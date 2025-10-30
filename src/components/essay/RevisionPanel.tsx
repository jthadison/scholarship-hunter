"use client";

/**
 * Revision Panel Component
 * Story 4.7 - AC6: Revision Phase with Improvement Suggestions
 *
 * Paragraph-by-paragraph analysis with color-coded feedback,
 * side-by-side diff view, and accept/dismiss actions
 */

import { useState } from "react";
import { RefreshCw, Loader2, Check, X, Eye } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import type { ParagraphFeedback } from "../../server/services/aiEssayAssistant";

interface RevisionPanelProps {
  essayId: string;
  currentContent: string;
  revisionFeedback?: any; // Saved feedback from database
  onAnalyze: () => Promise<ParagraphFeedback[]>;
  onSaveFeedback: (feedback: any) => void;
}

interface FeedbackAction {
  paragraphNumber: number;
  suggestionIndex: number;
  action: "accepted" | "dismissed";
}

export function RevisionPanel({
  essayId: _essayId,
  currentContent,
  revisionFeedback: savedFeedback,
  onAnalyze,
  onSaveFeedback,
}: RevisionPanelProps) {
  const [feedback, setFeedback] = useState<ParagraphFeedback[]>(
    savedFeedback?.feedback || []
  );
  const [actions, setActions] = useState<FeedbackAction[]>(
    savedFeedback?.actions || []
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [viewMode, setViewMode] = useState<"feedback" | "side-by-side">("feedback");

  const paragraphs = currentContent.split(/\n\n+/).filter((p) => p.trim().length > 0);

  const handleAnalyze = async () => {
    if (!currentContent.trim()) {
      alert("Please write some content first");
      return;
    }

    setIsAnalyzing(true);
    try {
      const analysis = await onAnalyze();
      setFeedback(analysis);

      // Save feedback
      const data = {
        feedback: analysis,
        actions: [],
        analyzedAt: new Date().toISOString(),
      };
      onSaveFeedback(data);
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

  const handleAction = (
    paragraphNumber: number,
    suggestionIndex: number,
    action: "accepted" | "dismissed"
  ) => {
    const newAction = { paragraphNumber, suggestionIndex, action };
    const updatedActions = [
      ...actions.filter(
        (a) =>
          !(a.paragraphNumber === paragraphNumber && a.suggestionIndex === suggestionIndex)
      ),
      newAction,
    ];
    setActions(updatedActions);

    // Save actions
    const data = {
      feedback,
      actions: updatedActions,
    };
    onSaveFeedback(data);
  };

  const getActionForSuggestion = (paragraphNumber: number, suggestionIndex: number) => {
    return actions.find(
      (a) => a.paragraphNumber === paragraphNumber && a.suggestionIndex === suggestionIndex
    );
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "needs-attention":
        return "border-red-200 bg-red-50";
      case "moderate":
        return "border-orange-200 bg-orange-50";
      case "minor":
        return "border-yellow-200 bg-yellow-50";
      default:
        return "border-green-200 bg-green-50";
    }
  };

  const getSeverityBadge = (severity: string) => {
    const colors = {
      "needs-attention": "bg-red-100 text-red-800",
      moderate: "bg-orange-100 text-orange-800",
      minor: "bg-yellow-100 text-yellow-800",
      good: "bg-green-100 text-green-800",
    };
    return colors[severity as keyof typeof colors] || colors.good;
  };

  const totalSuggestions = feedback.reduce((sum, f) => sum + f.suggestions.length, 0);
  const addressedSuggestions = actions.length;
  const progressPercentage = totalSuggestions > 0
    ? Math.round((addressedSuggestions / totalSuggestions) * 100)
    : 0;

  return (
    <div className="revision-panel space-y-6">
      {/* Header with Analyze Button */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-indigo-600" />
                Revision Analysis
              </CardTitle>
              <CardDescription>
                Get AI-powered feedback on each paragraph to improve your essay
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
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {feedback.length > 0 ? "Re-analyze" : "Analyze Essay"}
                </>
              )}
            </Button>
          </div>
        </CardHeader>

        {/* Progress Tracker */}
        {feedback.length > 0 && (
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">Revision Progress</span>
                <span className="font-semibold text-indigo-600">
                  {addressedSuggestions} / {totalSuggestions} suggestions addressed
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* View Mode Tabs */}
      {feedback.length > 0 && (
        <Tabs value={viewMode} onValueChange={(v: string) => setViewMode(v as typeof viewMode)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="feedback">Feedback View</TabsTrigger>
            <TabsTrigger value="side-by-side">
              <Eye className="h-4 w-4 mr-1" />
              Side-by-Side
            </TabsTrigger>
          </TabsList>

          {/* Feedback View */}
          <TabsContent value="feedback" className="space-y-4">
            {feedback.map((para) => (
              <Card
                key={para.paragraphNumber}
                className={`${getSeverityColor(para.severity)}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">
                      Paragraph {para.paragraphNumber}
                    </CardTitle>
                    <Badge className={getSeverityBadge(para.severity)}>
                      {para.severity}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Original Paragraph */}
                  <div className="p-3 bg-white rounded border border-gray-200">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {paragraphs[para.paragraphNumber - 1]}
                    </p>
                  </div>

                  {/* Strengths */}
                  {para.strengths.length > 0 && (
                    <div>
                      <h5 className="text-sm font-semibold text-green-700 mb-2">
                        ✓ Strengths:
                      </h5>
                      <ul className="space-y-1">
                        {para.strengths.map((strength, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-green-600">•</span>
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Areas for Improvement */}
                  {para.improvements.length > 0 && (
                    <div>
                      <h5 className="text-sm font-semibold text-orange-700 mb-2">
                        ⚠ Areas for Improvement:
                      </h5>
                      <ul className="space-y-1">
                        {para.improvements.map((improvement, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-orange-600">•</span>
                            {improvement}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Actionable Suggestions */}
                  {para.suggestions.length > 0 && (
                    <div>
                      <h5 className="text-sm font-semibold text-indigo-700 mb-2">
                        💡 Suggestions:
                      </h5>
                      <div className="space-y-2">
                        {para.suggestions.map((suggestion, idx) => {
                          const action = getActionForSuggestion(para.paragraphNumber, idx);
                          return (
                            <div
                              key={idx}
                              className={`p-3 rounded-lg border ${
                                action?.action === "accepted"
                                  ? "bg-green-50 border-green-300"
                                  : action?.action === "dismissed"
                                  ? "bg-gray-100 border-gray-300 opacity-60"
                                  : "bg-white border-indigo-200"
                              }`}
                            >
                              <p className="text-sm text-gray-800">{suggestion}</p>
                              <div className="flex items-center gap-2 mt-2">
                                {!action && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        handleAction(para.paragraphNumber, idx, "accepted")
                                      }
                                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                    >
                                      <Check className="h-3 w-3 mr-1" />
                                      Accept
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        handleAction(para.paragraphNumber, idx, "dismissed")
                                      }
                                      className="text-gray-600 hover:text-gray-700"
                                    >
                                      <X className="h-3 w-3 mr-1" />
                                      Dismiss
                                    </Button>
                                  </>
                                )}
                                {action?.action === "accepted" && (
                                  <Badge className="bg-green-100 text-green-800">
                                    ✓ Accepted
                                  </Badge>
                                )}
                                {action?.action === "dismissed" && (
                                  <Badge variant="secondary">Dismissed</Badge>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Side-by-Side View */}
          <TabsContent value="side-by-side" className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Original */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Original Draft</h4>
                    <div className="prose prose-sm max-w-none">
                      {paragraphs.map((para, idx) => {
                        const paraFeedback = feedback.find((f) => f.paragraphNumber === idx + 1);
                        const severityColor = paraFeedback
                          ? getSeverityColor(paraFeedback.severity)
                          : "";

                        return (
                          <div
                            key={idx}
                            className={`p-3 mb-3 rounded-lg border ${severityColor}`}
                          >
                            <div className="flex items-start justify-between mb-1">
                              <span className="text-xs font-semibold text-gray-500">
                                Paragraph {idx + 1}
                              </span>
                              {paraFeedback && (
                                <Badge className={getSeverityBadge(paraFeedback.severity)}>
                                  {paraFeedback.severity}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-800 whitespace-pre-wrap">{para}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Feedback Summary */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Revision Notes</h4>
                    <div className="space-y-3">
                      {feedback.map((para) => (
                        <div
                          key={para.paragraphNumber}
                          className="p-3 border border-gray-200 rounded-lg bg-white"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-700">
                              Paragraph {para.paragraphNumber}
                            </span>
                            <Badge className={getSeverityBadge(para.severity)}>
                              {para.severity}
                            </Badge>
                          </div>

                          {para.improvements.length > 0 && (
                            <div className="text-xs space-y-1">
                              {para.improvements.slice(0, 2).map((imp, idx) => (
                                <p key={idx} className="text-gray-600">• {imp}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Empty State */}
      {feedback.length === 0 && !isAnalyzing && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <RefreshCw className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Ready to Revise?
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Click &quot;Analyze Essay&quot; to get AI-powered feedback on each paragraph
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
