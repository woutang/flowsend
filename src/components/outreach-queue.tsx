"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useOutreach } from "@/hooks/use-outreach";
import { ContactCard } from "@/components/contact-card";
import { ActionButtons } from "@/components/action-buttons";
import { QueueList } from "@/components/queue-list";
import { StatsBar } from "@/components/stats-bar";
import { ContactForm } from "@/components/contact-form";
import { isValidHttpUrl } from "@/lib/url-validation";
import type { Channel, Outreach } from "@/types/database";

// Extracted component to handle message state, reset via key prop when contact changes
function MessageEditor({
  contact,
  onMarkSent,
  onSkip,
}: {
  contact: Outreach;
  onMarkSent: (message: string) => Promise<void>;
  onSkip: () => Promise<void>;
}) {
  const [message, setMessage] = useState(contact.message ?? "");
  const [channel, setChannel] = useState<Channel>(contact.channel);

  const handleMarkSent = useCallback(async () => {
    await onMarkSent(message);
    setMessage("");
  }, [onMarkSent, message]);

  return (
    <div className="space-y-4">
      <ContactCard
        contact={contact}
        message={message}
        onMessageChange={setMessage}
        channel={channel}
        onChannelChange={setChannel}
      />
      <ActionButtons
        linkedinUrl={contact.linkedin_url}
        message={message}
        onMarkSent={handleMarkSent}
        onSkip={onSkip}
      />
    </div>
  );
}

export function OutreachQueue() {
  const {
    contacts,
    currentContact,
    isLoading,
    error,
    addContact,
    markSent,
    skipContact,
    selectContact,
    getStats,
  } = useOutreach();

  // Use ref for keyboard handler to avoid stale closures
  const currentContactRef = useRef(currentContact);

  useEffect(() => {
    currentContactRef.current = currentContact;
  }, [currentContact]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      try {
        // Cmd/Ctrl + O to open LinkedIn
        if ((e.metaKey || e.ctrlKey) && e.key === "o") {
          e.preventDefault();
          const url = currentContactRef.current?.linkedin_url;
          if (url && isValidHttpUrl(url)) {
            window.open(url, "_blank", "noopener,noreferrer");
          }
        }
      } catch (err) {
        console.error("Keyboard shortcut error:", err);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleMarkSent = useCallback(
    async (message: string) => {
      await markSent(message);
    },
    [markSent]
  );

  const handleSkip = useCallback(async () => {
    await skipContact();
  }, [skipContact]);

  const stats = getStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading contacts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with stats and add button */}
      <div className="flex items-center justify-between">
        <StatsBar
          sentToday={stats.sentToday}
          sentThisWeek={stats.sentThisWeek}
          totalSent={stats.totalSent}
        />
        <ContactForm onAdd={addContact} />
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        {/* Current contact card - key resets state when contact changes */}
        {currentContact ? (
          <MessageEditor
            key={currentContact.id}
            contact={currentContact}
            onMarkSent={handleMarkSent}
            onSkip={handleSkip}
          />
        ) : (
          <ContactCard
            contact={null}
            message=""
            onMessageChange={() => {}}
            channel="linkedin"
            onChannelChange={() => {}}
          />
        )}

        {/* Queue sidebar */}
        <div className="lg:border-l lg:pl-6">
          <QueueList
            contacts={contacts}
            currentContactId={currentContact?.id ?? null}
            onSelectContact={selectContact}
          />
        </div>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="text-xs text-muted-foreground text-center">
        <span className="inline-flex items-center gap-4">
          <span>
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">⌘</kbd> +{" "}
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Enter</kbd>{" "}
            Mark Sent
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">⌘</kbd> +{" "}
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">⇧</kbd> +{" "}
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">C</kbd> Copy
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">⌘</kbd> +{" "}
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">O</kbd> Open
            LinkedIn
          </span>
        </span>
      </div>
    </div>
  );
}
