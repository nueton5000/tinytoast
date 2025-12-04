import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText } from "lucide-react";
import { useAmplifyClient } from "@/lib/amplify-client-context";

interface ProfileSetupProps {
  userId: string;
  onComplete: () => void;
}

export function ProfileSetup({ userId, onComplete }: ProfileSetupProps) {
  const [nickname, setNickname] = useState("");
  const [resumeName, setResumeName] = useState("");
  const [resumeContent, setResumeContent] = useState("");
  const [uploadMethod, setUploadMethod] = useState<"text" | "file">("text");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const client = useAmplifyClient();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    const validTypes = ["text/plain", "application/pdf", "application/msword",
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

    if (!validTypes.includes(file.type)) {
      setError("Please upload a valid document file (TXT, PDF, DOC, DOCX)");
      return;
    }

    setResumeName(file.name.replace(/\.[^/.]+$/, "")); // Remove extension

    // For text files, read content directly
    if (file.type === "text/plain") {
      const reader = new FileReader();
      reader.onload = (event) => {
        setResumeContent(event.target?.result as string);
      };
      reader.readAsText(file);
    } else {
      // For other files, show a message
      setResumeContent(`[Uploaded file: ${file.name}]\n\nPlease paste your resume content here or use the text input tab.`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nickname.trim()) {
      setError("Please enter a nickname");
      return;
    }

    setError("");
    setLoading(true);

    try {
      // Check if nickname is already taken
      const existingProfiles = await client.models.Profile.listProfileByNickname({
        nickname: nickname.trim()
      });

      if (existingProfiles.data && existingProfiles.data.length > 0) {
        setError("This nickname is already taken. Please choose another one.");
        setLoading(false);
        return;
      }

      // Create profile
      const profileResponse = await client.models.Profile?.create({
        id: userId,
        userId: userId,
        nickname: nickname.trim(),
      });

      if (!profileResponse?.data) {
        throw new Error("Failed to create profile");
      }

      // Create resume if content is provided
      if (resumeName.trim() && resumeContent.trim()) {
        await client.models.Resume.create({
          name: resumeName.trim(),
          publishedContent: resumeContent.trim(),
          profileId: userId,
        });
      }

      onComplete();
    } catch (err: any) {
      console.error("Error creating profile:", err);
      setError(err.message || "Failed to create profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Complete Your Profile</CardTitle>
          <CardDescription>
            Let's set up your profile and optionally upload your resume
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nickname */}
            <div className="space-y-2">
              <Label htmlFor="nickname">Nickname *</Label>
              <Input
                id="nickname"
                type="text"
                placeholder="How should we call you?"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground">
                This is how others will see you on the platform
              </p>
            </div>

            {/* Resume Upload Section */}
            <div className="space-y-2">
              <Label>Resume (Optional)</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Upload your resume now or add it later from your dashboard
              </p>

              <Tabs value={uploadMethod} onValueChange={(v) => setUploadMethod(v as "text" | "file")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="text" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Paste Text
                  </TabsTrigger>
                  <TabsTrigger value="file" className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Upload File
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="text" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="resume-name">Resume Name</Label>
                    <Input
                      id="resume-name"
                      type="text"
                      placeholder="e.g., Software Engineer Resume"
                      value={resumeName}
                      onChange={(e) => setResumeName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="resume-content">Resume Content</Label>
                    <Textarea
                      id="resume-content"
                      placeholder="Paste your resume content here..."
                      value={resumeContent}
                      onChange={(e) => setResumeContent(e.target.value)}
                      className="min-h-[300px] font-mono text-sm"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="file" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="resume-file">Upload Resume File</Label>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors">
                      <Input
                        id="resume-file"
                        type="file"
                        accept=".txt,.pdf,.doc,.docx"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <label
                        htmlFor="resume-file"
                        className="cursor-pointer flex flex-col items-center gap-2"
                      >
                        <Upload className="h-10 w-10 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          Click to upload or drag and drop
                        </span>
                        <span className="text-xs text-muted-foreground">
                          TXT, PDF, DOC, or DOCX (max 10MB)
                        </span>
                      </label>
                    </div>
                  </div>

                  {resumeName && (
                    <div className="space-y-2">
                      <Label htmlFor="resume-name-file">Resume Name</Label>
                      <Input
                        id="resume-name-file"
                        type="text"
                        placeholder="e.g., Software Engineer Resume"
                        value={resumeName}
                        onChange={(e) => setResumeName(e.target.value)}
                      />
                    </div>
                  )}

                  {resumeContent && (
                    <div className="space-y-2">
                      <Label htmlFor="resume-content-preview">Preview / Edit Content</Label>
                      <Textarea
                        id="resume-content-preview"
                        value={resumeContent}
                        onChange={(e) => setResumeContent(e.target.value)}
                        className="min-h-[200px] font-mono text-sm"
                      />
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? "Creating Profile..." : "Complete Setup"}
              </Button>
              {resumeContent && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setResumeName("");
                    setResumeContent("");
                  }}
                >
                  Clear Resume
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
