"use client";

import { useState, useEffect, useRef } from "react";
import { useAmplifyClient } from "@/lib/amplify-client-context";
import { getCurrentUser } from "aws-amplify/auth";
import type { Schema } from "@/amplify/data/resource";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Loader2,
  Check,
  Sparkles,
  Pencil,
  Eye,
  History,
  Save,
  CheckCircle2,
  X,
  Upload,
  ChevronDown
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ResumeEditorProps {
  resumeId?: string | null;
  onSave?: () => void;
}

export function ResumeEditor({ resumeId, onSave }: ResumeEditorProps) {
  const client = useAmplifyClient();
  const [resumeName, setResumeName] = useState("My Resume");
  const [isEditingName, setIsEditingName] = useState(false);
  const [resumeContent, setResumeContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const [isPreviewMode, setIsPreviewMode] = useState(true);
  const [currentResumeId, setCurrentResumeId] = useState<string | null>(resumeId || null);
  const [currentVersion, setCurrentVersion] = useState<Schema["ResumeVersion"]["type"] | null>(null);
  const [versions, setVersions] = useState<Array<Schema["ResumeVersion"]["type"]>>([]);
  const [publishedVersion, setPublishedVersion] = useState<Schema["ResumeVersion"]["type"] | null>(null);

  // Feedback state
  const [incorporatedFeedback, setIncorporatedFeedback] = useState<Array<Schema["Feedback"]["type"]>>([]);
  const [availableFeedback, setAvailableFeedback] = useState<Array<Schema["Feedback"]["type"]>>([]);
  const [selectedFeedback, setSelectedFeedback] = useState<Set<string>>(new Set());

  // AI state
  const [aiInstructions, setAiInstructions] = useState("");
  const [generatedUpdate, setGeneratedUpdate] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadResumeData();
  }, []);

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  const loadResumeData = async () => {
    try {
      setLoading(true);
      const user = await getCurrentUser();

      // Get user's profile
      const profileResponse = await client.models.Profile.get({ id: user.userId });
      if (!profileResponse.data) {
        throw new Error("Profile not found");
      }

      // Get the profile's resume
      const resumeResponse = await profileResponse.data.resume();
      let resume = resumeResponse.data;

      // If no resume exists, create one
      if (!resume) {
        const createResponse = await client.models.Resume.create({
          name: "My Resume",
          profileId: user.userId,
        });
        resume = createResponse.data;
      }

      if (resume) {
        setCurrentResumeId(resume.id);
        setResumeName(resume.name || "My Resume");

        // Load all versions
        const versionsResponse = await resume.versions();
        const allVersions = versionsResponse.data.sort((a, b) => (b.version || 0) - (a.version || 0));
        setVersions(allVersions);

        // Find published version
        const published = allVersions.find(v => v.isPublished);
        setPublishedVersion(published || null);

        // Load the latest version or create initial one
        if (allVersions.length > 0) {
          const latest = allVersions[0];
          setCurrentVersion(latest);
          setResumeContent(latest.content || "");
        } else {
          // Create initial version
          const versionResponse = await client.models.ResumeVersion.create({
            resumeId: resume.id,
            content: "",
            version: 1,
            isPublished: false,
          });
          if (versionResponse.data) {
            setCurrentVersion(versionResponse.data);
            setVersions([versionResponse.data]);
          }
        }

        // Load feedback
        await loadFeedbackData(resume.id);
      }
    } catch (err: any) {
      console.error("Error loading resume:", err);
      setError(err.message || "Failed to load resume");
    } finally {
      setLoading(false);
    }
  };

  const loadFeedbackData = async (resumeId: string) => {
    try {
      // Load all feedback for the user
      const allFeedbackResponse = await client.models.Feedback.list();
      const allFeedback = allFeedbackResponse.data;

      // Load the junction table entries to see what's already incorporated
      const resumeFeedbackResponse = await client.models.ResumeFeedback.list({
        filter: { resumeId: { eq: resumeId } }
      });
      const incorporatedIds = new Set(
        resumeFeedbackResponse.data.map(rf => rf.feedbackId).filter(Boolean)
      );

      // Split feedback into incorporated and available
      const incorporated = allFeedback.filter(f => f.id && incorporatedIds.has(f.id));
      const available = allFeedback.filter(f => f.id && !incorporatedIds.has(f.id));

      setIncorporatedFeedback(incorporated);
      setAvailableFeedback(available);
    } catch (err) {
      console.error("Error loading feedback:", err);
    }
  };

  const handleSaveAsDraft = async () => {
    if (!resumeName.trim()) {
      setError("Please enter a resume name");
      return;
    }

    if (!currentResumeId) {
      setError("No resume loaded");
      return;
    }

    setError("");
    setSaving(true);

    try {
      // Update resume name
      await client.models.Resume.update({
        id: currentResumeId,
        name: resumeName.trim(),
      });

      // Create new version
      const nextVersion = (versions[0]?.version || 0) + 1;
      await client.models.ResumeVersion.create({
        resumeId: currentResumeId,
        content: resumeContent.trim(),
        version: nextVersion,
        isPublished: false,
      });

      // Reload data from database to ensure sync
      await loadResumeData();

      onSave?.();
    } catch (err: any) {
      setError(err.message || "Failed to save resume");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!currentResumeId || !currentVersion) {
      setError("No version to publish");
      return;
    }

    setError("");
    setPublishing(true);

    try {
      // Unpublish all other versions
      await Promise.all(
        versions
          .filter(v => v.isPublished && v.id !== currentVersion.id)
          .map(v => client.models.ResumeVersion.update({
            id: v.id!,
            isPublished: false,
            publishedAt: null,
          }))
      );

      // Publish current version (update content and publish)
      await client.models.ResumeVersion.update({
        id: currentVersion.id!,
        content: resumeContent.trim(),
        isPublished: true,
        publishedAt: new Date().toISOString(),
      });

      // Reload data from database to ensure sync
      await loadResumeData();

      onSave?.();
    } catch (err: any) {
      setError(err.message || "Failed to publish resume");
    } finally {
      setPublishing(false);
    }
  };

  const handleGenerateUpdate = async () => {
    // Check if user has selected feedback or provided instructions
    if (selectedFeedback.size === 0 && !aiInstructions.trim()) {
      setError("Please select feedback or provide instructions");
      return;
    }

    setError("");
    setIsGenerating(true);
    setGeneratedUpdate("");

    try {
      // Build the prompt parts
      const resumePart = resumeContent;

      let feedbackPart = "";
      if (selectedFeedback.size > 0) {
        const feedbackItems = availableFeedback
          .filter(f => f.id && selectedFeedback.has(f.id))
          .map(f => {
            if (f.questionText) {
              return `Q: ${f.questionText}\nA: ${f.content}`;
            }
            return f.content || "";
          })
          .filter(Boolean)
          .join("\n\n");
        feedbackPart = `Feedback:\n${feedbackItems}`;
      }

      let instructionsPart = "";
      if (aiInstructions.trim()) {
        instructionsPart = `Instructions:\n${aiInstructions}`;
      }

      // Combine all parts
      const parts = [resumePart, feedbackPart, instructionsPart].filter(Boolean);
      const prompt = parts.join("\n\n---\n\n");

      // Call the generation route
      const response = await client.generations.improveResume({
        content: prompt
      });

      if (response.data?.resumeContent) {
        setGeneratedUpdate(response.data.resumeContent);
      } else {
        throw new Error("No response from AI");
      }
    } catch (err: any) {
      console.error("Error generating update:", err);
      setError(err.message || "Failed to generate update");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyUpdate = async () => {
    if (!generatedUpdate) return;

    setResumeContent(generatedUpdate);

    // Mark the selected feedback as incorporated
    if (currentResumeId && selectedFeedback.size > 0) {
      try {
        await Promise.all(
          Array.from(selectedFeedback).map(feedbackId =>
            client.models.ResumeFeedback.create({
              resumeId: currentResumeId,
              feedbackId: feedbackId
            })
          )
        );

        // Reload feedback data to update the UI
        await loadFeedbackData(currentResumeId);

        // Clear selections and generated update
        setSelectedFeedback(new Set());
        setGeneratedUpdate("");
        setAiInstructions("");
      } catch (err) {
        console.error("Error marking feedback as incorporated:", err);
      }
    } else {
      // Just clear the state if no resume ID
      setGeneratedUpdate("");
      setAiInstructions("");
    }
  };

  const handleDiscardUpdate = () => {
    setGeneratedUpdate("");
    setError("");
  };

  const handleVersionSwitch = (version: Schema["ResumeVersion"]["type"]) => {
    setCurrentVersion(version);
    setResumeContent(version.content || "");
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Toolbar */}
      <div className="border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Editable Resume Name */}
          <div className="flex items-center gap-2">
            {isEditingName ? (
              <Input
                ref={nameInputRef}
                value={resumeName}
                onChange={(e) => setResumeName(e.target.value)}
                onBlur={() => setIsEditingName(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setIsEditingName(false);
                  if (e.key === "Escape") {
                    setIsEditingName(false);
                  }
                }}
                className="h-8 w-64"
              />
            ) : (
              <>
                <h1 className="text-lg font-semibold">{resumeName}</h1>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setIsEditingName(true)}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Preview/Edit Toggle */}
          <div className="inline-flex rounded-md border">
            <Button
              variant={!isPreviewMode ? "ghost" : "ghost"}
              size="sm"
              className={`h-7 rounded-none border-r ${!isPreviewMode ? 'bg-muted' : ''}`}
              onClick={() => setIsPreviewMode(false)}
            >
              <Pencil className="h-3 w-3 mr-1" />
              Edit
            </Button>
            <Button
              variant={isPreviewMode ? "ghost" : "ghost"}
              size="sm"
              className={`h-7 rounded-none ${isPreviewMode ? 'bg-muted' : ''}`}
              onClick={() => setIsPreviewMode(true)}
            >
              <Eye className="h-3 w-3 mr-1" />
              Preview
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Version Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 gap-2">
                <History className="h-4 w-4" />
                <span>v{currentVersion?.version || 1}</span>
                {currentVersion?.isPublished && (
                  <Badge variant="default" className="text-xs">Published</Badge>
                )}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              {versions.map(version => (
                <DropdownMenuItem
                  key={version.id}
                  onClick={() => handleVersionSwitch(version)}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">v{version.version}</span>
                    {version.isPublished && (
                      <Badge variant="default" className="text-xs">Published</Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(version.updatedAt)}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Separator orientation="vertical" className="h-6" />

          {/* Save Button */}
          <Button onClick={handleSaveAsDraft} disabled={saving} size="sm" variant="outline">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-3 w-3" />
                Save Draft
              </>
            )}
          </Button>

          {/* Publish Button */}
          <Button onClick={handlePublish} disabled={publishing} size="sm">
            {publishing ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-3 w-3" />
                Publish
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="px-6 py-2 bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Resume Content Panel */}
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="h-full flex flex-col">
              {isPreviewMode ? (
                <ScrollArea className="flex-1 p-6">
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {resumeContent || "*No content yet. Switch to Edit mode to add content.*"}
                    </ReactMarkdown>
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex-1 p-6">
                  <Textarea
                    value={resumeContent}
                    onChange={(e) => setResumeContent(e.target.value)}
                    placeholder="# Your Resume

Start writing your resume in markdown...

## Experience
**Software Engineer** at Company Name
- Achievement 1
- Achievement 2

## Education
**Degree** from University Name"
                    className="h-full font-mono text-sm resize-none"
                  />
                </div>
              )}
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* AI Assistant Panel */}
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="h-full flex flex-col">
              <div className="border-b px-6 py-3 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="font-semibold">AI Resume Assistant</h2>
              </div>

              {/* AI Instructions - Fixed at top */}
              <div className="border-b px-6 py-4 bg-background">
                <div className="space-y-2">
                  <Textarea
                    value={aiInstructions}
                    onChange={(e) => setAiInstructions(e.target.value)}
                    placeholder="What would you like to improve? (e.g., make it more concise, add more metrics, etc.)"
                    className="text-sm resize-none h-10 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 shadow-none"
                    disabled={isGenerating}
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={handleGenerateUpdate}
                      disabled={isGenerating || (selectedFeedback.size === 0 && !aiInstructions.trim())}
                      size="sm"
                      className="bg-primary hover:bg-primary/90 disabled:opacity-100"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Generate
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-6 space-y-6">
                  {/* Incorporated Feedback */}
                  {incorporatedFeedback.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium">Incorporated Feedback</CardTitle>
                          <Badge variant="secondary" className="text-xs">
                            {incorporatedFeedback.length}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-32">
                          <div className="space-y-2">
                            {incorporatedFeedback.map(feedback => (
                              <div
                                key={feedback.id}
                                className="flex items-start gap-2 p-2 rounded bg-muted/50"
                              >
                                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <div className="text-xs flex-1">
                                  {feedback.questionText && (
                                    <p className="font-medium text-muted-foreground mb-1">
                                      Q: {feedback.questionText}
                                    </p>
                                  )}
                                  <p>A: {feedback.content}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  )}

                  {/* Available Feedback */}
                  {availableFeedback.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium">Available Feedback</CardTitle>
                          {selectedFeedback.size > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {selectedFeedback.size} selected
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-40">
                          <div className="space-y-1">
                            {availableFeedback.map(feedback => (
                              <div
                                key={feedback.id}
                                className="flex items-start gap-2 p-2 rounded hover:bg-muted cursor-pointer transition-colors"
                                onClick={() => {
                                  if (!feedback.id) return;
                                  const newSelected = new Set(selectedFeedback);
                                  if (newSelected.has(feedback.id)) {
                                    newSelected.delete(feedback.id);
                                  } else {
                                    newSelected.add(feedback.id);
                                  }
                                  setSelectedFeedback(newSelected);
                                }}
                              >
                                <div className="flex h-4 w-4 items-center justify-center rounded border mt-0.5 flex-shrink-0">
                                  {feedback.id && selectedFeedback.has(feedback.id) && (
                                    <Check className="h-3 w-3" />
                                  )}
                                </div>
                                <div className="text-xs flex-1">
                                  {feedback.questionText && (
                                    <p className="font-medium text-muted-foreground mb-1">
                                      Q: {feedback.questionText}
                                    </p>
                                  )}
                                  <p>A: {feedback.content}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  )}

                  {/* Generated Update */}
                  {generatedUpdate && (
                    <Card className="border-primary">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Generated Update</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <ScrollArea className="h-64 w-full rounded border bg-muted/50">
                          <div className="p-4">
                            <div className="prose prose-sm max-w-none">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {generatedUpdate}
                              </ReactMarkdown>
                            </div>
                          </div>
                        </ScrollArea>

                        <div className="flex gap-2">
                          <Button onClick={handleApplyUpdate} className="flex-1">
                            <Check className="mr-2 h-4 w-4" />
                            Apply to Resume
                          </Button>
                          <Button onClick={handleDiscardUpdate} variant="outline" className="flex-1">
                            <X className="mr-2 h-4 w-4" />
                            Discard
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Empty State */}
                  {availableFeedback.length === 0 && incorporatedFeedback.length === 0 && (
                    <Card>
                      <CardContent className="pt-6 text-center text-sm text-muted-foreground">
                        <p>No feedback available yet.</p>
                        <p className="mt-2">Share your resume to collect feedback!</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </ScrollArea>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
