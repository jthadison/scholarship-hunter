/**
 * Story 4.9: Essay Quality Assessment
 * Main Quality Assessment Panel Component
 *
 * Displays comprehensive quality assessment with:
 * - Overall score badge
 * - Dimensional breakdown
 * - Morgan feedback
 * - Improvement suggestions
 * - Success indicator
 */

"use client";

import { useState } from "react";
import { trpc } from "@/shared/lib/trpc";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Loader2, Sparkles, RefreshCw } from "lucide-react";
import { DimensionalBreakdown } from "./DimensionalBreakdown";
import { ImprovementSuggestions } from "./ImprovementSuggestions";
import { MorganFeedback } from "./MorganFeedback";
import { SuccessIndicator } from "./SuccessIndicator";

interface QualityAssessmentPanelProps {
  essayId: string;
  isFirstDraft?: boolean;
}

export function QualityAssessmentPanel({
  essayId,
  isFirstDraft = false,
}: QualityAssessmentPanelProps) {
  const [isAssessing, setIsAssessing] = useState(false);

  // Get cached assessment
  const { data: assessmentData, refetch } = trpc.essay.getQualityAssessment.useQuery(
    { essayId },
    { enabled: !!essayId }
  );

  // Assess quality mutation
  const assessQuality = trpc.essay.assessQuality.useMutation({
    onSuccess: () => {
      void refetch();
    },
  });

  // Get Morgan feedback
  const { data: morganFeedback } = trpc.essay.getMorganFeedback.useQuery(
    { essayId, isFirstDraft },
    { enabled: !!assessmentData?.assessment }
  );

  const handleAssess = async (forceReassess = false) => {
    setIsAssessing(true);
    try {
      await assessQuality.mutateAsync({ essayId, forceReassess });
    } catch (error) {
      console.error("Assessment error:", error);
    } finally {
      setIsAssessing(false);
    }
  };

  const assessment = assessmentData?.assessment as any;
  const score = assessmentData?.score;

  // Score label based on ranges
  const getScoreLabel = (score: number) => {
    if (score >= 90) return { label: "Excellent", color: "text-green-600 bg-green-50" };
    if (score >= 75) return { label: "Strong", color: "text-blue-600 bg-blue-50" };
    if (score >= 60) return { label: "Good", color: "text-yellow-600 bg-yellow-50" };
    if (score >= 50) return { label: "Fair", color: "text-orange-600 bg-orange-50" };
    return { label: "Needs Improvement", color: "text-red-600 bg-red-50" };
  };

  const scoreInfo = score ? getScoreLabel(score) : null;

  return (
    <div className="space-y-6">
      {/* Header with Assess Button */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Essay Quality Assessment
          </CardTitle>
          <Button
            onClick={() => handleAssess(false)}
            disabled={isAssessing}
            size="sm"
            variant={assessment ? "outline" : "default"}
          >
            {isAssessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : assessment ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reassess
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Assess Quality
              </>
            )}
          </Button>
        </CardHeader>

        {assessment && (
          <CardContent className="space-y-6">
            {/* Overall Score Badge */}
            <div className="flex flex-col items-center justify-center space-y-2 rounded-lg border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 p-6">
              <div className="text-sm font-medium text-gray-600">Overall Quality Score</div>
              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-bold text-purple-600">{score}</span>
                <span className="text-2xl text-gray-500">/100</span>
              </div>
              {scoreInfo && (
                <Badge className={scoreInfo.color} variant="secondary">
                  {scoreInfo.label}
                </Badge>
              )}
              <div className="text-xs text-gray-500">
                Last assessed: {new Date(assessment.assessedAt).toLocaleString()}
              </div>
            </div>

            {/* Morgan Feedback */}
            {morganFeedback && (
              <MorganFeedback feedback={morganFeedback} score={score!} />
            )}

            {/* Success Indicator */}
            <SuccessIndicator essayId={essayId} qualityScore={score!} />

            {/* Dimensional Breakdown */}
            <DimensionalBreakdown dimensions={assessment.dimensions} />

            {/* Improvement Suggestions */}
            {assessment.suggestions && assessment.suggestions.length > 0 && (
              <ImprovementSuggestions
                suggestions={assessment.suggestions}
                essayId={essayId}
              />
            )}

            {/* Technical Quality Report Summary */}
            {assessment.technicalQualityReport && (
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="text-sm">Technical Quality Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Grammar errors:</span>
                      <Badge variant={assessment.grammarErrors.length > 3 ? "destructive" : "secondary"}>
                        {assessment.grammarErrors.length}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Style issues:</span>
                      <Badge variant="secondary">
                        {assessment.technicalQualityReport.styleIssues.length}
                      </Badge>
                    </div>
                    {assessment.readabilityMetrics && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Reading grade level:</span>
                        <Badge variant="secondary">
                          {assessment.readabilityMetrics.fleschKincaidGradeLevel.toFixed(1)}
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Authenticity Warnings */}
            {assessment.authenticityWarnings && assessment.authenticityWarnings.length > 0 && (
              <Card className="border-amber-200 bg-amber-50">
                <CardHeader>
                  <CardTitle className="text-sm text-amber-800">
                    Authenticity Concerns
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-amber-700">
                    {assessment.authenticityWarnings.map((warning: string, index: number) => (
                      <li key={index} className="flex gap-2">
                        <span>•</span>
                        <span>{warning}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </CardContent>
        )}

        {/* Empty State */}
        {!assessment && !isAssessing && (
          <CardContent>
            <div className="flex flex-col items-center justify-center space-y-4 py-8 text-center">
              <Sparkles className="h-12 w-12 text-gray-400" />
              <div>
                <h3 className="font-semibold text-gray-900">Ready to Assess Your Essay?</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get comprehensive feedback across 5 quality dimensions with specific improvement
                  suggestions from Morgan.
                </p>
              </div>
              <Button onClick={() => handleAssess(false)}>
                <Sparkles className="mr-2 h-4 w-4" />
                Assess Quality
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
