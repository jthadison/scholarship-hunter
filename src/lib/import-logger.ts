/**
 * Import Logger Utility
 *
 * Provides structured logging and reporting for scholarship import operations.
 * Tracks success/failure rates, validation errors, and generates detailed reports.
 *
 * @module lib/import-logger
 */

import * as fs from 'fs'
import * as path from 'path'

/**
 * Validation error details for a specific record
 */
export interface ValidationError {
  row: number
  field?: string
  message: string
  data?: unknown
}

/**
 * Import statistics and summary
 */
export interface ImportStats {
  totalRecords: number
  validRecords: number
  invalidRecords: number
  duplicatesFound: number
  duplicatesSkipped: number
  importedRecords: number
  failedRecords: number
  startTime: Date
  endTime?: Date
  duration?: number // milliseconds
}

/**
 * ImportLogger class for tracking import operations
 */
export class ImportLogger {
  private importType: string
  private logs: string[] = []
  private errors: ValidationError[] = []
  private stats: ImportStats

  constructor(importType: string) {
    this.importType = importType
    this.stats = {
      totalRecords: 0,
      validRecords: 0,
      invalidRecords: 0,
      duplicatesFound: 0,
      duplicatesSkipped: 0,
      importedRecords: 0,
      failedRecords: 0,
      startTime: new Date(),
    }
  }

  /**
   * Log the start of import operation
   */
  start(message: string): void {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] START: ${message}`
    this.logs.push(logMessage)
    console.log(`\n${'='.repeat(80)}`)
    console.log(`🚀 ${message}`)
    console.log(`${'='.repeat(80)}\n`)
  }

  /**
   * Log informational message
   */
  info(message: string): void {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] INFO: ${message}`
    this.logs.push(logMessage)
    console.log(`ℹ️  ${message}`)
  }

  /**
   * Log warning message
   */
  warn(message: string): void {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] WARN: ${message}`
    this.logs.push(logMessage)
    console.log(`⚠️  ${message}`)
  }

  /**
   * Log error message
   */
  error(message: string, error?: ValidationError): void {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] ERROR: ${message}`
    this.logs.push(logMessage)
    console.log(`❌ ${message}`)

    if (error) {
      this.errors.push(error)
    }
  }

  /**
   * Log completion message with summary
   */
  complete(message: string): void {
    this.stats.endTime = new Date()
    this.stats.duration = this.stats.endTime.getTime() - this.stats.startTime.getTime()

    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] COMPLETE: ${message}`
    this.logs.push(logMessage)

    console.log(`\n${'='.repeat(80)}`)
    console.log(`✅ ${message}`)
    console.log(`${'='.repeat(80)}`)

    this.printSummary()
  }

  /**
   * Print import summary statistics
   */
  private printSummary(): void {
    console.log('\n📊 Import Summary:')
    console.log(`${'─'.repeat(80)}`)
    console.log(`Total Records:       ${this.stats.totalRecords}`)
    console.log(`Valid Records:       ${this.stats.validRecords}`)
    console.log(`Invalid Records:     ${this.stats.invalidRecords}`)
    console.log(`Duplicates Found:    ${this.stats.duplicatesFound}`)
    console.log(`Duplicates Skipped:  ${this.stats.duplicatesSkipped}`)
    console.log(`Imported Records:    ${this.stats.importedRecords}`)
    console.log(`Failed Records:      ${this.stats.failedRecords}`)
    console.log(`Duration:            ${this.formatDuration(this.stats.duration || 0)}`)
    console.log(`${'─'.repeat(80)}\n`)

    if (this.errors.length > 0) {
      console.log(`⚠️  ${this.errors.length} validation errors occurred. Check log file for details.\n`)
    }
  }

  /**
   * Format duration in human-readable format
   */
  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`
    const seconds = (ms / 1000).toFixed(2)
    return `${seconds}s`
  }

  /**
   * Update statistics
   */
  updateStats(stats: Partial<ImportStats>): void {
    this.stats = { ...this.stats, ...stats }
  }

  /**
   * Get current statistics
   */
  getStats(): ImportStats {
    return { ...this.stats }
  }

  /**
   * Get validation errors
   */
  getErrors(): ValidationError[] {
    return [...this.errors]
  }

  /**
   * Export full report to file
   */
  exportReport(filePath: string): void {
    // Ensure logs directory exists
    const logsDir = path.dirname(filePath)
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true })
    }

    // Build report content
    const report = this.buildReport()

    // Write to file
    fs.writeFileSync(filePath, report, 'utf-8')

    console.log(`📄 Import log saved to: ${filePath}`)
  }

  /**
   * Build detailed report content
   */
  private buildReport(): string {
    const lines: string[] = []

    // Header
    lines.push('='.repeat(80))
    lines.push(`SCHOLARSHIP IMPORT REPORT - ${this.importType.toUpperCase()}`)
    lines.push('='.repeat(80))
    lines.push('')

    // Statistics
    lines.push('STATISTICS')
    lines.push('-'.repeat(80))
    lines.push(`Total Records:       ${this.stats.totalRecords}`)
    lines.push(`Valid Records:       ${this.stats.validRecords}`)
    lines.push(`Invalid Records:     ${this.stats.invalidRecords}`)
    lines.push(`Duplicates Found:    ${this.stats.duplicatesFound}`)
    lines.push(`Duplicates Skipped:  ${this.stats.duplicatesSkipped}`)
    lines.push(`Imported Records:    ${this.stats.importedRecords}`)
    lines.push(`Failed Records:      ${this.stats.failedRecords}`)
    lines.push(`Start Time:          ${this.stats.startTime.toISOString()}`)
    lines.push(`End Time:            ${this.stats.endTime?.toISOString() || 'N/A'}`)
    lines.push(`Duration:            ${this.formatDuration(this.stats.duration || 0)}`)
    lines.push('')

    // Validation Errors
    if (this.errors.length > 0) {
      lines.push('VALIDATION ERRORS')
      lines.push('-'.repeat(80))
      for (const error of this.errors) {
        lines.push(`Row ${error.row}: ${error.message}`)
        if (error.field) {
          lines.push(`  Field: ${error.field}`)
        }
        if (error.data) {
          lines.push(`  Data: ${JSON.stringify(error.data)}`)
        }
        lines.push('')
      }
    }

    // Full Log
    lines.push('FULL LOG')
    lines.push('-'.repeat(80))
    lines.push(...this.logs)
    lines.push('')

    lines.push('='.repeat(80))
    lines.push('END OF REPORT')
    lines.push('='.repeat(80))

    return lines.join('\n')
  }

  /**
   * Export failed records to CSV for manual review
   */
  exportFailedRecords(filePath: string, failedRecords: Array<{ row: number; data: unknown; error: string }>): void {
    if (failedRecords.length === 0) {
      this.info('No failed records to export')
      return
    }

    // Ensure directory exists
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    // Build CSV content
    const lines: string[] = []
    lines.push('Row,Error,Data')

    for (const record of failedRecords) {
      const dataStr = JSON.stringify(record.data).replace(/"/g, '""')
      const errorStr = record.error.replace(/"/g, '""')
      lines.push(`${record.row},"${errorStr}","${dataStr}"`)
    }

    // Write to file
    fs.writeFileSync(filePath, lines.join('\n'), 'utf-8')

    this.info(`Failed records exported to: ${filePath}`)
  }
}
