import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SubscriptionGate } from './subscription-gate';
import { Users, MapPin, Sparkles, Loader2, Check } from 'lucide-react';
import type { Schema } from '@/amplify/data/resource';

interface ProjectDetailDialogProps {
  idea: Schema['Idea']['type'] | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSubscribed: boolean;
  userId?: string;
  email?: string;
  onJoin?: (ideaId: string) => Promise<void>;
  hasJoined?: boolean;
}

export function ProjectDetailDialog({
  idea,
  open,
  onOpenChange,
  isSubscribed,
  userId,
  email,
  onJoin,
  hasJoined,
}: ProjectDetailDialogProps) {
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(hasJoined);
  const [error, setError] = useState<string | null>(null);

  if (!idea) return null;

  const spotsLeft = (idea.maxParticipants || 0) - (idea.currentParticipants || 0);
  const isFull = spotsLeft <= 0;

  const handleJoin = async () => {
    if (!onJoin || !idea.id) return;

    setJoining(true);
    setError(null);

    try {
      await onJoin(idea.id);
      setJoined(true);
    } catch (err: any) {
      setError(err.message || 'Failed to join project');
    } finally {
      setJoining(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-start gap-2">
            <DialogTitle className="text-xl">{idea.title}</DialogTitle>
            {idea.isFeatured && (
              <Badge variant="secondary" className="shrink-0">
                <Sparkles className="h-3 w-3 mr-1" />
                Featured
              </Badge>
            )}
          </div>
          <DialogDescription className="flex items-center gap-3 pt-1">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {idea.currentParticipants || 0}/{idea.maxParticipants} members
            </span>
            {idea.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {idea.location}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <h4 className="font-medium mb-2">Description</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {idea.description}
            </p>
          </div>

          {idea.skillsNeeded && idea.skillsNeeded.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Skills Needed</h4>
              <div className="flex flex-wrap gap-1.5">
                {idea.skillsNeeded.map((skill, i) => (
                  <Badge key={i} variant="outline">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {idea.impactArea && (
            <div>
              <h4 className="font-medium mb-2">Impact Area</h4>
              <Badge variant="secondary">{idea.impactArea}</Badge>
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>

          {joined ? (
            <Button disabled>
              <Check className="h-4 w-4 mr-2" />
              Joined
            </Button>
          ) : isFull ? (
            <Button disabled>Project Full</Button>
          ) : (
            <SubscriptionGate
              isSubscribed={isSubscribed}
              userId={userId}
              email={email}
              action="join this project"
            >
              <Button onClick={handleJoin} disabled={joining}>
                {joining ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Join Project
              </Button>
            </SubscriptionGate>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
