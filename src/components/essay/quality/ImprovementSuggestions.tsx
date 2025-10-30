/**
 * Story 4.9: Essay Quality Assessment
 * Improvement Suggestions Component
 *
 * Displays prioritized improvement suggestions with:
 * - Priority indicators (Critical/Important/Optional)
 * - Issue, Location, Recommendation, Impact
 * - Action buttons (Dismiss)
 * - Grouping by priority
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { AlertTriangle, AlertCircle, Info, X, TrendingUp } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../../ui/collapsible";
import { ChevronDown } from "lucide-react";

interface ImprovementSuggestion {
  priority: "critical" | "important" | "optional";
  issue: string;
  location: string;
  recommendation: string;
  impact: string;
}

interface ImprovementSuggestionsProps {
  suggestions: ImprovementSuggestion[];
  essayId: string;
}

export function ImprovementSuggestions({ suggestions }: ImprovementSuggestionsProps) {
  const [dismissedIds, setDismissedIds] = useState<number[]>([]);

  // Group suggestions by priority
  const groupedSuggestions = {
    critical: suggestions.filter((s) => s.priority === "critical" && !dismissedIds.includes(suggestions.indexOf(s))),
    important: suggestions.filter((s) => s.priority === "important" && !dismissedIds.includes(suggestions.indexOf(s))),
    optional: suggestions.filter((s) => s.priority === "optional" && !dismissedIds.includes(suggestions.indexOf(s))),
  };

  const getPriorityConfig = (priority: "critical" | "important" | "optional") => {
    switch (priority) {
      case "critical":
        return {
          icon: AlertTriangle,
          color: "text-red-600",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          label: "Critical",
        };
      case "important":
        return {
          icon: AlertCircle,
          color: "text-yellow-600",
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
          label: "Important",
        };
      case "optional":
        return {
          icon: Info,
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          label: "Nice-to-have",
        };
    }
  };

  const handleDismiss = (index: number) => {
    setDismissedIds([...dismissedIds, index]);
  };

  const renderSuggestionGroup = (
    priority: "critical" | "important" | "optional",
    items: ImprovementSuggestion[]
  ) => {
    if (items.length === 0) return null;

    const config = getPriorityConfig(priority);
    const Icon = config.icon;

    return (
      <Collapsible defaultOpen={priority === "critical" || priority === "important"}>
        <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg p-3 hover:bg-gray-50">
          <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${config.color}`} />
            <span className="font-semibold">{config.label}</span>
            <Badge variant="secondary">{items.length}</Badge>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-500 transition-transform ui-expanded:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-3">
          {items.map((suggestion) => {
            const globalIndex = suggestions.indexOf(suggestion);
            return (
              <Card
                key={globalIndex}
                className={`${config.borderColor} ${config.bgColor} relative border-l-4`}
              >
                <CardContent className="pt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-2 h-6 w-6 p-0"
                    onClick={() => handleDismiss(globalIndex)}
                  >
                    <X className="h-4 w-4" />
                  </Button>

                  <div className="space-y-2 pr-8">
                    {/* Issue */}
                    <div>
                      <span className="text-xs font-semibold uppercase text-gray-500">
                        Issue
                      </span>
                      <p className="mt-1 text-sm font-medium text-gray-900">
                        {suggestion.issue}
                      </p>
                    </div>

                    {/* Location */}
                    <div>
                      <span className="text-xs font-semibold uppercase text-gray-500">
                        Location
                      </span>
                      <p className="mt-1 text-sm text-gray-700">{suggestion.location}</p>
                    </div>

                    {/* Recommendation */}
                    <div>
                      <span className="text-xs font-semibold uppercase text-gray-500">
                        Recommendation
                      </span>
                      <p className="mt-1 text-sm text-gray-700">{suggestion.recommendation}</p>
                    </div>

                    {/* Impact */}
                    <div className="flex items-center gap-2 pt-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-600">
                        {suggestion.impact}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Improvement Suggestions</span>
          <Badge variant="secondary">
            {suggestions.length - dismissedIds.length} suggestions
          </Badge>
        </CardTitle>
        <p className="text-sm text-gray-500">
          Prioritized feedback to strengthen your essay
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {renderSuggestionGroup("critical", groupedSuggestions.critical)}
        {renderSuggestionGroup("important", groupedSuggestions.important)}
        {renderSuggestionGroup("optional", groupedSuggestions.optional)}

        {dismissedIds.length === suggestions.length && (
          <div className="py-8 text-center text-sm text-gray-500">
            All suggestions dismissed. Great job addressing the feedback!
          </div>
        )}
      </CardContent>
    </Card>
  );
}
