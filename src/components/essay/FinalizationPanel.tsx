"use client";

/**
 * Finalization Panel Component
 * Story 4.7 - AC8: Finalization Phase with Review Checklist
 *
 * Final review checklist, preview mode, export options, mark complete
 */

import { useState, useEffect } from "react";
import { Flag, Loader2, Download, Copy, Eye, Check, X, FileText } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import type { AuthenticityScore } from "../../server/services/aiEssayAssistant";

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  status: "pass" | "fail" | "pending";
  required: boolean;
}

interface FinalizationPanelProps {
  essayId: string;
  title: string;
  currentContent: string;
  wordCount: number;
  targetMin: number;
  targetMax: number;
  promptAnalysis?: any;
  grammarIssuesCount: number;
  qualityScore?: number; // Story 4.9: Quality assessment score
  onValidateAuthenticity: () => Promise<AuthenticityScore>;
  onMarkComplete: () => Promise<void>;
  onExport: (format: "txt" | "docx") => void;
}

export function FinalizationPanel({
  essayId: _essayId,
  title,
  currentContent,
  wordCount,
  targetMin,
  targetMax,
  promptAnalysis,
  grammarIssuesCount,
  qualityScore,
  onValidateAuthenticity,
  onMarkComplete,
  onExport,
}: FinalizationPanelProps) {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [authenticityScore, setAuthenticityScore] = useState<AuthenticityScore | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Build checklist on mount/update
  useEffect(() => {
    const items: ChecklistItem[] = [
      {
        id: "word-count",
        label: "Word count within target range",
        description: `Essay should be between ${targetMin} and ${targetMax} words`,
        status:
          wordCount >= targetMin && wordCount <= targetMax
            ? "pass"
            : "fail",
        required: true,
      },
      {
        id: "grammar",
        label: "Grammar check complete",
        description: "No critical grammar errors remaining",
        status: grammarIssuesCount === 0 ? "pass" : "fail",
        required: true,
      },
      {
        id: "authenticity",
        label: "Personal voice maintained",
        description: "Essay demonstrates authentic student voice",
        status: authenticityScore
          ? authenticityScore.assessment === "authentic"
            ? "pass"
            : authenticityScore.assessment === "needs-review"
            ? "pending"
            : "fail"
          : "pending",
        required: true,
      },
      {
        id: "quality-score",
        label: "Quality assessment meets threshold",
        description: "Overall quality score ≥60 required for submission",
        status: qualityScore
          ? qualityScore >= 60
            ? "pass"
            : "fail"
          : "pending",
        required: true,
      },
    ];

    // Add prompt requirements if available
    if (promptAnalysis?.requiredElements) {
      items.push({
        id: "prompt-requirements",
        label: "Prompt requirements addressed",
        description: `${promptAnalysis.requiredElements.length} required elements covered`,
        status: "pending", // Would need manual verification
        required: true,
      });
    }

    setChecklist(items);
  }, [wordCount, targetMin, targetMax, grammarIssuesCount, authenticityScore, promptAnalysis, qualityScore]);

  const handleValidateAuthenticity = async () => {
    setIsValidating(true);
    try {
      const score = await onValidateAuthenticity();
      setAuthenticityScore(score);
    } catch (error) {
      console.error("Failed to validate:", error);
      alert("Failed to validate authenticity. Please try again.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleMarkComplete = async () => {
    const allRequiredPassed = checklist
      .filter((item) => item.required)
      .every((item) => item.status === "pass");

    if (!allRequiredPassed) {
      alert(
        "Please address all required checklist items before finalizing. Critical items must pass."
      );
      return;
    }

    setShowConfirmModal(true);
  };

  const confirmMarkComplete = async () => {
    setIsCompleting(true);
    try {
      await onMarkComplete();
      setShowConfirmModal(false);
      // Show success message
      alert("Essay finalized successfully! It has been added to your library.");
    } catch (error) {
      console.error("Failed to mark complete:", error);
      alert("Failed to finalize essay. Please try again.");
    } finally {
      setIsCompleting(false);
    }
  };

  const handleCopyToClipboard = () => {
    // Convert HTML to plain text
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = currentContent;
    const plainText = tempDiv.textContent || tempDiv.innerText || "";

    navigator.clipboard.writeText(plainText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pass":
        return <Check className="h-5 w-5 text-green-600" />;
      case "fail":
        return <X className="h-5 w-5 text-red-600" />;
      default:
        return <Loader2 className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pass":
        return "bg-green-50 border-green-200";
      case "fail":
        return "bg-red-50 border-red-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const allRequiredPassed = checklist
    .filter((item) => item.required)
    .every((item) => item.status === "pass");

  const passedCount = checklist.filter((item) => item.status === "pass").length;
  const totalCount = checklist.length;

  return (
    <div className="finalization-panel space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Flag className="h-5 w-5 text-green-600" />
            Final Review & Export
          </CardTitle>
          <CardDescription>
            Complete the checklist and finalize your essay
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-lg">
            <div>
              <div className="text-sm text-gray-700 mb-1">Checklist Progress</div>
              <div className="text-2xl font-bold text-indigo-700">
                {passedCount} / {totalCount}
              </div>
            </div>
            <Badge
              className={
                allRequiredPassed
                  ? "bg-green-100 text-green-800"
                  : "bg-yellow-100 text-yellow-800"
              }
            >
              {allRequiredPassed ? "Ready to Finalize" : "In Progress"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Review Checklist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {checklist.map((item) => (
            <div
              key={item.id}
              className={`flex items-start gap-3 p-4 border rounded-lg ${getStatusColor(
                item.status
              )}`}
            >
              <div className="mt-0.5">{getStatusIcon(item.status)}</div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-1">
                  <h4 className="font-semibold text-gray-900 text-sm">{item.label}</h4>
                  {item.required && (
                    <Badge variant="outline" className="text-xs">
                      Required
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-600">{item.description}</p>

                {/* Special actions for certain items */}
                {item.id === "authenticity" && !authenticityScore && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleValidateAuthenticity}
                    disabled={isValidating}
                    className="mt-2"
                  >
                    {isValidating ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Validating...
                      </>
                    ) : (
                      "Run Authenticity Check"
                    )}
                  </Button>
                )}

                {item.id === "authenticity" && authenticityScore && (
                  <div className="mt-2 p-2 bg-white rounded border border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold">Authenticity Score:</span>
                      <span className="text-sm font-bold text-indigo-600">
                        {authenticityScore.score}/100
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">{authenticityScore.feedback}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Preview & Export */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preview & Export</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => setShowPreview(true)}
              className="w-full"
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview Essay
            </Button>
            <Button
              variant="outline"
              onClick={handleCopyToClipboard}
              className="w-full"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2 text-green-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy to Clipboard
                </>
              )}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => onExport("txt")}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              Download .txt
            </Button>
            <Button
              variant="outline"
              onClick={() => onExport("docx")}
              className="w-full"
            >
              <FileText className="h-4 w-4 mr-2" />
              Download .docx
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Finalize Button */}
      <Card className="border-2 border-green-200 bg-green-50">
        <CardContent className="py-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Ready to Finalize?
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Once finalized, your essay will be added to your library. You can still edit it later if needed.
            </p>
            <Button
              onClick={handleMarkComplete}
              disabled={!allRequiredPassed || isCompleting}
              size="lg"
              className="bg-green-600 hover:bg-green-700"
            >
              {isCompleting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Finalizing...
                </>
              ) : (
                <>
                  <Check className="h-5 w-5 mr-2" />
                  Mark Essay Complete
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              Plain text preview (as reviewers will see it)
            </DialogDescription>
          </DialogHeader>
          <div className="prose prose-sm max-w-none p-6 bg-gray-50 rounded-lg">
            <div
              dangerouslySetInnerHTML={{
                __html: currentContent.replace(/<[^>]*>/g, ""),
              }}
              className="whitespace-pre-wrap"
            />
          </div>
          <div className="text-xs text-gray-500 text-right">
            {wordCount} words
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalize Essay?</DialogTitle>
            <DialogDescription>
              Are you ready to finalize this essay? It will be marked as complete and added to your essay library. You can still edit it later if needed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmMarkComplete}
              disabled={isCompleting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isCompleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Finalizing...
                </>
              ) : (
                "Yes, Finalize Essay"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
