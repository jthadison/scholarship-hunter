# Scholarship Import Guide

This guide explains how to import scholarship data into the Scholarship Hunter database using CSV or JSON files.

## Table of Contents

- [Overview](#overview)
- [Import Formats](#import-formats)
- [Required Fields](#required-fields)
- [Optional Fields](#optional-fields)
- [Eligibility Criteria Structure](#eligibility-criteria-structure)
- [Import Commands](#import-commands)
- [Import Options](#import-options)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)

## Overview

The Scholarship Hunter import system supports two data formats:

- **JSON** (Recommended): Best for complex nested eligibility criteria
- **CSV**: Best for simple, tabular data with basic eligibility requirements

Both formats support:
- ✅ Data validation with detailed error reporting
- ✅ Duplicate detection using fuzzy matching
- ✅ Batch processing for performance
- ✅ Comprehensive logging and reporting
- ✅ Dry-run mode for testing

## Import Formats

### JSON Format (Recommended)

JSON format provides the most flexibility for complex eligibility criteria.

**Template:** `templates/scholarship-import-template.json`

```json
{
  "name": "Women in STEM Award",
  "provider": "National STEM Foundation",
  "description": "Scholarship supporting women pursuing STEM degrees...",
  "awardAmount": 5000,
  "deadline": "2025-12-15T23:59:59.000Z",
  "eligibilityCriteria": {
    "academic": {
      "minGPA": 3.5,
      "minSAT": 1200
    },
    "demographic": {
      "requiredGender": "Female"
    },
    "majorField": {
      "requiredFieldOfStudy": ["STEM"]
    }
  }
}
```

### CSV Format

CSV format is simpler but less flexible for complex criteria.

**Template:** `templates/scholarship-import-template.csv`

| name | provider | description | awardAmount | deadline | minGPA | requiredGender |
|------|----------|-------------|-------------|----------|--------|----------------|
| Women in STEM Award | National STEM Foundation | Supporting women in STEM | 5000 | 2025-12-15T23:59:59.000Z | 3.5 | Female |

**Note:** For arrays in CSV (tags, majors, etc.), use semicolons as separators: `STEM;Women;Merit-based`

## Required Fields

All scholarships must include these fields:

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `name` | String | Scholarship name | "Women in STEM Award" |
| `provider` | String | Organization offering scholarship | "National STEM Foundation" |
| `description` | String (min 10 chars) | Detailed description | "Scholarship supporting women..." |
| `awardAmount` | Integer | Minimum award amount in dollars | 5000 |
| `deadline` | ISO DateTime | Application deadline | "2025-12-15T23:59:59.000Z" |
| `eligibilityCriteria` | Object | Eligibility requirements | See structure below |

## Optional Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `website` | URL | - | Scholarship website |
| `contactEmail` | Email | - | Contact email |
| `awardAmountMax` | Integer | - | Maximum award (if range) |
| `numberOfAwards` | Integer | 1 | Number of awards given |
| `renewable` | Boolean | false | Whether scholarship is renewable |
| `renewalYears` | Integer | - | Years renewable |
| `announcementDate` | ISO DateTime | - | Winner announcement date |
| `essayPrompts` | Array | [] | Essay prompt objects |
| `requiredDocuments` | Array | [] | Required document types |
| `recommendationCount` | Integer | 0 | Number of recommendations |
| `applicantPoolSize` | Integer | - | Typical applicant pool size |
| `acceptanceRate` | Float (0-1) | - | Acceptance rate (e.g., 0.2 = 20%) |
| `sourceUrl` | URL | - | Source of scholarship data |
| `tags` | Array | [] | Searchable tags |
| `category` | Enum | - | "Merit-based", "Need-based", "Identity-based", "Mixed" |
| `verified` | Boolean | false | Whether data is verified |

## Eligibility Criteria Structure

Eligibility criteria is organized into 6 dimensions:

### 1. Academic Criteria

```json
"academic": {
  "minGPA": 3.5,           // 0.0 - 4.0 scale
  "maxGPA": 4.0,
  "minSAT": 1200,          // 400 - 1600
  "maxSAT": 1600,
  "minACT": 26,            // 1 - 36
  "maxACT": 36,
  "classRankPercentile": 10, // Top 10%
  "gpaWeight": 0.7         // Weight in matching (0-1)
}
```

### 2. Demographic Criteria

```json
"demographic": {
  "requiredGender": "Female",  // "Male", "Female", "Non-binary", "Any"
  "requiredEthnicity": ["Hispanic", "African American"],
  "ageMin": 18,
  "ageMax": 25,
  "requiredState": ["CA", "NY", "TX"],
  "requiredCity": ["San Francisco", "New York"],
  "residencyRequired": "In-State"  // "In-State", "Out-of-State", "Any"
}
```

### 3. Major/Field Criteria

```json
"majorField": {
  "eligibleMajors": ["Biology", "Chemistry", "Physics"],
  "excludedMajors": ["Business Administration"],
  "requiredFieldOfStudy": ["STEM", "Engineering"],
  "careerGoalsKeywords": ["healthcare", "medical research"]
}
```

### 4. Experience Criteria

```json
"experience": {
  "minVolunteerHours": 50,
  "requiredExtracurriculars": ["Debate Team", "Student Government"],
  "leadershipRequired": true,
  "minWorkExperience": 12,  // months
  "awardsHonorsRequired": false
}
```

### 5. Financial Criteria

```json
"financial": {
  "requiresFinancialNeed": true,
  "maxEFC": 5000,  // Maximum Expected Family Contribution
  "pellGrantRequired": true,
  "financialNeedLevel": "HIGH"  // "LOW", "MODERATE", "HIGH", "VERY_HIGH"
}
```

### 6. Special Criteria

```json
"special": {
  "firstGenerationRequired": true,
  "militaryAffiliation": "Veteran",  // "None", "Veteran", "Dependent", "Active Duty", "Any"
  "disabilityRequired": false,
  "citizenshipRequired": "US Citizen",  // "US Citizen", "Permanent Resident", "Any"
  "otherRequirements": ["Must attend HBCU", "Must pursue teaching career"]
}
```

### Essay Prompts

```json
"essayPrompts": [
  {
    "prompt": "Describe how you plan to use your STEM education...",
    "wordLimit": 500,
    "required": true
  }
]
```

## Import Commands

### JSON Import

```bash
# Basic import
npm run import:json -- data/scholarships.json

# Dry run (validate without importing)
npm run import:json -- data/scholarships.json --dry-run

# Skip duplicates
npm run import:json -- data/scholarships.json --skip-duplicates

# Merge duplicates with existing data
npm run import:json -- data/scholarships.json --merge-duplicates

# Custom batch size (default: 100)
npm run import:json -- data/scholarships.json --batch-size 50
```

### CSV Import

```bash
# Basic import
npm run import:csv -- data/scholarships.csv

# Dry run (validate without importing)
npm run import:csv -- data/scholarships.csv --dry-run

# Skip duplicates
npm run import:csv -- data/scholarships.csv --skip-duplicates

# Merge duplicates with existing data
npm run import:csv -- data/scholarships.csv --merge-duplicates
```

### MVP Seed Data

```bash
# Import MVP seed dataset (1,000+ scholarships)
npm run seed:mvp
```

## Import Options

| Option | Description |
|--------|-------------|
| `--dry-run` | Validate data without database writes. Useful for testing. |
| `--skip-duplicates` | Skip scholarships that match existing records (90% similarity threshold) |
| `--merge-duplicates` | Merge new data with existing duplicate records |
| `--batch-size <n>` | Number of records per transaction (default: 100) |

## Import Process

The import process follows these steps:

1. **File Validation**: Verify file exists and is readable
2. **Data Parsing**: Parse CSV/JSON format
3. **Schema Validation**: Validate each record against Zod schema
4. **Deadline Filtering**: Remove scholarships with expired deadlines
5. **Duplicate Detection**: Find duplicates using fuzzy matching (90% threshold)
6. **Duplicate Handling**: Skip, merge, or warn based on options
7. **Batch Import**: Insert records in batches for performance
8. **Logging**: Generate detailed logs and reports

## Output and Logs

Import operations generate comprehensive logs:

- **Console Output**: Real-time progress and summary statistics
- **Log File**: Detailed log at `logs/import-{format}-{timestamp}.log`
- **Failed Records**: CSV export at `logs/failed-import-{format}-{timestamp}.csv`

### Log File Contents

- Import statistics (total, valid, invalid, duplicates, imported, failed)
- Validation errors with row numbers and error messages
- Duplicate matches with similarity scores
- Full operation log with timestamps

## Examples

### Example 1: Import New Scholarships (JSON)

```bash
npm run import:json -- data/new-scholarships.json
```

**Output:**
```
================================================================================
🚀 Importing scholarships from data/new-scholarships.json
================================================================================

ℹ️  Reading JSON file...
ℹ️  Parsed 100 scholarship records
ℹ️  Validating scholarship data...
ℹ️  Validated 98 records, 2 validation errors
❌ Row 15: awardAmount: Expected number, received string
❌ Row 42: deadline: Invalid datetime format
ℹ️  Checking for duplicates...
⚠️  Found 5 potential duplicates
ℹ️  Importing 93 scholarships in batches of 100...
ℹ️  Batch 1/1: Imported 93/93 scholarships

================================================================================
✅ Successfully imported 93 scholarships
================================================================================

📊 Import Summary:
────────────────────────────────────────────────────────────────────────────────
Total Records:       100
Valid Records:       98
Invalid Records:     2
Duplicates Found:    5
Duplicates Skipped:  0
Imported Records:    93
Failed Records:      0
Duration:            2.34s
────────────────────────────────────────────────────────────────────────────────

📄 Import log saved to: logs/import-json-1730000000000.log
```

### Example 2: Dry Run Validation (CSV)

```bash
npm run import:csv -- data/scholarships.csv --dry-run
```

Validates data without database writes. Use this to check for errors before actual import.

### Example 3: Import with Duplicate Handling

```bash
npm run import:json -- data/scholarships.json --skip-duplicates
```

Skips any scholarships that are 90% similar to existing records.

## Troubleshooting

### Common Errors

#### "File not found"
- Verify the file path is correct
- Use relative or absolute paths

#### "JSON parsing failed"
- Validate JSON syntax using a JSON validator
- Check for trailing commas, missing quotes, etc.

#### "awardAmount: Expected number, received string"
- Ensure numeric fields contain numbers, not strings
- In JSON: Use `5000` not `"5000"`
- In CSV: Don't use quotes around numbers

#### "deadline: Invalid datetime format"
- Use ISO 8601 format: `2025-12-15T23:59:59.000Z`
- Include time and timezone

#### "Validation failed: description must be at least 10 characters"
- Provide detailed descriptions (minimum 10 characters)

### Performance Tips

1. **Use JSON format** for complex eligibility criteria
2. **Batch size**: Use larger batches (200-500) for faster imports on powerful systems
3. **Dry run first**: Always test with `--dry-run` before actual import
4. **Skip duplicates**: Use `--skip-duplicates` when re-importing data

### Data Quality Checklist

Before importing, verify:

- ✅ All required fields present
- ✅ Award amounts are realistic ($100 - $50,000 typical range)
- ✅ Deadlines in future (expired scholarships are auto-filtered)
- ✅ GPA values between 0.0 - 4.0
- ✅ SAT scores between 400 - 1600
- ✅ ACT scores between 1 - 36
- ✅ Email addresses valid
- ✅ URLs include protocol (https://)
- ✅ Array fields use semicolons in CSV (tags;majors;etc)

## Best Practices

1. **Start Small**: Test with 10-20 scholarships first
2. **Use Templates**: Copy template files as starting point
3. **Validate Early**: Run `--dry-run` before importing
4. **Check Logs**: Review import logs for errors and warnings
5. **Verify Data**: Use Prisma Studio to spot-check imported records
6. **Source Attribution**: Always include `sourceUrl` and set `verified=true` for trusted sources
7. **Keep Backups**: Maintain backup copies of import files

## Support

For issues or questions:
- Check the [troubleshooting section](#troubleshooting)
- Review import logs in `logs/` directory
- Check failed records CSV for problematic data
- Consult the [data sources documentation](./data-sources.md)
