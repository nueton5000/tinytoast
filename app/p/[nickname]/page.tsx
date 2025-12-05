"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAmplifyClient } from "@/lib/amplify-client-context";
import type { Schema } from "@/amplify/data/resource";
import { Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const client = useAmplifyClient();

  const [profile, setProfile] = useState<Schema["Profile"]["type"] | null>(null);
  const [resumeContent, setResumeContent] = useState<string>("");
  const [appliedFeedback, setAppliedFeedback] = useState<Array<Schema["Feedback"]["type"]>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params?.nickname) {
      loadProfile();
    }
  }, [params?.nickname]);

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
                <div className="space-y-3">
                  {appliedFeedback.map((feedback) => (
                    <div key={feedback.id} className="text-sm">
                      <div className="font-medium mb-1">{feedback.questionText}</div>
                      <div className="text-muted-foreground line-clamp-3">{feedback.content}</div>
                    </div>
                  ))}
                </div>
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
