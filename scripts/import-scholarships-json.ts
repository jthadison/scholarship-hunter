#!/usr/bin/env tsx
/**
 * JSON Scholarship Import Script
 *
 * Imports scholarship data from JSON files into the database with validation,
 * duplicate detection, and comprehensive logging.
 *
 * Usage:
 *   npm run import:json -- <file-path> [options]
 *
 * Options:
 *   --dry-run              Validate without importing to database
 *   --skip-duplicates      Skip duplicate scholarships
 *   --merge-duplicates     Merge duplicate data with existing records
 *   --batch-size <number>  Number of records per transaction (default: 100)
 *
 * Examples:
 *   npm run import:json -- data/scholarships.json
 *   npm run import:json -- data/scholarships.json --dry-run
 *   npm run import:json -- data/scholarships.json --skip-duplicates
 */

import * as fs from 'fs'
import * as path from 'path'
import { PrismaClient } from '@prisma/client'
import { scholarshipImportSchema } from '../src/lib/validation/scholarship'
import { findDuplicates, mergeDuplicates } from '../src/lib/scholarship-dedup'
import { ImportLogger, ValidationError } from '../src/lib/import-logger'

const prisma = new PrismaClient()

/**
 * Import options configuration
 */
interface ImportOptions {
  dryRun: boolean
  skipDuplicates: boolean
  mergeDuplicates: boolean
  batchSize: number
}

/**
 * Parse command line arguments
 */
function parseArgs(): { filePath: string; options: ImportOptions } {
  const args = process.argv.slice(2)

  if (args.length === 0 || args[0]?.startsWith('--')) {
    console.error('Error: File path is required')
    console.error('Usage: npm run import:json -- <file-path> [options]')
    process.exit(1)
  }

  const filePath = args[0]!
  const options: ImportOptions = {
    dryRun: args.includes('--dry-run'),
    skipDuplicates: args.includes('--skip-duplicates'),
    mergeDuplicates: args.includes('--merge-duplicates'),
    batchSize: 100,
  }

  // Parse batch size if provided
  const batchSizeIndex = args.indexOf('--batch-size')
  if (batchSizeIndex !== -1 && args[batchSizeIndex + 1]) {
    const size = parseInt(args[batchSizeIndex + 1]!, 10)
    if (!isNaN(size) && size > 0) {
      options.batchSize = size
    }
  }

  return { filePath, options }
}

/**
 * Main import function
 */
async function importScholarships(filePath: string, options: ImportOptions): Promise<void> {
  const logger = new ImportLogger('json-import')

  try {
    // Validate file exists
    if (!fs.existsSync(filePath)) {
      logger.error(`File not found: ${filePath}`)
      process.exit(1)
    }

    logger.start(`Importing scholarships from ${filePath}`)

    if (options.dryRun) {
      logger.info('DRY RUN MODE - No database writes will occur')
    }

    // Read and parse JSON file
    logger.info('Reading JSON file...')
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    let data: unknown[]

    try {
      data = JSON.parse(fileContent)
    } catch (error) {
      logger.error('Failed to parse JSON file', {
        row: 0,
        message: error instanceof Error ? error.message : 'Unknown error',
      })
      process.exit(1)
    }

    if (!Array.isArray(data)) {
      logger.error('JSON file must contain an array of scholarship objects')
      process.exit(1)
    }

    logger.info(`Parsed ${data.length} scholarship records`)

    // Validate all records
    logger.info('Validating scholarship data...')
    const validated: Array<Record<string, unknown>> = []
    const validationErrors: ValidationError[] = []
    const failedRecords: Array<{ row: number; data: unknown; error: string }> = []

    for (const [index, record] of data.entries()) {
      const result = scholarshipImportSchema.safeParse(record)

      if (result.success) {
        // Filter out scholarships with expired deadlines
        const deadline = new Date(result.data.deadline)
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        if (deadline >= today) {
          validated.push(result.data as unknown as Record<string, unknown>)
        } else {
          logger.warn(
            `Row ${index + 1}: Scholarship "${(record as { name?: string }).name || 'Unknown'}" has expired deadline (${deadline.toISOString().split('T')[0]}), skipping`
          )
        }
      } else {
        const errorMessages = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ')

        validationErrors.push({
          row: index + 1,
          message: errorMessages,
          data: record,
        })

        failedRecords.push({
          row: index + 1,
          data: record,
          error: errorMessages,
        })

        logger.error(`Row ${index + 1}: ${errorMessages}`)
      }
    }

    logger.updateStats({
      totalRecords: data.length,
      validRecords: validated.length,
      invalidRecords: validationErrors.length,
    })

    logger.info(`Validated ${validated.length} records, ${validationErrors.length} validation errors`)

    if (validated.length === 0) {
      logger.warn('No valid records to import')
      logger.complete('Import completed with no records')
      return
    }

    // Duplicate detection
    logger.info('Checking for duplicates...')
    const duplicates = await findDuplicates(validated as Array<{ name: string; provider: string }>, {
      threshold: 0.9,
      checkExisting: true,
      checkWithinArray: true,
    })

    logger.updateStats({
      duplicatesFound: duplicates.length,
    })

    if (duplicates.length > 0) {
      logger.warn(`Found ${duplicates.length} potential duplicates`)

      // Log details about duplicates
      for (const dup of duplicates.slice(0, 10)) {
        // Show first 10
        const similarity = (dup.similarity * 100).toFixed(1)
        if (dup.existingId) {
          logger.info(
            `  Duplicate: "${dup.scholarship.name}" (${similarity}% match with existing "${dup.existingName}")`
          )
        } else {
          logger.info(`  Duplicate: "${dup.scholarship.name}" (${similarity}% match within import data)`)
        }
      }

      if (duplicates.length > 10) {
        logger.info(`  ... and ${duplicates.length - 10} more`)
      }
    }

    // Filter records based on duplicate handling options
    let toImport = validated

    if (options.skipDuplicates) {
      const duplicateNames = new Set(duplicates.map((d) => `${d.scholarship.name}|${d.scholarship.provider}`))
      toImport = validated.filter((s) => {
        const key = `${(s as { name: string }).name}|${(s as { provider: string }).provider}`
        return !duplicateNames.has(key)
      })

      logger.updateStats({
        duplicatesSkipped: validated.length - toImport.length,
      })

      logger.info(`Skipping ${validated.length - toImport.length} duplicates, importing ${toImport.length} records`)
    } else if (options.mergeDuplicates) {
      // Merge duplicates with existing records
      logger.info('Merging duplicate data...')
      const toUpdate: Array<{ id: string; data: Record<string, unknown> }> = []
      const duplicateIds = new Set<string>()

      for (const dup of duplicates.filter((d) => d.existingId)) {
        if (dup.existingId && !duplicateIds.has(dup.existingId)) {
          const existing = await prisma.scholarship.findUnique({
            where: { id: dup.existingId },
          })

          if (existing) {
            const merged = mergeDuplicates(existing as unknown as Record<string, unknown>, dup.scholarship)
            toUpdate.push({ id: dup.existingId, data: merged })
            duplicateIds.add(dup.existingId)
          }
        }
      }

      // Remove duplicates from import list
      const duplicateNames = new Set(duplicates.map((d) => `${d.scholarship.name}|${d.scholarship.provider}`))
      toImport = validated.filter((s) => {
        const key = `${(s as { name: string }).name}|${(s as { provider: string }).provider}`
        return !duplicateNames.has(key)
      })

      // Update existing records with merged data
      if (!options.dryRun && toUpdate.length > 0) {
        logger.info(`Updating ${toUpdate.length} existing records with merged data...`)
        for (const { id, data } of toUpdate) {
          await prisma.scholarship.update({
            where: { id },
            data: data as any, // eslint-disable-line @typescript-eslint/no-explicit-any
          })
        }
      }

      logger.info(`Merged ${toUpdate.length} duplicates, importing ${toImport.length} new records`)
    }

    // Dry run - exit before importing
    if (options.dryRun) {
      logger.info(`Dry run complete. Would import ${toImport.length} scholarships`)
      logger.complete(`Dry run validation completed successfully`)

      // Export failed records if any
      if (failedRecords.length > 0) {
        const timestamp = Date.now()
        const failedPath = path.join('logs', `failed-import-json-${timestamp}.csv`)
        logger.exportFailedRecords(failedPath, failedRecords)
      }

      return
    }

    // Batch insert for performance
    logger.info(`Importing ${toImport.length} scholarships in batches of ${options.batchSize}...`)
    const batchSize = options.batchSize
    let imported = 0
    let failed = 0

    for (let i = 0; i < toImport.length; i += batchSize) {
      const batch = toImport.slice(i, i + batchSize)
      const batchNum = Math.floor(i / batchSize) + 1
      const totalBatches = Math.ceil(toImport.length / batchSize)

      try {
        await prisma.$transaction(
          batch.map((scholarship) =>
            prisma.scholarship.create({
              data: scholarship as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            })
          )
        )

        imported += batch.length
        logger.info(`Batch ${batchNum}/${totalBatches}: Imported ${imported}/${toImport.length} scholarships`)
      } catch (error) {
        failed += batch.length
        logger.error(`Batch ${batchNum}/${totalBatches}: Failed to import batch`, {
          row: i,
          message: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    logger.updateStats({
      importedRecords: imported,
      failedRecords: failed,
    })

    // Export logs and reports
    const timestamp = Date.now()
    const logPath = path.join('logs', `import-json-${timestamp}.log`)
    logger.exportReport(logPath)

    // Export failed records if any
    if (failedRecords.length > 0) {
      const failedPath = path.join('logs', `failed-import-json-${timestamp}.csv`)
      logger.exportFailedRecords(failedPath, failedRecords)
    }

    logger.complete(`Successfully imported ${imported} scholarships`)
  } catch (error) {
    logger.error('Import failed with error', {
      row: 0,
      message: error instanceof Error ? error.message : 'Unknown error',
    })
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run import if executed directly
if (require.main === module) {
  const { filePath, options } = parseArgs()

  importScholarships(filePath, options).catch((error) => {
    console.error('Fatal error during import:', error)
    process.exit(1)
  })
}

export { importScholarships }
export type { ImportOptions }
