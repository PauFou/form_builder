import React, { useState } from "react";
import { Bold, Italic, Underline, Link as LinkIcon, Video, X, Check } from "lucide-react";
import { cn } from "../../../lib/utils";

interface RichTextToolbarProps {
  value: string;
  onChange: (value: string) => void;
  textareaRef?: React.RefObject<HTMLDivElement>;
}

export function RichTextToolbar({ value, onChange, textareaRef }: RichTextToolbarProps) {
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [selectedTextForLink, setSelectedTextForLink] = useState("");
  const [linkStartPos, setLinkStartPos] = useState(0);
  const [linkEndPos, setLinkEndPos] = useState(0);

  const wrapSelection = (tagName: string) => {
    const editor = textareaRef?.current;
    if (!editor) return;

    editor.focus();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString();

    if (!selectedText) return;

    // Create wrapper element
    const wrapper = document.createElement(tagName);
    wrapper.textContent = selectedText;

    // Replace selection with wrapped content
    range.deleteContents();
    range.insertNode(wrapper);

    // Update the value
    setTimeout(() => {
      onChange(editor.innerHTML);
    }, 0);
  };

  const handleBold = () => {
    wrapSelection("strong");
  };

  const handleItalic = () => {
    wrapSelection("em");
  };

  const handleUnderline = () => {
    wrapSelection("u");
  };

  const handleLinkClick = () => {
    const editor = textareaRef?.current;
    if (!editor) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString();

    setSelectedTextForLink(selectedText);
    setIsAddingLink(true);
    setLinkUrl("");
  };

  const handleLinkConfirm = () => {
    if (!linkUrl) return;

    const editor = textareaRef?.current;
    if (!editor) return;

    editor.focus();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);

    // Create link element
    const link = document.createElement("a");
    link.href = linkUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = selectedTextForLink || linkUrl;

    // Replace selection with link
    range.deleteContents();
    range.insertNode(link);

    // Update the value
    setTimeout(() => {
      onChange(editor.innerHTML);
      setIsAddingLink(false);
      setLinkUrl("");
      setSelectedTextForLink("");
    }, 0);
  };

  const handleLinkCancel = () => {
    setIsAddingLink(false);
    setLinkUrl("");
    setSelectedTextForLink("");
    textareaRef?.current?.focus();
  };

  const handleVideo = () => {
    const url = prompt("Enter YouTube URL:");
    if (!url) return;

    const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/;
    const match = url.match(youtubeRegex);

    if (match) {
      const videoId = match[1];
      const iframe = document.createElement("iframe");
      iframe.width = "560";
      iframe.height = "315";
      iframe.src = `https://www.youtube.com/embed/${videoId}`;
      iframe.title = "YouTube video";
      iframe.setAttribute("frameborder", "0");
      iframe.setAttribute(
        "allow",
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      );
      iframe.setAttribute("allowfullscreen", "true");

      const editor = textareaRef?.current;
      if (editor) {
        editor.focus();

        // Add line breaks before and after
        const br1 = document.createElement("br");
        const br2 = document.createElement("br");
        const br3 = document.createElement("br");
        const br4 = document.createElement("br");

        editor.appendChild(br1);
        editor.appendChild(br2);
        editor.appendChild(iframe);
        editor.appendChild(br3);
        editor.appendChild(br4);

        setTimeout(() => {
          onChange(editor.innerHTML);
        }, 0);
      }
    }
  };

  return (
    <>
      {isAddingLink ? (
        // Link URL Input (replaces toolbar temporarily)
        <div className="flex items-center gap-2 w-full">
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleLinkConfirm();
              } else if (e.key === "Escape") {
                e.preventDefault();
                handleLinkCancel();
              }
            }}
            placeholder="Enter URL (https://...)"
            className="flex-1 px-3 py-2 text-sm border border-indigo-600 rounded focus:outline-none focus:ring-1 focus:ring-indigo-600"
            autoFocus
          />
          <button
            type="button"
            onClick={handleLinkConfirm}
            className="p-2 hover:bg-green-100 rounded border border-green-600 transition-colors bg-white"
            title="Confirm"
          >
            <Check className="w-4 h-4 text-green-600" />
          </button>
          <button
            type="button"
            onClick={handleLinkCancel}
            className="p-2 hover:bg-red-100 rounded border border-red-600 transition-colors bg-white"
            title="Cancel"
          >
            <X className="w-4 h-4 text-red-600" />
          </button>
        </div>
      ) : (
        // Normal Toolbar
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
            onClick={handleLinkClick}
            className="p-2 hover:bg-gray-100 rounded border border-gray-300 transition-colors bg-white"
            title="Insert Link"
          >
            <LinkIcon className="w-4 h-4 text-gray-600" />
          </button>
          <button
            type="button"
            onClick={handleVideo}
            className="p-2 hover:bg-gray-100 rounded border border-gray-300 transition-colors bg-white"
            title="Insert Video"
          >
            <Video className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      )}
    </>
  );
}
