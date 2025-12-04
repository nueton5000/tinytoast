import { useState, useEffect } from "react";
import { getCurrentUser } from "aws-amplify/auth";
import { useAmplifyClient } from "@/lib/amplify-client-context";
import type { Schema } from "@/amplify/data/resource";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Send } from "lucide-react";

export default function GivenFeedbackPage() {
  const client = useAmplifyClient();
  const [user, setUser] = useState<any>(null);
  const [givenFeedback, setGivenFeedback] = useState<Array<Schema["Feedback"]["type"]>>([]);
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
          const feedbackRes = await profileRes.data.providedFeedback();
          setGivenFeedback(feedbackRes.data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, client]);

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
          <Send className="h-10 w-10" />
          Feedback Given
        </h1>
        <p className="text-muted-foreground mt-2">
          Review feedback you've provided to others
        </p>
      </div>

      {givenFeedback.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">
              You haven't provided any feedback yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {givenFeedback.map((feedback) => (
            <Card key={feedback.id}>
              <CardHeader>
                <CardTitle>Feedback</CardTitle>
                <CardDescription>
                  To: Profile {feedback.toProfileId} •{" "}
                  {new Date(feedback.createdAt || "").toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap">{feedback.content}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
