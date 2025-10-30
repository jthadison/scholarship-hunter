"use client";

/**
 * Version History Component
 * Story 4.7 - AC10: Version History UI
 *
 * View previous versions, compare changes, and restore
 */

import { useState } from "react";
import { History, Loader2, RotateCcw, Eye, Calendar } from "lucide-react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

interface EssayVersion {
  id: string;
  content: string;
  wordCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface VersionHistoryProps {
  essayId: string;
  currentContent: string;
  currentWordCount: number;
  versions: EssayVersion[];
  isLoading: boolean;
  onRestore: (versionId: string) => Promise<void>;
  onRefresh: () => void;
}

export function VersionHistory({
  essayId,
  currentContent,
  currentWordCount,
  versions,
  isLoading,
  onRestore,
  onRefresh,
}: VersionHistoryProps) {
  const [selectedVersion, setSelectedVersion] = useState<EssayVersion | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "diff">("list");

  const handleRestore = async () => {
    if (!selectedVersion) return;

    setIsRestoring(true);
    try {
      await onRestore(selectedVersion.id);
      setShowRestoreConfirm(false);
      setSelectedVersion(null);
      onRefresh();
    } catch (error) {
      console.error("Failed to restore version:", error);
      alert("Failed to restore version. Please try again.");
    } finally {
      setIsRestoring(false);
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;

    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDiff = (oldContent: string, newContent: string) => {
    // Simple word-level diff
    const oldWords = oldContent.split(/\s+/);
    const newWords = newContent.split(/\s+/);

    const added = newWords.filter((word) => !oldWords.includes(word));
    const removed = oldWords.filter((word) => !newWords.includes(word));

    return { added, removed, changed: added.length + removed.length };
  };

  return (
    <div className="version-history">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="h-5 w-5 text-indigo-600" />
                Version History
              </CardTitle>
              <CardDescription>
                View and restore previous versions (last 50 saved)
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>

        {versions.length > 0 && (
          <CardContent>
            <div className="text-sm text-gray-600">
              {versions.length} version{versions.length !== 1 ? "s" : ""} saved
            </div>
          </CardContent>
        )}
      </Card>

      {/* View Mode Tabs */}
      {versions.length > 0 && (
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as typeof viewMode)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list">
              <History className="h-4 w-4 mr-1" />
              Version List
            </TabsTrigger>
            <TabsTrigger value="diff">
              <Eye className="h-4 w-4 mr-1" />
              Compare Changes
            </TabsTrigger>
          </TabsList>

          {/* Version List */}
          <TabsContent value="list" className="space-y-2 mt-4">
            {/* Current Version */}
            <div className="p-4 border-2 border-green-200 bg-green-50 rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-600 text-white">Current</Badge>
                  <span className="text-sm font-semibold text-gray-900">
                    Latest Version
                  </span>
                </div>
                <span className="text-sm text-gray-600">{currentWordCount} words</span>
              </div>
              <p className="text-xs text-gray-500">Active working draft</p>
            </div>

            {/* Previous Versions */}
            {versions.map((version, index) => {
              const diff = getDiff(version.content, currentContent);
              const wordDiff = currentWordCount - version.wordCount;

              return (
                <div
                  key={version.id}
                  className="p-4 border border-gray-200 rounded-lg bg-white hover:border-indigo-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">
                        Version from {formatDate(version.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">{version.wordCount} words</span>
                      {wordDiff !== 0 && (
                        <Badge
                          variant="outline"
                          className={wordDiff > 0 ? "text-green-700" : "text-red-700"}
                        >
                          {wordDiff > 0 ? "+" : ""}
                          {wordDiff} words
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      {diff.changed > 0 && `${diff.changed} word${diff.changed !== 1 ? "s" : ""} changed`}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedVersion(version)}
                        className="text-indigo-600 hover:text-indigo-700"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedVersion(version);
                          setShowRestoreConfirm(true);
                        }}
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Restore
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </TabsContent>

          {/* Diff View */}
          <TabsContent value="diff" className="mt-4">
            {selectedVersion ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Comparing: Current vs {formatDate(selectedVersion.createdAt)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Old Version */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">
                        Version from {formatDate(selectedVersion.createdAt)}
                      </h4>
                      <div className="prose prose-sm max-w-none p-3 bg-red-50 border border-red-200 rounded">
                        <div className="text-sm whitespace-pre-wrap">
                          {selectedVersion.content.replace(/<[^>]*>/g, "")}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {selectedVersion.wordCount} words
                      </p>
                    </div>

                    {/* Current Version */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Current Version</h4>
                      <div className="prose prose-sm max-w-none p-3 bg-green-50 border border-green-200 rounded">
                        <div className="text-sm whitespace-pre-wrap">
                          {currentContent.replace(/<[^>]*>/g, "")}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">{currentWordCount} words</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Eye className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">
                    Select a version from the list to compare changes
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Empty State */}
      {versions.length === 0 && !isLoading && (
        <Card>
          <CardContent className="py-12 text-center">
            <History className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Version History Yet
            </h3>
            <p className="text-sm text-gray-600">
              Versions are created automatically as you write. Keep editing to build your history!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Restore Confirmation Modal */}
      <Dialog open={showRestoreConfirm} onOpenChange={setShowRestoreConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore This Version?</DialogTitle>
            <DialogDescription>
              This will replace your current essay content with the version from{" "}
              {selectedVersion && formatDate(selectedVersion.createdAt)}. Your current content will
              be saved as a new version.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRestoreConfirm(false)}>
              Cancel
            </Button>
            <Button onClick={handleRestore} disabled={isRestoring}>
              {isRestoring ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Restoring...
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Restore This Version
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Version Preview Modal */}
      {selectedVersion && !showRestoreConfirm && (
        <Dialog open={!!selectedVersion} onOpenChange={() => setSelectedVersion(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Version from {formatDate(selectedVersion.createdAt)}</DialogTitle>
              <DialogDescription>{selectedVersion.wordCount} words</DialogDescription>
            </DialogHeader>
            <div className="prose prose-sm max-w-none p-6 bg-gray-50 rounded-lg">
              <div
                className="whitespace-pre-wrap"
                dangerouslySetInnerHTML={{
                  __html: selectedVersion.content.replace(/<[^>]*>/g, ""),
                }}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedVersion(null)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  setShowRestoreConfirm(true);
                }}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Restore This Version
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
