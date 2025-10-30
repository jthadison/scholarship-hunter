/**
 * Story 4.9: Essay Quality Assessment
 * Success Indicator Component
 *
 * Displays predictive success probability with:
 * - Probability percentage
 * - Confidence level
 * - Contextual messaging
 * - Visual indicator
 */

"use client";

import { trpc } from "@/shared/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { TrendingUp, AlertTriangle, CheckCircle2, Target } from "lucide-react";
import { Progress } from "../../ui/progress";

interface SuccessIndicatorProps {
  essayId: string;
  qualityScore: number;
  competitionLevel?: "low" | "medium" | "high";
}

export function SuccessIndicator({
  essayId,
  qualityScore,
  competitionLevel = "medium",
}: SuccessIndicatorProps) {
  // Get success probability
  const { data: successData } = trpc.essay.calculateSuccessProbability.useQuery(
    { essayId, competitionLevel },
    { enabled: !!essayId && !!qualityScore }
  );

  if (!successData) return null;

  const { probability, confidence, message } = successData;

  // Determine color scheme based on probability
  const getColorScheme = (prob: number) => {
    if (prob >= 85) {
      return {
        icon: CheckCircle2,
        iconColor: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        progressColor: "bg-green-500",
        textColor: "text-green-700",
      };
    }
    if (prob >= 70) {
      return {
        icon: TrendingUp,
        iconColor: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        progressColor: "bg-blue-500",
        textColor: "text-blue-700",
      };
    }
    return {
      icon: AlertTriangle,
      iconColor: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      progressColor: "bg-orange-500",
      textColor: "text-orange-700",
    };
  };

  const colorScheme = getColorScheme(probability);
  const Icon = colorScheme.icon;

  const getConfidenceBadge = (conf: string) => {
    const colors = {
      high: "bg-green-100 text-green-800",
      medium: "bg-yellow-100 text-yellow-800",
      low: "bg-orange-100 text-orange-800",
    };
    return colors[conf as keyof typeof colors] || colors.medium;
  };

  return (
    <Card className={`${colorScheme.borderColor} border-l-4`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Success Probability
          </div>
          <Badge className={getConfidenceBadge(confidence)} variant="secondary">
            {confidence} confidence
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Probability Display */}
        <div className={`rounded-lg ${colorScheme.bgColor} p-6`}>
          <div className="flex items-center justify-center gap-3">
            <Icon className={`h-8 w-8 ${colorScheme.iconColor}`} />
            <div className="text-center">
              <div className="flex items-baseline gap-1">
                <span className={`text-4xl font-bold ${colorScheme.textColor}`}>
                  {probability}%
                </span>
              </div>
              <div className="text-sm text-gray-600">probability of success</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <Progress
              value={probability}
              className="h-3"
              indicatorClassName={colorScheme.progressColor}
              aria-label={`Success probability: ${probability} percent`}
            />
          </div>
        </div>

        {/* Contextual Message */}
        <div className="rounded-lg bg-gray-50 p-4">
          <p className="text-sm leading-relaxed text-gray-700">{message}</p>
        </div>

        {/* Competition Level Indicator */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Competition level:</span>
          <Badge variant="outline" className="capitalize">
            {competitionLevel}
          </Badge>
        </div>

        {/* Calculation Factors */}
        <div className="space-y-1 text-xs text-gray-500">
          <div className="font-medium">Success factors:</div>
          <div className="ml-2 space-y-0.5">
            <div>• Essay quality: {qualityScore}/100 (40% weight)</div>
            <div>• Profile strength (25% weight)</div>
            <div>• Match score (20% weight)</div>
            <div>• Competition level (15% weight)</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
