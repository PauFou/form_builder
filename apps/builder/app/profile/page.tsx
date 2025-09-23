"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import {
  User,
  Mail,
  Phone,
  Globe,
  Shield,
  Key,
  Bell,
  Download,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  Copy,
  Monitor,
  Smartphone,
  MapPin,
  Clock,
  Camera,
  Edit3,
  Save,
  X,
  AlertTriangle,
  CheckCircle,
  Smartphone as SmartphoneIcon,
} from "lucide-react";
import {
  Button,
  Input,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Label,
  Separator,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Alert,
  AlertDescription,
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@skemya/ui";

import { profileApi, MOCK_PROFILE, MOCK_SESSIONS, MOCK_API_TOKENS } from "../../lib/api/profile";
import { TIMEZONES, LANGUAGES, API_PERMISSIONS } from "../../lib/types/profile";
import type { UserProfile, CreateApiTokenRequest } from "../../lib/types/profile";
import { cn } from "../../lib/utils";

function ProfileInfo({ profile }: { profile: UserProfile }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: profile.first_name,
    last_name: profile.last_name,
    phone: profile.phone || "",
    timezone: profile.timezone,
    language: profile.language,
  });

  const handleSave = async () => {
    try {
      await profileApi.updateProfile(formData);
      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await profileApi.uploadAvatar(file);
      toast.success("Avatar updated successfully");
    } catch (error) {
      toast.error("Failed to upload avatar");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Profile Information
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
        >
          {isEditing ? (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save
            </>
          ) : (
            <>
              <Edit3 className="h-4 w-4 mr-2" />
              Edit
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar Section */}
        <div className="flex items-center gap-6">
          <div className="relative">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile.avatar_url} alt={profile.first_name} />
              <AvatarFallback className="text-lg">
                {profile.first_name?.[0]}
                {profile.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            {isEditing && (
              <label className="absolute -bottom-2 -right-2 bg-primary text-white rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors">
                <Camera className="h-4 w-4" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </label>
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold">
              {profile.first_name} {profile.last_name}
            </h3>
            <p className="text-muted-foreground">{profile.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={profile.email_verified ? "default" : "secondary"}>
                {profile.email_verified ? (
                  <CheckCircle className="h-3 w-3 mr-1" />
                ) : (
                  <AlertTriangle className="h-3 w-3 mr-1" />
                )}
                {profile.email_verified ? "Verified" : "Unverified"}
              </Badge>
              {profile.two_factor_enabled && (
                <Badge className="bg-green-100 text-green-800">
                  <Shield className="h-3 w-3 mr-1" />
                  2FA Enabled
                </Badge>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="first_name">First Name</Label>
            <Input
              id="first_name"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="last_name">Last Name</Label>
            <Input
              id="last_name"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" value={profile.email} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">
              Email cannot be changed. Contact support if needed.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              disabled={!isEditing}
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select
              value={formData.timezone}
              onValueChange={(value) => setFormData({ ...formData, timezone: value })}
              disabled={!isEditing}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <Select
              value={formData.language}
              onValueChange={(value) => setFormData({ ...formData, language: value })}
              disabled={!isEditing}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isEditing && (
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditing(false);
                setFormData({
                  first_name: profile.first_name,
                  last_name: profile.last_name,
                  phone: profile.phone || "",
                  timezone: profile.timezone,
                  language: profile.language,
                });
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SecuritySettings({ profile }: { profile: UserProfile }) {
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const handleChangePassword = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error("Passwords don't match");
      return;
    }

    try {
      await profileApi.changePassword(passwordData);
      toast.success("Password changed successfully");
      setShowChangePassword(false);
      setPasswordData({ current_password: "", new_password: "", confirm_password: "" });
    } catch (error) {
      toast.error("Failed to change password");
    }
  };

  const handleToggle2FA = async () => {
    if (profile.two_factor_enabled) {
      // Disable 2FA - would need password confirmation
      toast("2FA disable feature coming soon");
    } else {
      // Enable 2FA - would show QR code setup
      toast("2FA setup feature coming soon");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Security Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Password Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Password</h4>
              <p className="text-sm text-muted-foreground">
                Last changed on {format(new Date(profile.updated_at), "MMM d, yyyy")}
              </p>
            </div>
            <Button variant="outline" onClick={() => setShowChangePassword(!showChangePassword)}>
              Change Password
            </Button>
          </div>

          {showChangePassword && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="space-y-4 p-4 border rounded-lg"
            >
              <div className="space-y-2">
                <Label htmlFor="current_password">Current Password</Label>
                <Input
                  id="current_password"
                  type="password"
                  value={passwordData.current_password}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, current_password: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new_password">New Password</Label>
                <Input
                  id="new_password"
                  type="password"
                  value={passwordData.new_password}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, new_password: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirm New Password</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  value={passwordData.confirm_password}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, confirm_password: e.target.value })
                  }
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowChangePassword(false)}>
                  Cancel
                </Button>
                <Button onClick={handleChangePassword}>Update Password</Button>
              </div>
            </motion.div>
          )}
        </div>

        <Separator />

        {/* Two-Factor Authentication */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">Two-Factor Authentication</h4>
            <p className="text-sm text-muted-foreground">
              Add an extra layer of security to your account
            </p>
          </div>
          <Switch checked={profile.two_factor_enabled} onCheckedChange={handleToggle2FA} />
        </div>

        <Separator />

        {/* Email Verification */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">Email Verification</h4>
            <p className="text-sm text-muted-foreground">
              {profile.email_verified
                ? "Your email address is verified"
                : "Please verify your email address"}
            </p>
          </div>
          {!profile.email_verified && (
            <Button variant="outline" size="sm">
              Resend Verification
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ActiveSessions() {
  const { data: sessions = MOCK_SESSIONS } = useQuery({
    queryKey: ["sessions"],
    queryFn: profileApi.getSessions,
  });

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await profileApi.revokeSession(sessionId);
      toast.success("Session revoked successfully");
    } catch (error) {
      toast.error("Failed to revoke session");
    }
  };

  const handleRevokeAllSessions = async () => {
    try {
      await profileApi.revokeAllSessions();
      toast.success("All sessions revoked successfully");
    } catch (error) {
      toast.error("Failed to revoke sessions");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Monitor className="h-5 w-5" />
          Active Sessions
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRevokeAllSessions}
          className="text-destructive hover:text-destructive"
        >
          Revoke All
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={cn(
                "flex items-center justify-between p-4 rounded-lg border",
                session.is_current && "border-primary/50 bg-primary/5"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  {session.device.includes("iPhone") || session.device.includes("Android") ? (
                    <SmartphoneIcon className="h-4 w-4" />
                  ) : (
                    <Monitor className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{session.device}</p>
                    {session.is_current && (
                      <Badge variant="default" className="text-xs">
                        Current
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {session.browser} • {session.location}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Last active:{" "}
                    {format(new Date(session.last_activity), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </div>

              {!session.is_current && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRevokeSession(session.id)}
                  className="text-destructive hover:text-destructive"
                >
                  Revoke
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ApiTokens() {
  const { data: tokens = MOCK_API_TOKENS } = useQuery({
    queryKey: ["api-tokens"],
    queryFn: profileApi.getApiTokens,
  });

  const [showCreateToken, setShowCreateToken] = useState(false);
  const [tokenData, setTokenData] = useState<CreateApiTokenRequest>({
    name: "",
    permissions: [],
  });

  const handleCreateToken = async () => {
    try {
      const result = await profileApi.createApiToken(tokenData);
      toast.success("API token created successfully");
      // Show token in a secure way (copy to clipboard, show once, etc.)
      setShowCreateToken(false);
      setTokenData({ name: "", permissions: [] });
    } catch (error) {
      toast.error("Failed to create API token");
    }
  };

  const handleRevokeToken = async (tokenId: string) => {
    try {
      await profileApi.revokeApiToken(tokenId);
      toast.success("API token revoked successfully");
    } catch (error) {
      toast.error("Failed to revoke API token");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          API Tokens
        </CardTitle>
        <Dialog open={showCreateToken} onOpenChange={setShowCreateToken}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Token
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create API Token</DialogTitle>
              <DialogDescription>
                Create a new API token for accessing the Skemya API
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token_name">Token Name</Label>
                <Input
                  id="token_name"
                  placeholder="e.g., Production API"
                  value={tokenData.name}
                  onChange={(e) => setTokenData({ ...tokenData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Permissions</Label>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                  {API_PERMISSIONS.map((permission) => (
                    <div key={permission.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={permission.id}
                        checked={tokenData.permissions.includes(permission.id)}
                        onChange={(e) => {
                          const newPermissions = e.target.checked
                            ? [...tokenData.permissions, permission.id]
                            : tokenData.permissions.filter((p) => p !== permission.id);
                          setTokenData({ ...tokenData, permissions: newPermissions });
                        }}
                        className="rounded"
                      />
                      <div>
                        <Label htmlFor={permission.id} className="text-sm font-medium">
                          {permission.name}
                        </Label>
                        <p className="text-xs text-muted-foreground">{permission.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateToken(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateToken}
                disabled={!tokenData.name || tokenData.permissions.length === 0}
              >
                Create Token
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tokens.map((token) => (
            <div key={token.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{token.name}</p>
                  <Badge variant={token.is_active ? "default" : "secondary"}>
                    {token.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground font-mono">{token.token_preview}</p>
                <p className="text-xs text-muted-foreground">
                  Created: {format(new Date(token.created_at), "MMM d, yyyy")} • Last used:{" "}
                  {format(new Date(token.last_used), "MMM d, yyyy")}
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {token.permissions.slice(0, 3).map((permission) => (
                    <Badge key={permission} variant="outline" className="text-xs">
                      {permission}
                    </Badge>
                  ))}
                  {token.permissions.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{token.permissions.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRevokeToken(token.id)}
                className="text-destructive hover:text-destructive"
              >
                Revoke
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProfilePage() {
  // Mock data for now - replace with real API call
  const { data: profile = MOCK_PROFILE, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: profileApi.getProfile,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="h-64 bg-muted rounded" />
          <div className="h-48 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="api">API Tokens</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <ProfileInfo profile={profile} />
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <SecuritySettings profile={profile} />
        </TabsContent>

        <TabsContent value="sessions" className="space-y-6">
          <ActiveSessions />
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <ApiTokens />
        </TabsContent>
      </Tabs>
    </div>
  );
}
