import type { Form } from "@forms/contracts";

export const DEMO_FORMS: Record<string, Form> = {
  "logic-demo": {
    id: "logic-demo",
    title: "Logic Demo Form",
    description: "Demonstrates dynamic form behavior with logic rules",
    createdAt: new Date(),
    updatedAt: new Date(),
    pages: [
      {
        id: "page-1",
        title: "Personal Information",
        blocks: [
          {
            id: "name",
            type: "text",
            question: "What's your name?",
            required: true,
            placeholder: "Enter your full name",
          },
          {
            id: "email",
            type: "email",
            question: "What's your email?",
            required: true,
            placeholder: "name@example.com",
          },
          {
            id: "country",
            type: "dropdown",
            question: "What country are you from?",
            required: true,
            options: [
              { id: "us", text: "United States", value: "US" },
              { id: "ca", text: "Canada", value: "CA" },
              { id: "uk", text: "United Kingdom", value: "UK" },
              { id: "fr", text: "France", value: "FR" },
              { id: "de", text: "Germany", value: "DE" },
              { id: "other", text: "Other", value: "other" },
            ],
          },
          {
            id: "state",
            type: "dropdown",
            question: "Which state are you from?",
            required: false,
            description: "This field is shown only for US residents",
            options: [
              { id: "ca", text: "California", value: "CA" },
              { id: "ny", text: "New York", value: "NY" },
              { id: "tx", text: "Texas", value: "TX" },
              { id: "fl", text: "Florida", value: "FL" },
              { id: "other", text: "Other", value: "other" },
            ],
          },
          {
            id: "province",
            type: "dropdown",
            question: "Which province are you from?",
            required: false,
            description: "This field is shown only for Canadian residents",
            options: [
              { id: "on", text: "Ontario", value: "ON" },
              { id: "qc", text: "Quebec", value: "QC" },
              { id: "bc", text: "British Columbia", value: "BC" },
              { id: "ab", text: "Alberta", value: "AB" },
              { id: "other", text: "Other", value: "other" },
            ],
          },
          {
            id: "age",
            type: "number",
            question: "How old are you?",
            required: true,
            validation: [
              {
                type: "min",
                value: 0,
                message: "Age must be a positive number",
              },
              {
                type: "max",
                value: 150,
                message: "Please enter a valid age",
              },
            ],
          },
          {
            id: "student",
            type: "single_select",
            question: "Are you a student?",
            required: true,
            options: [
              { id: "yes", text: "Yes", value: "yes" },
              { id: "no", text: "No", value: "no" },
            ],
          },
          {
            id: "school",
            type: "text",
            question: "Which school do you attend?",
            description: "This field is shown only for students",
            placeholder: "Enter your school name",
          },
          {
            id: "employer",
            type: "text",
            question: "Who is your employer?",
            description: "This field is shown only for non-students",
            placeholder: "Enter your employer name",
          },
        ],
      },
    ],
    logic: [
      {
        id: "rule-show-state",
        name: "Show state field for US residents",
        conditions: [
          {
            id: "cond-country-us",
            field: "country",
            operator: "equals",
            value: "US",
          },
        ],
        actions: [
          {
            id: "action-show-state",
            type: "show",
            target: "state",
          },
        ],
      },
      {
        id: "rule-hide-state",
        name: "Hide state field for non-US residents",
        conditions: [
          {
            id: "cond-country-not-us",
            field: "country",
            operator: "not_equals",
            value: "US",
          },
        ],
        actions: [
          {
            id: "action-hide-state",
            type: "hide",
            target: "state",
          },
        ],
      },
      {
        id: "rule-show-province",
        name: "Show province field for Canadian residents",
        conditions: [
          {
            id: "cond-country-ca",
            field: "country",
            operator: "equals",
            value: "CA",
          },
        ],
        actions: [
          {
            id: "action-show-province",
            type: "show",
            target: "province",
          },
        ],
      },
      {
        id: "rule-hide-province",
        name: "Hide province field for non-Canadian residents",
        conditions: [
          {
            id: "cond-country-not-ca",
            field: "country",
            operator: "not_equals",
            value: "CA",
          },
        ],
        actions: [
          {
            id: "action-hide-province",
            type: "hide",
            target: "province",
          },
        ],
      },
      {
        id: "rule-show-school",
        name: "Show school field for students",
        conditions: [
          {
            id: "cond-student-yes",
            field: "student",
            operator: "equals",
            value: "yes",
          },
        ],
        actions: [
          {
            id: "action-show-school",
            type: "show",
            target: "school",
          },
          {
            id: "action-hide-employer",
            type: "hide",
            target: "employer",
          },
        ],
      },
      {
        id: "rule-show-employer",
        name: "Show employer field for non-students",
        conditions: [
          {
            id: "cond-student-no",
            field: "student",
            operator: "equals",
            value: "no",
          },
        ],
        actions: [
          {
            id: "action-hide-school",
            type: "hide",
            target: "school",
          },
          {
            id: "action-show-employer",
            type: "show",
            target: "employer",
          },
        ],
      },
    ],
    theme: {
      colors: {
        primary: "#3B82F6",
        background: "#FFFFFF",
        surface: "#F9FAFB",
        text: "#111827",
        textMuted: "#6B7280",
        border: "#E5E7EB",
        error: "#EF4444",
        success: "#10B981",
      },
    },
    settings: {
      submitLabel: "Submit Form",
      showProgressBar: true,
      allowSaveAndResume: true,
      thankYouMessage: "<h2>Thank you!</h2><p>Your response has been recorded successfully.</p>",
    },
  },
};
