"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Share2, Copy, Check, ExternalLink } from "lucide-react";

interface ShareProfileLinkProps {
  nickname: string | null | undefined;
}

export function ShareProfileLink({ nickname }: ShareProfileLinkProps) {
  const [copied, setCopied] = useState(false);

  if (!nickname) {
    return null;
  }

  const profileUrl = `${window.location.origin}/p/${nickname}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const openInNewTab = () => {
    window.open(profileUrl, '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Share Your Profile
            </CardTitle>
            <CardDescription>
              Share this link to collect feedback on your resume
            </CardDescription>
          </div>
          <Badge variant="secondary">Public</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Nickname Display */}
        <div className="space-y-1">
          <div className="text-sm font-medium text-muted-foreground">Your Nickname</div>
          <div className="flex items-center gap-2 rounded-md bg-muted p-3">
            <code className="flex-1 text-lg font-bold">{nickname}</code>
          </div>
        </div>

        {/* Full URL */}
        <div className="space-y-1">
          <div className="text-sm font-medium text-muted-foreground">Full Link</div>
          <div className="flex gap-2">
            <Input
              value={profileUrl}
              readOnly
              className="font-mono text-sm"
            />
            <Button
              onClick={copyToClipboard}
              variant="outline"
              size="icon"
              className="shrink-0"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <Button
              onClick={openInNewTab}
              variant="outline"
              size="icon"
              className="shrink-0"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Anyone with this link can view your resumes and provide feedback through an AI-guided interview.
        </p>
      </CardContent>
    </Card>
  );
}
