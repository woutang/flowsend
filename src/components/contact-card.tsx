"use client";

import { useEffect, useRef } from "react";
import type { Outreach, Channel } from "@/types/database";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { isValidHttpUrl } from "@/lib/url-validation";

type Props = {
  contact: Outreach | null;
  message: string;
  onMessageChange: (message: string) => void;
  channel: Channel;
  onChannelChange: (channel: Channel) => void;
};

const CHAR_LIMITS = {
  linkedin: { connection: 300, message: 8000 },
  email: { message: 10000 },
};

export function ContactCard({
  contact,
  message,
  onMessageChange,
  channel,
  onChannelChange,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus textarea when contact changes - THIS IS CRITICAL FOR WISPR
  // Intentionally depend only on contact?.id to avoid re-focusing when other fields change
  useEffect(() => {
    if (contact) {
      textareaRef.current?.focus();
    }
  }, [contact?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!contact) {
    return (
      <Card className="flex-1">
        <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
          No contacts in queue. Add some to get started!
        </CardContent>
      </Card>
    );
  }

  const charLimit = channel === "linkedin" ? CHAR_LIMITS.linkedin.connection : CHAR_LIMITS.email.message;
  const charCount = message.length;
  const isOverLimit = charCount > charLimit;

  return (
    <Card className="flex-1">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold">{contact.name}</h2>
            {contact.company && (
              <p className="text-muted-foreground">{contact.company}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {contact.source && (
              <Badge variant="secondary">{contact.source}</Badge>
            )}
          </div>
        </div>

        {contact.linkedin_url && isValidHttpUrl(contact.linkedin_url) && (
          <a
            href={contact.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-1"
          >
            <ExternalLink className="h-3 w-3" />
            {contact.linkedin_url.replace(/^https?:\/\/(www\.)?/, "")}
          </a>
        )}

        {contact.notes && (
          <p className="text-sm text-muted-foreground mt-2 p-2 bg-muted rounded">
            {contact.notes}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Message</span>
          <div className="flex gap-1">
            <Button
              variant={channel === "linkedin" ? "default" : "outline"}
              size="sm"
              onClick={() => onChannelChange("linkedin")}
            >
              LinkedIn
            </Button>
            <Button
              variant={channel === "email" ? "default" : "outline"}
              size="sm"
              onClick={() => onChannelChange("email")}
            >
              Email
            </Button>
          </div>
        </div>

        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          placeholder="Start speaking with Wispr Flow, or type your message..."
          className="min-h-[150px] resize-none"
        />

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            {channel === "linkedin" ? "Connection request limit: 300 chars" : ""}
          </span>
          <span className={isOverLimit ? "text-red-500 font-medium" : "text-muted-foreground"}>
            {charCount}/{charLimit}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
