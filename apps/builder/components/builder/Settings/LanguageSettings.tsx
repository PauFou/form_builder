"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useFormBuilderStore } from "../../../lib/stores/form-builder-store";
import { SUPPORTED_LANGUAGES, DEFAULT_MESSAGES } from "@skemya/runtime";
import type { SupportedLanguage, CustomMessages } from "@skemya/runtime";

export function LanguageSettings() {
  const { form, updateForm } = useFormBuilderStore();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const settings = form?.settings || {};
  const defaultLanguage: SupportedLanguage = (settings.defaultLanguage ||
    "en") as SupportedLanguage;
  const customMessages = settings.customMessages || {};

  const handleDefaultLanguageChange = (language: SupportedLanguage) => {
    updateForm({
      settings: {
        ...settings,
        defaultLanguage: language,
      },
    });
  };

  const handleCustomMessageChange = (
    languageCode: SupportedLanguage,
    key: keyof CustomMessages,
    value: string
  ) => {
    const languageCustomMessages = customMessages[languageCode] || {};

    updateForm({
      settings: {
        ...settings,
        customMessages: {
          ...customMessages,
          [languageCode]: {
            ...languageCustomMessages,
            [key]: value,
          },
        },
      },
    });
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const getCurrentLanguageMessages = (): CustomMessages => {
    return {
      ...DEFAULT_MESSAGES[defaultLanguage],
      ...(customMessages[defaultLanguage] || {}),
    };
  };

  const currentMessages = getCurrentLanguageMessages();

  return (
    <div className="space-y-6">
      {/* Default Language Section */}
      <div className="bg-white border border-gray-200 rounded p-5 shadow-sm">
        <Label className="text-sm font-semibold text-gray-900 mb-2 block">
          Form's default language
        </Label>
        <p className="text-sm text-gray-900/60 mb-4">
          This will make all the system messages in your form in that language.
        </p>

        <div className="relative">
          <select
            value={defaultLanguage}
            onChange={(e) => handleDefaultLanguageChange(e.target.value as SupportedLanguage)}
            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent appearance-none pr-10"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-xs text-blue-800">
            Please note that changing the default language here won't affect any text that you have
            entered from the builder like question title, button texts etc. You have to write them
            yourself in the language of your choice.
          </p>
        </div>
      </div>

      {/* Add Multiple Languages (PRO - Coming Soon) */}
      <div className="bg-white border border-gray-200 rounded p-5 shadow-sm opacity-60 cursor-not-allowed">
        <div className="flex items-center gap-2 mb-2">
          <Label className="text-sm font-semibold text-gray-900">Add multiple languages</Label>
          <span className="px-2 py-0.5 bg-[#FF6B35] text-white text-xs font-bold rounded">PRO</span>
          <span className="px-2 py-0.5 bg-gray-400 text-white text-xs font-bold rounded">
            À VENIR
          </span>
        </div>
        <p className="text-sm text-gray-900/60 mb-4">
          Here you can add multiple languages to your form. All the translations will be done on the
          basis of the default language you have selected above.
        </p>

        <div className="relative">
          <select
            disabled
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-gray-100 cursor-not-allowed appearance-none pr-10"
          >
            <option value="">+ Add language</option>
          </select>
          <Plus className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Customize Messages Section */}
      <div className="bg-white border border-gray-200 rounded p-5 shadow-sm">
        <Label className="text-sm font-semibold text-gray-900 mb-2 block">Customize messages</Label>
        <p className="text-sm text-gray-900/60 mb-4">
          Customize the system messages for{" "}
          <strong>
            {SUPPORTED_LANGUAGES.find((l) => l.code === defaultLanguage)?.flag}{" "}
            {SUPPORTED_LANGUAGES.find((l) => l.code === defaultLanguage)?.name}
          </strong>{" "}
          (your default language selected above).
        </p>

        {/* Buttons, labels & hints */}
        <div className="border border-gray-200 rounded mb-4">
          <button
            onClick={() => toggleSection("buttons")}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm font-semibold text-gray-900">Buttons, labels & hints</span>
            {expandedSections.buttons ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )}
          </button>

          {expandedSections.buttons && (
            <div className="p-4 border-t border-gray-200 space-y-4">
              <div>
                <Label className="text-xs font-medium text-gray-700 mb-1 block">
                  Keyboard instruction to go to next question
                </Label>
                <input
                  type="text"
                  value={currentMessages.keyboardNextInstruction || ""}
                  onChange={(e) =>
                    handleCustomMessageChange(
                      defaultLanguage,
                      "keyboardNextInstruction",
                      e.target.value
                    )
                  }
                  placeholder={DEFAULT_MESSAGES[defaultLanguage].keyboardNextInstruction}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-700 mb-1 block">
                  Keyboard instruction to submit
                </Label>
                <input
                  type="text"
                  value={currentMessages.keyboardSubmitInstruction || ""}
                  onChange={(e) =>
                    handleCustomMessageChange(
                      defaultLanguage,
                      "keyboardSubmitInstruction",
                      e.target.value
                    )
                  }
                  placeholder={DEFAULT_MESSAGES[defaultLanguage].keyboardSubmitInstruction}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-700 mb-1 block">
                  Instruction for Dropdown question button
                </Label>
                <input
                  type="text"
                  value={currentMessages.dropdownPlaceholder || ""}
                  onChange={(e) =>
                    handleCustomMessageChange(
                      defaultLanguage,
                      "dropdownPlaceholder",
                      e.target.value
                    )
                  }
                  placeholder={DEFAULT_MESSAGES[defaultLanguage].dropdownPlaceholder}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-700 mb-1 block">
                  Instruction for Dropdown question input
                </Label>
                <input
                  type="text"
                  value={currentMessages.dropdownSearchPlaceholder || ""}
                  onChange={(e) =>
                    handleCustomMessageChange(
                      defaultLanguage,
                      "dropdownSearchPlaceholder",
                      e.target.value
                    )
                  }
                  placeholder={DEFAULT_MESSAGES[defaultLanguage].dropdownSearchPlaceholder}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-700 mb-1 block">
                  Label for "Other" answer option
                </Label>
                <input
                  type="text"
                  value={currentMessages.otherOptionLabel || ""}
                  onChange={(e) =>
                    handleCustomMessageChange(defaultLanguage, "otherOptionLabel", e.target.value)
                  }
                  placeholder={DEFAULT_MESSAGES[defaultLanguage].otherOptionLabel}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-700 mb-1 block">
                  Hint for "Other" answer option
                </Label>
                <input
                  type="text"
                  value={currentMessages.otherOptionHint || ""}
                  onChange={(e) =>
                    handleCustomMessageChange(defaultLanguage, "otherOptionHint", e.target.value)
                  }
                  placeholder={DEFAULT_MESSAGES[defaultLanguage].otherOptionHint}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-700 mb-1 block">
                  Submit button text
                </Label>
                <input
                  type="text"
                  value={currentMessages.submitButtonText || ""}
                  onChange={(e) =>
                    handleCustomMessageChange(defaultLanguage, "submitButtonText", e.target.value)
                  }
                  placeholder={DEFAULT_MESSAGES[defaultLanguage].submitButtonText}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                />
              </div>

              {/* File upload messages */}
              <div>
                <Label className="text-xs font-medium text-gray-700 mb-1 block">
                  Button text for uploading a single file
                </Label>
                <input
                  type="text"
                  value={currentMessages.uploadSingleFileText || ""}
                  onChange={(e) =>
                    handleCustomMessageChange(
                      defaultLanguage,
                      "uploadSingleFileText",
                      e.target.value
                    )
                  }
                  placeholder={DEFAULT_MESSAGES[defaultLanguage].uploadSingleFileText}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-700 mb-1 block">
                  Button text for replacing an existing file
                </Label>
                <input
                  type="text"
                  value={currentMessages.replaceFileText || ""}
                  onChange={(e) =>
                    handleCustomMessageChange(defaultLanguage, "replaceFileText", e.target.value)
                  }
                  placeholder={DEFAULT_MESSAGES[defaultLanguage].replaceFileText}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-700 mb-1 block">
                  Button text for uploading multiple files
                </Label>
                <input
                  type="text"
                  value={currentMessages.uploadMultipleFilesText || ""}
                  onChange={(e) =>
                    handleCustomMessageChange(
                      defaultLanguage,
                      "uploadMultipleFilesText",
                      e.target.value
                    )
                  }
                  placeholder={DEFAULT_MESSAGES[defaultLanguage].uploadMultipleFilesText}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-700 mb-1 block">
                  Button text for uploading additional files
                </Label>
                <input
                  type="text"
                  value={currentMessages.uploadMoreFilesText || ""}
                  onChange={(e) =>
                    handleCustomMessageChange(
                      defaultLanguage,
                      "uploadMoreFilesText",
                      e.target.value
                    )
                  }
                  placeholder={DEFAULT_MESSAGES[defaultLanguage].uploadMoreFilesText}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-700 mb-1 block">
                  Instruction for file upload like drag and drop or click to upload
                </Label>
                <input
                  type="text"
                  value={currentMessages.fileUploadInstruction || ""}
                  onChange={(e) =>
                    handleCustomMessageChange(
                      defaultLanguage,
                      "fileUploadInstruction",
                      e.target.value
                    )
                  }
                  placeholder={DEFAULT_MESSAGES[defaultLanguage].fileUploadInstruction}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-700 mb-1 block">
                  Message for maximum file size limit
                </Label>
                <input
                  type="text"
                  value={currentMessages.maxFileSizeMessage || ""}
                  onChange={(e) =>
                    handleCustomMessageChange(defaultLanguage, "maxFileSizeMessage", e.target.value)
                  }
                  placeholder={DEFAULT_MESSAGES[defaultLanguage].maxFileSizeMessage}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-700 mb-1 block">
                  Message for file uploading
                </Label>
                <input
                  type="text"
                  value={currentMessages.uploadingMessage || ""}
                  onChange={(e) =>
                    handleCustomMessageChange(defaultLanguage, "uploadingMessage", e.target.value)
                  }
                  placeholder={DEFAULT_MESSAGES[defaultLanguage].uploadingMessage}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-700 mb-1 block">
                  Message for file upload finishing
                </Label>
                <input
                  type="text"
                  value={currentMessages.finishingUploadMessage || ""}
                  onChange={(e) =>
                    handleCustomMessageChange(
                      defaultLanguage,
                      "finishingUploadMessage",
                      e.target.value
                    )
                  }
                  placeholder={DEFAULT_MESSAGES[defaultLanguage].finishingUploadMessage}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>

        {/* Error & validation messages */}
        <div className="border border-gray-200 rounded">
          <button
            onClick={() => toggleSection("errors")}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm font-semibold text-gray-900">Error & validation messages</span>
            {expandedSections.errors ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )}
          </button>

          {expandedSections.errors && (
            <div className="p-4 border-t border-gray-200 grid grid-cols-1 gap-4">
              {/* Required errors */}
              <div>
                <Label className="text-xs font-medium text-gray-700 mb-1 block">
                  Error message for required field
                </Label>
                <input
                  type="text"
                  value={currentMessages.requiredFieldError || ""}
                  onChange={(e) =>
                    handleCustomMessageChange(defaultLanguage, "requiredFieldError", e.target.value)
                  }
                  placeholder={DEFAULT_MESSAGES[defaultLanguage].requiredFieldError}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-700 mb-1 block">
                  Error message for required contact block fields
                </Label>
                <input
                  type="text"
                  value={currentMessages.requiredContactFieldsError || ""}
                  onChange={(e) =>
                    handleCustomMessageChange(
                      defaultLanguage,
                      "requiredContactFieldsError",
                      e.target.value
                    )
                  }
                  placeholder={DEFAULT_MESSAGES[defaultLanguage].requiredContactFieldsError}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-700 mb-1 block">
                  Error message for required address block fields
                </Label>
                <input
                  type="text"
                  value={currentMessages.requiredAddressFieldsError || ""}
                  onChange={(e) =>
                    handleCustomMessageChange(
                      defaultLanguage,
                      "requiredAddressFieldsError",
                      e.target.value
                    )
                  }
                  placeholder={DEFAULT_MESSAGES[defaultLanguage].requiredAddressFieldsError}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-700 mb-1 block">
                  Error message for required signature field
                </Label>
                <input
                  type="text"
                  value={currentMessages.requiredSignatureError || ""}
                  onChange={(e) =>
                    handleCustomMessageChange(
                      defaultLanguage,
                      "requiredSignatureError",
                      e.target.value
                    )
                  }
                  placeholder={DEFAULT_MESSAGES[defaultLanguage].requiredSignatureError}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                />
              </div>

              {/* Validation errors */}
              <div>
                <Label className="text-xs font-medium text-gray-700 mb-1 block">
                  Error message for invalid email
                </Label>
                <input
                  type="text"
                  value={currentMessages.invalidEmailError || ""}
                  onChange={(e) =>
                    handleCustomMessageChange(defaultLanguage, "invalidEmailError", e.target.value)
                  }
                  placeholder={DEFAULT_MESSAGES[defaultLanguage].invalidEmailError}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-700 mb-1 block">
                  Error message for not business email
                </Label>
                <input
                  type="text"
                  value={currentMessages.businessEmailOnlyError || ""}
                  onChange={(e) =>
                    handleCustomMessageChange(
                      defaultLanguage,
                      "businessEmailOnlyError",
                      e.target.value
                    )
                  }
                  placeholder={DEFAULT_MESSAGES[defaultLanguage].businessEmailOnlyError}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-700 mb-1 block">
                  Error message for invalid url
                </Label>
                <input
                  type="text"
                  value={currentMessages.invalidUrlError || ""}
                  onChange={(e) =>
                    handleCustomMessageChange(defaultLanguage, "invalidUrlError", e.target.value)
                  }
                  placeholder={DEFAULT_MESSAGES[defaultLanguage].invalidUrlError}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-700 mb-1 block">
                  Error message for invalid phone number
                </Label>
                <input
                  type="text"
                  value={currentMessages.invalidPhoneError || ""}
                  onChange={(e) =>
                    handleCustomMessageChange(defaultLanguage, "invalidPhoneError", e.target.value)
                  }
                  placeholder={DEFAULT_MESSAGES[defaultLanguage].invalidPhoneError}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-700 mb-1 block">
                  Error message for invalid number
                </Label>
                <input
                  type="text"
                  value={currentMessages.invalidNumberError || ""}
                  onChange={(e) =>
                    handleCustomMessageChange(defaultLanguage, "invalidNumberError", e.target.value)
                  }
                  placeholder={DEFAULT_MESSAGES[defaultLanguage].invalidNumberError}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-700 mb-1 block">
                  Error message for number lower than min
                </Label>
                <input
                  type="text"
                  value={currentMessages.numberTooLowError || ""}
                  onChange={(e) =>
                    handleCustomMessageChange(defaultLanguage, "numberTooLowError", e.target.value)
                  }
                  placeholder={DEFAULT_MESSAGES[defaultLanguage].numberTooLowError}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-700 mb-1 block">
                  Error message for number greater than max
                </Label>
                <input
                  type="text"
                  value={currentMessages.numberTooHighError || ""}
                  onChange={(e) =>
                    handleCustomMessageChange(defaultLanguage, "numberTooHighError", e.target.value)
                  }
                  placeholder={DEFAULT_MESSAGES[defaultLanguage].numberTooHighError}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-700 mb-1 block">
                  Error message for number not between min and max
                </Label>
                <input
                  type="text"
                  value={currentMessages.numberOutOfRangeError || ""}
                  onChange={(e) =>
                    handleCustomMessageChange(
                      defaultLanguage,
                      "numberOutOfRangeError",
                      e.target.value
                    )
                  }
                  placeholder={DEFAULT_MESSAGES[defaultLanguage].numberOutOfRangeError}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-700 mb-1 block">
                  Message for multi select exact selection
                </Label>
                <input
                  type="text"
                  value={currentMessages.multiSelectExactError || ""}
                  onChange={(e) =>
                    handleCustomMessageChange(
                      defaultLanguage,
                      "multiSelectExactError",
                      e.target.value
                    )
                  }
                  placeholder={DEFAULT_MESSAGES[defaultLanguage].multiSelectExactError}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-700 mb-1 block">
                  Error message for matrix required error
                </Label>
                <input
                  type="text"
                  value={currentMessages.matrixRequiredError || ""}
                  onChange={(e) =>
                    handleCustomMessageChange(
                      defaultLanguage,
                      "matrixRequiredError",
                      e.target.value
                    )
                  }
                  placeholder={DEFAULT_MESSAGES[defaultLanguage].matrixRequiredError}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-700 mb-1 block">
                  Message for multi select range selection
                </Label>
                <input
                  type="text"
                  value={currentMessages.multiSelectRangeError || ""}
                  onChange={(e) =>
                    handleCustomMessageChange(
                      defaultLanguage,
                      "multiSelectRangeError",
                      e.target.value
                    )
                  }
                  placeholder={DEFAULT_MESSAGES[defaultLanguage].multiSelectRangeError}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-700 mb-1 block">
                  Error message for payment required
                </Label>
                <input
                  type="text"
                  value={currentMessages.paymentRequiredError || ""}
                  onChange={(e) =>
                    handleCustomMessageChange(
                      defaultLanguage,
                      "paymentRequiredError",
                      e.target.value
                    )
                  }
                  placeholder={DEFAULT_MESSAGES[defaultLanguage].paymentRequiredError}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                />
              </div>

              {/* System messages */}
              <div>
                <Label className="text-xs font-medium text-gray-700 mb-1 block">
                  Error message for internet connection error
                </Label>
                <input
                  type="text"
                  value={currentMessages.offlineError || ""}
                  onChange={(e) =>
                    handleCustomMessageChange(defaultLanguage, "offlineError", e.target.value)
                  }
                  placeholder={DEFAULT_MESSAGES[defaultLanguage].offlineError}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-700 mb-1 block">
                  Message for internet connection is back
                </Label>
                <input
                  type="text"
                  value={currentMessages.backOnlineMessage || ""}
                  onChange={(e) =>
                    handleCustomMessageChange(defaultLanguage, "backOnlineMessage", e.target.value)
                  }
                  placeholder={DEFAULT_MESSAGES[defaultLanguage].backOnlineMessage}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-700 mb-1 block">
                  Error message for server error
                </Label>
                <input
                  type="text"
                  value={currentMessages.serverError || ""}
                  onChange={(e) =>
                    handleCustomMessageChange(defaultLanguage, "serverError", e.target.value)
                  }
                  placeholder={DEFAULT_MESSAGES[defaultLanguage].serverError}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                />
              </div>

              {/* File errors */}
              <div>
                <Label className="text-xs font-medium text-gray-700 mb-1 block">
                  Error message for file upload error
                </Label>
                <input
                  type="text"
                  value={currentMessages.fileUploadError || ""}
                  onChange={(e) =>
                    handleCustomMessageChange(defaultLanguage, "fileUploadError", e.target.value)
                  }
                  placeholder={DEFAULT_MESSAGES[defaultLanguage].fileUploadError}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-700 mb-1 block">
                  Error message for file size error
                </Label>
                <input
                  type="text"
                  value={currentMessages.fileSizeError || ""}
                  onChange={(e) =>
                    handleCustomMessageChange(defaultLanguage, "fileSizeError", e.target.value)
                  }
                  placeholder={DEFAULT_MESSAGES[defaultLanguage].fileSizeError}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-700 mb-1 block">
                  Error message for file type error
                </Label>
                <input
                  type="text"
                  value={currentMessages.fileTypeError || ""}
                  onChange={(e) =>
                    handleCustomMessageChange(defaultLanguage, "fileTypeError", e.target.value)
                  }
                  placeholder={DEFAULT_MESSAGES[defaultLanguage].fileTypeError}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-700 mb-1 block">
                  Error message for scheduler required error
                </Label>
                <input
                  type="text"
                  value={currentMessages.schedulerRequiredError || ""}
                  onChange={(e) =>
                    handleCustomMessageChange(
                      defaultLanguage,
                      "schedulerRequiredError",
                      e.target.value
                    )
                  }
                  placeholder={DEFAULT_MESSAGES[defaultLanguage].schedulerRequiredError}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
