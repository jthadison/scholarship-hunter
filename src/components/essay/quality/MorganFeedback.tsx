/**
 * Story 4.9: Essay Quality Assessment
 * Morgan Feedback Component
 *
 * Displays Morgan's personalized, encouraging feedback with avatar
 */

"use client";

import { Card, CardContent } from "../../ui/card";
import { Sparkles } from "lucide-react";

interface MorganFeedbackProps {
  feedback: string;
  score: number;
}

export function MorganFeedback({ feedback, score }: MorganFeedbackProps) {
  // Determine Morgan's expression based on score
  const getExpression = (score: number) => {
    if (score >= 90) return "🌟";
    if (score >= 75) return "😊";
    if (score >= 60) return "👍";
    if (score >= 50) return "💪";
    return "🎯";
  };

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
      <CardContent className="pt-6">
        <div className="flex gap-4">
          {/* Morgan Avatar */}
          <div className="flex-shrink-0">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-3xl shadow-md">
              {getExpression(score)}
            </div>
          </div>

          {/* Feedback Speech Bubble */}
          <div className="flex-1">
            <div className="relative rounded-lg bg-white p-4 shadow-sm">
              {/* Speech bubble arrow */}
              <div className="absolute -left-2 top-4 h-4 w-4 rotate-45 bg-white"></div>

              <div className="relative">
                <div className="mb-2 flex items-center gap-2">
                  <span className="font-semibold text-purple-900">Morgan says:</span>
                  <Sparkles className="h-4 w-4 text-purple-500" />
                </div>
                <p className="text-sm leading-relaxed text-gray-700">{feedback}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
