import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { useAmplifyClient } from '@/lib/amplify-client-context';
import type { Schema } from '@/amplify/data/resource';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { SubscriptionGate } from '@/components/teams/subscription-gate';
import { Loader2, X, Check, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const IMPACT_AREAS = [
  'Environment',
  'Education',
  'Health',
  'Community',
  'Technology',
  'Arts & Culture',
  'Social Justice',
];

const SUGGESTED_SKILLS = [
  'JavaScript',
  'Python',
  'Design',
  'Marketing',
  'Project Management',
  'Data Analysis',
  'Writing',
  'Photography',
  'Video Editing',
  'Community Outreach',
];

export default function PostIdeaPage() {
  const router = useRouter();
  const client = useAmplifyClient();
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState<string>();
  const [profile, setProfile] = useState<Schema['Profile']['type'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [impactArea, setImpactArea] = useState('');
  const [location, setLocation] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('5');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');

  useEffect(() => {
    getCurrentUser()
      .then(async (u) => {
        setUser(u);
        const attrs = await fetchUserAttributes();
        setEmail(attrs.email);
      })
      .catch(() => {
        router.push('/');
      });
  }, [router]);

  useEffect(() => {
    if (!user?.userId) return;

    const fetchProfile = async () => {
      try {
        const response = await client.models.Profile.get({ id: user.userId });
        if (response.data) {
          setProfile(response.data);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfile();
  }, [user, client]);

  const isSubscribed =
    profile?.subscriptionStatus === 'ACTIVE' &&
    profile?.subscriptionTier !== 'FREE';

  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
    }
    setSkillInput('');
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile?.id) {
      setError('Please log in to post an idea');
      return;
    }

    if (!title.trim() || !description.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create short description (first 150 chars)
      const shortDesc = description.slice(0, 150) + (description.length > 150 ? '...' : '');

      await client.models.Idea.create({
        title: title.trim(),
        description: description.trim(),
        shortDescription: shortDesc,
        skillsNeeded: skills.length > 0 ? skills : null,
        maxParticipants: parseInt(maxParticipants) || 5,
        currentParticipants: 1, // Owner counts as participant
        status: 'ACTIVE',
        impactArea: impactArea || null,
        location: location.trim() || null,
        ownerProfileId: profile.id,
        isFeatured: false,
      });

      // Also create IdeaMember for owner
      // The Idea ID is auto-generated, we need to fetch it
      const ideasResponse = await client.models.Idea.list({
        filter: {
          ownerProfileId: { eq: profile.id },
          title: { eq: title.trim() },
        },
      });

      const createdIdea = ideasResponse.data[0];
      if (createdIdea?.id) {
        await client.models.IdeaMember.create({
          ideaId: createdIdea.id,
          profileId: profile.id,
          role: 'OWNER',
          status: 'APPROVED',
          joinedAt: new Date().toISOString(),
        });
      }

      setSuccess(true);
    } catch (err: any) {
      console.error('Error creating idea:', err);
      setError(err.message || 'Failed to create idea');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Idea Submitted!</h2>
            <p className="text-muted-foreground mb-6">
              Your idea has been submitted and is now visible on the board.
              Other members can now discover and join your project.
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/teams/board">
                <Button>View Project Board</Button>
              </Link>
              <Button variant="outline" onClick={() => {
                setSuccess(false);
                setTitle('');
                setDescription('');
                setImpactArea('');
                setLocation('');
                setMaxParticipants('5');
                setSkills([]);
              }}>
                Post Another
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">Project Title *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Community Garden Initiative"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your project, its goals, and what you're looking to achieve..."
          required
          rows={5}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <p className="text-xs text-muted-foreground">
          The first 150 characters will be shown as a preview
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="impactArea">Impact Area</Label>
          <Select value={impactArea} onValueChange={setImpactArea}>
            <SelectTrigger>
              <SelectValue placeholder="Select an area" />
            </SelectTrigger>
            <SelectContent>
              {IMPACT_AREAS.map((area) => (
                <SelectItem key={area} value={area}>
                  {area}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., San Francisco, CA"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="maxParticipants">Max Team Size *</Label>
        <Select value={maxParticipants} onValueChange={setMaxParticipants}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[2, 3, 4, 5, 6, 8, 10, 15, 20].map((n) => (
              <SelectItem key={n} value={n.toString()}>
                {n} members
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Skills Needed</Label>
        <div className="flex gap-2">
          <Input
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            placeholder="Add a skill..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addSkill(skillInput);
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => addSkill(skillInput)}
          >
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {SUGGESTED_SKILLS.filter((s) => !skills.includes(s)).slice(0, 5).map((skill) => (
            <Badge
              key={skill}
              variant="outline"
              className="cursor-pointer hover:bg-muted"
              onClick={() => addSkill(skill)}
            >
              + {skill}
            </Badge>
          ))}
        </div>
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
            {skills.map((skill) => (
              <Badge key={skill} variant="secondary">
                {skill}
                <button
                  type="button"
                  onClick={() => removeSkill(skill)}
                  className="ml-1.5 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-4">
        <Link href="/teams/board">
          <Button type="button" variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : null}
          Submit Idea
        </Button>
      </div>
    </form>
  );

  return (
    <>
      <Head>
        <title>Post an Idea | Impact Teams</title>
        <meta name="description" content="Share your project idea with the community" />
      </Head>

      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Post a New Idea</CardTitle>
            <CardDescription>
              Share your project idea with the community. Describe what you want
              to build and the skills you're looking for.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SubscriptionGate
              isSubscribed={isSubscribed}
              userId={user?.userId}
              email={email}
              action="post your idea"
            >
              {formContent}
            </SubscriptionGate>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
