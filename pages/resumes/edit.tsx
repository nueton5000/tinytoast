import { useRouter } from "next/router";
import { ResumeEditor } from "@/components/resume/resume-editor";

export default function ResumeEditPage() {
  const router = useRouter();
  const resumeId = router.query.id as string | null;

  const handleSave = () => {
    router.push("/dashboard");
  };

  return (
    <ResumeEditor
      resumeId={resumeId}
      onSave={handleSave}
    />
  );
}
