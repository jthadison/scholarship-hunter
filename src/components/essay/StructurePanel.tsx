"use client";

/**
 * Structure Panel Component
 * Story 4.7 - AC4: Structure Phase Outline Builder
 *
 * Recommended essay structure from prompt analysis
 * with customizable sections and word count allocation
 */

import { useState, useEffect } from "react";
import { FileText, GripVertical, Plus, Trash2, Save, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import type { PromptAnalysis } from "../../types/essay";

interface OutlineSection {
  id: string;
  section: string;
  content: string;
  wordCount: number;
  guidance: string;
  order: number;
}

interface StructurePanelProps {
  essayId: string;
  promptAnalysis?: PromptAnalysis;
  outline?: any; // JSON field from database
  targetWordCount?: number;
  onSaveOutline: (outline: any) => void;
}

export function StructurePanel({
  essayId,
  promptAnalysis,
  outline: savedOutline,
  targetWordCount = 650,
  onSaveOutline,
}: StructurePanelProps) {
  const [sections, setSections] = useState<OutlineSection[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Initialize sections from prompt analysis or saved outline
  useEffect(() => {
    if (savedOutline?.sections) {
      setSections(savedOutline.sections);
    } else if (promptAnalysis?.suggestedStructure?.outline) {
      // Load recommended structure from prompt analysis
      const recommended = promptAnalysis.suggestedStructure.outline.map(
        (item, index) => ({
          id: `section-${index}`,
          section: item.section,
          content: item.content,
          wordCount: item.wordCount,
          guidance: item.guidance,
          order: index,
        })
      );
      setSections(recommended);
    } else {
      // Default structure if no analysis available
      setSections([
        {
          id: "section-0",
          section: "Introduction",
          content: "Opening hook and context",
          wordCount: 150,
          guidance: "Start with an engaging hook that draws the reader in",
          order: 0,
        },
        {
          id: "section-1",
          section: "Body",
          content: "Main narrative and examples",
          wordCount: 400,
          guidance: "Provide specific details and personal insights",
          order: 1,
        },
        {
          id: "section-2",
          section: "Conclusion",
          content: "Reflection and future impact",
          wordCount: 100,
          guidance: "Connect to your goals and aspirations",
          order: 2,
        },
      ]);
    }
  }, [promptAnalysis, savedOutline]);

  const totalAllocatedWords = sections.reduce((sum, s) => sum + s.wordCount, 0);

  const handleAddSection = () => {
    const newSection: OutlineSection = {
      id: `section-${Date.now()}`,
      section: "New Section",
      content: "Description of this section",
      wordCount: 100,
      guidance: "Write your guidance here",
      order: sections.length,
    };
    setSections([...sections, newSection]);
    setIsEditing(true);
  };

  const handleDeleteSection = (sectionId: string) => {
    const updated = sections
      .filter((s) => s.id !== sectionId)
      .map((s, index) => ({ ...s, order: index }));
    setSections(updated);
    handleSave(updated);
  };

  const handleUpdateSection = (
    sectionId: string,
    field: keyof OutlineSection,
    value: string | number
  ) => {
    setSections(
      sections.map((s) =>
        s.id === sectionId ? { ...s, [field]: value } : s
      )
    );
    setIsEditing(true);
  };

  const handleReorder = (sectionId: string, direction: "up" | "down") => {
    const index = sections.findIndex((s) => s.id === sectionId);
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === sections.length - 1)
    ) {
      return;
    }

    const newIndex = direction === "up" ? index - 1 : index + 1;
    const reordered = [...sections];
    [reordered[index], reordered[newIndex]] = [
      reordered[newIndex],
      reordered[index],
    ];

    // Update order numbers
    const updated = reordered.map((s, i) => ({ ...s, order: i }));
    setSections(updated);
    handleSave(updated);
  };

  const handleSave = async (updatedSections?: OutlineSection[]) => {
    setIsSaving(true);
    setIsEditing(false);
    try {
      const data = {
        sections: updatedSections || sections,
        totalAllocatedWords: updatedSections
          ? updatedSections.reduce((sum, s) => sum + s.wordCount, 0)
          : totalAllocatedWords,
        flow: promptAnalysis?.suggestedStructure?.flow || "Custom structure",
      };
      await onSaveOutline(data);
    } catch (error) {
      console.error("Failed to save outline:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="structure-panel space-y-6">
      {/* Recommended Structure Info */}
      {promptAnalysis?.suggestedStructure && (
        <Card className="bg-indigo-50 border-indigo-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-600" />
              Recommended Structure
            </CardTitle>
            <CardDescription className="text-indigo-700">
              Based on AI analysis of your essay prompt
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-indigo-900">
              <span className="font-semibold">Suggested Flow:</span>{" "}
              {promptAnalysis.suggestedStructure.flow}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Outline Builder */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">Essay Outline</CardTitle>
              <CardDescription>
                Customize sections, reorder, and allocate word counts
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {isEditing && (
                <Button onClick={() => handleSave()} size="sm" variant="default">
                  <Save className="h-4 w-4 mr-1" />
                  Save Changes
                </Button>
              )}
              {isSaving && (
                <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Word Count Summary */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-700">
              Total Allocated: <span className="font-semibold">{totalAllocatedWords} words</span>
            </span>
            <span className="text-sm text-gray-700">
              Target: <span className="font-semibold">{targetWordCount} words</span>
            </span>
            <span
              className={`text-sm font-semibold ${
                totalAllocatedWords > targetWordCount + 50
                  ? "text-red-600"
                  : totalAllocatedWords < targetWordCount - 50
                  ? "text-yellow-600"
                  : "text-green-600"
              }`}
            >
              {totalAllocatedWords > targetWordCount ? "+" : ""}
              {totalAllocatedWords - targetWordCount} words
            </span>
          </div>

          {/* Sections */}
          <div className="space-y-3">
            {sections.map((section, index) => (
              <div
                key={section.id}
                className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm"
              >
                <div className="flex items-start gap-3">
                  {/* Drag Handle */}
                  <div className="flex flex-col gap-1 pt-2">
                    <button
                      onClick={() => handleReorder(section.id, "up")}
                      disabled={index === 0}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    >
                      <GripVertical className="h-4 w-4 rotate-180" />
                    </button>
                    <button
                      onClick={() => handleReorder(section.id, "down")}
                      disabled={index === sections.length - 1}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    >
                      <GripVertical className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Section Content */}
                  <div className="flex-1 space-y-2">
                    {/* Section Name */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-500">
                        {index + 1}.
                      </span>
                      <Input
                        value={section.section}
                        onChange={(e) =>
                          handleUpdateSection(section.id, "section", e.target.value)
                        }
                        className="font-semibold"
                        placeholder="Section name"
                      />
                      <Input
                        type="number"
                        value={section.wordCount}
                        onChange={(e) =>
                          handleUpdateSection(
                            section.id,
                            "wordCount",
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="w-24 text-right"
                        placeholder="Words"
                      />
                      <span className="text-sm text-gray-500">words</span>
                    </div>

                    {/* Section Description */}
                    <Input
                      value={section.content}
                      onChange={(e) =>
                        handleUpdateSection(section.id, "content", e.target.value)
                      }
                      placeholder="What this section covers"
                      className="text-sm"
                    />

                    {/* Guidance */}
                    <Textarea
                      value={section.guidance}
                      onChange={(e) =>
                        handleUpdateSection(section.id, "guidance", e.target.value)
                      }
                      placeholder="Writing guidance for this section"
                      className="text-sm resize-none"
                      rows={2}
                    />
                  </div>

                  {/* Delete Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteSection(section.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 mt-1"
                    disabled={sections.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Section Button */}
          <Button
            onClick={handleAddSection}
            variant="outline"
            className="w-full"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Section
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
