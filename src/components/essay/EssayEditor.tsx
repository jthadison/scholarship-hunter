"use client";

/**
 * Essay Editor Component
 * Story 4.7 - Essay Editor with 6-Phase Guidance
 *
 * Main Tiptap rich text editor wrapper with formatting toolbar,
 * auto-save, and phase-specific functionality integration.
 */

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useRef } from "react";
import debounce from "lodash.debounce";
import { EditorToolbar } from "./EditorToolbar";
import { AutoSaveIndicator } from "./AutoSaveIndicator";
import { WordCountTracker } from "./WordCountTracker";

interface EssayEditorProps {
  essayId: string;
  content: string;
  wordCount: number;
  targetMin?: number;
  targetMax?: number;
  onUpdate: (content: string, wordCount: number) => void;
  onAutoSave: () => void;
  readOnly?: boolean;
  placeholder?: string;
}

export function EssayEditor({
  essayId: _essayId,
  content,
  wordCount,
  targetMin = 500,
  targetMax = 750,
  onUpdate,
  onAutoSave,
  readOnly = false,
  placeholder: _placeholder = "Start writing your essay here...",
}: EssayEditorProps) {
  // Use ref to keep stable reference to onAutoSave callback
  const onAutoSaveRef = useRef(onAutoSave);

  // Update ref when onAutoSave changes
  useEffect(() => {
    onAutoSaveRef.current = onAutoSave;
  }, [onAutoSave]);

  // Debounced auto-save - triggers 10 seconds after user stops typing
  // Use useMemo instead of useCallback to create debounced function only once
  const debouncedAutoSave = useRef(
    debounce(() => {
      console.log('🚀 Debounced auto-save executing');
      onAutoSaveRef.current();
    }, 10000)
  ).current;

  // Initialize Tiptap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
    ],
    content,
    editable: !readOnly,
    immediatelyRender: false, // Fix SSR hydration issues
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none focus:outline-none min-h-[400px] px-4 py-3",
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const text = editor.getText();
      const words = text.trim().split(/\s+/).filter(Boolean).length;

      onUpdate(html, words);
      debouncedAutoSave();
    },
  });

  // Update editor content when prop changes (e.g., version restore)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [editor, content]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedAutoSave.cancel();
    };
  }, [debouncedAutoSave]);

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="essay-editor w-full">
      {/* Toolbar */}
      <EditorToolbar editor={editor} readOnly={readOnly} />

      {/* Editor Content */}
      <div className="border border-gray-300 rounded-b-lg bg-white">
        <EditorContent editor={editor} />
      </div>

      {/* Bottom Bar - Auto-save indicator and Word Count */}
      <div className="flex items-center justify-between mt-2 px-2">
        <AutoSaveIndicator />
        <WordCountTracker
          current={wordCount}
          targetMin={targetMin}
          targetMax={targetMax}
        />
      </div>
    </div>
  );
}
