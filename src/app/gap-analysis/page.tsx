/**
 * Gap Analysis Page
 *
 * Main page for gap analysis feature displaying:
 * - Gap Analysis Dashboard
 * - Improvement Roadmap
 * - Progress Comparison
 * - Interactive Simulator
 *
 * Story: 5.3 - Gap Analysis - Profile Improvement Recommendations
 * @module app/gap-analysis
 */

import { GapAnalysisDashboard } from '@/components/gap-analysis/GapAnalysisDashboard'
// import { RoadmapTimeline } from '@/components/gap-analysis/RoadmapTimeline'
import { ProgressComparison } from '@/components/gap-analysis/ProgressComparison'
import { GapSimulator } from '@/components/gap-analysis/GapSimulator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Target, MapPin, TrendingUp, Sparkles } from 'lucide-react'

export default function GapAnalysisPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Tabs defaultValue="analysis" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Gap Analysis</span>
          </TabsTrigger>
          <TabsTrigger value="roadmap" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">Roadmap</span>
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Progress</span>
          </TabsTrigger>
          <TabsTrigger value="simulator" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Simulator</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="space-y-6">
          <GapAnalysisDashboard />
        </TabsContent>

        <TabsContent value="roadmap" className="space-y-6">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Your Improvement Roadmap
            </h1>
            <p className="text-gray-600">
              Follow this strategic plan to unlock more scholarship opportunities
            </p>
          </div>
          {/* RoadmapTimeline will be populated after analysis */}
          <p className="text-center text-gray-500">
            Run the Gap Analysis first to generate your personalized roadmap
          </p>
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Track Your Progress
            </h1>
            <p className="text-gray-600">
              See how your profile has improved since your last analysis
            </p>
          </div>
          <ProgressComparison />
        </TabsContent>

        <TabsContent value="simulator" className="space-y-6">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Explore "What-If" Scenarios
            </h1>
            <p className="text-gray-600">
              See how different improvements would impact your scholarship opportunities
            </p>
          </div>
          <GapSimulator />
        </TabsContent>
      </Tabs>
    </div>
  )
}
