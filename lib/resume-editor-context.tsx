"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface ResumeEditorContextType {
  openEditor: (resumeId?: string) => void;
  closeEditor: () => void;
  isOpen: boolean;
  resumeId: string | null;
}

const ResumeEditorContext = createContext<ResumeEditorContextType | null>(null);

export function ResumeEditorProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [resumeId, setResumeId] = useState<string | null>(null);

  const openEditor = (id?: string) => {
    setResumeId(id || null);
    setIsOpen(true);
  };

  const closeEditor = () => {
    setIsOpen(false);
    setResumeId(null);
  };

  return (
    <ResumeEditorContext.Provider value={{ openEditor, closeEditor, isOpen, resumeId }}>
      {children}
    </ResumeEditorContext.Provider>
  );
}

export function useResumeEditor() {
  const context = useContext(ResumeEditorContext);
  if (!context) {
    throw new Error("useResumeEditor must be used within ResumeEditorProvider");
  }
  return context;
}
