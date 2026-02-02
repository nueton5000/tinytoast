"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAmplifyClient } from "@/lib/amplify-client-context";
import type { Schema } from "@/amplify/data/resource";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarSection,
  SidebarSectionTitle,
  SidebarItem
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Settings,
  LogOut,
  ChevronDown,
  FileText,
  MessageSquare,
  Send,
  Menu,
  X,
  Home,
  Users,
  Lightbulb,
  LayoutGrid
} from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
  user: any;
  onSignOut: () => void;
}

function AppLayoutInner({ children, user, onSignOut }: AppLayoutProps) {
  const client = useAmplifyClient();
  const pathname = usePathname();

  const [profile, setProfile] = useState<Schema["Profile"]["type"]>();
  const [receivedFeedback, setReceivedFeedback] = useState<Array<Schema["Feedback"]["type"]>>([]);
  const [givenFeedback, setGivenFeedback] = useState<Array<Schema["Feedback"]["type"]>>([]);

  // Collapse sidebar by default on view resume page
  const isViewResumePage = pathname?.startsWith('/p/');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(isViewResumePage);

  const userEmail = user?.signInDetails?.loginId || user?.username || "User";
  const userInitial = userEmail.charAt(0).toUpperCase();

  useEffect(() => {
    if (!user?.userId) return;

    const fetchProfile = async () => {
      try {
        const response = await client.models.Profile.get({ id: user.userId });
        if (response.data) {
          setProfile(response.data);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    fetchProfile();
  }, [user, client]);

  useEffect(() => {
    if (!profile) return;

    const fetchData = async () => {
      try {
        const [receivedRes, providedRes] = await Promise.all([
          profile.receivedFeedback(),
          profile.providedFeedback(),
        ]);
        setReceivedFeedback(receivedRes.data);
        setGivenFeedback(providedRes.data);
      } catch (error) {
        console.error("Error fetching profile data:", error);
      }
    };

    fetchData();
  }, [profile]);

  return (
    <>
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-background">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="text-xl font-bold hover:opacity-80">
            tiny toast
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted font-bold">
                  {userInitial}
                </div>
                <span className="hidden sm:inline">{userEmail}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Link href="/settings">
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
              </Link>
              <Link href="/settings">
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onSignOut} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Sidebar */}
        <Sidebar collapsed={sidebarCollapsed}>
          <SidebarHeader>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="ml-auto"
            >
              {sidebarCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
            </Button>
          </SidebarHeader>

          {!sidebarCollapsed && (
            <SidebarContent>
              {/* Dashboard */}
              <SidebarSection>
                <Link href="/dashboard">
                  <SidebarItem active={pathname === "/dashboard"}>
                    <Home className="h-4 w-4" />
                    <span>Dashboard</span>
                  </SidebarItem>
                </Link>
              </SidebarSection>

              <Separator className="my-2" />

              {/* Resume Links */}
              <SidebarSection>
                <SidebarSectionTitle>Resume</SidebarSectionTitle>
                {profile?.nickname && (
                  <Link href={`/p/${profile.nickname}`}>
                    <SidebarItem active={pathname === `/p/${profile.nickname}`}>
                      <FileText className="h-4 w-4" />
                      <span>View Resume</span>
                    </SidebarItem>
                  </Link>
                )}
                <Link href="/resumes/edit">
                  <SidebarItem active={pathname === "/resumes/edit"}>
                    <FileText className="h-4 w-4" />
                    <span>Edit Resume</span>
                  </SidebarItem>
                </Link>
              </SidebarSection>

              <Separator className="my-2" />

              {/* Feedback Received */}
              <SidebarSection>
                <SidebarSectionTitle>
                  <div className="flex items-center justify-between">
                    <span>Feedback Received</span>
                    <Badge variant="secondary">{receivedFeedback.length}</Badge>
                  </div>
                </SidebarSectionTitle>
                <Link href="/feedback/received">
                  <SidebarItem active={pathname.startsWith("/feedback/received")}>
                    <MessageSquare className="h-4 w-4" />
                    <span>View All</span>
                  </SidebarItem>
                </Link>
              </SidebarSection>

              <Separator className="my-2" />

              {/* Feedback Given */}
              <SidebarSection>
                <SidebarSectionTitle>
                  <div className="flex items-center justify-between">
                    <span>Feedback Given</span>
                    <Badge variant="secondary">{givenFeedback.length}</Badge>
                  </div>
                </SidebarSectionTitle>
                <Link href="/feedback/given">
                  <SidebarItem active={pathname.startsWith("/feedback/given")}>
                    <Send className="h-4 w-4" />
                    <span>View All</span>
                  </SidebarItem>
                </Link>
              </SidebarSection>

              <Separator className="my-2" />

              {/* Local Teams */}
              <SidebarSection>
                <SidebarSectionTitle>Local Teams</SidebarSectionTitle>
                <Link href="/teams">
                  <SidebarItem active={pathname === "/teams"}>
                    <Users className="h-4 w-4" />
                    <span>Overview</span>
                  </SidebarItem>
                </Link>
                <Link href="/teams/board">
                  <SidebarItem active={pathname === "/teams/board"}>
                    <LayoutGrid className="h-4 w-4" />
                    <span>Project Board</span>
                  </SidebarItem>
                </Link>
                <Link href="/teams/post">
                  <SidebarItem active={pathname === "/teams/post"}>
                    <Lightbulb className="h-4 w-4" />
                    <span>Post an Idea</span>
                  </SidebarItem>
                </Link>
              </SidebarSection>
            </SidebarContent>
          )}
        </Sidebar>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-muted/10">
          {children}
        </main>
      </div>
    </>
  );
}

export function AppLayout(props: AppLayoutProps) {
  return <AppLayoutInner {...props} />;
}
