"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAmplifyClient } from "@/lib/amplify-client-context";
import type { Schema } from "@/amplify/data/resource";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ResumePage() {
  const params = useParams();
  const client = useAmplifyClient();

  const [resume, setResume] = useState<Schema["Resume"]["type"] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params?.id) {
      loadResume();
    }
  }, [params?.id]);

  const loadResume = async () => {
    if (!params?.id) return;

    try {
      setLoading(true);
      const response = await client.models.Resume.get({ id: params.id as string });
      if (response.data) {
        setResume(response.data);
      }
    } catch (error) {
      console.error("Error loading resume:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-sm text-muted-foreground">Resume not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 max-w-4xl mx-auto w-full px-8 py-12">
        <article className="prose prose-lg max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {resume.publishedContent}
          </ReactMarkdown>
        </article>
      </main>

      <footer className="border-t py-6 mt-12">
        <div className="max-w-4xl mx-auto px-8">
          <p className="text-xs text-muted-foreground text-center">
            Powered by{" "}
            <a
              href="https://tinytoast.app"
              className="hover:text-foreground transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              tiny toast
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
