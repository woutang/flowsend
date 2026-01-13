"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, Copy, Check, SkipForward } from "lucide-react";

type Props = {
  linkedinUrl: string | null;
  message: string;
  onMarkSent: () => Promise<void>;
  onSkip: () => Promise<void>;
  isLoading?: boolean;
};

export function ActionButtons({
  linkedinUrl,
  message,
  onMarkSent,
  onSkip,
  isLoading,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);

  const handleOpenLinkedIn = () => {
    if (linkedinUrl) {
      window.open(linkedinUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleCopy = async () => {
    if (!message.trim()) return;

    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleMarkSent = async () => {
    setIsSending(true);
    try {
      await onMarkSent();
    } finally {
      setIsSending(false);
    }
  };

  const handleSkip = async () => {
    setIsSkipping(true);
    try {
      await onSkip();
    } finally {
      setIsSkipping(false);
    }
  };

  const disabled = isLoading || isSending || isSkipping;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button
        variant="outline"
        onClick={handleOpenLinkedIn}
        disabled={!linkedinUrl || disabled}
      >
        <ExternalLink className="h-4 w-4 mr-2" />
        {linkedinUrl ? "Open LinkedIn" : "No LinkedIn URL"}
      </Button>

      <Button
        variant="outline"
        onClick={handleCopy}
        disabled={!message.trim() || disabled}
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 mr-2" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="h-4 w-4 mr-2" />
            Copy Message
          </>
        )}
      </Button>

      <Button variant="outline" onClick={handleSkip} disabled={disabled}>
        <SkipForward className="h-4 w-4 mr-2" />
        {isSkipping ? "Skipping..." : "Skip"}
      </Button>

      <Button onClick={handleMarkSent} disabled={disabled}>
        <Check className="h-4 w-4 mr-2" />
        {isSending ? "Saving..." : "Mark Sent"}
      </Button>
    </div>
  );
}
