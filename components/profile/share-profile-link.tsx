"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, ExternalLink } from "lucide-react";

interface ShareProfileLinkProps {
  nickname: string | null | undefined;
}

export function ShareProfileLink({ nickname }: ShareProfileLinkProps) {
  const [copied, setCopied] = useState(false);

  if (!nickname) {
    return null;
  }

  const profileUrl = `${window.location.origin}/p/${nickname}/feedback`;

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
        <CardTitle>Share Feedback Link</CardTitle>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
}
