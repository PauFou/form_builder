import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Checkbox } from "./checkbox";
import { Label } from "./label";

const meta: Meta<typeof Checkbox> = {
  title: "Components/Checkbox",
  component: Checkbox,
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
      <Checkbox id="terms" />
      <Label
        htmlFor="terms"
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        Accept terms and conditions
      </Label>
    </div>
  ),
};

export const FormExample: Story = {
  render: () => (
    <form className="space-y-3">
      <div className="flex items-center space-x-2">
        <Checkbox id="terms1" required />
        <Label
          htmlFor="terms1"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          I agree to the terms and conditions
        </Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="marketing" />
        <Label
          htmlFor="marketing"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Send me marketing emails
        </Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="data" defaultChecked />
        <Label
          htmlFor="data"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Share my data with third parties
        </Label>
      </div>
    </form>
  ),
};

export const MultipleSelection: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h3 className="mb-3 text-lg font-medium">Select your interests</h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox id="design" />
            <Label htmlFor="design">Design</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="development" defaultChecked />
            <Label htmlFor="development">Development</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="marketing-field" />
            <Label htmlFor="marketing-field">Marketing</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="sales" />
            <Label htmlFor="sales">Sales</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="support" defaultChecked />
            <Label htmlFor="support">Customer Support</Label>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const IndeterminateExample: Story = {
  render: () => {
    const [checkedItems, setCheckedItems] = React.useState({
      option1: false,
      option2: true,
      option3: false,
    });

    const allChecked = Object.values(checkedItems).every(Boolean);
    const isIndeterminate = Object.values(checkedItems).some(Boolean) && !allChecked;

    return (
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="all"
            checked={allChecked ? true : isIndeterminate ? "indeterminate" : false}
            onCheckedChange={(checked) => {
              setCheckedItems({
                option1: checked === true,
                option2: checked === true,
                option3: checked === true,
              });
            }}
          />
          <Label htmlFor="all" className="font-medium">
            Select All
          </Label>
        </div>
        <div className="ml-6 space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="option1"
              checked={checkedItems.option1}
              onCheckedChange={(checked) =>
                setCheckedItems((prev) => ({ ...prev, option1: checked === true }))
              }
            />
            <Label htmlFor="option1">Option 1</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="option2"
              checked={checkedItems.option2}
              onCheckedChange={(checked) =>
                setCheckedItems((prev) => ({ ...prev, option2: checked === true }))
              }
            />
            <Label htmlFor="option2">Option 2</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="option3"
              checked={checkedItems.option3}
              onCheckedChange={(checked) =>
                setCheckedItems((prev) => ({ ...prev, option3: checked === true }))
              }
            />
            <Label htmlFor="option3">Option 3</Label>
          </div>
        </div>
      </div>
    );
  },
};

export const RealWorldExamples: Story = {
  render: () => (
    <div className="space-y-6 w-full max-w-md">
      <div>
        <h3 className="mb-3 text-lg font-semibold">Form Permissions</h3>
        <div className="space-y-2">
          <div className="rounded-lg border p-3">
            <div className="flex items-center space-x-2">
              <Checkbox id="view" defaultChecked />
              <Label htmlFor="view" className="flex-1 cursor-pointer">
                <div className="font-medium">View submissions</div>
                <div className="text-sm text-muted-foreground">
                  Can view all form submissions and analytics
                </div>
              </Label>
            </div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="flex items-center space-x-2">
              <Checkbox id="edit" defaultChecked />
              <Label htmlFor="edit" className="flex-1 cursor-pointer">
                <div className="font-medium">Edit form</div>
                <div className="text-sm text-muted-foreground">
                  Can modify form fields and settings
                </div>
              </Label>
            </div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="flex items-center space-x-2">
              <Checkbox id="delete" />
              <Label htmlFor="delete" className="flex-1 cursor-pointer">
                <div className="font-medium">Delete submissions</div>
                <div className="text-sm text-muted-foreground">
                  Can permanently delete form submissions
                </div>
              </Label>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-lg font-semibold">Export Options</h3>
        <div className="space-y-2 rounded-lg border p-4">
          <div className="mb-3 text-sm text-muted-foreground">
            Select the data you want to include in your export
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox id="responses" defaultChecked />
              <Label htmlFor="responses">Form responses</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="metadata" defaultChecked />
              <Label htmlFor="metadata">Submission metadata</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="partial" />
              <Label htmlFor="partial">Partial submissions</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="analytics" />
              <Label htmlFor="analytics">Analytics data</Label>
            </div>
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
        <Label>Normal</Label>
        <Checkbox />
      </div>
      <div className="space-y-2">
        <Label>Checked</Label>
        <Checkbox checked />
      </div>
      <div className="space-y-2">
        <Label>Disabled</Label>
        <Checkbox disabled />
      </div>
      <div className="space-y-2">
        <Label>Disabled Checked</Label>
        <Checkbox disabled checked />
      </div>
    </div>
  ),
};
