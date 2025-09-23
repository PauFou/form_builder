import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "./badge";
import { Check, X, AlertCircle, Clock, Star } from "lucide-react";

const meta: Meta<typeof Badge> = {
  title: "Components/Badge",
  component: Badge,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: { type: "select" },
      options: ["default", "secondary", "destructive", "outline", "success", "warning"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Badge",
  },
};

export const Secondary: Story = {
  args: {
    children: "Secondary",
    variant: "secondary",
  },
};

export const Destructive: Story = {
  args: {
    children: "Destructive",
    variant: "destructive",
  },
};

export const Outline: Story = {
  args: {
    children: "Outline",
    variant: "outline",
  },
};

export const Success: Story = {
  args: {
    children: "Success",
    variant: "success",
  },
};

export const Warning: Story = {
  args: {
    children: "Warning",
    variant: "warning",
  },
};

export const WithIcon: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge>
        <Check className="mr-1 h-3 w-3" /> Approved
      </Badge>
      <Badge variant="destructive">
        <X className="mr-1 h-3 w-3" /> Rejected
      </Badge>
      <Badge variant="warning">
        <AlertCircle className="mr-1 h-3 w-3" /> Pending
      </Badge>
      <Badge variant="secondary">
        <Clock className="mr-1 h-3 w-3" /> In Progress
      </Badge>
      <Badge variant="success">
        <Star className="mr-1 h-3 w-3" /> Featured
      </Badge>
    </div>
  ),
};

export const StatusBadges: Story = {
  name: "Status Examples",
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Form Status:</span>
        <Badge variant="success">Published</Badge>
        <Badge variant="secondary">Draft</Badge>
        <Badge variant="destructive">Archived</Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Submission Status:</span>
        <Badge variant="success">Complete</Badge>
        <Badge variant="warning">Partial</Badge>
        <Badge variant="destructive">Failed</Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">User Roles:</span>
        <Badge>Admin</Badge>
        <Badge variant="secondary">Editor</Badge>
        <Badge variant="outline">Viewer</Badge>
      </div>
    </div>
  ),
};

export const SizesAndCounts: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge>New</Badge>
      <Badge variant="secondary">12</Badge>
      <Badge variant="destructive">99+</Badge>
      <Badge variant="outline">v2.0.0</Badge>
      <Badge variant="success">PRO</Badge>
      <Badge variant="warning">BETA</Badge>
    </div>
  ),
};

export const RealWorldUsage: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Customer Feedback Form</h3>
            <p className="text-sm text-muted-foreground">Collect customer insights</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="success">Active</Badge>
            <Badge variant="secondary">45 responses</Badge>
          </div>
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Employee Survey</h3>
            <p className="text-sm text-muted-foreground">Annual satisfaction survey</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="warning">Closing Soon</Badge>
            <Badge variant="secondary">128 responses</Badge>
          </div>
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Event Registration</h3>
            <p className="text-sm text-muted-foreground">Tech conference 2024</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="destructive">Closed</Badge>
            <Badge variant="secondary">500 responses</Badge>
            <Badge>Full</Badge>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
    </div>
  ),
};
