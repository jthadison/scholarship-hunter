/**
 * Story 5.10: Help System - Help Articles Content
 *
 * Initial help articles content for seeding database.
 * Total: 20 articles covering all major features.
 *
 * @module server/lib/help/help-articles
 */

import { HelpCategory } from '@prisma/client'

export interface HelpArticleData {
  title: string
  slug: string
  description: string
  content: string
  category: HelpCategory
  context: string[]
  keywords: string[]
  order: number
  relatedArticleIds: string[] // Will be populated after creation
}

export const HELP_ARTICLES: Omit<HelpArticleData, 'relatedArticleIds'>[] = [
  // ============================================================================
  // GETTING_STARTED (5 articles)
  // ============================================================================
  {
    title: 'Getting Started with Scholarship Hunter',
    slug: 'getting-started',
    description:
      'Learn the basics of using Scholarship Hunter to find and apply for scholarships.',
    content: `# Getting Started with Scholarship Hunter

Welcome to Scholarship Hunter! This guide will help you get started with the platform.

## Step 1: Complete Your Profile
Your profile is the foundation of your scholarship matches. Make sure to fill out all sections:
- Academic information (GPA, test scores)
- Demographics and background
- Major and career goals
- Extracurricular activities and achievements

## Step 2: Browse Scholarships
Navigate to the Scholarships page to discover opportunities. Use filters to narrow down results:
- Award amount
- Deadline
- Category (STEM, Arts, etc.)

## Step 3: Add Applications
When you find a scholarship you like, click "Add to Applications" to track it in your pipeline.

## Step 4: Track Your Progress
Use the Applications page to monitor deadlines, submit documents, and track outcomes.

## Need Help?
Click the help icon (?) on any page for context-specific guidance.`,
    category: 'GETTING_STARTED',
    context: ['/dashboard', '/'],
    keywords: ['getting started', 'welcome', 'introduction', 'basics', 'tutorial'],
    order: 1,
  },

  {
    title: 'Understanding Profile Strength',
    slug: 'profile-strength',
    description: 'Learn how profile strength is calculated and how to improve it.',
    content: `# Understanding Profile Strength

Your profile strength score (0-100) indicates how competitive your profile is for scholarships.

## How It's Calculated
Profile strength is based on five dimensions:
1. **Academic** (30%): GPA, test scores, class rank
2. **Experience** (25%): Extracurriculars, volunteer hours, work experience
3. **Leadership** (20%): Leadership roles and awards
4. **Demographics** (15%): Unique background factors
5. **Completeness** (10%): How much of your profile is filled out

## Improving Your Score
- Complete all profile sections
- Add extracurricular activities
- List leadership roles
- Update test scores regularly
- Track volunteer hours

## Why It Matters
Higher profile strength means:
- Better scholarship matches
- Higher success probability scores
- More opportunities unlocked`,
    category: 'GETTING_STARTED',
    context: ['/dashboard', '/profile'],
    keywords: ['profile strength', 'score', 'competitive', 'improvement'],
    order: 2,
  },

  {
    title: 'Dashboard Overview',
    slug: 'dashboard-overview',
    description: 'Navigate your dashboard and understand key metrics.',
    content: `# Dashboard Overview

Your dashboard provides a quick snapshot of your scholarship journey.

## Key Sections
### Profile Strength Card
Shows your current profile strength score and improvement suggestions.

### Application Pipeline
Quick view of applications by status:
- Not Started
- In Progress
- Submitted
- Awarded/Denied

### Upcoming Deadlines
Next 5 critical deadlines to keep you on track.

### Recent Matches
New scholarship opportunities discovered by our matching engine.

### Funding Summary
Total potential funding from your applications.

## Quick Actions
- Add new application
- Update profile
- View analytics
- Export data`,
    category: 'GETTING_STARTED',
    context: ['/dashboard'],
    keywords: ['dashboard', 'overview', 'metrics', 'quick view'],
    order: 3,
  },

  {
    title: 'What Are Next Steps?',
    slug: 'next-steps',
    description: 'Understand recommended next steps and action items.',
    content: `# What Are Next Steps?

The "Next Steps" section on your dashboard provides personalized action items to keep you on track.

## Types of Next Steps
### Urgent Actions
- Deadlines within 7 days
- Missing documents
- Incomplete applications

### Profile Improvements
- Suggested fields to complete
- Gaps to fill for better matches

### New Opportunities
- Recently matched scholarships
- High-value opportunities

## How to Act
Click any next step to navigate directly to the relevant page and complete the action.

## Priority Order
Next steps are sorted by:
1. Urgency (deadline proximity)
2. Impact (funding amount, match score)
3. Ease (time to complete)`,
    category: 'GETTING_STARTED',
    context: ['/dashboard'],
    keywords: ['next steps', 'actions', 'recommendations', 'todo'],
    order: 4,
  },

  {
    title: 'Contact Support',
    slug: 'contact-support',
    description: 'Get help from our support team.',
    content: `# Contact Support

Need additional assistance? Our support team is here to help!

## Support Channels
### Email Support
- support@scholarshiphunter.com
- Response time: Within 24 hours

### Help Articles
Browse our comprehensive help center for answers to common questions.

### AI Assistant
Ask questions in natural language using the AI help assistant (available in the help panel).

## Before Contacting Support
1. Check the help articles for your question
2. Search the help center
3. Ask the AI assistant

## What to Include
When contacting support, please provide:
- Your account email
- Description of the issue
- Screenshots if applicable
- Steps to reproduce the problem`,
    category: 'GETTING_STARTED',
    context: ['/'],
    keywords: ['support', 'contact', 'help', 'email', 'assistance'],
    order: 5,
  },

  // ============================================================================
  // SCHOLARSHIPS (4 articles)
  // ============================================================================
  {
    title: 'Scholarship Search Tips',
    slug: 'search-tips',
    description: 'Master scholarship search with filters and keywords.',
    content: `# Scholarship Search Tips

Find the best scholarships faster with these search strategies.

## Use Filters Effectively
### Award Amount
Set minimum award amount to focus on high-value scholarships.

### Deadline Range
Filter by deadlines that fit your timeline.

### Category
Browse by field of study (STEM, Arts, Business, etc.).

### Match Score
Focus on scholarships with 75%+ match scores for best success probability.

## Search Keywords
Try searching for:
- Your major or field of study
- Your state or city
- Special circumstances (first-generation, military affiliation)
- Specific organizations

## Save Searches
Use the "Recent Searches" feature to quickly re-run common searches.

## Browse by Priority Tier
- **Must Apply**: 90%+ match, high-value, high success probability
- **Should Apply**: 75-89% match, good fit
- **If Time Permits**: 60-74% match, worth considering`,
    category: 'SCHOLARSHIPS',
    context: ['/scholarships'],
    keywords: ['search', 'filters', 'keywords', 'find scholarships'],
    order: 1,
  },

  {
    title: 'Understanding Match Scores',
    slug: 'match-scores',
    description: 'Learn how scholarship match scores are calculated.',
    content: `# Understanding Match Scores

Match scores (0-100) indicate how well you align with a scholarship's requirements.

## Components
Match scores combine six factors:
1. **Academic** (25%): GPA, test scores vs. requirements
2. **Demographics** (20%): Ethnicity, gender, state
3. **Major/Field** (20%): Intended major alignment
4. **Experience** (15%): Extracurriculars, volunteer work
5. **Financial** (10%): Financial need criteria
6. **Special Criteria** (10%): Unique requirements (first-gen, military, etc.)

## Score Ranges
- **90-100**: Excellent match - highly recommended
- **75-89**: Good match - strong fit
- **60-74**: Moderate match - worth considering
- **Below 60**: Weak match - may not meet criteria

## Improving Your Match Scores
- Complete all profile sections
- Update profile regularly
- Add extracurricular activities
- Document special circumstances`,
    category: 'SCHOLARSHIPS',
    context: ['/scholarships', '/scholarships/[id]'],
    keywords: ['match score', 'percentage', 'fit', 'requirements'],
    order: 2,
  },

  {
    title: 'Eligibility Criteria Explained',
    slug: 'eligibility-criteria',
    description: 'Understand scholarship eligibility requirements.',
    content: `# Eligibility Criteria Explained

Every scholarship has eligibility criteria you must meet to apply.

## Common Criteria
### Academic Requirements
- Minimum GPA (e.g., 3.0 or higher)
- Test score thresholds (SAT/ACT)
- Class rank requirements

### Demographic Requirements
- Geographic location (state, city, zip code)
- Citizenship status
- Gender, ethnicity, or other identities

### Field of Study
- Specific majors or career paths
- STEM fields, arts, business, etc.

### Special Circumstances
- First-generation college student
- Military affiliation
- Financial need
- Disability status

## Hard vs. Soft Requirements
- **Hard**: Must meet to be eligible (automatic filter)
- **Soft**: Preferred but not required (affects match score)

## Checking Eligibility
Scholarship Hunter automatically filters scholarships based on your profile. Only see scholarships you're eligible for!`,
    category: 'SCHOLARSHIPS',
    context: ['/scholarships', '/scholarships/[id]'],
    keywords: ['eligibility', 'criteria', 'requirements', 'qualify'],
    order: 3,
  },

  {
    title: 'Adding Scholarships to Applications',
    slug: 'add-to-applications',
    description: 'Learn how to add scholarships to your application pipeline.',
    content: `# Adding Scholarships to Applications

Found a scholarship you want to apply for? Here's how to add it to your pipeline.

## From Scholarship Detail Page
1. Review the scholarship details
2. Check eligibility and requirements
3. Click "Add to Applications" button
4. Scholarship is added to your pipeline

## From Search Results
- Click the "+" icon on any scholarship card
- Adds directly to your applications

## What Happens Next
When you add a scholarship:
- Timeline is automatically generated
- Deadlines are added to your calendar
- Required documents are listed
- Essay prompts are identified

## Managing Applications
Navigate to the Applications page to:
- Track progress
- Upload documents
- Write essays
- Submit applications`,
    category: 'SCHOLARSHIPS',
    context: ['/scholarships/[id]'],
    keywords: ['add application', 'apply', 'start application', 'pipeline'],
    order: 4,
  },

  // ============================================================================
  // APPLICATIONS (4 articles)
  // ============================================================================
  {
    title: 'Application Pipeline Overview',
    slug: 'application-pipeline',
    description: 'Understand your application pipeline and status tracking.',
    content: `# Application Pipeline Overview

Your application pipeline tracks all scholarships you're applying for.

## Pipeline Statuses
### Not Started
- Scholarship added but no work begun
- Review requirements and timeline

### In Progress
- Application underway
- Documents being gathered
- Essays in draft

### Ready to Submit
- All requirements completed
- Final review needed

### Submitted
- Application sent
- Awaiting decision

### Awarded / Denied / Withdrawn
- Final outcomes

## Pipeline View
### Kanban Board
Drag-and-drop applications between status columns.

### List View
See all applications in a sortable table.

### Calendar View
Visualize deadlines on a calendar.

## Quick Actions
- Bulk status updates
- Filter by deadline, award amount, or status
- Export application list`,
    category: 'APPLICATIONS',
    context: ['/applications'],
    keywords: ['pipeline', 'applications', 'status', 'tracking'],
    order: 1,
  },

  {
    title: 'Deadline Management',
    slug: 'deadline-management',
    description: 'Never miss a scholarship deadline with our tools.',
    content: `# Deadline Management

Stay on top of deadlines with Scholarship Hunter's deadline management tools.

## Deadline Alerts
Receive notifications:
- **14 days before**: Initial reminder
- **7 days before**: Urgent reminder
- **3 days before**: Critical alert
- **1 day before**: Final warning

## Alert Channels
- Email notifications
- In-app alerts
- Calendar invites (.ics files)

## Managing Alert Preferences
Navigate to Settings > Notifications to customize:
- Notification frequency
- Alert timing
- Email vs. in-app preference

## Deadline Calendar
View all deadlines in calendar format:
- Monthly, weekly, or daily view
- Export to Google Calendar, Outlook
- Color-coded by priority tier

## At-Risk Detection
Applications flagged as "At Risk" when:
- Deadline approaching with low completion
- Missing critical documents
- Essay not started`,
    category: 'APPLICATIONS',
    context: ['/applications'],
    keywords: ['deadlines', 'alerts', 'notifications', 'reminders', 'calendar'],
    order: 2,
  },

  {
    title: 'Application Progress Tracking',
    slug: 'progress-tracking',
    description: 'Monitor completion percentage and requirements.',
    content: `# Application Progress Tracking

Track your progress toward completing each application.

## Completion Percentage
Each application shows a progress bar based on:
- Documents uploaded (40%)
- Essays completed (40%)
- Recommendations requested (10%)
- Additional requirements (10%)

## Requirements Checklist
View detailed checklist:
- [ ] Transcript uploaded
- [ ] Essay 1 complete
- [ ] Recommendation letter 1 requested
- [ ] Supplemental form submitted

## Progress Indicators
### Green (80-100%)
Application nearly complete, ready to submit.

### Yellow (50-79%)
Good progress, continue working.

### Red (0-49%)
Needs attention, especially if deadline is soon.

## Time Estimates
Each requirement shows estimated time to complete:
- Upload document: 5 min
- Write essay: 2-4 hours
- Request recommendation: 10 min`,
    category: 'APPLICATIONS',
    context: ['/applications', '/applications/[id]'],
    keywords: ['progress', 'completion', 'percentage', 'requirements', 'checklist'],
    order: 3,
  },

  {
    title: 'Application Workspace Guide',
    slug: 'application-workspace',
    description: 'Navigate the application workspace for managing a single application.',
    content: `# Application Workspace Guide

The application workspace is your hub for managing a single scholarship application.

## Workspace Sections
### Overview Tab
- Scholarship details
- Deadline countdown
- Progress summary
- Quick actions

### Requirements Tab
- Document checklist
- Essay prompts
- Recommendation letters
- Additional materials

### Timeline Tab
- Key milestones
- Recommended schedule
- Completion tracking

### Notes Tab
- Personal notes
- Research findings
- Application strategy

## Quick Actions
- Upload documents
- Start essay
- Request recommendation
- Update status
- Set reminders

## Mobile Access
Access the workspace on mobile for on-the-go updates.`,
    category: 'APPLICATIONS',
    context: ['/applications/[id]'],
    keywords: ['workspace', 'application details', 'manage application'],
    order: 4,
  },

  // ============================================================================
  // ESSAYS (3 articles)
  // ============================================================================
  {
    title: 'Essay Writing Tips',
    slug: 'essay-writing-tips',
    description: 'Write compelling scholarship essays that win awards.',
    content: `# Essay Writing Tips

Craft standout scholarship essays with these proven strategies.

## Essay Structure
### Introduction (10%)
- Hook the reader
- State your thesis
- Preview main points

### Body (80%)
- 2-3 main points
- Concrete examples
- Personal anecdotes
- Evidence and details

### Conclusion (10%)
- Summarize key points
- Connect to future goals
- Leave lasting impression

## Writing Tips
1. **Show, don't tell**: Use specific examples
2. **Be authentic**: Write in your own voice
3. **Answer the prompt**: Stay focused on the question
4. **Use active voice**: Makes writing more engaging
5. **Proofread**: Check for grammar and spelling errors

## Common Mistakes to Avoid
- Generic, vague statements
- Repeating resume information
- Ignoring word limits
- Waiting until last minute

## Get Feedback
- Use AI quality assessment
- Ask teachers or counselors
- Peer review`,
    category: 'ESSAYS',
    context: ['/essays', '/essays/[id]'],
    keywords: ['essay', 'writing tips', 'how to write', 'essay structure'],
    order: 1,
  },

  {
    title: 'Using the Essay AI Assistant',
    slug: 'ai-assistance',
    description: 'Leverage AI tools to improve your essays.',
    content: `# Using the Essay AI Assistant

Scholarship Hunter's AI assistant helps you write better essays faster.

## AI Features
### Brainstorming
- Generate topic ideas
- Outline suggestions
- Angle recommendations

### Drafting
- First draft generation
- Paragraph expansion
- Sentence rewording

### Editing
- Grammar and style suggestions
- Clarity improvements
- Tone adjustments

### Quality Assessment
- 6-dimensional scoring
- Specific improvement feedback
- Prompt alignment check

## How to Use
1. Open essay editor
2. Click "AI Assistant" button
3. Select AI action (brainstorm, draft, edit)
4. Review and customize AI output
5. Incorporate suggestions

## Best Practices
- Use AI as a starting point, not final product
- Personalize all AI-generated content
- Maintain your authentic voice
- Review AI suggestions critically

## Limitations
AI assistant cannot:
- Submit essays on your behalf
- Guarantee scholarship acceptance
- Replace human creativity and insight`,
    category: 'ESSAYS',
    context: ['/essays/[id]'],
    keywords: ['AI assistant', 'essay help', 'AI writing', 'improve essay'],
    order: 2,
  },

  {
    title: 'Essay Quality Assessment',
    slug: 'quality-assessment',
    description: 'Understand how essay quality is scored and how to improve.',
    content: `# Essay Quality Assessment

Get objective feedback on your essay quality with our 6-dimensional scoring.

## Quality Dimensions
### 1. Prompt Alignment (0-100)
Does your essay answer the question directly?

### 2. Clarity (0-100)
Is your essay easy to understand?

### 3. Engagement (0-100)
Does your essay capture attention?

### 4. Grammar & Mechanics (0-100)
Is your essay free of errors?

### 5. Authenticity (0-100)
Does your essay reflect your unique voice?

### 6. Impact (0-100)
Does your essay make a memorable impression?

## Overall Quality Score
Average of all six dimensions (0-100).

## Score Ranges
- **90-100**: Excellent - ready to submit
- **75-89**: Good - minor improvements needed
- **60-74**: Fair - significant revision recommended
- **Below 60**: Needs work - major revisions required

## Improvement Recommendations
Each dimension includes specific suggestions for improvement.

## Recheck After Edits
Run quality assessment again after making revisions to track improvement.`,
    category: 'ESSAYS',
    context: ['/essays/[id]'],
    keywords: ['essay quality', 'assessment', 'score', 'feedback', 'evaluation'],
    order: 3,
  },

  // ============================================================================
  // DOCUMENTS (2 articles)
  // ============================================================================
  {
    title: 'Document Vault Overview',
    slug: 'document-vault',
    description: 'Store and organize scholarship documents securely.',
    content: `# Document Vault Overview

The Document Vault is your centralized storage for all scholarship-related files.

## Document Types
### Required Documents
- Transcripts (official and unofficial)
- Test score reports (SAT, ACT)
- Proof of residency
- Financial aid forms

### Supporting Documents
- Resume / CV
- Letters of recommendation
- Personal statements
- Supplemental essays

### Custom Documents
Upload any additional files required by specific scholarships.

## Features
### Version Control
- Track document revisions
- Revert to previous versions
- See change history

### Organization
- Folder structure by document type
- Tag documents for easy search
- Link documents to applications

### Security
- Encrypted storage
- Access controls
- Secure sharing

## Uploading Documents
1. Navigate to Documents page
2. Click "Upload Document"
3. Select file (PDF, DOCX, JPG, PNG)
4. Choose document type
5. Add description (optional)`,
    category: 'DOCUMENTS',
    context: ['/documents'],
    keywords: ['documents', 'vault', 'upload', 'storage', 'files'],
    order: 1,
  },

  {
    title: 'Document Version Control',
    slug: 'version-control',
    description: 'Manage document versions and track changes.',
    content: `# Document Version Control

Keep track of document changes with built-in version control.

## How It Works
Every time you upload a new version of a document:
- Previous version is saved
- Version number increments (v1, v2, v3)
- Timestamp and change notes recorded

## Viewing Version History
1. Open document detail page
2. Click "Version History" tab
3. See list of all versions

## Comparing Versions
- Side-by-side comparison
- Highlighted changes
- Download any version

## Reverting to Previous Version
1. Select version from history
2. Click "Restore This Version"
3. Confirm restoration
4. Current version becomes new latest version

## Best Practices
- Add change notes when uploading new version
- Review version before sharing with scholarship providers
- Keep original documents (don't delete old versions)

## Storage Limits
- 90 days version history retention
- Older versions automatically archived`,
    category: 'DOCUMENTS',
    context: ['/documents', '/documents/[id]'],
    keywords: ['version control', 'document history', 'revisions', 'changes'],
    order: 2,
  },

  // ============================================================================
  // ANALYTICS (2 articles)
  // ============================================================================
  {
    title: 'Success Metrics Dashboard',
    slug: 'success-metrics',
    description: 'Track your scholarship success with detailed analytics.',
    content: `# Success Metrics Dashboard

Monitor your scholarship journey with comprehensive analytics.

## Key Metrics
### Applications Submitted
Total number of scholarship applications submitted.

### Success Rate
Percentage of applications that resulted in awards.

### Funding Secured
Total dollar amount awarded.

### Average Award
Mean award amount across all wins.

### Tier Breakdown
Distribution of applications by priority tier (Must Apply, Should Apply, If Time Permits).

## Trend Charts
### Cumulative Funding Over Time
Track total funding growth month-by-month.

### Application Outcomes
Pie chart showing Awarded, Denied, Pending breakdown.

### Monthly Activity
Applications submitted per month.

## ROI Analysis
### Effort vs. Return
Time invested compared to funding secured.

### Tier Performance
Success rate by priority tier.

## Exporting Analytics
Download analytics reports as PDF for:
- College applications
- Counselor meetings
- Parent updates`,
    category: 'ANALYTICS',
    context: ['/analytics'],
    keywords: ['analytics', 'metrics', 'success rate', 'funding', 'dashboard'],
    order: 1,
  },

  {
    title: 'Gap Analysis & Improvement',
    slug: 'gap-analysis',
    description: 'Identify opportunities to improve your scholarship competitiveness.',
    content: `# Gap Analysis & Improvement

Discover how to unlock more scholarship opportunities through strategic profile improvements.

## What Is Gap Analysis?
Gap analysis identifies missing qualifications or experiences that prevent you from accessing high-value scholarships.

## Types of Gaps
### Academic Gaps
- GPA threshold not met
- Missing test scores
- Class rank requirement

### Experience Gaps
- Insufficient volunteer hours
- No leadership roles
- Limited extracurriculars

### Demographic Gaps
- Profile information incomplete
- Missing special circumstances

## Gap Recommendations
Each gap includes:
- **Description**: What's missing
- **Impact**: Scholarships unlocked if filled
- **Achievability**: Easy, Moderate, or Long-Term
- **Action Plan**: Steps to fill the gap

## Profile Projection
See how filling gaps would improve:
- Profile strength score
- Number of matches
- Potential funding

## Setting Goals
Convert gaps into actionable goals:
1. Review gap analysis
2. Select high-impact gaps
3. Create improvement goals
4. Track progress`,
    category: 'ANALYTICS',
    context: ['/analytics', '/profile'],
    keywords: ['gap analysis', 'improvement', 'opportunities', 'unlock scholarships'],
    order: 2,
  },
]
