/**
 * Story 4.9: Essay Quality Assessment
 * Dimensional Breakdown Component
 *
 * Displays 5-dimension score breakdown with:
 * - Progress bars
 * - Color indicators (Red <50, Yellow 50-74, Green 75-100)
 * - Tooltips with explanations
 * - Improvement suggestions per dimension
 */

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Progress } from "../../ui/progress";
import { Badge } from "../../ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../ui/tooltip";
import { Info, Zap, Heart, Shield, Target, FileCheck } from "lucide-react";

interface DimensionScore {
  score: number;
  explanation: string;
  improvements: string[];
}

interface DimensionalBreakdownProps {
  dimensions: {
    memorability: DimensionScore;
    emotionalImpact: DimensionScore;
    authenticity: DimensionScore;
    promptAlignment: DimensionScore;
    technicalQuality: DimensionScore;
  };
}

export function DimensionalBreakdown({ dimensions }: DimensionalBreakdownProps) {
  const dimensionConfig = [
    {
      key: "memorability",
      label: "Memorability",
      icon: Zap,
      description: "Is it unique, engaging, and stands out? Does it avoid clichés?",
      weight: "20%",
    },
    {
      key: "emotionalImpact",
      label: "Emotional Impact",
      icon: Heart,
      description: "Does it resonate emotionally with readers? Is there vulnerability and depth?",
      weight: "20%",
    },
    {
      key: "authenticity",
      label: "Authenticity",
      icon: Shield,
      description: "Does it feel genuine and personal, not AI-generated or template-based?",
      weight: "25%",
    },
    {
      key: "promptAlignment",
      label: "Prompt Alignment",
      icon: Target,
      description: "Does it address all prompt requirements effectively and completely?",
      weight: "20%",
    },
    {
      key: "technicalQuality",
      label: "Technical Quality",
      icon: FileCheck,
      description: "Grammar, clarity, structure, readability, and flow",
      weight: "15%",
    },
  ] as const;

  const getScoreColor = (score: number) => {
    if (score >= 75) return { bg: "bg-green-500", text: "text-green-600", badge: "bg-green-50" };
    if (score >= 50) return { bg: "bg-yellow-500", text: "text-yellow-600", badge: "bg-yellow-50" };
    return { bg: "bg-red-500", text: "text-red-600", badge: "bg-red-50" };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCheck className="h-5 w-5" />
          Quality Dimensions
        </CardTitle>
        <p className="text-sm text-gray-500">
          Your essay evaluated across 5 key dimensions
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {dimensionConfig.map(({ key, label, icon: Icon, description, weight }) => {
          const dimension = dimensions[key as keyof typeof dimensions];
          const colors = getScoreColor(dimension.score);

          return (
            <div key={key} className="space-y-2">
              {/* Dimension Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${colors.text}`} />
                  <span className="font-medium">{label}</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-sm">{description}</p>
                        <p className="mt-1 text-xs text-gray-400">Weight: {weight}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Badge className={`${colors.badge} ${colors.text}`} variant="secondary">
                  {dimension.score}/100
                </Badge>
              </div>

              {/* Progress Bar */}
              <div className="relative">
                <Progress
                  value={dimension.score}
                  className="h-2"
                  indicatorClassName={colors.bg}
                  aria-label={`${label} score: ${dimension.score} out of 100`}
                />
              </div>

              {/* Explanation */}
              <p className="text-sm text-gray-600">{dimension.explanation}</p>

              {/* Improvements */}
              {dimension.improvements && dimension.improvements.length > 0 && (
                <div className="ml-6 space-y-1">
                  {dimension.improvements.map((improvement, index) => (
                    <div key={index} className="flex gap-2 text-sm text-gray-500">
                      <span className="text-purple-600">→</span>
                      <span>{improvement}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
