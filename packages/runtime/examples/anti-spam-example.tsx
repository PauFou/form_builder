import React from "react";
import { FormViewer, antiSpamService } from "@forms/runtime";
import type { FormSchema, RuntimeConfig } from "@forms/runtime";

// Example form schema
const schema: FormSchema = {
  id: "contact-form",
  title: "Contact Us",
  pages: [
    {
      id: "page1",
      blocks: [
        {
          id: "name",
          type: "text",
          question: "What's your name?",
          required: true,
        },
        {
          id: "email",
          type: "email",
          question: "What's your email?",
          required: true,
        },
        {
          id: "message",
          type: "long_text",
          question: "How can we help you?",
          required: true,
          properties: {
            minLength: 10,
            maxLength: 500,
          },
        },
      ],
    },
  ],
  settings: {
    submitText: "Send Message",
    showProgressBar: true,
    thankYouMessage: "<h2>Thank you!</h2><p>We'll get back to you soon.</p>",
  },
};

// Example 1: Basic Anti-Spam Configuration
export function BasicAntiSpamForm() {
  const config: RuntimeConfig = {
    formId: "contact-form",
    apiUrl: "https://api.example.com",
    enableAntiSpam: true, // Enable anti-spam
    minCompletionTime: 3000, // 3 seconds minimum
    onSpamDetected: (reason) => {
      console.warn("Spam detected:", reason);
      // Could show a user-friendly message
      alert("Please take your time filling out the form.");
    },
    onSubmit: async (data) => {
      console.log("Form submitted:", data);
      // Your submission logic here
    },
  };

  return <FormViewer schema={schema} config={config} />;
}

// Example 2: Custom Anti-Spam Configuration
export function CustomAntiSpamForm() {
  // Configure anti-spam service globally
  React.useEffect(() => {
    antiSpamService.updateConfig({
      honeypot: {
        enabled: true,
        fieldName: "_url_field", // Custom honeypot field name
      },
      timeTrap: {
        enabled: true,
        minCompletionTimeMs: 5000, // 5 seconds minimum
      },
      rateLimit: {
        enabled: true,
        byIP: {
          maxRequests: 5, // 5 submissions per IP
          windowMs: 60 * 1000, // per minute
        },
        byFormId: {
          maxRequests: 100, // 100 submissions per form
          windowMs: 60 * 1000, // per minute
        },
      },
    });
  }, []);

  const config: RuntimeConfig = {
    formId: "contact-form",
    apiUrl: "https://api.example.com",
    enableAntiSpam: true,
    onSpamDetected: (reason) => {
      // Handle different spam reasons
      switch (reason) {
        case "honeypot_filled":
          console.error("Bot detected: honeypot was filled");
          break;
        case "too_fast":
          alert("Please take a moment to review your submission.");
          break;
        case "rate_limit_ip":
          alert("Too many submissions. Please try again later.");
          break;
        case "rate_limit_form":
          alert("This form is experiencing high traffic. Please try again later.");
          break;
      }
    },
    onSubmit: async (data) => {
      // Include completion time in metadata
      console.log("Form submitted with metadata:", data.metadata);
    },
  };

  return (
    <div>
      <FormViewer schema={schema} config={config} />
      <AntiSpamStats />
    </div>
  );
}

// Example 3: Monitoring Anti-Spam Statistics
function AntiSpamStats() {
  const [stats, setStats] = React.useState(antiSpamService.getStatistics());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setStats(antiSpamService.getStatistics());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ marginTop: "2rem", padding: "1rem", background: "#f5f5f5" }}>
      <h3>Anti-Spam Statistics</h3>
      <p>Total submission attempts: {stats.totalAttempts}</p>
      <h4>Recent attempts by source:</h4>
      <ul>
        {Object.entries(stats.recentAttempts).map(([key, count]) => (
          <li key={key}>
            {key}: {count} attempts
          </li>
        ))}
      </ul>
    </div>
  );
}

// Example 4: Server-Side Validation (for API)
export async function validateSubmissionOnServer(
  request: Request,
  formData: any
): Promise<{ isValid: boolean; reason?: string }> {
  // Extract client IP (example for Express/Node.js environment)
  const clientIP = request.headers.get("x-forwarded-for") || 
                   request.headers.get("x-real-ip") || 
                   "unknown";

  // Validate using the anti-spam service
  const validation = await antiSpamService.validate(
    formData.sessionId || "server-validation",
    {
      ip: clientIP,
      formId: formData.formId,
    }
  );

  // Additional server-side checks
  if (validation.isValid) {
    // Check completion time from metadata
    const completionTime = formData.metadata?.completionTime;
    if (completionTime && completionTime < 3000) {
      return { isValid: false, reason: "too_fast_server" };
    }

    // Check for suspicious patterns
    const messageLength = formData.values.message?.length || 0;
    if (messageLength < 5) {
      return { isValid: false, reason: "message_too_short" };
    }

    // Check for spam keywords (basic example)
    const spamKeywords = ["viagra", "casino", "lottery", "pills"];
    const message = (formData.values.message || "").toLowerCase();
    const hasSpamKeywords = spamKeywords.some((keyword) =>
      message.includes(keyword)
    );
    if (hasSpamKeywords) {
      return { isValid: false, reason: "spam_keywords" };
    }
  }

  return validation;
}

// Example 5: Testing Anti-Spam in Development
export function TestAntiSpamForm() {
  const [testMode, setTestMode] = React.useState<
    "normal" | "bot" | "fast" | "rate_limit"
  >("normal");

  const config: RuntimeConfig = {
    formId: "test-form",
    apiUrl: "https://api.example.com",
    enableAntiSpam: true,
    minCompletionTime: 2000, // 2 seconds for testing
    onSpamDetected: (reason) => {
      console.log(`✅ Anti-spam working! Blocked reason: ${reason}`);
    },
    onSubmit: async (data) => {
      console.log("✅ Form submitted successfully:", data);
    },
  };

  // Simulate different scenarios
  React.useEffect(() => {
    const form = document.querySelector(".fr-form") as HTMLFormElement;
    if (!form) return;

    switch (testMode) {
      case "bot":
        // Simulate bot filling honeypot
        const honeypot = form.querySelector(
          'input[name="_website_url"]'
        ) as HTMLInputElement;
        if (honeypot) {
          honeypot.value = "http://spam-site.com";
        }
        break;

      case "fast":
        // Simulate fast submission (handled by the form logic)
        console.log("Fast mode: Try submitting within 2 seconds");
        break;

      case "rate_limit":
        // Update config for aggressive rate limiting
        antiSpamService.updateConfig({
          rateLimit: {
            enabled: true,
            byIP: {
              maxRequests: 2,
              windowMs: 10000, // 10 seconds
            },
            byFormId: {
              maxRequests: 5,
              windowMs: 60000,
            },
          },
        });
        console.log("Rate limit mode: Try submitting more than 2 times");
        break;
    }
  }, [testMode]);

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h3>Test Anti-Spam Features</h3>
        <label>
          Test Mode:
          <select
            value={testMode}
            onChange={(e) =>
              setTestMode(e.target.value as typeof testMode)
            }
            style={{ marginLeft: "0.5rem" }}
          >
            <option value="normal">Normal User</option>
            <option value="bot">Bot (fills honeypot)</option>
            <option value="fast">Fast Submission</option>
            <option value="rate_limit">Rate Limit Test</option>
          </select>
        </label>
      </div>
      <FormViewer schema={schema} config={config} />
    </div>
  );
}