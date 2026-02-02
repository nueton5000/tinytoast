import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { useAmplifyClient } from '@/lib/amplify-client-context';
import type { Schema } from '@/amplify/data/resource';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProjectCard } from '@/components/teams/project-card';
import { ProjectDetailDialog } from '@/components/teams/project-detail-dialog';
import { Plus, Search, Loader2, LayoutGrid, List, Filter } from 'lucide-react';

const IMPACT_AREAS = [
  'All Areas',
  'Environment',
  'Education',
  'Health',
  'Community',
  'Technology',
  'Arts & Culture',
  'Social Justice',
];

export default function ProjectBoardPage() {
  const router = useRouter();
  const client = useAmplifyClient();
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState<string>();
  const [profile, setProfile] = useState<Schema['Profile']['type'] | null>(null);
  const [ideas, setIdeas] = useState<Schema['Idea']['type'][]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIdea, setSelectedIdea] = useState<Schema['Idea']['type'] | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [impactFilter, setImpactFilter] = useState('All Areas');
  const [skillFilter, setSkillFilter] = useState('');

  // Check for success param from Stripe
  useEffect(() => {
    if (router.query.success) {
      // Refresh to update subscription status
      router.replace('/teams/board', undefined, { shallow: true });
    }
  }, [router.query.success, router]);

  useEffect(() => {
    getCurrentUser()
      .then(async (u) => {
        setUser(u);
        const attrs = await fetchUserAttributes();
        setEmail(attrs.email);
      })
      .catch(() => {});
  }, []);

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

  useEffect(() => {
    const fetchIdeas = async () => {
      setLoading(true);
      try {
        const response = await client.models.Idea.list({
          filter: { status: { eq: 'ACTIVE' } },
        });

        // Sort featured first, then by date
        const sorted = [...response.data].sort((a, b) => {
          if (a.isFeatured && !b.isFeatured) return -1;
          if (!a.isFeatured && b.isFeatured) return 1;
          return 0;
        });

        setIdeas(sorted);
      } catch (error) {
        console.error('Error fetching ideas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchIdeas();
  }, [client]);

  // Fetch joined ideas for current user
  useEffect(() => {
    if (!profile?.id) return;

    const fetchJoinedIdeas = async () => {
      try {
        const response = await client.models.IdeaMember.list({
          filter: { profileId: { eq: profile.id as string } },
        });
        const ids = new Set(response.data.map((m) => m.ideaId || '').filter(Boolean));
        setJoinedIds(ids);
      } catch (error) {
        console.error('Error fetching joined ideas:', error);
      }
    };

    fetchJoinedIdeas();
  }, [profile?.id, client]);

  const handleJoinProject = async (ideaId: string) => {
    if (!profile?.id) throw new Error('Please log in to join projects');

    await client.models.IdeaMember.create({
      ideaId,
      profileId: profile.id,
      role: 'MEMBER',
      status: 'PENDING',
      joinedAt: new Date().toISOString(),
    });

    setJoinedIds((prev) => {
      const newSet = new Set(prev);
      newSet.add(ideaId);
      return newSet;
    });
  };

  const isSubscribed =
    profile?.subscriptionStatus === 'ACTIVE' &&
    profile?.subscriptionTier !== 'FREE';

  // Filter ideas
  const filteredIdeas = ideas.filter((idea) => {
    const matchesSearch =
      !searchQuery ||
      idea.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesImpact =
      impactFilter === 'All Areas' || idea.impactArea === impactFilter;

    const matchesSkill =
      !skillFilter ||
      idea.skillsNeeded?.some((s) =>
        s?.toLowerCase().includes(skillFilter.toLowerCase())
      );

    return matchesSearch && matchesImpact && matchesSkill;
  });

  return (
    <>
      <Head>
        <title>Project Board | Impact Teams</title>
        <meta
          name="description"
          content="Browse and join high-impact local projects"
        />
      </Head>

      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Project Board</h1>
            <p className="text-muted-foreground mt-1">
              Discover projects that match your skills
            </p>
          </div>
          <Link href="/teams/post">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Post an Idea
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={impactFilter} onValueChange={setImpactFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Impact Area" />
            </SelectTrigger>
            <SelectContent>
              {IMPACT_AREAS.map((area) => (
                <SelectItem key={area} value={area}>
                  {area}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Filter by skill..."
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
            className="w-full sm:w-[160px]"
          />
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Active filters */}
        {(impactFilter !== 'All Areas' || skillFilter || searchQuery) && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {searchQuery && (
              <Badge
                variant="secondary"
                className="cursor-pointer"
                onClick={() => setSearchQuery('')}
              >
                "{searchQuery}" ×
              </Badge>
            )}
            {impactFilter !== 'All Areas' && (
              <Badge
                variant="secondary"
                className="cursor-pointer"
                onClick={() => setImpactFilter('All Areas')}
              >
                {impactFilter} ×
              </Badge>
            )}
            {skillFilter && (
              <Badge
                variant="secondary"
                className="cursor-pointer"
                onClick={() => setSkillFilter('')}
              >
                Skill: {skillFilter} ×
              </Badge>
            )}
          </div>
        )}

        {/* Project Grid/List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredIdeas.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">
              {ideas.length === 0
                ? 'No projects posted yet. Be the first!'
                : 'No projects match your filters.'}
            </p>
            <Link href="/teams/post">
              <Button>Post an Idea</Button>
            </Link>
          </div>
        ) : (
          <div
            className={
              viewMode === 'grid'
                ? 'grid sm:grid-cols-2 lg:grid-cols-3 gap-4'
                : 'space-y-3'
            }
          >
            {filteredIdeas.map((idea) => (
              <ProjectCard
                key={idea.id}
                idea={idea}
                onClick={() => {
                  setSelectedIdea(idea);
                  setDialogOpen(true);
                }}
              />
            ))}
          </div>
        )}

        <ProjectDetailDialog
          idea={selectedIdea}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          isSubscribed={isSubscribed}
          userId={user?.userId}
          email={email}
          onJoin={handleJoinProject}
          hasJoined={selectedIdea?.id ? joinedIds.has(selectedIdea.id) : false}
        />
      </div>
    </>
  );
}
