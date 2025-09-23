import type { Meta, StoryObj } from "@storybook/react";
import { Switch } from "./switch";
import { Label } from "./label";

const meta: Meta<typeof Switch> = {
  title: "Components/Switch",
  component: Switch,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    checked: {
      control: { type: "boolean" },
    },
    disabled: {
      control: { type: "boolean" },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Checked: Story = {
  args: {
    checked: true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const DisabledChecked: Story = {
  args: {
    disabled: true,
    checked: true,
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Switch id="airplane-mode" />
      <Label htmlFor="airplane-mode">Airplane Mode</Label>
    </div>
  ),
};

export const FormExample: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label htmlFor="marketing-emails" className="flex flex-col space-y-1">
          <span>Marketing emails</span>
          <span className="font-normal text-sm text-muted-foreground">
            Receive emails about new products, features, and more.
          </span>
        </Label>
        <Switch id="marketing-emails" />
      </div>
      <div className="flex items-center justify-between">
        <Label htmlFor="security-emails" className="flex flex-col space-y-1">
          <span>Security emails</span>
          <span className="font-normal text-sm text-muted-foreground">
            Receive emails about your account security.
          </span>
        </Label>
        <Switch id="security-emails" defaultChecked />
      </div>
    </div>
  ),
};

export const SettingsExample: Story = {
  render: () => (
    <div className="w-full max-w-md space-y-4">
      <div>
        <h3 className="mb-4 text-lg font-medium">Notifications</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Push Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive push notifications on your device
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive notifications via email</p>
            </div>
            <Switch />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>SMS Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive notifications via SMS</p>
            </div>
            <Switch />
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <h3 className="mb-4 text-lg font-medium">Privacy</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Public Profile</Label>
              <p className="text-sm text-muted-foreground">Make your profile visible to everyone</p>
            </div>
            <Switch />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Activity Status</Label>
              <p className="text-sm text-muted-foreground">Show when you're active</p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </div>
    </div>
  ),
};

export const RealWorldExamples: Story = {
  render: () => (
    <div className="space-y-6 w-full max-w-lg">
      <div className="rounded-lg border p-6">
        <h3 className="mb-4 text-lg font-semibold">Form Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="public" className="flex-1">
              <div className="font-medium">Public Form</div>
              <div className="text-sm text-muted-foreground">
                Anyone with the link can submit responses
              </div>
            </Label>
            <Switch id="public" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="multiple" className="flex-1">
              <div className="font-medium">Multiple Submissions</div>
              <div className="text-sm text-muted-foreground">
                Allow users to submit more than once
              </div>
            </Label>
            <Switch id="multiple" />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="notify" className="flex-1">
              <div className="font-medium">Email Notifications</div>
              <div className="text-sm text-muted-foreground">Get notified when someone submits</div>
            </Label>
            <Switch id="notify" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="captcha" className="flex-1">
              <div className="font-medium">reCAPTCHA</div>
              <div className="text-sm text-muted-foreground">Protect against spam submissions</div>
            </Label>
            <Switch id="captcha" />
          </div>
        </div>
      </div>

      <div className="rounded-lg border p-6">
        <h3 className="mb-4 text-lg font-semibold">Advanced Features</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="partial" className="flex-1">
              <div className="font-medium">Save Partial Submissions</div>
              <div className="text-sm text-muted-foreground">
                Save progress even if not completed
              </div>
            </Label>
            <Switch id="partial" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="webhook" className="flex-1">
              <div className="font-medium">Webhook Integration</div>
              <div className="text-sm text-muted-foreground">Send data to external services</div>
            </Label>
            <Switch id="webhook" />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="analytics" className="flex-1">
              <div className="font-medium">Advanced Analytics</div>
              <div className="text-sm text-muted-foreground">Track detailed form interactions</div>
            </Label>
            <Switch id="analytics" defaultChecked />
          </div>
        </div>
      </div>
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="flex flex-wrap gap-6">
      <div className="space-y-2">
        <Label>Off</Label>
        <Switch />
      </div>
      <div className="space-y-2">
        <Label>On</Label>
        <Switch checked />
      </div>
      <div className="space-y-2">
        <Label>Disabled Off</Label>
        <Switch disabled />
      </div>
      <div className="space-y-2">
        <Label>Disabled On</Label>
        <Switch disabled checked />
      </div>
    </div>
  ),
};

export const ColoredExamples: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Switch id="default" defaultChecked />
        <Label htmlFor="default">Default Primary Color</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Switch id="success" defaultChecked className="data-[state=checked]:bg-green-500" />
        <Label htmlFor="success">Success State</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Switch id="warning" defaultChecked className="data-[state=checked]:bg-yellow-500" />
        <Label htmlFor="warning">Warning State</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Switch id="danger" defaultChecked className="data-[state=checked]:bg-red-500" />
        <Label htmlFor="danger">Danger State</Label>
      </div>
    </div>
  ),
};
