"use client";

/**
 * Drafting Assistant Component
 * Story 4.7 - AC5: Drafting Phase with Contextual AI Feedback
 *
 * Writer's block assistance and contextual paragraph suggestions
 */

import { useState } from "react";
import { Zap, Loader2, AlertCircle } from "lucide-react";
import { Button } from "../ui/button";
import { Alert, AlertDescription } from "../ui/alert";
import type { ContextualSuggestion, WritersBlockHelp } from "../../server/services/aiEssayAssistant";

interface DraftingAssistantProps {
  essayId: string;
  currentContent: string;
  prompt: string;
  onGetFeedback: (paragraphText: string) => Promise<ContextualSuggestion[]>;
  onGetSentenceStarters: () => Promise<WritersBlockHelp>;
}

export function DraftingAssistant({
  essayId: _essayId,
  currentContent,
  prompt: _prompt,
  onGetFeedback,
  onGetSentenceStarters,
}: DraftingAssistantProps) {
  const [suggestions, setSuggestions] = useState<ContextualSuggestion[]>([]);
  const [writersBlockHelp, setWritersBlockHelp] = useState<WritersBlockHelp | null>(null);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const [isLoadingHelp, setIsLoadingHelp] = useState(false);

  const handleGetFeedback = async () => {
    if (!currentContent.trim()) {
      alert("Please write some content first");
      return;
    }

    // Get the last paragraph
    const paragraphs = currentContent.split(/\n\n+/).filter(Boolean);
    const lastParagraph = paragraphs[paragraphs.length - 1];

    if (!lastParagraph || lastParagraph.length < 10) {
      alert("Paragraph too short for analysis");
      return;
    }

    setIsLoadingFeedback(true);
    try {
      const feedback = await onGetFeedback(lastParagraph);
      setSuggestions(feedback);
    } catch (error) {
      console.error("Failed to get feedback:", error);
    } finally {
      setIsLoadingFeedback(false);
    }
  };

  const handleGetWritersBlockHelp = async () => {
    setIsLoadingHelp(true);
    try {
      const help = await onGetSentenceStarters();
      setWritersBlockHelp(help);
    } catch (error) {
      console.error("Failed to get help:", error);
    } finally {
      setIsLoadingHelp(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "important":
        return "border-red-200 bg-red-50";
      case "moderate":
        return "border-yellow-200 bg-yellow-50";
      default:
        return "border-blue-200 bg-blue-50";
    }
  };

  return (
    <div className="drafting-assistant space-y-4">
      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={handleGetFeedback}
          disabled={isLoadingFeedback || !currentContent.trim()}
          size="sm"
          variant="outline"
        >
          {isLoadingFeedback ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Zap className="h-4 w-4 mr-2" />
          )}
          Get Feedback on Last Paragraph
        </Button>

        <Button
          onClick={handleGetWritersBlockHelp}
          disabled={isLoadingHelp}
          size="sm"
          variant="outline"
        >
          {isLoadingHelp ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <AlertCircle className="h-4 w-4 mr-2" />
          )}
          Writer&apos;s Block Help
        </Button>
      </div>

      {/* Contextual Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-gray-900">Suggestions:</h4>
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border ${getSeverityColor(suggestion.severity)}`}
            >
              <div className="flex items-start gap-2">
                <span className="text-xs font-bold uppercase tracking-wide">
                  {suggestion.type}
                </span>
              </div>
              <p className="text-sm mt-1">{suggestion.message}</p>
              {suggestion.example && (
                <p className="text-xs text-gray-600 mt-2 italic">
                  Example: {suggestion.example}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Writer's Block Help */}
      {writersBlockHelp && (
        <Alert>
          <AlertDescription className="space-y-3">
            <div>
              <h4 className="font-semibold text-sm mb-2">Sentence Starters:</h4>
              <ul className="space-y-1">
                {writersBlockHelp.sentenceStarters.map((starter, index) => (
                  <li key={index} className="text-sm text-gray-700">
                    • {starter}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-2">Questions to Consider:</h4>
              <ul className="space-y-1">
                {writersBlockHelp.questions.map((question, index) => (
                  <li key={index} className="text-sm text-gray-700">
                    • {question}
                  </li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
