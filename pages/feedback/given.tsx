import { useState, useEffect } from "react";
import { getCurrentUser } from "aws-amplify/auth";
import { useAmplifyClient } from "@/lib/amplify-client-context";
import type { Schema } from "@/amplify/data/resource";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Send, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function GivenFeedbackPage() {
  const client = useAmplifyClient();
  const [user, setUser] = useState<any>(null);
  const [givenFeedback, setGivenFeedback] = useState<Array<Schema["Feedback"]["type"]>>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
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
        if (profileRes.data) {
          const feedbackRes = await profileRes.data.providedFeedback();
          setGivenFeedback(feedbackRes.data);

          // Load profiles for feedback recipients
          const profileMap = new Map<string, string>();
          for (const feedback of feedbackRes.data) {
            if (feedback.toProfileId) {
              try {
                const profileRes = await client.models.Profile.get({ id: feedback.toProfileId });
                if (profileRes.data?.nickname) {
                  profileMap.set(feedback.toProfileId, profileRes.data.nickname);
                }
              } catch (err) {
                console.error("Error loading profile for feedback:", err);
              }
            }
          }
          setFeedbackProfiles(profileMap);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, client]);

  const deleteFeedback = async (feedbackId: string) => {
    try {
      setDeleting(feedbackId);
      await client.models.Feedback.delete({ id: feedbackId });
      setGivenFeedback(prev => prev.filter(f => f.id !== feedbackId));
    } catch (error) {
      console.error("Error deleting feedback:", error);
    } finally {
      setDeleting(null);
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
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Question</TableHead>
                  <TableHead>Response</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {givenFeedback.map((feedback) => (
                  <TableRow key={feedback.id}>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(feedback.createdAt || "").toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-sm">
                      {feedback.toProfileId ? feedbackProfiles.get(feedback.toProfileId) || "Unknown" : "Unknown"}
                    </TableCell>
                    <TableCell className="font-medium max-w-xs">
                      {feedback.questionText}
                    </TableCell>
                    <TableCell className="max-w-md">
                      <div className="line-clamp-3">{feedback.content}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => feedback.id && deleteFeedback(feedback.id)}
                        disabled={deleting === feedback.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
