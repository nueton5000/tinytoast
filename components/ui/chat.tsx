"use client";

import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatProps {
  messages: Message[];
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isGenerating?: boolean;
  onCopy?: (content: string) => void;
  onApply?: (content: string) => void;
  placeholder?: string;
  className?: string;
}

export function Chat({
  messages,
  input,
  handleInputChange,
  handleSubmit,
  isGenerating = false,
  onCopy,
  onApply,
  placeholder = "Type a message...",
  className = ""
}: ChatProps) {
  return (
    <div className={`flex flex-col h-full ${className}`}>
      <MessageList
        messages={messages}
        isGenerating={isGenerating}
        onCopy={onCopy}
        onApply={onApply}
        className="flex-1"
      />
      <div className="border-t p-4">
        <MessageInput
          value={input}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          disabled={isGenerating}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}
