"use client";

/**
 * Polish Panel Component
 * Story 4.7 - AC7: Polish Phase with Grammar and Style Checking
 *
 * Grammar checker, tone analyzer, readability score, word choice suggestions
 */

import { useState } from "react";
import { Sparkles, Loader2, AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import type { PolishAnalysis } from "../../server/services/aiEssayAssistant";

interface PolishPanelProps {
  essayId: string;
  currentContent: string;
  onAnalyze: () => Promise<PolishAnalysis>;
}

export function PolishPanel({
  essayId,
  currentContent,
  onAnalyze,
}: PolishPanelProps) {
  const [analysis, setAnalysis] = useState<PolishAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!currentContent.trim()) {
      alert("Please write some content first");
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await onAnalyze();
      setAnalysis(result);
    } catch (error) {
      console.error("Failed to analyze:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to analyze essay. Please try again."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getIssueIcon = (severity: string) => {
    switch (severity) {
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-blue-600" />;
    }
  };

  const getIssueBadgeColor = (severity: string) => {
    switch (severity) {
      case "error":
        return "bg-red-100 text-red-800";
      case "warning":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const errorCount = analysis?.grammarIssues.filter((i) => i.severity === "error").length || 0;
  const warningCount = analysis?.grammarIssues.filter((i) => i.severity === "warning").length || 0;
  const suggestionCount = analysis?.grammarIssues.filter((i) => i.severity === "suggestion").length || 0;

  const getReadabilityAssessment = (gradeLevel: number) => {
    if (gradeLevel < 8) return { color: "text-yellow-600", message: "Too simple for college essays" };
    if (gradeLevel > 14) return { color: "text-yellow-600", message: "May be too complex" };
    return { color: "text-green-600", message: "Appropriate for scholarship essays" };
  };

  return (
    <div className="polish-panel space-y-6">
      {/* Header with Analyze Button */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                Polish & Style Check
              </CardTitle>
              <CardDescription>
                Check grammar, style, tone, and readability
              </CardDescription>
            </div>
            <Button onClick={handleAnalyze} disabled={isAnalyzing}>
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {analysis ? "Re-check" : "Check Essay"}
                </>
              )}
            </Button>
          </div>
        </CardHeader>

        {/* Summary */}
        {analysis && (
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-700">{errorCount}</div>
                <div className="text-xs text-red-600">Errors</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-700">{warningCount}</div>
                <div className="text-xs text-yellow-600">Warnings</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-700">{suggestionCount}</div>
                <div className="text-xs text-blue-600">Suggestions</div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Analysis Results */}
      {analysis && (
        <>
          {/* Grammar and Style Issues */}
          {analysis.grammarIssues.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Grammar & Style Issues</CardTitle>
                <CardDescription>
                  {analysis.grammarIssues.length} issue{analysis.grammarIssues.length !== 1 ? "s" : ""} found
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis.grammarIssues.map((issue, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg"
                  >
                    <div className="mt-0.5">{getIssueIcon(issue.severity)}</div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <span className="text-sm font-semibold text-gray-900 capitalize">
                          {issue.type}
                        </span>
                        <Badge className={getIssueBadgeColor(issue.severity)}>
                          {issue.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 mb-1">{issue.message}</p>
                      {issue.location && (
                        <p className="text-xs text-gray-500 mb-1">
                          <span className="font-medium">Location:</span> {issue.location}
                        </p>
                      )}
                      {issue.suggestion && (
                        <p className="text-xs text-green-700 bg-green-50 p-2 rounded mt-2">
                          <span className="font-medium">Suggestion:</span> {issue.suggestion}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {analysis.grammarIssues.length === 0 && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="py-8 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-green-900 mb-1">
                  No Issues Found!
                </h3>
                <p className="text-sm text-green-700">
                  Your essay looks great from a grammar and style perspective.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Tone Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tone Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-700">Detected Tone:</span>
                  <Badge variant="outline" className="font-semibold">
                    {analysis.toneAnalysis.detected}
                  </Badge>
                </div>
                <div className="flex items-start gap-2">
                  {analysis.toneAnalysis.appropriate ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  )}
                  <p className="text-sm text-gray-700">{analysis.toneAnalysis.feedback}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Readability Score */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Readability Score</CardTitle>
              <CardDescription>Flesch-Kincaid Grade Level</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-700">Grade Level:</span>
                  <span className="text-2xl font-bold text-indigo-600">
                    {analysis.readabilityScore.gradeLevel.toFixed(1)}
                  </span>
                </div>
                <Progress
                  value={(analysis.readabilityScore.gradeLevel / 16) * 100}
                  className="h-2 mb-2"
                />
                <p
                  className={`text-sm ${
                    getReadabilityAssessment(analysis.readabilityScore.gradeLevel).color
                  }`}
                >
                  {getReadabilityAssessment(analysis.readabilityScore.gradeLevel).message}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {analysis.readabilityScore.assessment}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Overused Words */}
          {analysis.overusedWords.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Overused Words</CardTitle>
                <CardDescription>
                  Consider using alternatives for variety
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis.overusedWords.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-purple-50 border border-purple-200 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-purple-900">
                        &quot;{item.word}&quot;
                      </span>
                      <Badge className="bg-purple-100 text-purple-800">
                        Used {item.count} times
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-700">
                      <span className="font-medium">Alternatives:</span>{" "}
                      {item.alternatives.join(", ")}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Empty State */}
      {!analysis && !isAnalyzing && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Ready to Polish?
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Click &quot;Check Essay&quot; to analyze grammar, style, tone, and readability
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
