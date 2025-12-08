import { useState, useEffect } from "react";
import Link from "next/link";
import { getCurrentUser } from "aws-amplify/auth";
import { useAmplifyClient } from "@/lib/amplify-client-context";
import type { Schema } from "@/amplify/data/resource";
import { ProfileSetup } from "@/components/profile/profile-setup";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Edit, Loader2, Copy, Check } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

export default function DashboardPage() {
  const client = useAmplifyClient();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Schema["Profile"]["type"]>();
  const [resume, setResume] = useState<Schema["Resume"]["type"] | null>(null);
  const [versions, setVersions] = useState<Array<Schema["ResumeVersion"]["type"]>>([]);
  const [publishedVersion, setPublishedVersion] = useState<Schema["ResumeVersion"]["type"] | null>(null);
  const [receivedFeedback, setReceivedFeedback] = useState<Array<Schema["Feedback"]["type"]>>([]);
  const [profileLoading, setProfileLoading] = useState(true);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [copied, setCopied] = useState(false);
  const [profileViewMetrics, setProfileViewMetrics] = useState<Array<Schema["ProfileDailyViewMetric"]["type"]>>([]);
  const [feedbackViewMetrics, setFeedbackViewMetrics] = useState<Array<Schema["FeedbackTotalViewMetric"]["type"]>>([]);

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
        // Load resume
        const resumeRes = await profile.resume();
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
      } catch (error) {
        console.error("Error fetching resume:", error);
      }

      try {
        // Load feedback
        const receivedRes = await profile.receivedFeedback();
        console.log("Received feedback response:", receivedRes);
        console.log("Received feedback data:", receivedRes.data);
        console.log("Profile ID:", profile.id);
        setReceivedFeedback(receivedRes.data);
      } catch (error) {
        console.error("Error fetching feedback:", error);
      }

      try {
        // Load profile view metrics
        const profileViewsRes = await client.models.ProfileDailyViewMetric.list({
          filter: { profileId: { eq: profile.id } }
        });
        setProfileViewMetrics(profileViewsRes.data);
      } catch (error) {
        console.error("Error fetching profile view metrics:", error);
      }

      try {
        // Load feedback view metrics
        const feedbackViewsRes = await client.models.FeedbackTotalViewMetric.list({
          filter: { profileId: { eq: profile.id } }
        });
        setFeedbackViewMetrics(feedbackViewsRes.data);
      } catch (error) {
        console.error("Error fetching feedback view metrics:", error);
      }
    };

    fetchData();
  }, [profile, client]);

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

  const copyFeedbackLink = async () => {
    if (!profile?.nickname) return;
    const profileUrl = `${window.location.origin}/p/${profile.nickname}/feedback`;
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
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

  // Chart configurations
  const viewsChartConfig = {
    views: {
      label: "Views",
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig;

  const clicksChartConfig = {
    clicks: {
      label: "Clicks",
      color: "hsl(var(--chart-2))",
    },
  } satisfies ChartConfig;

  // Process profile view metrics for the last 7 days
  const resumeViewsData = (() => {
    const last7Days = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

      const metric = profileViewMetrics.find(m => m.date === dateStr);
      last7Days.push({
        date: dayName,
        views: metric?.viewCount || 0
      });
    }

    return last7Days;
  })();

  // Process feedback view metrics to show clicks by feedback
  const feedbackClicksData = feedbackViewMetrics
    .filter(metric => metric.feedbackId)
    .map(metric => {
      const feedback = receivedFeedback.find(f => f.id === metric.feedbackId);
      return {
        profile: feedback?.fromProfileId?.substring(0, 8) || metric.feedbackId?.substring(0, 8) || "Unknown",
        clicks: metric.viewCount
      };
    })
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10); // Show top 10

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">
          Dashboard
        </h1>
        {profile?.nickname && (
          <div className="flex items-center gap-2">
            <code className="text-sm text-muted-foreground px-3 py-1.5 bg-muted rounded-md">
              {window.location.origin}/p/{profile.nickname}/feedback
            </code>
            <Button
              onClick={copyFeedbackLink}
              variant="outline"
              size="sm"
              className="shrink-0"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2 text-green-600" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Resume Views
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <ChartContainer config={viewsChartConfig} className="h-[200px] w-full">
              <LineChart data={resumeViewsData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  dataKey="views"
                  type="monotone"
                  stroke="var(--color-views)"
                  strokeWidth={2}
                  dot={{ fill: "var(--color-views)", r: 4 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Feedback Clicks
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            {feedbackClicksData.length > 0 ? (
              <ChartContainer config={clicksChartConfig} className="h-[200px] w-full">
                <BarChart data={feedbackClicksData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="profile"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="clicks" fill="var(--color-clicks)" radius={4} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
                No feedback clicks yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Resume */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Resume</CardTitle>
        </CardHeader>
        <CardContent>
          {resume && publishedVersion ? (
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-medium mb-1">{resume.name}</h3>
                <p className="text-sm text-muted-foreground">
                  Version {publishedVersion.version}
                </p>
              </div>
              <Link href="/resumes/edit">
                <Button variant="outline" size="sm">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </Link>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground text-sm mb-4">
                No resume published yet
              </p>
              <Link href="/resumes/edit">
                <Button size="sm">
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
        </CardHeader>
        <CardContent>
          {receivedFeedback.length > 0 ? (
            <div className="space-y-3">
              {receivedFeedback.slice(0, 5).map(feedback => (
                <div
                  key={feedback.id}
                  className="border-b pb-3 last:border-0 last:pb-0"
                >
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {feedback.questionText}
                  </p>
                  <p className="text-sm">{feedback.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              No feedback received yet. Share your profile link to start collecting feedback!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
