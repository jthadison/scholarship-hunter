'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { ExternalLink, FileText, DollarSign, GraduationCap, Heart, Info } from 'lucide-react'

/**
 * Resource Center Component
 *
 * Displays curated financial aid and college planning resources for parents.
 * Story 5.8: Parent/Guardian View - Task 9 (Financial Aid Resources)
 */
export function ResourceCenter() {
  const resources = [
    {
      category: 'Financial Aid Basics',
      icon: <DollarSign className="h-5 w-5" />,
      items: [
        {
          title: 'FAFSA (Free Application for Federal Student Aid)',
          description: 'Complete the FAFSA to qualify for federal grants, loans, and work-study programs.',
          url: 'https://studentaid.gov/h/apply-for-aid/fafsa',
          placeholder: true,
        },
        {
          title: 'CSS Profile',
          description: 'Required by some colleges for institutional aid. Separate from FAFSA.',
          url: 'https://cssprofile.collegeboard.org/',
          placeholder: true,
        },
        {
          title: 'Federal Student Aid',
          description: 'Official U.S. government source for information on federal student aid programs.',
          url: 'https://studentaid.gov/',
          placeholder: true,
        },
      ],
    },
    {
      category: 'Scholarship Strategies',
      icon: <GraduationCap className="h-5 w-5" />,
      items: [
        {
          title: 'How to Support Your Student\'s Scholarship Journey',
          description: 'Best practices for helping without overwhelming. Encouragement strategies that work.',
          url: '#',
          placeholder: true,
          type: 'PDF Guide',
        },
        {
          title: 'Understanding Scholarship Timelines',
          description: 'What to expect during the application and award process.',
          url: '#',
          placeholder: true,
          type: 'Article',
        },
        {
          title: 'Scholarship Scam Warning Signs',
          description: 'How to identify legitimate scholarships and avoid fraudulent opportunities.',
          url: '#',
          placeholder: true,
          type: 'Guide',
        },
      ],
    },
    {
      category: 'College Planning',
      icon: <FileText className="h-5 w-5" />,
      items: [
        {
          title: 'Net Price Calculators',
          description: 'Estimate what colleges will actually cost after financial aid.',
          url: 'https://collegecost.ed.gov/net-price',
          placeholder: true,
        },
        {
          title: 'College Scorecard',
          description: 'Compare colleges by cost, graduation rates, and average earnings after graduation.',
          url: 'https://collegescorecard.ed.gov/',
          placeholder: true,
        },
        {
          title: 'Understanding Financial Aid Packages',
          description: 'How to compare aid offers and make informed decisions.',
          url: '#',
          placeholder: true,
          type: 'PDF Guide',
        },
      ],
    },
    {
      category: 'Supporting Your Student',
      icon: <Heart className="h-5 w-5" />,
      items: [
        {
          title: 'Managing College Application Stress',
          description: 'Tips for keeping your student motivated without adding pressure.',
          url: '#',
          placeholder: true,
          type: 'Article',
        },
        {
          title: 'Parent-Student Communication Guide',
          description: 'How to have productive conversations about college funding and expectations.',
          url: '#',
          placeholder: true,
          type: 'Guide',
        },
        {
          title: 'Financial Planning for College',
          description: 'Budgeting strategies and financial planning resources for families.',
          url: '#',
          placeholder: true,
          type: 'Worksheet',
        },
      ],
    },
  ]

  return (
    <div className="space-y-6">
      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          These resources are provided for informational purposes. We are not affiliated with these
          organizations. Always verify information with official sources.
        </AlertDescription>
      </Alert>

      {/* Resource Categories */}
      {resources.map((category) => (
        <Card key={category.category}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {category.icon}
              {category.category}
            </CardTitle>
            <CardDescription>
              {category.category === 'Financial Aid Basics' &&
                'Essential resources for understanding and applying for financial aid'}
              {category.category === 'Scholarship Strategies' &&
                'Tips and guides for maximizing scholarship success'}
              {category.category === 'College Planning' &&
                'Tools for comparing colleges and planning finances'}
              {category.category === 'Supporting Your Student' &&
                'Resources for helping your student succeed'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {category.items.map((item) => (
                <div
                  key={item.title}
                  className="flex flex-col gap-2 rounded-lg border p-4 hover:bg-accent transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-sm">{item.title}</h3>
                    {item.type && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        {item.type}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 w-fit"
                    asChild={!item.placeholder}
                    disabled={item.placeholder && item.url === '#'}
                    title={item.placeholder ? 'Placeholder - Content coming soon' : undefined}
                  >
                    {item.placeholder && item.url === '#' ? (
                      <span className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Coming Soon
                      </span>
                    ) : (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        View Resource
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Additional Support */}
      <Card>
        <CardHeader>
          <CardTitle>Need More Help?</CardTitle>
          <CardDescription>Additional support options for parents</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            If you need additional support or have questions about your student's scholarship
            progress, consider:
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
            <li>Contacting your student's high school counselor</li>
            <li>Reviewing scholarship requirements together with your student</li>
            <li>Attending financial aid workshops at prospective colleges</li>
            <li>Consulting with a college financial planner if needed</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
