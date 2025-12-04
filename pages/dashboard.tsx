import { useState, useEffect } from "react";
import Link from "next/link";
import { getCurrentUser } from "aws-amplify/auth";
import { useAmplifyClient } from "@/lib/amplify-client-context";
import type { Schema } from "@/amplify/data/resource";
import { ProfileSetup } from "@/components/profile/profile-setup";
import { ShareProfileLink } from "@/components/profile/share-profile-link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, MessageSquare, Send, Edit, Loader2 } from "lucide-react";

export default function DashboardPage() {
  const client = useAmplifyClient();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Schema["Profile"]["type"]>();
  const [resume, setResume] = useState<Schema["Resume"]["type"] | null>(null);
  const [versions, setVersions] = useState<Array<Schema["ResumeVersion"]["type"]>>([]);
  const [publishedVersion, setPublishedVersion] = useState<Schema["ResumeVersion"]["type"] | null>(null);
  const [receivedFeedback, setReceivedFeedback] = useState<Array<Schema["Feedback"]["type"]>>([]);
  const [givenFeedback, setGivenFeedback] = useState<Array<Schema["Feedback"]["type"]>>([]);
  const [profileLoading, setProfileLoading] = useState(true);
  const [showProfileSetup, setShowProfileSetup] = useState(false);

  useEffect(() => {
    getCurrentUser().then(currentUser => setUser(currentUser)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user?.userId) return;

    const fetchProfile = async () => {
      try {
        setProfileLoading(true);
        const response = await client.models.Profile.get({ id: user.userId });
        if (response.data) {
          setProfile(response.data);
          setShowProfileSetup(false);
        } else {
          setShowProfileSetup(true);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        setShowProfileSetup(true);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, [user, client]);

  useEffect(() => {
    if (!profile) return;

    const fetchData = async () => {
      try {
        const [resumeRes, receivedRes, providedRes] = await Promise.all([
          profile.resume(),
          profile.receivedFeedback(),
          profile.providedFeedback(),
        ]);

        const resumeData = resumeRes.data;
        setResume(resumeData);

        if (resumeData) {
          // Load versions
          const versionsRes = await resumeData.versions();
          const allVersions = versionsRes.data.sort((a, b) => (b.version || 0) - (a.version || 0));
          setVersions(allVersions);

          // Find published version
          const published = allVersions.find(v => v.isPublished);
          setPublishedVersion(published || null);
        }

        setReceivedFeedback(receivedRes.data);
        setGivenFeedback(providedRes.data);
      } catch (error) {
        console.error("Error fetching profile data:", error);
      }
    };

    fetchData();
  }, [profile]);

  const handleProfileSetupComplete = () => {
    if (user?.userId) {
      client.models.Profile.get({ id: user.userId })
        .then(response => {
          if (response.data) {
            setProfile(response.data);
            setShowProfileSetup(false);
          }
        });
    }
  };

  if (user && showProfileSetup && !profileLoading) {
    return <ProfileSetup userId={user.userId} onComplete={handleProfileSetupComplete} />;
  }

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-lg text-muted-foreground">Loading your profile...</div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">
          Welcome back, {profile.nickname}!
        </h1>
        <p className="text-muted-foreground mt-2">
          Here's an overview of your resumes and feedback.
        </p>
      </div>

      {/* Share Profile Link */}
      <div className="mb-8">
        <ShareProfileLink nickname={profile.nickname} />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Resume Versions
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{versions.length}</div>
            {publishedVersion && (
              <p className="text-xs text-muted-foreground mt-1">
                v{publishedVersion.version} published
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Feedback Received
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{receivedFeedback.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Feedback Given
            </CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{givenFeedback.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Resume Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Your Resume</CardTitle>
          <CardDescription>
            {resume ? `${resume.name} - ${versions.length} version${versions.length !== 1 ? 's' : ''}` : 'No resume yet'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {resume ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{resume.name}</h3>
                    {publishedVersion && (
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                        v{publishedVersion.version} Published
                      </span>
                    )}
                  </div>
                  {publishedVersion?.content && (
                    <p className="text-sm text-muted-foreground">
                      {publishedVersion.content.substring(0, 150)}...
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Link href="/resumes/edit">
                    <Button variant="default" size="sm">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Resume
                    </Button>
                  </Link>
                </div>
              </div>

              {versions.length > 1 && (
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-2">Recent Versions</h4>
                  <div className="space-y-2">
                    {versions.slice(0, 3).map(version => (
                      <div key={version.id} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Version {version.version}
                          {version.isPublished && ' (Published)'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {version.updatedAt && new Date(version.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground text-sm mb-4">
                No resume yet. Create your first resume to get started!
              </p>
              <Link href="/resumes/edit">
                <Button>
                  <FileText className="mr-2 h-4 w-4" />
                  Create Resume
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Feedback */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Feedback</CardTitle>
          <CardDescription>Latest feedback you've received</CardDescription>
        </CardHeader>
        <CardContent>
          {receivedFeedback.length > 0 ? (
            <div className="space-y-4">
              {receivedFeedback.slice(0, 3).map(feedback => (
                <div
                  key={feedback.id}
                  className="border-b pb-4 last:border-0 last:pb-0"
                >
                  <p className="text-sm">{feedback.content?.substring(0, 200)}...</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              No feedback received yet. Share your profile link to collect feedback!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
