import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Sparkles } from 'lucide-react';
import type { Schema } from '@/amplify/data/resource';

interface ProjectCardProps {
  idea: Schema['Idea']['type'];
  onClick?: () => void;
}

export function ProjectCard({ idea, onClick }: ProjectCardProps) {
  const spotsLeft = (idea.maxParticipants || 0) - (idea.currentParticipants || 0);

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg line-clamp-2">{idea.title}</CardTitle>
          {idea.isFeatured && (
            <Badge variant="secondary" className="shrink-0">
              <Sparkles className="h-3 w-3 mr-1" />
              Featured
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {idea.shortDescription || idea.description}
        </p>

        {idea.skillsNeeded && idea.skillsNeeded.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {idea.skillsNeeded.slice(0, 4).map((skill, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {skill}
              </Badge>
            ))}
            {idea.skillsNeeded.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{idea.skillsNeeded.length - 4}
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>
              {idea.currentParticipants || 0}/{idea.maxParticipants}
            </span>
          </div>
          {spotsLeft > 0 ? (
            <span className="text-xs text-primary font-medium">
              {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left
            </span>
          ) : (
            <Badge variant="secondary" className="text-xs">
              Full
            </Badge>
          )}
        </div>

        {idea.impactArea && (
          <div className="text-xs text-muted-foreground">
            {idea.impactArea}
            {idea.location && ` • ${idea.location}`}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
