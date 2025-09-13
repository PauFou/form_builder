import { FormSchema, SubmissionSchema, Field } from "../form.contract";

describe("Form Schema Contracts", () => {
  describe("Field validation", () => {
    it("should validate a complete text field", () => {
      const textField = {
        id: "field_1",
        type: "text" as const,
        title: "Your Name",
        description: "Please enter your full name",
        placeholder: "John Doe",
        required: true,
        validation: [
          {
            type: "required" as const,
            message: "Name is required",
          },
        ],
      };

      expect(() => Field.parse(textField)).not.toThrow();
    });

    it("should validate email field with pattern validation", () => {
      const emailField = {
        id: "email_1",
        type: "email" as const,
        title: "Email Address",
        required: true,
        validation: [
          {
            type: "pattern" as const,
            value: "^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$",
            message: "Please enter a valid email address",
          },
        ],
      };

      expect(() => Field.parse(emailField)).not.toThrow();
    });

    it("should validate select field with options", () => {
      const selectField = {
        id: "role_1",
        type: "select" as const,
        title: "What is your role?",
        required: true,
        options: [
          { value: "developer", label: "Developer" },
          { value: "designer", label: "Designer" },
          { value: "manager", label: "Manager" },
        ],
      };

      expect(() => Field.parse(selectField)).not.toThrow();
    });

    it("should reject invalid field types", () => {
      const invalidField = {
        id: "invalid_1",
        type: "invalid_type",
        title: "Invalid Field",
      };

      expect(() => Field.parse(invalidField)).toThrow();
    });
  });

  describe("Form validation", () => {
    it("should validate a complete form", () => {
      const form = {
        id: "form_123",
        version: 1,
        title: "User Feedback Form",
        description: "We value your feedback",
        pages: [
          {
            id: "page_1",
            title: "Personal Information",
            blocks: [
              {
                id: "name_field",
                type: "text" as const,
                title: "Your Name",
                required: true,
              },
            ],
          },
        ],
        theme: {
          colors: {
            primary: "#3b82f6",
            background: "#ffffff",
            surface: "#f8fafc",
            text: "#1e293b",
            textMuted: "#64748b",
            border: "#e2e8f0",
            error: "#ef4444",
            success: "#10b981",
          },
        },
        settings: {
          submitLabel: "Send Feedback",
          showProgressBar: true,
          allowSaveAndResume: true,
        },
      };

      expect(() => FormSchema.parse(form)).not.toThrow();
    });

    it("should require minimum form properties", () => {
      const minimalForm = {
        id: "form_minimal",
        version: 1,
        title: "Minimal Form",
        pages: [
          {
            id: "page_1",
            blocks: [
              {
                id: "field_1",
                type: "text" as const,
                title: "Question 1",
              },
            ],
          },
        ],
      };

      expect(() => FormSchema.parse(minimalForm)).not.toThrow();
    });
  });

  describe("Submission validation", () => {
    it("should validate a complete submission", () => {
      const submission = {
        id: "sub_123",
        formId: "form_123",
        formVersion: 1,
        respondentId: "resp_456",
        sessionId: "sess_789",
        answers: {
          name_field: "John Doe",
          email_field: "john@example.com",
        },
        metadata: {
          startedAt: "2024-01-01T10:00:00Z",
          completedAt: "2024-01-01T10:05:00Z",
          timeSpentSeconds: 300,
          device: "desktop" as const,
          browser: "Chrome",
          location: {
            country: "US",
            region: "California",
            city: "San Francisco",
          },
        },
        partial: false,
      };

      expect(() => SubmissionSchema.parse(submission)).not.toThrow();
    });

    it("should validate partial submission", () => {
      const partialSubmission = {
        id: "sub_partial",
        formId: "form_123",
        formVersion: 1,
        respondentId: "resp_456",
        sessionId: "sess_789",
        answers: {
          name_field: "John",
        },
        metadata: {
          startedAt: "2024-01-01T10:00:00Z",
          device: "mobile" as const,
        },
        partial: true,
      };

      expect(() => SubmissionSchema.parse(partialSubmission)).not.toThrow();
    });
  });

  describe("Runtime compatibility", () => {
    it("should match runtime FormField interface", () => {
      // Should validate against our schema structure
      const contractField = {
        id: "test_field",
        type: "text" as const,
        title: "Test Field",
        required: true,
        validation: [
          {
            type: "pattern" as const,
            value: "^[a-z]+$",
          },
        ],
      };

      expect(() => Field.parse(contractField)).not.toThrow();
    });
  });
});
