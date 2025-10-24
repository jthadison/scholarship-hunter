# Database Entity-Relationship (ER) Diagram

**Document Version:** 1.0
**Last Updated:** 2025-10-23
**Related:** [Data Architecture](02-data-architecture.md) | [Tech Spec Epic 1](../tech-spec-epic-1.md)

## Overview

This document provides a comprehensive Entity-Relationship diagram for the Scholarship Hunter database schema. The schema is organized into 5 domain modules supporting 12 core entities with optimized relationships, constraints, and indexes for 100,000+ students and 10,000+ scholarships.

## Schema Modules

### 1. Profile Module
### 2. Matching Module
### 3. Application Module
### 4. Content Module
### 5. Analytics Module

---

## Complete Entity-Relationship Diagram

```mermaid
erDiagram
    %% ============================================================================
    %% PROFILE MODULE
    %% ============================================================================

    User ||--|| Student : "has"
    User {
        string id PK "cuid()"
        string clerkId UK "Clerk authentication ID"
        string email UK
        boolean emailVerified
        UserRole role "STUDENT, COUNSELOR, PARENT, ADMIN"
        datetime createdAt
        datetime updatedAt
    }

    Student ||--|| Profile : "has"
    Student ||--o{ Application : "creates"
    Student ||--o{ Document : "uploads"
    Student ||--o{ Essay : "writes"
    Student ||--o{ Match : "receives"
    Student ||--o{ Outcome : "has"
    Student {
        string id PK "cuid()"
        string userId FK_UK "→ User.id"
        string firstName
        string lastName
        datetime dateOfBirth
        string phone
        datetime createdAt
        datetime updatedAt
    }

    Profile {
        string id PK "cuid()"
        string studentId FK_UK "→ Student.id"
        float gpa "0.0-4.0"
        float gpaScale "default 4.0"
        int satScore "400-1600"
        int actScore "1-36"
        int classRank
        int classSize
        int graduationYear "2024-2030"
        string currentGrade
        string gender
        string[] ethnicity
        string state
        string city
        string zipCode
        string citizenship
        FinancialNeed financialNeed "LOW, MODERATE, HIGH, VERY_HIGH"
        boolean pellGrantEligible
        string efcRange
        string intendedMajor
        string fieldOfStudy
        string careerGoals
        json extracurriculars
        int volunteerHours ">=0"
        json workExperience
        json leadershipRoles
        json awardsHonors
        boolean firstGeneration
        string militaryAffiliation
        string disabilities
        string additionalContext
        float completionPercentage "0-100"
        float strengthScore "0-100"
        datetime createdAt
        datetime updatedAt
    }

    %% ============================================================================
    %% MATCHING MODULE
    %% ============================================================================

    Scholarship ||--o{ Application : "receives"
    Scholarship ||--o{ Match : "matches"
    Scholarship {
        string id PK "cuid()"
        string name
        string provider
        string description
        string website
        string contactEmail
        int awardAmount "$"
        int awardAmountMax "$"
        int numberOfAwards
        boolean renewable
        datetime deadline
        datetime announcementDate
        json eligibilityCriteria "complex rules"
        json essayPrompts
        string[] requiredDocuments
        int recommendationCount "0-5"
        int applicantPoolSize
        float acceptanceRate "0.0-1.0"
        string sourceUrl
        datetime lastVerified
        boolean verified
        string[] tags
        string category
        datetime createdAt
        datetime updatedAt
    }

    Match {
        string id PK "cuid()"
        string studentId FK "→ Student.id"
        string scholarshipId FK "→ Scholarship.id"
        float overallMatchScore "0-100"
        float academicScore "0-100"
        float demographicScore "0-100"
        float majorFieldScore "0-100"
        float experienceScore "0-100"
        float financialScore "0-100"
        float specialCriteriaScore "0-100"
        float successProbability "0.0-1.0"
        PriorityTier priorityTier "MUST_APPLY, SHOULD_APPLY, IF_TIME_PERMITS, HIGH_VALUE_REACH"
        float strategicValue "ROI calculation"
        EffortLevel applicationEffort "LOW, MEDIUM, HIGH"
        json missingCriteria
        json improvementImpact
        datetime calculatedAt
        boolean notified
        datetime createdAt
        datetime updatedAt
    }

    %% ============================================================================
    %% APPLICATION MODULE
    %% ============================================================================

    Application ||--|| Timeline : "has"
    Application ||--|| Outcome : "has"
    Application ||--o{ Essay : "includes"
    Application ||--o{ Document : "includes"
    Application ||--o{ Recommendation : "requests"
    Application {
        string id PK "cuid()"
        string studentId FK "→ Student.id"
        string scholarshipId FK "→ Scholarship.id"
        ApplicationStatus status "NOT_STARTED, TODO, IN_PROGRESS, READY_FOR_REVIEW, SUBMITTED, AWAITING_DECISION, AWARDED, DENIED, WITHDRAWN"
        PriorityTier priorityTier
        int essayCount
        boolean essayComplete
        int documentsRequired
        int documentsUploaded
        int recsRequired
        int recsReceived
        float progressPercentage "0-100"
        datetime dateAdded
        datetime targetSubmitDate
        datetime actualSubmitDate
        datetime outcomeDate
        string notes
        datetime createdAt
        datetime updatedAt
    }

    Timeline {
        string id PK "cuid()"
        string applicationId FK_UK "→ Application.id"
        datetime startEssayDate
        datetime requestRecsDate
        datetime uploadDocsDate
        datetime finalReviewDate
        datetime submitDate
        boolean hasConflicts
        string[] conflictsWith "application IDs"
        int estimatedHours
        datetime createdAt
        datetime updatedAt
    }

    %% ============================================================================
    %% CONTENT MODULE
    %% ============================================================================

    Document ||--o| Document : "version history"
    Document ||--o| Recommendation : "attached to"
    Document {
        string id PK "cuid()"
        string studentId FK "→ Student.id"
        string applicationId FK_NULL "→ Application.id"
        string name
        DocumentType type "TRANSCRIPT, RESUME, PERSONAL_STATEMENT, FINANCIAL_DOCUMENT, RECOMMENDATION_LETTER, SUPPLEMENTAL_MATERIAL, OTHER"
        string fileName
        int fileSize "bytes"
        string mimeType
        string storagePath
        string bucketName
        int version
        string previousVersionId FK_SELF "→ Document.id"
        boolean compliant
        json validationErrors
        datetime createdAt
        datetime updatedAt
    }

    Essay ||--o| Essay : "version history"
    Essay {
        string id PK "cuid()"
        string studentId FK "→ Student.id"
        string applicationId FK_NULL "→ Application.id"
        string title
        string prompt
        string content "essay text"
        int wordCount
        EssayPhase phase "DISCOVERY, STRUCTURE, DRAFTING, REVISION, POLISH, FINALIZATION"
        boolean isComplete
        boolean aiGenerated
        string aiPromptUsed
        string aiModel
        boolean personalized
        float qualityScore "0-100"
        json qualityBreakdown
        string improvementSuggestions
        int version
        string previousVersionId FK_SELF "→ Essay.id"
        string[] themes "reusability tags"
        json adaptabilityScores
        datetime createdAt
        datetime updatedAt
    }

    Recommendation {
        string id PK "cuid()"
        string applicationId FK "→ Application.id"
        string name "recommender name"
        string email "recommender email"
        string relationship
        RecommendationStatus status "PENDING_REQUEST, REQUESTED, REMINDED, RECEIVED, SUBMITTED"
        datetime requestedAt
        datetime reminderSentAt
        datetime receivedAt
        datetime submittedAt
        string uploadToken UK "secure token"
        datetime uploadLinkExpiry
        string documentId FK_NULL "→ Document.id"
        datetime createdAt
        datetime updatedAt
    }

    %% ============================================================================
    %% ANALYTICS MODULE
    %% ============================================================================

    Outcome {
        string id PK "cuid()"
        string studentId FK "→ Student.id"
        string applicationId FK_UK "→ Application.id"
        OutcomeResult result "AWARDED, DENIED, WAITLISTED, WITHDRAWN"
        int awardAmountReceived "$"
        datetime decisionDate
        string feedback
        string notes
        datetime createdAt
        datetime updatedAt
    }

    Student ||--o{ AnalyticsSnapshot : "tracks"
    AnalyticsSnapshot {
        string id PK "cuid()"
        string studentId FK "→ Student.id"
        datetime snapshotDate
        datetime periodStart
        datetime periodEnd
        int totalApplications
        int totalSubmitted
        int totalAwarded
        int totalDenied
        float successRate "0.0-1.0"
        int totalFundingSecured "$"
        float averageAwardAmount "$"
        int potentialFunding "$"
        float profileStrengthScore "0-100"
        float profileCompletion "0-100"
        int matchesGenerated
        int essaysWritten
        int documentsUploaded
        datetime createdAt
        datetime updatedAt
    }
```

---

## Relationship Cardinality Summary

| Relationship | Cardinality | Cascade Rule | Purpose |
|--------------|-------------|--------------|---------|
| User → Student | 1:1 | CASCADE | One user account per student |
| Student → Profile | 1:1 | CASCADE | One comprehensive profile per student |
| Student → Application | 1:many | CASCADE | Student can apply to multiple scholarships |
| Student → Document | 1:many | CASCADE | Student owns uploaded documents |
| Student → Essay | 1:many | CASCADE | Student writes multiple essays |
| Student → Match | 1:many | CASCADE | Student receives multiple scholarship matches |
| Student → Outcome | 1:many | CASCADE | Student has outcome records |
| Student → AnalyticsSnapshot | 1:many | CASCADE | Periodic analytics snapshots |
| Scholarship → Application | 1:many | CASCADE | Scholarship receives multiple applications |
| Scholarship → Match | 1:many | CASCADE | Scholarship matched to multiple students |
| Application → Timeline | 1:1 | CASCADE | Each application has one timeline |
| Application → Outcome | 1:1 | CASCADE | Each application has one outcome |
| Application → Essay | 1:many | SET_NULL | Essays reusable across applications |
| Application → Document | 1:many | SET_NULL | Documents reusable across applications |
| Application → Recommendation | 1:many | CASCADE | Recommendations tied to specific application |
| Recommendation → Document | 1:1 optional | SET_NULL | Recommendation letter stored as document |
| Document → Document | 1:1 optional | SET_NULL | Version history chain |
| Essay → Essay | 1:1 optional | SET_NULL | Version history chain |

---

## Foreign Key Constraints

### Cascade Deletions (Owned Children)
```
User → Student → Profile, Applications, Documents, Essays, Matches, Outcomes
Scholarship → Applications, Matches
Application → Timeline, Outcome, Recommendations
```

**Rationale:** When a parent record is deleted, all owned child records should be removed to maintain data integrity.

### SetNull (Shared Resources)
```
Application → Essays (SET_NULL on applicationId)
Application → Documents (SET_NULL on applicationId)
Recommendation → Document (SET_NULL on documentId)
Document → previousVersionId (SET_NULL - version history)
Essay → previousVersionId (SET_NULL - version history)
```

**Rationale:** Essays and documents can be reused across multiple applications. Deleting an application should preserve the essay library for future use.

---

## Unique Constraints

| Model | Constraint | Purpose |
|-------|-----------|---------|
| User | `email` | One account per email |
| User | `clerkId` | One Clerk auth per user |
| Student | `userId` | One student per user (1:1) |
| Profile | `studentId` | One profile per student (1:1) |
| Application | `(studentId, scholarshipId)` | No duplicate applications |
| Match | `(studentId, scholarshipId)` | One match per student-scholarship pair |
| Timeline | `applicationId` | One timeline per application (1:1) |
| Outcome | `applicationId` | One outcome per application (1:1) |
| Recommendation | `uploadToken` | Secure unique upload links |

---

## Indexes for Query Performance

### Profile Module Indexes
```prisma
User:
  @@index([clerkId])
  @@index([email])

Student:
  @@index([userId])

Profile:
  @@index([studentId])
  @@index([graduationYear])
  @@index([intendedMajor])
```

### Matching Module Indexes
```prisma
Scholarship:
  @@index([deadline])
  @@index([awardAmount])
  @@index([provider])
  @@index([category])
  @@index([verified, deadline])  // composite

Match:
  @@index([studentId, priorityTier])  // composite
  @@index([scholarshipId])
  @@index([overallMatchScore])
```

### Application Module Indexes
```prisma
Application:
  @@index([studentId, status])  // composite - dashboard queries
  @@index([status])
  @@index([targetSubmitDate])

Timeline:
  @@index([applicationId])
  @@index([submitDate])
```

### Content Module Indexes
```prisma
Document:
  @@index([studentId])
  @@index([applicationId])
  @@index([type])

Essay:
  @@index([studentId])
  @@index([applicationId])
  @@index([phase])

Recommendation:
  @@index([applicationId])
  @@index([status])
  @@index([uploadToken])
```

### Analytics Module Indexes
```prisma
Outcome:
  @@index([studentId])
  @@index([applicationId])
  @@index([result])
  @@index([decisionDate])

AnalyticsSnapshot:
  @@index([studentId, snapshotDate])  // composite
  @@index([periodStart])
```

---

## Enums (Fixed Value Sets)

```prisma
enum UserRole {
  STUDENT
  COUNSELOR
  PARENT
  ADMIN
}

enum FinancialNeed {
  LOW
  MODERATE
  HIGH
  VERY_HIGH
}

enum ApplicationStatus {
  NOT_STARTED
  TODO
  IN_PROGRESS
  READY_FOR_REVIEW
  SUBMITTED
  AWAITING_DECISION
  AWARDED
  DENIED
  WITHDRAWN
}

enum PriorityTier {
  MUST_APPLY
  SHOULD_APPLY
  IF_TIME_PERMITS
  HIGH_VALUE_REACH
}

enum EffortLevel {
  LOW
  MEDIUM
  HIGH
}

enum DocumentType {
  TRANSCRIPT
  RESUME
  PERSONAL_STATEMENT
  FINANCIAL_DOCUMENT
  RECOMMENDATION_LETTER
  SUPPLEMENTAL_MATERIAL
  OTHER
}

enum EssayPhase {
  DISCOVERY
  STRUCTURE
  DRAFTING
  REVISION
  POLISH
  FINALIZATION
}

enum RecommendationStatus {
  PENDING_REQUEST
  REQUESTED
  REMINDED
  RECEIVED
  SUBMITTED
}

enum OutcomeResult {
  AWARDED
  DENIED
  WAITLISTED
  WITHDRAWN
}
```

---

## Performance Considerations

### Query Optimization Targets
- **Common queries <100ms:** Dashboard data, scholarship search, application list
- **Index coverage:** All foreign keys indexed
- **Composite indexes:** For frequent multi-column WHERE clauses (e.g., `Application (studentId, status)`)

### Scale Targets
- **Students:** 100,000+
- **Scholarships:** 10,000+
- **Applications:** 500,000+ (avg 5 per student)
- **Documents/Essays:** 1,000,000+

### Access Patterns
1. **Dashboard:** `SELECT * FROM Application WHERE studentId = ? AND status IN (?) ORDER BY targetSubmitDate`
2. **Scholarship Search:** `SELECT * FROM Scholarship WHERE verified = true AND deadline > NOW() ORDER BY deadline`
3. **Match Discovery:** `SELECT * FROM Match WHERE studentId = ? AND priorityTier IN (?) ORDER BY overallMatchScore DESC`
4. **Essay Library:** `SELECT * FROM Essay WHERE studentId = ? AND applicationId IS NULL ORDER BY createdAt DESC`

---

## Data Integrity Rules

### NOT NULL Constraints
- **Required user fields:** userId, email, firstName, lastName
- **Required scholarship fields:** name, provider, deadline, awardAmount
- **Required application fields:** studentId, scholarshipId, status
- **All timestamps:** createdAt, updatedAt (with defaults)

### Default Values
```prisma
// Timestamps
createdAt @default(now())
updatedAt @updatedAt

// Booleans
emailVerified @default(false)
pellGrantEligible @default(false)
firstGeneration @default(false)
verified @default(false)
isComplete @default(false)
aiGenerated @default(false)

// Enums
role @default(STUDENT)
status @default(NOT_STARTED)

// Numeric
completionPercentage @default(0)
strengthScore @default(0)
volunteerHours @default(0)
gpaScale @default(4.0)
```

---

## Change Log

- **2025-10-23:** Initial ER diagram created for Story 1.2 (Database Schema Design & Implementation)
- **Reviewed Against:** [Data Architecture (02-data-architecture.md)](02-data-architecture.md), [Tech Spec Epic 1](../tech-spec-epic-1.md)

---

## Verification Checklist

- [x] All 12 core entities documented
- [x] All relationships defined with cardinality
- [x] Foreign key cascade rules specified
- [x] All unique constraints listed
- [x] All indexes documented
- [x] All 9 enums defined
- [x] Performance targets specified
- [x] Scale targets documented (100K+ students, 10K+ scholarships)
- [x] Access patterns analyzed
- [x] Data integrity rules defined
- [x] Matches [Data Architecture](02-data-architecture.md) specification
