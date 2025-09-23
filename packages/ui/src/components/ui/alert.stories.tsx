import type { Meta, StoryObj } from "@storybook/react";
import { Alert, AlertDescription, AlertTitle } from "./alert";
import { AlertCircle, CheckCircle, XCircle, AlertTriangle, Info, Terminal } from "lucide-react";

const meta: Meta<typeof Alert> = {
  title: "Components/Alert",
  component: Alert,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: { type: "select" },
      options: ["default", "destructive", "warning", "success"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>You can add components to your app using the cli.</AlertDescription>
    </Alert>
  ),
};

export const Destructive: Story = {
  render: () => (
    <Alert variant="destructive">
      <XCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>Your session has expired. Please log in again.</AlertDescription>
    </Alert>
  ),
};

export const Warning: Story = {
  render: () => (
    <Alert variant="warning">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Warning</AlertTitle>
      <AlertDescription>
        This action will permanently delete all data and cannot be undone.
      </AlertDescription>
    </Alert>
  ),
};

export const Success: Story = {
  render: () => (
    <Alert variant="success">
      <CheckCircle className="h-4 w-4" />
      <AlertTitle>Success!</AlertTitle>
      <AlertDescription>
        Your form has been published successfully and is now accepting responses.
      </AlertDescription>
    </Alert>
  ),
};

export const WithoutTitle: Story = {
  render: () => (
    <div className="space-y-4 w-[500px]">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>This is a simple alert without a title.</AlertDescription>
      </Alert>

      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertDescription>Something went wrong. Please try again.</AlertDescription>
      </Alert>
    </div>
  ),
};

export const FormValidationAlerts: Story = {
  render: () => (
    <div className="space-y-4 w-[500px]">
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertTitle>Validation Error</AlertTitle>
        <AlertDescription>
          Please fix the following errors before submitting:
          <ul className="mt-2 list-disc list-inside space-y-1">
            <li>Email field is required</li>
            <li>Password must be at least 8 characters</li>
            <li>Please accept the terms and conditions</li>
          </ul>
        </AlertDescription>
      </Alert>

      <Alert variant="warning">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Unsaved Changes</AlertTitle>
        <AlertDescription>
          You have unsaved changes. Are you sure you want to leave this page?
        </AlertDescription>
      </Alert>

      <Alert variant="success">
        <CheckCircle className="h-4 w-4" />
        <AlertTitle>Form Submitted</AlertTitle>
        <AlertDescription>
          Thank you for your submission. We'll get back to you within 24 hours.
        </AlertDescription>
      </Alert>
    </div>
  ),
};

export const SystemAlerts: Story = {
  render: () => (
    <div className="space-y-4 w-[600px]">
      <Alert>
        <Terminal className="h-4 w-4" />
        <AlertTitle>API Update Available</AlertTitle>
        <AlertDescription>
          A new version of our API is available. Update your integration to take advantage of new
          features.
          <a href="#" className="underline ml-1">
            View changelog
          </a>
        </AlertDescription>
      </Alert>

      <Alert variant="warning">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Scheduled Maintenance</AlertTitle>
        <AlertDescription>
          We'll be performing scheduled maintenance on January 15th from 2:00 AM to 4:00 AM EST.
          Your forms will remain accessible, but some features may be temporarily unavailable.
        </AlertDescription>
      </Alert>

      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Service Disruption</AlertTitle>
        <AlertDescription>
          We're currently experiencing issues with form submissions. Our team is working to resolve
          this.
          <a href="#" className="underline ml-1">
            Status page
          </a>
        </AlertDescription>
      </Alert>
    </div>
  ),
};

export const OnboardingAlerts: Story = {
  render: () => (
    <div className="space-y-4 w-[600px]">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Welcome to FormBuilder!</AlertTitle>
        <AlertDescription>
          Get started by creating your first form. Check out our
          <a href="#" className="underline ml-1">
            quick start guide
          </a>
          to learn the basics.
        </AlertDescription>
      </Alert>

      <Alert variant="success">
        <CheckCircle className="h-4 w-4" />
        <AlertTitle>Account Verified</AlertTitle>
        <AlertDescription>
          Your email address has been successfully verified. You can now create unlimited forms and
          access all premium features.
        </AlertDescription>
      </Alert>

      <Alert variant="warning">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Free Trial Ending</AlertTitle>
        <AlertDescription>
          Your free trial expires in 3 days. Upgrade to Pro to continue using advanced features.
          <a href="#" className="underline ml-1">
            View pricing
          </a>
        </AlertDescription>
      </Alert>
    </div>
  ),
};

export const CompactAlerts: Story = {
  render: () => (
    <div className="space-y-2 w-[500px]">
      <Alert className="py-2">
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>Changes saved automatically</AlertDescription>
      </Alert>

      <Alert variant="warning" className="py-2">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>Connection unstable - some features may not work</AlertDescription>
      </Alert>

      <Alert variant="destructive" className="py-2">
        <XCircle className="h-4 w-4" />
        <AlertDescription>Failed to save - please try again</AlertDescription>
      </Alert>
    </div>
  ),
};

export const InteractiveAlerts: Story = {
  render: () => (
    <div className="space-y-4 w-[600px]">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Cookie Consent</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>We use cookies to improve your experience.</span>
          <div className="flex gap-2 ml-4">
            <button className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded">
              Accept
            </button>
            <button className="text-xs border px-3 py-1 rounded">Decline</button>
          </div>
        </AlertDescription>
      </Alert>

      <Alert variant="warning">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Confirm Delete</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>This will permanently delete the form "Customer Survey".</span>
          <div className="flex gap-2 ml-4">
            <button className="text-xs bg-destructive text-destructive-foreground px-3 py-1 rounded">
              Delete
            </button>
            <button className="text-xs border px-3 py-1 rounded">Cancel</button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4 w-[500px]">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Default Alert</AlertTitle>
        <AlertDescription>This is a default alert with informational styling.</AlertDescription>
      </Alert>

      <Alert variant="success">
        <CheckCircle className="h-4 w-4" />
        <AlertTitle>Success Alert</AlertTitle>
        <AlertDescription>This is a success alert indicating completion.</AlertDescription>
      </Alert>

      <Alert variant="warning">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Warning Alert</AlertTitle>
        <AlertDescription>This is a warning alert for potentially risky actions.</AlertDescription>
      </Alert>

      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertTitle>Error Alert</AlertTitle>
        <AlertDescription>This is an error alert for failed operations.</AlertDescription>
      </Alert>
    </div>
  ),
};
