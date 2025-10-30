"use client";

/**
 * Discovery Panel Component
 * Story 4.7 - AC3: Discovery Phase AI Suggestions
 *
 * Brainstorming workspace with AI-generated ideas from student profile
 */

import { useState } from "react";
import { Lightbulb, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import type { DiscoveryResponse } from "../../server/services/aiEssayAssistant";

interface DiscoveryPanelProps {
  essayId: string;
  prompt: string;
  discoveryNotes?: any; // JSON field from database
  onSaveNotes: (notes: any) => void;
  onGenerateIdeas: () => Promise<DiscoveryResponse>;
}

interface Note {
  id: string;
  content: string;
  createdAt: Date;
}

export function DiscoveryPanel({
  essayId: _essayId,
  prompt,
  discoveryNotes,
  onSaveNotes,
  onGenerateIdeas,
}: DiscoveryPanelProps) {
  const [notes, setNotes] = useState<Note[]>(
    discoveryNotes?.notes || []
  );
  const [currentNote, setCurrentNote] = useState("");
  const [aiIdeas, setAiIdeas] = useState<DiscoveryResponse | null>(
    discoveryNotes?.aiIdeas || null
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleGenerateIdeas = async () => {
    setIsGenerating(true);
    try {
      const ideas = await onGenerateIdeas();
      setAiIdeas(ideas);
      // Auto-save AI ideas to discovery notes
      const updatedData = { notes, aiIdeas: ideas };
      onSaveNotes(updatedData);
    } catch (error) {
      console.error("Failed to generate ideas:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to generate ideas. Please try again."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddNote = () => {
    if (!currentNote.trim()) return;

    const newNote: Note = {
      id: Date.now().toString(),
      content: currentNote.trim(),
      createdAt: new Date(),
    };

    const updatedNotes = [...notes, newNote];
    setNotes(updatedNotes);
    setCurrentNote("");

    // Auto-save
    handleSave(updatedNotes);
  };

  const handleDeleteNote = (noteId: string) => {
    const updatedNotes = notes.filter((n) => n.id !== noteId);
    setNotes(updatedNotes);
    handleSave(updatedNotes);
  };

  const handleSave = async (updatedNotes?: Note[]) => {
    setIsSaving(true);
    try {
      const data = {
        notes: updatedNotes || notes,
        aiIdeas,
      };
      await onSaveNotes(data);
    } catch (error) {
      console.error("Failed to save notes:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="discovery-panel space-y-6">
      {/* Essay Prompt Display */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Essay Prompt</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 italic">&ldquo;{prompt}&rdquo;</p>
        </CardContent>
      </Card>

      {/* AI Ideas Generation */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                AI-Generated Ideas
              </CardTitle>
              <CardDescription>
                Personalized content suggestions based on your profile
              </CardDescription>
            </div>
            <Button
              onClick={handleGenerateIdeas}
              disabled={isGenerating}
              size="sm"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Generate Ideas
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!aiIdeas && !isGenerating && (
            <p className="text-sm text-gray-500 text-center py-8">
              Click &quot;Generate Ideas&quot; to get AI-powered suggestions based on your
              profile and this essay prompt.
            </p>
          )}

          {isGenerating && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          )}

          {aiIdeas && !isGenerating && (
            <div className="space-y-6">
              {/* Ideas */}
              <div className="space-y-3">
                {aiIdeas.ideas.map((idea, index) => (
                  <div
                    key={index}
                    className="p-4 bg-indigo-50 rounded-lg border border-indigo-200"
                  >
                    <p className="font-medium text-gray-900 mb-1">{idea.idea}</p>
                    <p className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Relevance:</span> {idea.relevance}
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      {idea.profileReference}
                    </Badge>
                  </div>
                ))}
              </div>

              {/* Brainstorming Questions */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  Questions to Explore:
                </h4>
                <ul className="space-y-2">
                  {aiIdeas.brainstormingQuestions.map((question, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-sm text-gray-700"
                    >
                      <span className="text-indigo-600 font-bold mt-0.5">•</span>
                      {question}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Brainstorming Workspace */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Brainstorming Notes</CardTitle>
          <CardDescription>
            Jot down thoughts, experiences, and ideas. These notes will remain
            accessible throughout all phases.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Note Input */}
          <div className="space-y-2">
            <Textarea
              value={currentNote}
              onChange={(e) => setCurrentNote(e.target.value)}
              placeholder="Add a note: e.g., 'Write about hospital volunteer experience with Mrs. Chen...'"
              className="min-h-[100px]"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  handleAddNote();
                }
              }}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Press Ctrl+Enter to add note
              </p>
              <Button onClick={handleAddNote} size="sm" disabled={!currentNote.trim()}>
                <Plus className="h-4 w-4 mr-1" />
                Add Note
              </Button>
            </div>
          </div>

          {/* Saved Notes */}
          {notes.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-700">
                Saved Notes ({notes.length})
              </h4>
              <div className="space-y-2">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex-1">
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">
                        {note.content}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(note.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteNote(note.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {notes.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              No notes yet. Start brainstorming above!
            </p>
          )}

          {/* Save Status */}
          <div className="flex items-center justify-end gap-2 text-xs text-gray-500">
            {isSaving ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-3 w-3 text-green-600" />
                All notes saved
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
