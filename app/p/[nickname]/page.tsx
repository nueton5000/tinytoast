"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { getCurrentUser } from "aws-amplify/auth";
import { useAmplifyClient } from "@/lib/amplify-client-context";
import type { Schema } from "@/amplify/data/resource";
import { Loader2, ChevronDown, ChevronRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const client = useAmplifyClient();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<Schema["Profile"]["type"] | null>(null);
  const [profile, setProfile] = useState<Schema["Profile"]["type"] | null>(null);
  const [resumeContent, setResumeContent] = useState<string>("");
  const [appliedFeedback, setAppliedFeedback] = useState<Array<Schema["Feedback"]["type"]>>([]);
  const [expandedFeedback, setExpandedFeedback] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [currentUserLoaded, setCurrentUserLoaded] = useState(false);
  const loggedPageViewRef = useRef(false);

  useEffect(() => {
    getCurrentUser()
      .then(user => {
        setCurrentUser(user);
        if (user?.userId) {
          return client.models.Profile.get({ id: user.userId });
        }
        return null;
      })
      .then(response => {
        setCurrentUserProfile(response?.data || null);
        setCurrentUserLoaded(true);
      })
      .catch(() => {
        setCurrentUserProfile(null);
        setCurrentUserLoaded(true);
      });
  }, [client]);

  useEffect(() => {
    if (params?.nickname && currentUserLoaded) {
      loadProfile();
    }
  }, [params?.nickname, currentUserLoaded]);

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

        // Check if user is viewing their own profile
        const isOwnProfile = currentUserProfile?.id === profileData.id;

        // Log page view metric if not viewing own profile (only once)
        if (!isOwnProfile && profileData.id && !loggedPageViewRef.current) {
          loggedPageViewRef.current = true;
          try {
            await client.mutations.incrementProfileView({ profileId: profileData.id });
          } catch (error) {
            console.error("Error logging page view:", error);
          }
        }

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

          // Load applied feedback
          const resumeFeedbackResponse = await resume.feedbacks();
          const feedbackPromises = resumeFeedbackResponse.data.map(async (rf) => {
            const feedbackResponse = await rf.feedback();
            return feedbackResponse.data;
          });
          const feedbacks = (await Promise.all(feedbackPromises)).filter(Boolean) as Array<Schema["Feedback"]["type"]>;
          setAppliedFeedback(feedbacks);
        }
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
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
        <div className="text-center text-muted-foreground">Profile not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">

      <main className="flex-1 w-full">
        {resumeContent ? (
          <div className="flex gap-8 max-w-7xl mx-auto px-8 py-12">
            {/* Left sidebar - Applied Feedback */}
            {appliedFeedback.length > 0 && (
              <aside className="w-64 flex-shrink-0">
                <h2 className="text-sm font-semibold mb-4">Feedback</h2>
                <ul className="space-y-2">
                  {appliedFeedback.map((feedback) => {
                    const isExpanded = expandedFeedback.has(feedback.id);
                    const toggleExpanded = () => {
                      setExpandedFeedback(prev => {
                        const next = new Set(prev);
                        if (next.has(feedback.id)) {
                          next.delete(feedback.id);
                        } else {
                          next.add(feedback.id);
                        }
                        return next;
                      });

                      // Log feedback view metric when clicked
                      if (profile?.id && feedback.id && currentUserProfile?.id !== profile.id) {
                        client.mutations.incrementFeedbackView({
                          profileId: profile.id,
                          feedbackId: feedback.id
                        }).catch(error => console.error("Error logging feedback view:", error));
                      }
                    };

                    return (
                      <li key={feedback.id}>
                        <button
                          onClick={toggleExpanded}
                          className="w-full text-left text-sm p-3 rounded-lg border hover:bg-accent transition-colors"
                        >
                          <div className="flex items-start gap-2">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            ) : (
                              <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              {isExpanded && (
                                <div className="font-medium mb-2">{feedback.questionText}</div>
                              )}
                              <div className={`text-muted-foreground ${!isExpanded ? 'line-clamp-2' : ''}`}>
                                {feedback.content}
                              </div>
                            </div>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </aside>
            )}

            {/* Main content - Resume */}
            <article className="flex-1 min-w-0 prose prose-neutral dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground prose-a:text-foreground max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {resumeContent}
              </ReactMarkdown>
            </article>
          </div>
        ) : (
          <div className="flex items-center justify-center py-24">
            <div className="text-center text-muted-foreground">
              No published resume available
            </div>
          </div>
        )}
      </main>

      <footer className="border-t py-6 mt-12">
        <div className="max-w-7xl mx-auto px-8">
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
