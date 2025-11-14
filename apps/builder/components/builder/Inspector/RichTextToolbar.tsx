import React, { useState } from "react";
import { Bold, Italic, Underline, Link as LinkIcon, Video, Image } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  Label,
} from "@skemya/ui";
import { cn } from "../../../lib/utils";

interface RichTextToolbarProps {
  value: string;
  onChange: (value: string) => void;
  textareaRef?: React.RefObject<HTMLTextAreaElement>;
}

export function RichTextToolbar({ value, onChange, textareaRef }: RichTextToolbarProps) {
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  const insertMarkdown = (before: string, after: string = before) => {
    const textarea = textareaRef?.current;
    if (!textarea) {
      // Fallback: just append to the end
      onChange(value + before + after);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newValue = value.substring(0, start) + before + selectedText + after + value.substring(end);

    onChange(newValue);

    // Set cursor position after the inserted text
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleBold = () => {
    insertMarkdown("**", "**");
  };

  const handleItalic = () => {
    insertMarkdown("*", "*");
  };

  const handleUnderline = () => {
    insertMarkdown("<u>", "</u>");
  };

  const handleInsertLink = () => {
    if (!linkUrl) return;

    const textarea = textareaRef?.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = value.substring(start, end);
      const displayText = linkText || selectedText || linkUrl;
      const markdown = `[${displayText}](${linkUrl})`;
      const newValue = value.substring(0, start) + markdown + value.substring(end);
      onChange(newValue);
    } else {
      const displayText = linkText || linkUrl;
      onChange(value + `[${displayText}](${linkUrl})`);
    }

    setLinkModalOpen(false);
    setLinkUrl("");
    setLinkText("");
  };

  const handleInsertVideo = () => {
    if (!videoUrl) return;

    // Support YouTube, Vimeo, etc.
    const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/;
    const vimeoRegex = /vimeo\.com\/(\d+)/;

    let embedCode = "";
    const youtubeMatch = videoUrl.match(youtubeRegex);
    const vimeoMatch = videoUrl.match(vimeoRegex);

    if (youtubeMatch) {
      const videoId = youtubeMatch[1];
      embedCode = `\n\n[![YouTube Video](https://img.youtube.com/vi/${videoId}/0.jpg)](${videoUrl})\n\n`;
    } else if (vimeoMatch) {
      embedCode = `\n\n[Watch Video](${videoUrl})\n\n`;
    } else {
      embedCode = `\n\n[Video](${videoUrl})\n\n`;
    }

    onChange(value + embedCode);
    setVideoModalOpen(false);
    setVideoUrl("");
  };

  return (
    <>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={handleBold}
          className="p-2 hover:bg-gray-100 rounded border border-gray-300 transition-colors bg-white"
          title="Bold"
        >
          <Bold className="w-4 h-4 text-gray-600" />
        </button>
        <button
          type="button"
          onClick={handleItalic}
          className="p-2 hover:bg-gray-100 rounded border border-gray-300 transition-colors bg-white"
          title="Italic"
        >
          <Italic className="w-4 h-4 text-gray-600" />
        </button>
        <button
          type="button"
          onClick={handleUnderline}
          className="p-2 hover:bg-gray-100 rounded border border-gray-300 transition-colors bg-white"
          title="Underline"
        >
          <Underline className="w-4 h-4 text-gray-600" />
        </button>
        <button
          type="button"
          onClick={() => setLinkModalOpen(true)}
          className="p-2 hover:bg-gray-100 rounded border border-gray-300 transition-colors bg-white"
          title="Insert Link"
        >
          <LinkIcon className="w-4 h-4 text-gray-600" />
        </button>
        <button
          type="button"
          onClick={() => setVideoModalOpen(true)}
          className="p-2 hover:bg-gray-100 rounded border border-gray-300 transition-colors bg-white"
          title="Insert Video"
        >
          <Video className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Link Modal */}
      <Dialog open={linkModalOpen} onOpenChange={setLinkModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="link-text">Link Text</Label>
              <Input
                id="link-text"
                placeholder="Click here"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link-url">URL</Label>
              <Input
                id="link-url"
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInsertLink}>Insert Link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Video Modal */}
      <Dialog open={videoModalOpen} onOpenChange={setVideoModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Video</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="video-url">Video URL</Label>
              <Input
                id="video-url"
                placeholder="https://youtube.com/watch?v=..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Supports YouTube, Vimeo, and direct video URLs
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVideoModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInsertVideo}>Insert Video</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
