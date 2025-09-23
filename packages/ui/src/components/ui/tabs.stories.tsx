import type { Meta, StoryObj } from "@storybook/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { Badge } from "./badge";
import { Settings, User, CreditCard, Bell, Shield, HelpCircle } from "lucide-react";

const meta: Meta<typeof Tabs> = {
  title: "Components/Tabs",
  component: Tabs,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="account" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>
      <TabsContent value="account" className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Make changes to your account here. Click save when you're done.
        </p>
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" defaultValue="Pedro Duarte" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input id="username" defaultValue="@peduarte" />
        </div>
      </TabsContent>
      <TabsContent value="password" className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Change your password here. After saving, you'll be logged out.
        </p>
        <div className="space-y-2">
          <Label htmlFor="current">Current password</Label>
          <Input id="current" type="password" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new">New password</Label>
          <Input id="new" type="password" />
        </div>
      </TabsContent>
    </Tabs>
  ),
};

export const WithCards: Story = {
  render: () => (
    <Tabs defaultValue="account" className="w-[500px]">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>
              Make changes to your account here. Click save when you're done.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" defaultValue="Pedro Duarte" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" defaultValue="@peduarte" />
            </div>
            <Button>Save changes</Button>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="password">
        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>
              Change your password here. After saving, you'll be logged out.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current">Current password</Label>
              <Input id="current" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new">New password</Label>
              <Input id="new" type="password" />
            </div>
            <Button>Save password</Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  ),
};

export const FormBuilder: Story = {
  render: () => (
    <Tabs defaultValue="fields" className="w-[800px]">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="fields">Fields</TabsTrigger>
        <TabsTrigger value="logic">Logic</TabsTrigger>
        <TabsTrigger value="design">Design</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>

      <TabsContent value="fields" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Form Fields</CardTitle>
            <CardDescription>
              Add and configure form fields for your respondents to fill out.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <Button variant="outline" className="h-20 flex-col">
                <span className="text-sm font-medium">Short Text</span>
                <span className="text-xs text-muted-foreground">Single line input</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <span className="text-sm font-medium">Long Text</span>
                <span className="text-xs text-muted-foreground">Multi-line textarea</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <span className="text-sm font-medium">Email</span>
                <span className="text-xs text-muted-foreground">Email validation</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <span className="text-sm font-medium">Multiple Choice</span>
                <span className="text-xs text-muted-foreground">Radio buttons</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <span className="text-sm font-medium">Checkboxes</span>
                <span className="text-xs text-muted-foreground">Multiple selection</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <span className="text-sm font-medium">File Upload</span>
                <span className="text-xs text-muted-foreground">Document/image upload</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="logic" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Conditional Logic</CardTitle>
            <CardDescription>Show or hide fields based on previous responses.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Logic Rule #1</h4>
                  <Badge variant="secondary">Active</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Show "Additional Comments" field when "Satisfaction Rating" is less than 3
                </p>
              </div>
              <Button variant="outline">Add Logic Rule</Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="design" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Form Design</CardTitle>
            <CardDescription>Customize the appearance of your form.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Theme</Label>
                <div className="flex gap-2">
                  <div className="h-8 w-8 rounded-full bg-blue-500 cursor-pointer border-2 border-blue-600"></div>
                  <div className="h-8 w-8 rounded-full bg-green-500 cursor-pointer"></div>
                  <div className="h-8 w-8 rounded-full bg-purple-500 cursor-pointer"></div>
                  <div className="h-8 w-8 rounded-full bg-orange-500 cursor-pointer"></div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Layout</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm">
                    Single Page
                  </Button>
                  <Button variant="outline" size="sm">
                    Multi-step
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="settings" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Form Settings</CardTitle>
            <CardDescription>Configure form behavior and notifications.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Public Form</Label>
                <p className="text-sm text-muted-foreground">
                  Anyone with the link can submit responses
                </p>
              </div>
              <input type="checkbox" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Get notified when someone submits</p>
              </div>
              <input type="checkbox" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Save Partial Submissions</Label>
                <p className="text-sm text-muted-foreground">Save progress even if not completed</p>
              </div>
              <input type="checkbox" defaultChecked />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  ),
};

export const SettingsPanel: Story = {
  render: () => (
    <Tabs defaultValue="profile" className="w-[600px]">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="profile" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          Profile
        </TabsTrigger>
        <TabsTrigger value="billing" className="flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          Billing
        </TabsTrigger>
        <TabsTrigger value="notifications" className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Notifications
        </TabsTrigger>
        <TabsTrigger value="security" className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Security
        </TabsTrigger>
        <TabsTrigger value="advanced" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Advanced
        </TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your personal information and how others see you.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-full bg-muted"></div>
              <div>
                <Button variant="outline" size="sm">
                  Change Avatar
                </Button>
                <p className="text-xs text-muted-foreground mt-1">JPG, PNG or GIF. Max size 2MB.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input defaultValue="John" />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input defaultValue="Doe" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input defaultValue="john@example.com" />
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="billing" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Billing & Subscription</CardTitle>
            <CardDescription>Manage your subscription and payment methods.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Pro Plan</h4>
                  <p className="text-sm text-muted-foreground">$19/month</p>
                </div>
                <Badge>Current Plan</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="h-8 w-12 bg-blue-500 rounded"></div>
                <div className="flex-1">
                  <p className="font-medium">•••• •••• •••• 4242</p>
                  <p className="text-sm text-muted-foreground">Expires 12/24</p>
                </div>
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              </div>
            </div>
            <Button variant="outline">Upgrade Plan</Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="notifications" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>Choose how you want to be notified about activity.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Email notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                </div>
                <input type="checkbox" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Push notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications on your device
                  </p>
                </div>
                <input type="checkbox" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Marketing emails</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive emails about new features and tips
                  </p>
                </div>
                <input type="checkbox" />
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="security" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
            <CardDescription>Manage your account security and authentication.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Two-factor authentication</Label>
              <div className="flex items-center gap-3">
                <Badge variant="destructive">Disabled</Badge>
                <Button variant="outline" size="sm">
                  Enable 2FA
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Active sessions</Label>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Current session</p>
                    <p className="text-sm text-muted-foreground">Chrome on macOS</p>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>
              </div>
            </div>
            <Button variant="destructive" size="sm">
              Sign out all sessions
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="advanced" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Advanced Settings</CardTitle>
            <CardDescription>Advanced configuration and danger zone.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-medium mb-3">API Keys</h4>
              <div className="flex items-center gap-3">
                <Input value="sk_live_..." readOnly />
                <Button variant="outline" size="sm">
                  Regenerate
                </Button>
              </div>
            </div>
            <div className="border-t pt-6">
              <h4 className="font-medium text-destructive mb-3">Danger Zone</h4>
              <div className="space-y-3">
                <Button variant="destructive" size="sm">
                  Delete Account
                </Button>
                <p className="text-sm text-muted-foreground">
                  This action cannot be undone. All your data will be permanently deleted.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  ),
};

export const VerticalTabs: Story = {
  render: () => (
    <div className="w-[700px]">
      <Tabs defaultValue="overview" orientation="vertical" className="flex gap-6">
        <TabsList className="flex flex-col h-auto w-48 p-1">
          <TabsTrigger value="overview" className="w-full justify-start">
            Overview
          </TabsTrigger>
          <TabsTrigger value="analytics" className="w-full justify-start">
            Analytics
          </TabsTrigger>
          <TabsTrigger value="submissions" className="w-full justify-start">
            Submissions
          </TabsTrigger>
          <TabsTrigger value="integrations" className="w-full justify-start">
            Integrations
          </TabsTrigger>
        </TabsList>

        <div className="flex-1">
          <TabsContent value="overview" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Overview</CardTitle>
                <CardDescription>General form statistics and performance.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">1,234</div>
                    <div className="text-sm text-muted-foreground">Total Views</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">567</div>
                    <div className="text-sm text-muted-foreground">Submissions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">46%</div>
                    <div className="text-sm text-muted-foreground">Conversion Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Analytics</CardTitle>
                <CardDescription>Detailed analytics and insights.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Analytics dashboard would go here...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="submissions" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Submissions</CardTitle>
                <CardDescription>View and manage form submissions.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Submissions table would go here...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Integrations</CardTitle>
                <CardDescription>Connect with external services.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Integration options would go here...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  ),
};
