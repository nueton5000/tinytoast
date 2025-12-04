"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getCurrentUser } from "aws-amplify/auth";
import { useAmplifyClient } from "@/lib/amplify-client-context";
import type { Schema } from "@/amplify/data/resource";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

export default function ProfileFeedbackPage() {
  const params = useParams();
  const router = useRouter();
  const client = useAmplifyClient();

  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<Schema["Profile"]["type"] | null>(null);
  const [profile, setProfile] = useState<Schema["Profile"]["type"] | null>(null);
  const [resumeContent, setResumeContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [waitingForAI, setWaitingForAI] = useState(false);
  const [conversationComplete, setConversationComplete] = useState(false);

  useEffect(() => {
    getCurrentUser().then(currentUser => {
      setUser(currentUser);
      // Load the current user's profile
      if (currentUser?.userId) {
        client.models.Profile.get({ id: currentUser.userId })
          .then(res => setUserProfile(res.data || null))
          .catch(() => setUserProfile(null));
      }
    }).catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (params?.nickname) {
      loadProfile();
    }
  }, [params?.nickname]);

  useEffect(() => {
    if (profile?.id && user && messages.length === 0 && !waitingForAI) {
      getFirstQuestion();
    }
  }, [profile, user]);

  const loadProfile = async () => {
    if (!params?.nickname) return;

    try {
      setLoading(true);
      const response = await client.models.Profile.listProfileByNickname({
        nickname: params.nickname as string,
      });

      if (response.data && response.data.length > 0) {
        const profileData = response.data[0];
        setProfile(profileData);

        // Load the profile's resume
        const resumeResponse = await profileData.resume();
        const resume = resumeResponse.data;

        if (resume) {
          // Load all versions and find the published one
          const versionsResponse = await resume.versions();
          const publishedVersion = versionsResponse.data.find(v => v.isPublished);

          if (publishedVersion?.content) {
            setResumeContent(publishedVersion.content);
          }
        }
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const getFirstQuestion = async () => {
    if (!profile?.id) return;

    try {
      setWaitingForAI(true);

      const response = await client.generations.collectFeedback({
        resumeContent: resumeContent || "No resume published yet",
        conversationHistory: ""
      });

      if (response.data?.question) {
        setMessages([{ role: "assistant", content: response.data.question }]);
        if (response.data.isComplete) {
          setConversationComplete(true);
        }
      }
    } catch (err: any) {
      console.error("Error getting first question:", err);
      setError(err.message || "Failed to start feedback collection");
    } finally {
      setWaitingForAI(false);
    }
  };

  const handleSendMessage = async () => {
    if (!currentAnswer.trim()) return;

    const userMessage = currentAnswer.trim();
    const updatedMessages = [...messages, { role: "user" as const, content: userMessage }];
    setMessages(updatedMessages);
    setCurrentAnswer("");
    setWaitingForAI(true);

    try {
      // Build conversation history
      const history = updatedMessages
        .map(msg => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
        .join("\n\n");

      const response = await client.generations.collectFeedback({
        resumeContent: resumeContent || "No resume published yet",
        conversationHistory: history
      });

      if (response.data?.question) {
        const finalMessages = [...updatedMessages, { role: "assistant" as const, content: response.data.question }];
        setMessages(finalMessages);

        if (response.data.isComplete) {
          setConversationComplete(true);
        }
      }
    } catch (err: any) {
      console.error("Error sending message:", err);
      setError(err.message || "Failed to send message");
    } finally {
      setWaitingForAI(false);
    }
  };

  const handleSubmit = async () => {
    if (!profile?.id || !user?.userId) return;

    try {
      setSubmitting(true);

      // Create separate feedback records for each Q&A pair
      // Messages alternate: assistant (question), user (answer), assistant (question), user (answer)...
      const feedbackPromises = [];

      for (let i = 0; i < messages.length - 1; i += 2) {
        const question = messages[i]; // assistant message (question)
        const answer = messages[i + 1]; // user message (answer)

        if (question.role === "assistant" && answer?.role === "user") {
          feedbackPromises.push(
            client.models.Feedback.create({
              toProfileId: profile.id,
              fromProfileId: user.userId,
              questionText: question.content,
              content: answer.content,
            })
          );
        }
      }

      await Promise.all(feedbackPromises);
      setSubmitted(true);
    } catch (err: any) {
      console.error("Error submitting feedback:", err);
      setError(err.message || "Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-sm text-muted-foreground">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">Profile not found</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user && !loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <Card className="max-w-2xl w-full">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Sign in to give feedback</CardTitle>
            <CardDescription className="text-center">
              You need to be signed in to provide feedback to {profile.nickname}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-muted-foreground text-center">
              Signing in helps prevent spam and allows you to track the feedback you've given.
            </p>
            <Button onClick={() => router.push('/dashboard')} className="w-full">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <Card className="max-w-2xl w-full">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Thank you!</CardTitle>
            <CardDescription className="text-center">
              Your feedback has been sent to {profile.nickname}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              Your thoughtful feedback will help them improve and grow professionally.
            </p>
          </CardContent>
        </Card>

        <footer className="mt-12">
          <p className="text-xs text-muted-foreground text-center">
            Powered by{" "}
            <a
              href="https://tinytoast.app"
              className="hover:text-foreground transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              tiny toast
            </a>
          </p>
        </footer>
      </div>
    );
  }

  const currentQuestion = messages.length > 0 ? messages[messages.length - 1] : null;
  const previousMessages = messages.slice(0, -1);

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 max-w-3xl mx-auto w-full px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Share feedback for {profile.nickname}
          </h1>
          <p className="text-muted-foreground">
            Your honest feedback will help them grow professionally. All responses are valuable.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              {waitingForAI && !currentQuestion ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Starting conversation...</span>
                </div>
              ) : (
                currentQuestion?.content || "Loading..."
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentQuestion && !waitingForAI && (
              <div>
                <Textarea
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder="Share your thoughts..."
                  className="min-h-32"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.metaKey && currentAnswer.trim()) {
                      handleSendMessage();
                    }
                  }}
                />
              </div>
            )}

            {waitingForAI && currentQuestion && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}

            <div className="flex gap-3 justify-between">
              <div>
                {conversationComplete && (
                  <Button variant="outline" onClick={() => setConversationComplete(false)}>
                    Continue Conversation
                  </Button>
                )}
              </div>
              <div className="flex gap-3">
                {conversationComplete ? (
                  <Button onClick={handleSubmit} disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Feedback"
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleSendMessage}
                    disabled={!currentAnswer.trim() || waitingForAI}
                  >
                    Send
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {previousMessages.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium mb-3 text-muted-foreground">Conversation:</h3>
            <div className="space-y-3">
              {previousMessages.map((msg, idx) => (
                <div key={idx} className="text-sm">
                  <p className="font-medium text-muted-foreground mb-1">
                    {msg.role === "assistant" ? "Question" : "Your response"}:
                  </p>
                  <p className="text-foreground/80">{msg.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t py-6 mt-12">
        <div className="max-w-3xl mx-auto px-8">
          <p className="text-xs text-muted-foreground text-center">
            Powered by{" "}
            <a
              href="https://tinytoast.app"
              className="hover:text-foreground transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              tiny toast
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
