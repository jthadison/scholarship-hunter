# Scholarship Data Sources

This document tracks the sources of scholarship data imported into the Scholarship Hunter database.

## Data Source Requirements

All scholarship data must meet these criteria:

- ✅ **Verified**: Data from official scholarship provider websites or trusted aggregators
- ✅ **Current**: Deadlines must be in the future (system auto-filters expired scholarships)
- ✅ **Complete**: All required fields present (name, provider, description, award, deadline, criteria)
- ✅ **Accurate**: Award amounts, eligibility requirements, and URLs verified
- ✅ **Attribution**: Source URL documented for each scholarship

## MVP Seed Dataset

**File**: `data/mvp-scholarships-1000.json`
**Status**: Generated
**Record Count**: 1,000+
**Last Updated**: 2025-10-25

### Distribution

The MVP seed dataset includes diverse scholarships across:

- **30% Merit-based**: Academic excellence, test scores, GPA requirements
- **30% Need-based**: Financial need, EFC limits, Pell Grant requirements
- **20% Identity-based**: Gender, ethnicity, first-generation, military
- **20% Mixed criteria**: Combination of merit, need, and identity factors

### Coverage Across 6 Dimensions

1. **Academic**: GPA ranges (2.0-4.0), SAT (400-1600), ACT (1-36)
2. **Demographic**: All genders, diverse ethnicities, all US states, ages 16-30
3. **Major/Field**: STEM, Liberal Arts, Business, Healthcare, Education, Engineering
4. **Experience**: Volunteer hours, leadership, extracurriculars, work experience
5. **Financial**: EFC ranges, Pell Grant, financial need levels
6. **Special**: First-generation, military affiliation, disability, citizenship

## Public Scholarship Databases

These are reputable sources for scholarship data:

### Fastweb
- **URL**: https://www.fastweb.com/
- **Scholarships**: 1.5M+ scholarships, $3.4B in awards
- **Quality**: High - Verified, up-to-date
- **Access**: Free registration required
- **API**: Not publicly available
- **Scraping**: Terms of Service prohibit automated scraping

### Scholarships.com
- **URL**: https://www.scholarships.com/
- **Scholarships**: 3.7M+ scholarships, $19B in awards
- **Quality**: High - Verified, comprehensive
- **Access**: Free registration required
- **API**: Not publicly available
- **Scraping**: Terms of Service prohibit automated scraping

### College Board Scholarship Search
- **URL**: https://bigfuture.collegeboard.org/scholarships
- **Scholarships**: 11,000+ scholarships
- **Quality**: Very High - Official, verified
- **Access**: Free, no registration
- **API**: Not publicly available
- **Data Use**: Educational purposes only

### Peterson's Scholarship Search
- **URL**: https://www.petersons.com/scholarship-search
- **Scholarships**: 1.9M+ scholarships
- **Quality**: High - Curated, verified
- **Access**: Free with registration, premium features available
- **API**: Not publicly available

### Federal Student Aid
- **URL**: https://studentaid.gov/understand-aid/types/scholarships
- **Scholarships**: Federal and state programs
- **Quality**: Very High - Official government data
- **Access**: Free, public
- **Data Use**: Public domain for federal programs

## Organization-Specific Scholarships

### Professional Organizations

- **IEEE**: Engineering and technology scholarships
- **AMA**: Medical and healthcare scholarships
- **ABA**: Legal profession scholarships
- **AAUW**: Women in STEM and education

### Corporate Scholarship Programs

- **Coca-Cola Scholars**: Merit-based, community service
- **Gates Scholarship**: Need-based, minority students
- **Dell Scholars**: Need-based, low-income students
- **Google Lime Scholarship**: Students with disabilities in CS

### Community Foundations

Local community foundations often maintain scholarship programs. Research by state/region.

## Data Collection Methods

### Approved Methods

1. **Manual Entry**: Transcribe from official websites
2. **Official APIs**: Use provider APIs where available (rare)
3. **Official Data Exports**: Request data exports from providers
4. **Public Datasets**: Use openly licensed scholarship datasets
5. **Partnerships**: Establish data sharing agreements with providers

### Prohibited Methods

- ❌ Automated web scraping without permission
- ❌ Using copyrighted data without license
- ❌ Violating Terms of Service of scholarship databases
- ❌ Re-publishing proprietary data without rights

## Data Verification Process

All imported scholarships should be verified:

1. **Source Check**: Verify scholarship exists on provider website
2. **Award Verification**: Confirm award amount is accurate
3. **Deadline Verification**: Check current year deadline
4. **Eligibility Check**: Verify eligibility requirements
5. **URL Validation**: Ensure application URL is correct and active
6. **Contact Verification**: Verify email/phone contact information

## MVP Data Generation

For MVP development and testing, the seed dataset was generated with realistic but synthetic data:

**Characteristics**:
- Realistic scholarship names and providers
- Accurate eligibility criteria structures
- Valid award ranges ($500 - $50,000)
- Diverse geographic coverage (all US states)
- Multiple academic fields and career paths
- Various deadline distribution throughout the year

**Note**: MVP seed data is for testing and development only. Production systems should use verified, real scholarship data from approved sources.

## Data Refresh Schedule

**Recommended Schedule**:
- **Weekly**: Add new scholarships from monitored sources
- **Monthly**: Verify deadlines for upcoming scholarships
- **Quarterly**: Full data quality audit
- **Annually**: Remove expired/discontinued scholarships

## Compliance and Legal

### Data Usage Rights

- Ensure proper licensing for all imported data
- Respect copyright and Terms of Service
- Provide attribution as required
- Do not republish proprietary data without permission

### Student Privacy

- Do not collect personal student information without consent
- Comply with FERPA, COPPA, and privacy regulations
- Secure all student profile data
- Provide data deletion capabilities

### Accuracy Disclaimer

Include disclaimer that scholarship data is provided for informational purposes and students should verify details on official scholarship websites.

## Contributing Scholarship Data

To contribute scholarship data to this project:

1. Ensure you have rights to share the data
2. Verify all information is accurate and current
3. Format data according to import templates
4. Include source attribution (sourceUrl)
5. Mark verified=true only for verified data
6. Submit via pull request with data source documentation

## Questions and Support

For questions about scholarship data sources:
- Review this documentation
- Check import logs for data quality issues
- Verify source URLs are accessible
- Consult legal counsel for licensing questions
