import { FormSchema, SubmissionSchema, Field, Page } from "../src/form.contract";

describe("Form Contract Tests", () => {
  describe("Field validation", () => {
    test("should validate a text field", () => {
      const field: Field = {
        id: "field_1",
        type: "text",
        title: "What is your name?",
        required: true,
        validation: [
          { type: "required", message: "Name is required" },
          { type: "min", value: 2, message: "Name must be at least 2 characters" },
        ],
      };

      expect(() => Field.parse(field)).not.toThrow();
    });

    test("should validate a select field with options", () => {
      const field: Field = {
        id: "field_2",
        type: "select",
        title: "Choose your country",
        options: [
          { value: "us", label: "United States" },
          { value: "uk", label: "United Kingdom" },
          { value: "fr", label: "France" },
        ],
      };

      expect(() => Field.parse(field)).not.toThrow();
    });

    test("should reject invalid field type", () => {
      const field = {
        id: "field_3",
        type: "invalid_type",
        title: "Invalid field",
      };

      expect(() => Field.parse(field)).toThrow();
    });
  });

  describe("Page validation", () => {
    test("should validate a page with multiple fields", () => {
      const page: Page = {
        id: "page_1",
        title: "Personal Information",
        blocks: [
          {
            id: "field_1",
            type: "text",
            title: "First Name",
            required: true,
          },
          {
            id: "field_2",
            type: "text",
            title: "Last Name",
            required: true,
          },
          {
            id: "field_3",
            type: "email",
            title: "Email Address",
            required: true,
          },
        ],
      };

      expect(() => Page.parse(page)).not.toThrow();
    });
  });

  describe("Form validation", () => {
    test("should validate a complete form", () => {
      const form = {
        id: "form_123",
        version: 1,
        title: "Customer Feedback Survey",
        description: "Help us improve our service",
        pages: [
          {
            id: "page_1",
            title: "About You",
            blocks: [
              {
                id: "name",
                type: "text",
                title: "Your Name",
                required: true,
              },
              {
                id: "email",
                type: "email",
                title: "Email Address",
                required: true,
              },
            ],
          },
          {
            id: "page_2",
            title: "Feedback",
            blocks: [
              {
                id: "rating",
                type: "rating",
                title: "How would you rate our service?",
                required: true,
                config: { max: 5 },
              },
              {
                id: "comments",
                type: "long_text",
                title: "Additional comments",
                required: false,
              },
            ],
          },
        ],
        logic: [
          {
            id: "logic_1",
            conditions: [
              {
                field: "rating",
                operator: "less_than",
                value: 3,
              },
            ],
            actions: [
              {
                type: "show",
                target: "follow_up",
              },
            ],
          },
        ],
        theme: {
          colors: {
            primary: "#3b82f6",
            background: "#ffffff",
            surface: "#f9fafb",
            text: "#111827",
            textMuted: "#6b7280",
            border: "#e5e7eb",
            error: "#ef4444",
            success: "#10b981",
          },
        },
        settings: {
          submitLabel: "Send Feedback",
          showProgressBar: true,
          allowSaveAndResume: true,
          thankYouMessage: "Thank you for your feedback!",
        },
      };

      expect(() => FormSchema.parse(form)).not.toThrow();
    });

    test("should reject form with invalid structure", () => {
      const invalidForm = {
        id: "form_123",
        version: "not-a-number", // Should be number
        title: "Invalid Form",
        pages: "not-an-array", // Should be array
      };

      expect(() => FormSchema.parse(invalidForm)).toThrow();
    });
  });

  describe("Submission validation", () => {
    test("should validate a complete submission", () => {
      const submission = {
        id: "sub_123",
        formId: "form_123",
        formVersion: 1,
        respondentId: "resp_456",
        sessionId: "sess_789",
        answers: {
          name: "John Doe",
          email: "john@example.com",
          rating: 5,
          comments: "Great service!",
        },
        metadata: {
          startedAt: "2024-01-01T10:00:00Z",
          completedAt: "2024-01-01T10:05:00Z",
          timeSpentSeconds: 300,
          device: "desktop",
          browser: "Chrome 120",
          ipAddress: "192.168.1.1",
          location: {
            country: "US",
            region: "CA",
            city: "San Francisco",
          },
        },
        partial: false,
      };

      expect(() => SubmissionSchema.parse(submission)).not.toThrow();
    });

    test("should validate a partial submission", () => {
      const partialSubmission = {
        id: "sub_456",
        formId: "form_123",
        formVersion: 1,
        respondentId: "resp_789",
        sessionId: "sess_012",
        answers: {
          name: "Jane",
          // email not provided yet
        },
        metadata: {
          startedAt: "2024-01-01T10:00:00Z",
          timeSpentSeconds: 60,
          device: "mobile",
        },
        partial: true,
      };

      expect(() => SubmissionSchema.parse(partialSubmission)).not.toThrow();
    });
  });

  describe("Cross-service compatibility", () => {
    test("builder output should be valid runtime input", () => {
      // Simulate form created by builder
      const builderOutput = {
        id: "form_builder_123",
        version: 1,
        title: "Builder Created Form",
        pages: [
          {
            id: "page_1",
            blocks: [
              {
                id: "field_1",
                type: "text",
                title: "Test Field",
                required: false,
              },
            ],
          },
        ],
      };

      // Validate it matches the contract
      const validatedForm = FormSchema.parse(builderOutput);

      // Runtime should be able to use this
      expect(validatedForm).toBeDefined();
      expect(validatedForm.pages[0].blocks[0].type).toBe("text");
    });

    test("runtime submission should match API expectations", () => {
      // Simulate submission from runtime
      const runtimeSubmission = {
        id: "sub_runtime_123",
        formId: "form_123",
        formVersion: 1,
        respondentId: "anon_456",
        sessionId: "sess_789",
        answers: {
          field_1: "User input",
        },
        partial: false,
      };

      // Validate it matches the contract
      const validatedSubmission = SubmissionSchema.parse(runtimeSubmission);

      // API should be able to process this
      expect(validatedSubmission).toBeDefined();
      expect(validatedSubmission.answers.field_1).toBe("User input");
    });
  });
});
