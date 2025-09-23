import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "./input";
import { Label } from "./label";
import { Search, Mail, Lock, User, Calendar, DollarSign } from "lucide-react";

const meta: Meta<typeof Input> = {
  title: "Components/Input",
  component: Input,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: { type: "select" },
      options: ["text", "email", "password", "number", "tel", "url", "date", "time", "search"],
    },
    disabled: {
      control: { type: "boolean" },
    },
    placeholder: {
      control: { type: "text" },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: "Enter text...",
    type: "text",
  },
};

export const Email: Story = {
  args: {
    placeholder: "email@example.com",
    type: "email",
  },
};

export const Password: Story = {
  args: {
    placeholder: "Enter password",
    type: "password",
  },
};

export const Number: Story = {
  args: {
    placeholder: "0",
    type: "number",
    min: 0,
    max: 100,
  },
};

export const Date: Story = {
  args: {
    type: "date",
  },
};

export const SearchType: Story = {
  args: {
    placeholder: "Search...",
    type: "search",
  },
};

export const Disabled: Story = {
  args: {
    placeholder: "Disabled input",
    disabled: true,
    value: "Cannot edit this",
  },
};

export const File: Story = {
  args: {
    type: "file",
    accept: "image/*",
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="email">Email</Label>
      <Input type="email" id="email" placeholder="Email" />
    </div>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-sm">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-10" placeholder="Search forms..." type="search" />
      </div>

      <div className="relative">
        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-10" placeholder="Email address" type="email" />
      </div>

      <div className="relative">
        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-10" placeholder="Password" type="password" />
      </div>

      <div className="relative">
        <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-10" placeholder="0.00" type="number" step="0.01" />
      </div>
    </div>
  ),
};

export const FormExample: Story = {
  render: () => (
    <form className="space-y-4 w-full max-w-md">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input id="name" placeholder="John Doe" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email-form">Email Address</Label>
        <Input id="email-form" type="email" placeholder="john@example.com" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input id="phone" type="tel" placeholder="+1 (555) 123-4567" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="birthdate">Date of Birth</Label>
        <Input id="birthdate" type="date" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="website">Website</Label>
        <Input id="website" type="url" placeholder="https://example.com" />
      </div>
    </form>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-sm">
      <Input className="h-8 text-xs" placeholder="Small input (h-8)" />
      <Input placeholder="Default input (h-10)" />
      <Input className="h-12 text-base" placeholder="Large input (h-12)" />
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-sm">
      <div className="space-y-2">
        <Label>Normal</Label>
        <Input placeholder="Normal state" />
      </div>

      <div className="space-y-2">
        <Label>Focused (click to see)</Label>
        <Input placeholder="Focus state" className="focus:ring-primary" />
      </div>

      <div className="space-y-2">
        <Label>Disabled</Label>
        <Input placeholder="Disabled state" disabled />
      </div>

      <div className="space-y-2">
        <Label>Read Only</Label>
        <Input value="Read only value" readOnly />
      </div>

      <div className="space-y-2">
        <Label>With Error</Label>
        <Input
          placeholder="Invalid input"
          className="border-destructive focus-visible:ring-destructive"
          aria-invalid="true"
        />
        <p className="text-sm text-destructive">This field is required</p>
      </div>
    </div>
  ),
};

export const RealWorldExamples: Story = {
  render: () => (
    <div className="space-y-6 w-full max-w-md">
      <div>
        <h3 className="mb-4 text-lg font-semibold">Login Form</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="login-email">Email</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="login-email"
                className="pl-10"
                placeholder="Enter your email"
                type="email"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="login-password"
                className="pl-10"
                placeholder="Enter your password"
                type="password"
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">Payment Form</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="card-number">Card Number</Label>
            <Input id="card-number" placeholder="1234 5678 9012 3456" maxLength={19} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiry">Expiry Date</Label>
              <Input id="expiry" placeholder="MM/YY" maxLength={5} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cvv">CVV</Label>
              <Input id="cvv" placeholder="123" maxLength={4} type="password" />
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
};
