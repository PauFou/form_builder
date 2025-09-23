import React, { useState, useEffect, useRef } from "react";

interface OneQuestionViewerProps {
  form: any;
  onSubmit: (data: any) => void;
  onPartialSave?: (data: any) => void;
  initialData?: any;
  className?: string;
}

export function OneQuestionViewer({
  form,
  onSubmit,
  onPartialSave,
  initialData = {},
  className = "",
}: OneQuestionViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Flatten all blocks from all pages
  const allBlocks = form.pages.flatMap((page: any) => page.blocks);
  const currentBlock = allBlocks[currentIndex];
  const progress = ((currentIndex + 1) / allBlocks.length) * 100;

  useEffect(() => {
    // Auto-focus input on mount and question change
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentIndex]);

  useEffect(() => {
    // Auto-save partial data
    if (onPartialSave && Object.keys(answers).length > 0) {
      const timer = setTimeout(() => {
        onPartialSave({
          answers,
          currentIndex,
          completed: false,
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [answers, currentIndex, onPartialSave]);

  const validateBlock = (block: any, value: any): string | null => {
    if (block.required && !value) {
      return "This field is required";
    }

    switch (block.type) {
      case "email":
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return "Please enter a valid email address";
        }
        break;
      case "phone":
        if (value && !/^\+?[\d\s()-]+$/.test(value)) {
          return "Please enter a valid phone number";
        }
        break;
      case "number":
        if (value && isNaN(Number(value))) {
          return "Please enter a valid number";
        }
        break;
    }

    return null;
  };

  const handleNext = () => {
    if (!currentBlock) return;

    const currentValue = answers[currentBlock.id];
    const error = validateBlock(currentBlock, currentValue);

    if (error) {
      setErrors({ [currentBlock.id]: error });
      return;
    }

    setErrors({});

    if (currentIndex < allBlocks.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setErrors({});
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        answers,
        completed: true,
        completedAt: new Date(),
      });
    } catch (error) {
      console.error("Submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleNext();
    }
  };

  const renderInput = (block: any) => {
    const value = answers[block.id] || "";
    const error = errors[block.id];

    switch (block.type) {
      case "short_text":
      case "text":
      case "email":
      case "phone":
      case "number":
        return (
          <div className="w-full max-w-2xl">
            <input
              ref={inputRef}
              type={block.type === "email" ? "email" : block.type === "number" ? "number" : "text"}
              value={value}
              onChange={(e) => setAnswers({ ...answers, [block.id]: e.target.value })}
              onKeyPress={handleKeyPress}
              placeholder={block.placeholder || "Type your answer here..."}
              className={`
                w-full px-0 py-4 text-2xl bg-transparent border-0 border-b-2 
                focus:outline-none focus:ring-0 transition-colors
                ${error ? "border-red-500" : "border-gray-300 focus:border-primary"}
              `}
              aria-label={block.question}
              aria-invalid={!!error}
              aria-describedby={error ? `${block.id}-error` : undefined}
            />
            {error && (
              <p id={`${block.id}-error`} className="mt-2 text-red-500 text-sm">
                {error}
              </p>
            )}
          </div>
        );

      case "long_text":
        return (
          <div className="w-full max-w-2xl">
            <textarea
              value={value}
              onChange={(e) => setAnswers({ ...answers, [block.id]: e.target.value })}
              onKeyPress={handleKeyPress}
              placeholder={block.placeholder || "Type your answer here..."}
              rows={4}
              className={`
                w-full px-0 py-4 text-xl bg-transparent border-0 border-b-2 
                focus:outline-none focus:ring-0 transition-colors resize-none
                ${error ? "border-red-500" : "border-gray-300 focus:border-primary"}
              `}
              aria-label={block.question}
              aria-invalid={!!error}
              aria-describedby={error ? `${block.id}-error` : undefined}
            />
            {error && (
              <p id={`${block.id}-error`} className="mt-2 text-red-500 text-sm">
                {error}
              </p>
            )}
          </div>
        );

      case "yes_no":
        return (
          <div className="flex gap-4">
            <button
              onClick={() => {
                setAnswers({ ...answers, [block.id]: true });
                setTimeout(handleNext, 300);
              }}
              className={`
                px-8 py-4 text-lg font-medium rounded-lg transition-all
                ${
                  value === true
                    ? "bg-primary text-white scale-105"
                    : "bg-gray-100 hover:bg-gray-200"
                }
              `}
            >
              Yes
            </button>
            <button
              onClick={() => {
                setAnswers({ ...answers, [block.id]: false });
                setTimeout(handleNext, 300);
              }}
              className={`
                px-8 py-4 text-lg font-medium rounded-lg transition-all
                ${
                  value === false
                    ? "bg-primary text-white scale-105"
                    : "bg-gray-100 hover:bg-gray-200"
                }
              `}
            >
              No
            </button>
          </div>
        );

      case "single_select":
      case "dropdown":
        return (
          <div className="w-full max-w-2xl space-y-2">
            {(block.options || []).map((option: any) => (
              <button
                key={option.value}
                onClick={() => {
                  setAnswers({ ...answers, [block.id]: option.value });
                  setTimeout(handleNext, 300);
                }}
                className={`
                  w-full p-4 text-left rounded-lg transition-all flex items-center gap-3
                  ${
                    value === option.value
                      ? "bg-primary text-white scale-[1.02]"
                      : "bg-gray-50 hover:bg-gray-100"
                  }
                `}
              >
                <div
                  className={`
                  w-6 h-6 rounded-full border-2 flex items-center justify-center
                  ${value === option.value ? "border-white" : "border-gray-300"}
                `}
                >
                  {value === option.value && <div className="w-3 h-3 rounded-full bg-white" />}
                </div>
                <span className="text-lg">{option.label}</span>
              </button>
            ))}
          </div>
        );

      case "multi_select": {
        const selectedValues = value || [];
        return (
          <div className="w-full max-w-2xl space-y-2">
            {(block.options || []).map((option: any) => {
              const isSelected = selectedValues.includes(option.value);
              return (
                <button
                  key={option.value}
                  onClick={() => {
                    const newValues = isSelected
                      ? selectedValues.filter((v: string) => v !== option.value)
                      : [...selectedValues, option.value];
                    setAnswers({ ...answers, [block.id]: newValues });
                  }}
                  className={`
                    w-full p-4 text-left rounded-lg transition-all flex items-center gap-3
                    ${
                      isSelected
                        ? "bg-primary text-white scale-[1.02]"
                        : "bg-gray-50 hover:bg-gray-100"
                    }
                  `}
                >
                  <div
                    className={`
                    w-6 h-6 rounded flex items-center justify-center border-2
                    ${isSelected ? "border-white" : "border-gray-300"}
                  `}
                  >
                    {isSelected && (
                      <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M13.485 3.463a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L6.5 8.478l5.293-5.293a1 1 0 011.414 0z" />
                      </svg>
                    )}
                  </div>
                  <span className="text-lg">{option.label}</span>
                </button>
              );
            })}
          </div>
        );
      }

      default:
        return <div>Unsupported field type: {block.type}</div>;
    }
  };

  if (!currentBlock) return null;

  return (
    <div className={`min-h-screen flex flex-col ${className}`}>
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-200">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-4xl">
          <div key={currentBlock.id} className="space-y-8">
            {/* Question Number */}
            <div className="text-sm font-medium text-gray-500">
              {currentIndex + 1} of {allBlocks.length}
            </div>

            {/* Question */}
            <h1 className="text-3xl md:text-4xl font-semibold">
              {currentBlock.question}
              {currentBlock.required && <span className="text-red-500 ml-2">*</span>}
            </h1>

            {/* Description */}
            {currentBlock.description && (
              <p className="text-lg text-gray-600">{currentBlock.description}</p>
            )}

            {/* Input */}
            <div className="py-8">{renderInput(currentBlock)}</div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-8">
              <button
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className={`
                    px-6 py-3 rounded-lg font-medium transition-all
                    ${currentIndex === 0 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100"}
                  `}
                aria-label="Previous question"
              >
                ← Previous
              </button>

              <button
                onClick={handleNext}
                disabled={isSubmitting}
                className="px-8 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-all disabled:opacity-50"
                aria-label={currentIndex === allBlocks.length - 1 ? "Submit form" : "Next question"}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Submitting...
                  </span>
                ) : currentIndex === allBlocks.length - 1 ? (
                  "Submit"
                ) : (
                  "Next →"
                )}
              </button>
            </div>

            {/* Keyboard hint */}
            <div className="text-center text-sm text-gray-500">Press Enter to continue</div>
          </div>
        </div>
      </div>
    </div>
  );
}
