"use client";

/**
 * Phase Navigator Component
 * Story 4.7 - AC2: 6-Phase Writing Workflow
 *
 * Navigation between essay phases with progress indicators,
 * phase descriptions, and linear progression enforcement.
 */

import {
  Check,
  ChevronRight,
  Lightbulb,
  FileText,
  PenTool,
  RefreshCw,
  Sparkles,
  Flag,
} from "lucide-react";
import { Button } from "../ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

export type EssayPhase =
  | "DISCOVERY"
  | "STRUCTURE"
  | "DRAFTING"
  | "REVISION"
  | "POLISH"
  | "FINALIZATION";

interface Phase {
  id: EssayPhase;
  name: string;
  icon: React.ElementType;
  description: string;
  order: number;
}

const PHASES: Phase[] = [
  {
    id: "DISCOVERY",
    name: "Discovery",
    icon: Lightbulb,
    description:
      "Brainstorm ideas and explore your experiences relevant to this prompt",
    order: 1,
  },
  {
    id: "STRUCTURE",
    name: "Structure",
    icon: FileText,
    description:
      "Create an outline with recommended structure for your essay",
    order: 2,
  },
  {
    id: "DRAFTING",
    name: "Drafting",
    icon: PenTool,
    description: "Write your first draft with AI-powered suggestions",
    order: 3,
  },
  {
    id: "REVISION",
    name: "Revision",
    icon: RefreshCw,
    description: "Review and improve content, transitions, and structure",
    order: 4,
  },
  {
    id: "POLISH",
    name: "Polish",
    icon: Sparkles,
    description: "Fix grammar, improve style, and perfect your tone",
    order: 5,
  },
  {
    id: "FINALIZATION",
    name: "Finalization",
    icon: Flag,
    description: "Final review, compliance check, and submit your essay",
    order: 6,
  },
];

interface PhaseNavigatorProps {
  currentPhase: EssayPhase;
  completedPhases: EssayPhase[];
  onPhaseChange: (phase: EssayPhase) => void;
  onNextPhase: () => void;
  canAdvance: boolean; // Whether current phase criteria are met
}

export function PhaseNavigator({
  currentPhase,
  completedPhases,
  onPhaseChange,
  onNextPhase,
  canAdvance,
}: PhaseNavigatorProps) {
  const currentPhaseData = PHASES.find((p) => p.id === currentPhase);
  const currentOrder = currentPhaseData?.order ?? 1;
  const totalPhases = PHASES.length;
  const progressPercentage = ((currentOrder - 1) / (totalPhases - 1)) * 100;

  const isPhaseAccessible = (phase: Phase): boolean => {
    // Can always go back to previous phases
    if (phase.order <= currentOrder) {
      return true;
    }
    // Can only go forward if within one phase and can advance
    return phase.order === currentOrder + 1 && canAdvance;
  };

  const isPhaseCompleted = (phaseId: EssayPhase): boolean => {
    return completedPhases.includes(phaseId);
  };

  return (
    <div className="phase-navigator bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Phase Progress Bar */}
      <div className="px-6 pt-4 pb-2">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-700">
            Essay Writing Progress
          </h3>
          <span className="text-sm text-gray-600">
            Phase {currentOrder} of {totalPhases}
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 transition-all duration-300 ease-in-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Phase Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        {PHASES.map((phase) => {
          const Icon = phase.icon;
          const isActive = phase.id === currentPhase;
          const isCompleted = isPhaseCompleted(phase.id);
          const isAccessible = isPhaseAccessible(phase);

          return (
            <TooltipProvider key={phase.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => isAccessible && onPhaseChange(phase.id)}
                    disabled={!isAccessible}
                    className={`
                      flex flex-col items-center gap-1 px-4 py-3 min-w-[120px]
                      border-b-2 transition-all
                      ${
                        isActive
                          ? "border-indigo-600 bg-indigo-50"
                          : "border-transparent hover:bg-gray-50"
                      }
                      ${!isAccessible ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <Icon
                        className={`h-4 w-4 ${
                          isActive ? "text-indigo-600" : "text-gray-600"
                        }`}
                      />
                      {isCompleted && (
                        <Check className="h-3 w-3 text-green-600" />
                      )}
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        isActive ? "text-indigo-700" : "text-gray-700"
                      }`}
                    >
                      {phase.name}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{phase.description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>

      {/* Current Phase Description & Actions */}
      {currentPhaseData && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-gray-900 mb-1">
                {currentPhaseData.name} Phase
              </h4>
              <p className="text-sm text-gray-600">
                {currentPhaseData.description}
              </p>
            </div>

            {currentOrder < totalPhases && (
              <Button
                onClick={onNextPhase}
                disabled={!canAdvance}
                size="sm"
                className="ml-4"
              >
                Next Phase
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
