"use client";

import { useEffect, useState } from "react";
import { useFormBuilderStore } from "../../../lib/stores/form-builder-store";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Progress,
  RadioGroup,
  RadioGroupItem,
  Label,
  Checkbox,
} from "@forms/ui";
import { ChevronLeft, ChevronRight, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Block, Form } from "@forms/contracts";

// Block render components
function ShortTextBlock({ block }: { block: Block }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={block.id}>
        {block.question}
        {block.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {block.description && <p className="text-sm text-muted-foreground">{block.description}</p>}
      <input
        type="text"
        id={block.id}
        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        placeholder={block.placeholder || "Type your answer here..."}
        required={block.required}
      />
    </div>
  );
}

function LongTextBlock({ block }: { block: Block }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={block.id}>
        {block.question}
        {block.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {block.description && <p className="text-sm text-muted-foreground">{block.description}</p>}
      <textarea
        id={block.id}
        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary min-h-[120px] resize-y"
        placeholder={block.placeholder || "Type your answer here..."}
        required={block.required}
      />
    </div>
  );
}

function EmailBlock({ block }: { block: Block }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={block.id}>
        {block.question}
        {block.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {block.description && <p className="text-sm text-muted-foreground">{block.description}</p>}
      <input
        type="email"
        id={block.id}
        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        placeholder={block.placeholder || "name@example.com"}
        required={block.required}
      />
    </div>
  );
}

function DateBlock({ block }: { block: Block }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={block.id}>
        {block.question}
        {block.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {block.description && <p className="text-sm text-muted-foreground">{block.description}</p>}
      <input
        type="date"
        id={block.id}
        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        required={block.required}
      />
    </div>
  );
}

function SelectBlock({ block }: { block: Block }) {
  const options = block.options || [];

  return (
    <div className="space-y-2">
      <Label>
        {block.question}
        {block.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {block.description && <p className="text-sm text-muted-foreground">{block.description}</p>}
      <RadioGroup defaultValue="">
        {options.map((option) => (
          <div key={option.id} className="flex items-center space-x-2">
            <RadioGroupItem value={option.id} id={`${block.id}-${option.id}`} />
            <Label htmlFor={`${block.id}-${option.id}`} className="cursor-pointer">
              {option.text}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}

function CheckboxGroupBlock({ block }: { block: Block }) {
  const options = block.options || [];

  return (
    <div className="space-y-2">
      <Label>
        {block.question}
        {block.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {block.description && <p className="text-sm text-muted-foreground">{block.description}</p>}
      <div className="space-y-3">
        {options.map((option) => (
          <div key={option.id} className="flex items-center space-x-2">
            <Checkbox id={`${block.id}-${option.id}`} />
            <Label htmlFor={`${block.id}-${option.id}`} className="cursor-pointer">
              {option.text}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}

const BLOCK_RENDERERS: Record<string, React.ComponentType<{ block: Block }>> = {
  short_text: ShortTextBlock,
  long_text: LongTextBlock,
  email: EmailBlock,
  date: DateBlock,
  select: SelectBlock,
  checkbox_group: CheckboxGroupBlock,
};

export default function PreviewPage({ params }: { params: { id: string } }) {
  const { form } = useFormBuilderStore();
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  // In a real app, we'd fetch the form by ID
  // For now, we'll use the form from the store
  useEffect(() => {
    if (!form) {
      // Initialize with a test form if none exists
      useFormBuilderStore.getState().initializeForm({
        id: params.id,
        title: "Sample Form",
        description: "This is a preview of your form",
        pages: [
          {
            id: "page-1",
            title: "Welcome",
            blocks: [
              {
                id: "1",
                type: "short_text",
                question: "What is your name?",
                required: true,
              },
              {
                id: "2",
                type: "email",
                question: "What is your email?",
                required: true,
              },
            ],
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }, [params.id, form]);

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading form...</p>
      </div>
    );
  }

  const currentPage = form.pages[currentPageIndex];
  const totalPages = form.pages.length;
  const progress = ((currentPageIndex + 1) / totalPages) * 100;

  const handleNext = () => {
    if (currentPageIndex < totalPages - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Thank you!</CardTitle>
              <CardDescription>Your response has been recorded.</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="h-8 w-8 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">You can close this window now.</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Progress bar */}
        <div className="mb-8">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2 text-center">
            Step {currentPageIndex + 1} of {totalPages}
          </p>
        </div>

        {/* Form content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPageIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>{form.title}</CardTitle>
                {form.description && <CardDescription>{form.description}</CardDescription>}
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleNext();
                  }}
                >
                  {currentPage && (
                    <div className="space-y-6">
                      {currentPage.title &&
                        currentPage.title !== `Page ${currentPageIndex + 1}` && (
                          <h3 className="text-lg font-semibold">{currentPage.title}</h3>
                        )}

                      {currentPage.blocks.map((block) => {
                        const BlockRenderer = BLOCK_RENDERERS[block.type];
                        if (!BlockRenderer) {
                          return (
                            <div key={block.id} className="p-4 border border-dashed rounded-md">
                              <p className="text-sm text-muted-foreground">
                                Block type "{block.type}" not yet implemented
                              </p>
                            </div>
                          );
                        }
                        return <BlockRenderer key={block.id} block={block} />;
                      })}
                    </div>
                  )}

                  {/* Navigation buttons */}
                  <div className="flex justify-between mt-8 pt-6 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePrevious}
                      disabled={currentPageIndex === 0}
                    >
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>
                    <Button type="submit">
                      {currentPageIndex === totalPages - 1 ? (
                        <>
                          Submit
                          <Send className="h-4 w-4 ml-2" />
                        </>
                      ) : (
                        <>
                          Next
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
