import { useState, useEffect } from "react";
import { getCurrentUser } from "aws-amplify/auth";
import { useAmplifyClient } from "@/lib/amplify-client-context";
import type { Schema } from "@/amplify/data/resource";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

export default function ReceivedFeedbackPage() {
  const client = useAmplifyClient();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Schema["Profile"]["type"]>();
  const [receivedFeedback, setReceivedFeedback] = useState<Array<Schema["Feedback"]["type"]>>([]);
  const [resumes, setResumes] = useState<Array<Schema["Resume"]["type"]>>([]);
  const [resumeFeedbacks, setResumeFeedbacks] = useState<Array<Schema["ResumeFeedback"]["type"]>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser().then(currentUser => setUser(currentUser)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user?.userId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const profileRes = await client.models.Profile.get({ id: user.userId });
        if (profileRes.data) {
          setProfile(profileRes.data);
          const [feedbackRes, resumesRes, resumeFeedbacksRes] = await Promise.all([
            profileRes.data.receivedFeedback(),
            profileRes.data.resumes(),
            client.models.ResumeFeedback.list()
          ]);
          setReceivedFeedback(feedbackRes.data);
          setResumes(resumesRes.data);
          setResumeFeedbacks(resumeFeedbacksRes.data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, client]);

  const applyFeedbackToResume = async (feedbackId: string, resumeId: string) => {
    try {
      await client.models.ResumeFeedback.create({ feedbackId, resumeId });
      const response = await client.models.ResumeFeedback.list();
      setResumeFeedbacks(response.data);
    } catch (error) {
      console.error("Error applying feedback:", error);
    }
  };

  const isFeedbackAppliedToResume = (feedbackId: string, resumeId: string) => {
    return resumeFeedbacks.some(
      rf => rf.feedbackId === feedbackId && rf.resumeId === resumeId
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg">Loading feedback...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
          <MessageSquare className="h-10 w-10" />
          Feedback Received
        </h1>
        <p className="text-muted-foreground mt-2">
          Review and apply feedback to your resumes
        </p>
      </div>

      {receivedFeedback.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">
              No feedback received yet. Share your profile link to collect feedback!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {receivedFeedback.map((feedback) => (
            <Card key={feedback.id}>
              <CardHeader>
                <CardTitle>Feedback</CardTitle>
                <CardDescription>
                  {new Date(feedback.createdAt || "").toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="whitespace-pre-wrap">{feedback.content}</div>

                {resumes.length > 0 && (
                  <>
                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-2">Apply to Resume</h3>
                      <div className="flex gap-2 flex-wrap">
                        {resumes.map((resume) => {
                          if (!feedback.id || !resume.id) return null;
                          const isApplied = isFeedbackAppliedToResume(feedback.id, resume.id);
                          return (
                            <Button
                              key={resume.id}
                              variant={isApplied ? "secondary" : "outline"}
                              onClick={() =>
                                !isApplied && applyFeedbackToResume(feedback.id!, resume.id!)
                              }
                              disabled={isApplied}
                            >
                              {isApplied ? "✓ " : ""}Apply to {resume.name}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
