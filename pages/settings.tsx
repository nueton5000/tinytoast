import { useState, useEffect } from "react";
import { getCurrentUser } from "aws-amplify/auth";
import { useAmplifyClient } from "@/lib/amplify-client-context";
import type { Schema } from "@/amplify/data/resource";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ShareProfileLink } from "@/components/profile/share-profile-link";
import { Settings, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const client = useAmplifyClient();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Schema["Profile"]["type"]>();
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    getCurrentUser().then(currentUser => setUser(currentUser)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user?.userId) return;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await client.models.Profile.get({ id: user.userId });
        if (response.data) {
          setProfile(response.data);
          setNickname(response.data.nickname || "");
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, client]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nickname.trim()) {
      setError("Nickname cannot be empty");
      return;
    }

    if (!profile?.id) return;

    setError("");
    setSuccess("");
    setSaving(true);

    try {
      // Check if nickname is already taken by another user
      const existingProfiles = await client.models.Profile.listProfileByNickname({
        nickname: nickname.trim()
      });

      if (existingProfiles.data && existingProfiles.data.length > 0) {
        const otherProfile = existingProfiles.data.find(p => p.id !== profile.id);
        if (otherProfile) {
          setError("This nickname is already taken. Please choose another one.");
          setSaving(false);
          return;
        }
      }

      await client.models.Profile.update({
        id: profile.id,
        nickname: nickname.trim(),
      });

      setSuccess("Profile updated successfully!");

      // Refresh profile
      const response = await client.models.Profile.get({ id: profile.id });
      if (response.data) {
        setProfile(response.data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-lg text-muted-foreground">Loading settings...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center text-destructive">Profile not found</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
          <Settings className="h-10 w-10" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your profile and preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your display name and profile details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nickname">Nickname</Label>
                <Input
                  id="nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Enter your nickname"
                />
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  {error}
                </div>
              )}

              {success && (
                <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
                  {success}
                </div>
              )}

              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Public Profile Link */}
        <ShareProfileLink nickname={profile.nickname} />

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              Your account details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">User ID</span>
              <span className="text-sm font-mono">{profile.userId}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-sm text-muted-foreground">Profile Created</span>
              <span className="text-sm">
                {new Date(profile.createdAt || "").toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
