import { useState, useEffect } from "react";
import { getCurrentUser } from "aws-amplify/auth";
import { useAmplifyClient } from "@/lib/amplify-client-context";
import type { Schema } from "@/amplify/data/resource";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Trash2, CheckCircle2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function ReceivedFeedbackPage() {
  const client = useAmplifyClient();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Schema["Profile"]["type"]>();
  const [receivedFeedback, setReceivedFeedback] = useState<Array<Schema["Feedback"]["type"]>>([]);
  const [resumes, setResumes] = useState<Array<Schema["Resume"]["type"]>>([]);
  const [resumeFeedbacks, setResumeFeedbacks] = useState<Array<Schema["ResumeFeedback"]["type"]>>([]);
  const [loading, setLoading] = useState(true);
  const [discarding, setDiscarding] = useState<string | null>(null);
  const [applying, setApplying] = useState<string | null>(null);
  const [feedbackProfiles, setFeedbackProfiles] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    getCurrentUser().then(currentUser => setUser(currentUser)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user?.userId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const profileRes = await client.models.Profile.get({ id: user.userId });
        console.log("Profile:", profileRes.data);
        if (profileRes.data) {
          setProfile(profileRes.data);
          const feedbackRes = await profileRes.data.receivedFeedback();
          console.log("Received feedback response:", feedbackRes);
          console.log("Received feedback data:", feedbackRes.data);
          console.log("Feedback count:", feedbackRes.data.length);

          setReceivedFeedback(feedbackRes.data);

          // Load profiles for feedback providers
          const profileMap = new Map<string, string>();
          for (const feedback of feedbackRes.data) {
            if (feedback.fromProfileId) {
              try {
                const profileRes = await client.models.Profile.get({ id: feedback.fromProfileId });
                if (profileRes.data?.nickname) {
                  profileMap.set(feedback.fromProfileId, profileRes.data.nickname);
                }
              } catch (err) {
                console.error("Error loading profile for feedback:", err);
              }
            }
          }
          setFeedbackProfiles(profileMap);

          // Get the single resume (not resumes - Profile has hasOne relationship)
          const resumeRes = await profileRes.data.resume();
          console.log("Resume:", resumeRes.data);
          setResumes(resumeRes.data ? [resumeRes.data] : []);

          const resumeFeedbacksRes = await client.models.ResumeFeedback.list();
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
      setApplying(feedbackId);
      await client.models.ResumeFeedback.create({ feedbackId, resumeId });
      const response = await client.models.ResumeFeedback.list();
      setResumeFeedbacks(response.data);
    } catch (error) {
      console.error("Error applying feedback:", error);
    } finally {
      setApplying(null);
    }
  };

  const isFeedbackAppliedToResume = (feedbackId: string, resumeId: string) => {
    return resumeFeedbacks.some(
      rf => rf.feedbackId === feedbackId && rf.resumeId === resumeId
    );
  };

  const discardFeedback = async (feedbackId: string) => {
    try {
      setDiscarding(feedbackId);
      await client.models.Feedback.delete({ id: feedbackId });
      setReceivedFeedback(prev => prev.filter(f => f.id !== feedbackId));
    } catch (error) {
      console.error("Error discarding feedback:", error);
    } finally {
      setDiscarding(null);
    }
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
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>Question</TableHead>
                  <TableHead>Response</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receivedFeedback.map((feedback) => {
                  const resume = resumes[0];
                  const isApplied = feedback.id && resume?.id ? isFeedbackAppliedToResume(feedback.id, resume.id) : false;

                  return (
                    <TableRow key={feedback.id}>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(feedback.createdAt || "").toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm">
                        {feedback.fromProfileId ? feedbackProfiles.get(feedback.fromProfileId) || "Anonymous" : "Anonymous"}
                      </TableCell>
                      <TableCell className="font-medium max-w-xs">
                        {feedback.questionText}
                      </TableCell>
                      <TableCell className="max-w-md">
                        <div className="line-clamp-3">{feedback.content}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {resume && (
                            <Button
                              variant={isApplied ? "secondary" : "outline"}
                              size="sm"
                              onClick={() => !isApplied && feedback.id && resume.id && applyFeedbackToResume(feedback.id, resume.id)}
                              disabled={isApplied || applying === feedback.id}
                            >
                              {isApplied ? (
                                <>
                                  <CheckCircle2 className="h-4 w-4 mr-1" />
                                  Applied
                                </>
                              ) : (
                                "Apply to Resume"
                              )}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => feedback.id && discardFeedback(feedback.id)}
                            disabled={discarding === feedback.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
