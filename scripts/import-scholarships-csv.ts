#!/usr/bin/env tsx
/**
 * CSV Scholarship Import Script
 *
 * Imports scholarship data from CSV files into the database with validation,
 * duplicate detection, and comprehensive logging.
 *
 * Usage:
 *   npm run import:csv -- <file-path> [options]
 *
 * Options:
 *   --dry-run              Validate without importing to database
 *   --skip-duplicates      Skip duplicate scholarships
 *   --merge-duplicates     Merge duplicate data with existing records
 *   --batch-size <number>  Number of records per transaction (default: 100)
 *
 * Examples:
 *   npm run import:csv -- data/scholarships.csv
 *   npm run import:csv -- data/scholarships.csv --dry-run
 *   npm run import:csv -- data/scholarships.csv --skip-duplicates
 */

import * as fs from 'fs'
import * as path from 'path'
import Papa from 'papaparse'
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

  if (args.length === 0 || args[0].startsWith('--')) {
    console.error('Error: File path is required')
    console.error('Usage: npm run import:csv -- <file-path> [options]')
    process.exit(1)
  }

  const filePath = args[0]
  const options: ImportOptions = {
    dryRun: args.includes('--dry-run'),
    skipDuplicates: args.includes('--skip-duplicates'),
    mergeDuplicates: args.includes('--merge-duplicates'),
    batchSize: 100,
  }

  // Parse batch size if provided
  const batchSizeIndex = args.indexOf('--batch-size')
  if (batchSizeIndex !== -1 && args[batchSizeIndex + 1]) {
    const size = parseInt(args[batchSizeIndex + 1], 10)
    if (!isNaN(size) && size > 0) {
      options.batchSize = size
    }
  }

  return { filePath, options }
}

/**
 * Convert CSV row to scholarship object with proper type conversion
 */
function csvRowToScholarship(row: Record<string, string>): Record<string, unknown> {
  // Helper to parse array from semicolon-separated string
  const parseArray = (value: string | undefined): string[] => {
    if (!value || value.trim() === '') return []
    return value.split(';').map((v) => v.trim()).filter(Boolean)
  }

  // Helper to parse number
  const parseNumber = (value: string | undefined): number | undefined => {
    if (!value || value.trim() === '') return undefined
    const num = parseFloat(value)
    return isNaN(num) ? undefined : num
  }

  // Helper to parse integer
  const parseInt = (value: string | undefined): number | undefined => {
    if (!value || value.trim() === '') return undefined
    const num = Number(value)
    return isNaN(num) ? undefined : Math.floor(num)
  }

  // Helper to parse boolean
  const parseBoolean = (value: string | undefined): boolean => {
    if (!value) return false
    const v = value.toLowerCase().trim()
    return v === 'true' || v === '1' || v === 'yes'
  }

  // Build eligibility criteria from CSV columns
  const eligibilityCriteria: Record<string, unknown> = {}

  // Academic criteria
  if (row.minGPA || row.maxGPA || row.minSAT || row.maxSAT || row.minACT || row.maxACT || row.classRankPercentile) {
    eligibilityCriteria.academic = {
      minGPA: parseNumber(row.minGPA),
      maxGPA: parseNumber(row.maxGPA),
      minSAT: parseInt(row.minSAT),
      maxSAT: parseInt(row.maxSAT),
      minACT: parseInt(row.minACT),
      maxACT: parseInt(row.maxACT),
      classRankPercentile: parseNumber(row.classRankPercentile),
    }
  }

  // Demographic criteria
  if (row.requiredGender || row.requiredEthnicity || row.ageMin || row.ageMax || row.requiredState || row.residencyRequired) {
    eligibilityCriteria.demographic = {
      requiredGender: row.requiredGender || undefined,
      requiredEthnicity: parseArray(row.requiredEthnicity),
      ageMin: parseInt(row.ageMin),
      ageMax: parseInt(row.ageMax),
      requiredState: parseArray(row.requiredState),
      residencyRequired: row.residencyRequired || undefined,
    }
  }

  // Major/field criteria
  if (row.eligibleMajors || row.excludedMajors || row.requiredFieldOfStudy || row.careerGoalsKeywords) {
    eligibilityCriteria.majorField = {
      eligibleMajors: parseArray(row.eligibleMajors),
      excludedMajors: parseArray(row.excludedMajors),
      requiredFieldOfStudy: parseArray(row.requiredFieldOfStudy),
      careerGoalsKeywords: parseArray(row.careerGoalsKeywords),
    }
  }

  // Experience criteria
  if (row.minVolunteerHours || row.requiredExtracurriculars || row.leadershipRequired || row.minWorkExperience || row.awardsHonorsRequired) {
    eligibilityCriteria.experience = {
      minVolunteerHours: parseInt(row.minVolunteerHours),
      requiredExtracurriculars: parseArray(row.requiredExtracurriculars),
      leadershipRequired: parseBoolean(row.leadershipRequired),
      minWorkExperience: parseInt(row.minWorkExperience),
      awardsHonorsRequired: parseBoolean(row.awardsHonorsRequired),
    }
  }

  // Financial criteria
  if (row.requiresFinancialNeed || row.maxEFC || row.pellGrantRequired || row.financialNeedLevel) {
    eligibilityCriteria.financial = {
      requiresFinancialNeed: parseBoolean(row.requiresFinancialNeed),
      maxEFC: parseInt(row.maxEFC),
      pellGrantRequired: parseBoolean(row.pellGrantRequired),
      financialNeedLevel: row.financialNeedLevel || undefined,
    }
  }

  // Special criteria
  if (row.firstGenerationRequired || row.militaryAffiliation || row.disabilityRequired || row.citizenshipRequired || row.otherRequirements) {
    eligibilityCriteria.special = {
      firstGenerationRequired: parseBoolean(row.firstGenerationRequired),
      militaryAffiliation: row.militaryAffiliation || undefined,
      disabilityRequired: parseBoolean(row.disabilityRequired),
      citizenshipRequired: row.citizenshipRequired || undefined,
      otherRequirements: parseArray(row.otherRequirements),
    }
  }

  // Build scholarship object
  return {
    name: row.name,
    provider: row.provider,
    description: row.description,
    website: row.website || undefined,
    contactEmail: row.contactEmail || undefined,
    awardAmount: parseInt(row.awardAmount),
    awardAmountMax: parseInt(row.awardAmountMax),
    numberOfAwards: parseInt(row.numberOfAwards) || 1,
    renewable: parseBoolean(row.renewable),
    renewalYears: parseInt(row.renewalYears),
    deadline: row.deadline,
    announcementDate: row.announcementDate || undefined,
    eligibilityCriteria,
    requiredDocuments: parseArray(row.requiredDocuments),
    recommendationCount: parseInt(row.recommendationCount) || 0,
    applicantPoolSize: parseInt(row.applicantPoolSize),
    acceptanceRate: parseNumber(row.acceptanceRate),
    sourceUrl: row.sourceUrl || undefined,
    tags: parseArray(row.tags),
    category: row.category || undefined,
    verified: parseBoolean(row.verified),
  }
}

/**
 * Main import function
 */
async function importScholarships(filePath: string, options: ImportOptions): Promise<void> {
  const logger = new ImportLogger('csv-import')

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

    // Read and parse CSV file
    logger.info('Reading CSV file...')
    const fileContent = fs.readFileSync(filePath, 'utf-8')

    const parseResult = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
    })

    if (parseResult.errors.length > 0) {
      logger.warn(`CSV parsing warnings: ${parseResult.errors.length} issues found`)
      for (const error of parseResult.errors.slice(0, 5)) {
        logger.warn(`  Row ${error.row}: ${error.message}`)
      }
    }

    const rows = parseResult.data as Record<string, string>[]
    logger.info(`Parsed ${rows.length} CSV rows`)

    // Convert CSV rows to scholarship objects and validate
    logger.info('Converting and validating scholarship data...')
    const validated: Array<Record<string, unknown>> = []
    const validationErrors: ValidationError[] = []
    const failedRecords: Array<{ row: number; data: unknown; error: string }> = []

    for (const [index, row] of rows.entries()) {
      try {
        const scholarship = csvRowToScholarship(row)
        const result = scholarshipImportSchema.safeParse(scholarship)

        if (result.success) {
          // Filter out scholarships with expired deadlines
          const deadline = new Date(result.data.deadline)
          const today = new Date()
          today.setHours(0, 0, 0, 0)

          if (deadline >= today) {
            validated.push(result.data as unknown as Record<string, unknown>)
          } else {
            logger.warn(
              `Row ${index + 2}: Scholarship "${row.name || 'Unknown'}" has expired deadline (${deadline.toISOString().split('T')[0]}), skipping`
            )
          }
        } else {
          const errorMessages = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ')

          validationErrors.push({
            row: index + 2, // +2 because CSV has header row and arrays are 0-indexed
            message: errorMessages,
            data: row,
          })

          failedRecords.push({
            row: index + 2,
            data: row,
            error: errorMessages,
          })

          logger.error(`Row ${index + 2}: ${errorMessages}`)
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        validationErrors.push({
          row: index + 2,
          message: errorMessage,
          data: row,
        })
        failedRecords.push({
          row: index + 2,
          data: row,
          error: errorMessage,
        })
        logger.error(`Row ${index + 2}: ${errorMessage}`)
      }
    }

    logger.updateStats({
      totalRecords: rows.length,
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

      for (const dup of duplicates.slice(0, 10)) {
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

    // Filter records based on duplicate handling
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

      const duplicateNames = new Set(duplicates.map((d) => `${d.scholarship.name}|${d.scholarship.provider}`))
      toImport = validated.filter((s) => {
        const key = `${(s as { name: string }).name}|${(s as { provider: string }).provider}`
        return !duplicateNames.has(key)
      })

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

      if (failedRecords.length > 0) {
        const timestamp = Date.now()
        const failedPath = path.join('logs', `failed-import-csv-${timestamp}.csv`)
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
    const logPath = path.join('logs', `import-csv-${timestamp}.log`)
    logger.exportReport(logPath)

    if (failedRecords.length > 0) {
      const failedPath = path.join('logs', `failed-import-csv-${timestamp}.csv`)
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

export { importScholarships, ImportOptions }
