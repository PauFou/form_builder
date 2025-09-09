"use client";

import * as React from "react";
import { useEffect } from "react";
import Link from "next/link";
import { Button, Tabs, TabsList, TabsTrigger, Input } from "@forms/ui";
import {
  Settings,
  Eye,
  Save,
  ChevronLeft,
  MoreVertical,
  Search,
  Type,
  AlignLeft,
  Mail,
  Calendar,
  ChevronDown,
  Square,
  FileQuestion,
} from "lucide-react";

import { useFormBuilderStore } from "../lib/stores/form-builder-store";
import { FormCanvas } from "../components/builder/form-canvas";
import { DraggableBlock } from "../components/builder/draggable-block";
import { BlockInspector } from "../components/builder/block-inspector";
import { useKeyboardShortcuts } from "../lib/hooks/use-keyboard-shortcuts";
import { useAutosave } from "../lib/hooks/use-autosave";
import { PreviewPanel } from "../components/builder/preview-panel";

// Block definitions for the library
const BLOCK_LIBRARY = [
  { id: "short_text", type: "short_text", icon: Type, label: "Short text", category: "input" },
  { id: "long_text", type: "long_text", icon: AlignLeft, label: "Long text", category: "input" },
  { id: "email", type: "email", icon: Mail, label: "Email", category: "input" },
  { id: "select", type: "select", icon: ChevronDown, label: "Select", category: "choice" },
  {
    id: "checkbox_group",
    type: "checkbox_group",
    icon: Square,
    label: "Checkbox group",
    category: "choice",
  },
  { id: "date", type: "date", icon: Calendar, label: "Date", category: "input" },
];

const CATEGORIES = [
  { id: "input", label: "Input fields" },
  { id: "choice", label: "Choice fields" },
];

export default function BuilderPage() {
  const { form, initializeForm, selectedBlockId } = useFormBuilderStore();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [showPreview, setShowPreview] = React.useState(false);

  // Initialize with a test form if none exists
  useEffect(() => {
    if (!form) {
      initializeForm({
        id: "1",
        title: "Untitled Form",
        description: "",
        pages: [
          {
            id: "page-1",
            title: "Page 1",
            blocks: [],
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }, [form, initializeForm]);

  // Enable keyboard shortcuts and autosave
  useKeyboardShortcuts();
  useAutosave(form?.id || null);

  // Listen for preview toggle events
  useEffect(() => {
    const handleTogglePreview = () => {
      setShowPreview((prev) => !prev);
    };

    window.addEventListener("toggle-preview", handleTogglePreview);
    return () => {
      window.removeEventListener("toggle-preview", handleTogglePreview);
    };
  }, []);

  const filteredBlocks = BLOCK_LIBRARY.filter((block) =>
    block.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const blocksByCategory = CATEGORIES.map((category) => ({
    ...category,
    blocks: filteredBlocks.filter((block) => block.category === category.id),
  }));

  return (
    <div className="flex h-screen bg-background">
      {/* Topbar - Sticky */}
      <div className="fixed top-0 left-0 right-0 h-14 border-b bg-background z-50">
        <div className="h-full px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Forms
              </Button>
            </Link>
            <div className="h-6 w-px bg-border" />
            <div>
              <h1 className="font-semibold text-sm">{form?.title || "Loading..."}</h1>
              <p className="text-xs text-muted-foreground">
                {form?.updatedAt
                  ? `Last saved ${new Date(form.updatedAt).toLocaleTimeString()}`
                  : "Not saved"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button size="sm">
              <Save className="h-4 w-4 mr-2" />
              Publish
            </Button>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex w-full pt-14">
        {/* Left Rail - Block Library (320px) */}
        <div className="w-80 border-r bg-card flex flex-col">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-sm mb-3">Block Library</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search blocks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {blocksByCategory.map(
              (category) =>
                category.blocks.length > 0 && (
                  <div key={category.id} className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                      {category.label}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {category.blocks.map((block) => (
                        <DraggableBlock key={block.id} block={block} />
                      ))}
                    </div>
                  </div>
                )
            )}

            {filteredBlocks.length === 0 && (
              <div className="text-center py-8">
                <FileQuestion className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No blocks found</p>
              </div>
            )}
          </div>
        </div>

        {/* Canvas - Form Builder */}
        <div className="flex-1 overflow-auto bg-muted/30">
          <FormCanvas />
        </div>

        {/* Right Inspector (360px) */}
        <div className="w-[360px] border-l bg-card">
          <Tabs defaultValue="field" className="flex flex-col h-full">
            <div className="p-4 border-b">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="field">Field</TabsTrigger>
                <TabsTrigger value="logic">Logic</TabsTrigger>
                <TabsTrigger value="design">Design</TabsTrigger>
                <TabsTrigger value="data">Data</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto">
              {selectedBlockId ? (
                <BlockInspector blockId={selectedBlockId} />
              ) : (
                <div className="p-8 text-center">
                  <Settings className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Select a block to configure</p>
                </div>
              )}
            </div>
          </Tabs>
        </div>
      </div>

      {/* Preview Panel */}
      <PreviewPanel isOpen={showPreview} onClose={() => setShowPreview(false)} formId={form?.id} />
    </div>
  );
}
