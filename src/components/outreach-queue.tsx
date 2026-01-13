"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useOutreach } from "@/hooks/use-outreach";
import { ContactCard } from "@/components/contact-card";
import { ActionButtons } from "@/components/action-buttons";
import { QueueList } from "@/components/queue-list";
import { StatsBar } from "@/components/stats-bar";
import { ContactForm } from "@/components/contact-form";
import type { Channel } from "@/types/database";

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

  const [message, setMessage] = useState("");
  const [channel, setChannel] = useState<Channel>("linkedin");

  // Track previous contact ID to detect changes
  const prevContactIdRef = useRef<string | null>(null);

  // Use ref for keyboard handler to avoid stale closures
  const messageRef = useRef(message);
  const currentContactRef = useRef(currentContact);

  useEffect(() => {
    messageRef.current = message;
  }, [message]);

  useEffect(() => {
    currentContactRef.current = currentContact;
  }, [currentContact]);

  // Reset message when contact changes (using ref comparison)
  const currentContactId = currentContact?.id ?? null;
  if (currentContactId !== prevContactIdRef.current) {
    prevContactIdRef.current = currentContactId;
    // Only reset if we actually have a different contact
    if (currentContact) {
      // These are synchronous updates during render, not in effect
      if (message !== (currentContact.message ?? "")) {
        setMessage(currentContact.message ?? "");
      }
      if (channel !== currentContact.channel) {
        setChannel(currentContact.channel);
      }
    }
  }

  const handleMarkSent = useCallback(async () => {
    await markSent(messageRef.current);
    setMessage("");
  }, [markSent]);

  const handleSkip = useCallback(async () => {
    await skipContact();
    setMessage("");
  }, [skipContact]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Cmd/Ctrl + Enter to mark sent
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        if (currentContactRef.current) {
          await markSent(messageRef.current);
          setMessage("");
        }
      }
      // Cmd/Ctrl + Shift + C to copy
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "c") {
        e.preventDefault();
        if (messageRef.current.trim()) {
          navigator.clipboard.writeText(messageRef.current);
        }
      }
      // Cmd/Ctrl + O to open LinkedIn
      if ((e.metaKey || e.ctrlKey) && e.key === "o") {
        e.preventDefault();
        if (currentContactRef.current?.linkedin_url) {
          window.open(currentContactRef.current.linkedin_url, "_blank", "noopener,noreferrer");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [markSent]);

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
        {/* Current contact card */}
        <div className="space-y-4">
          <ContactCard
            contact={currentContact}
            message={message}
            onMessageChange={setMessage}
            channel={channel}
            onChannelChange={setChannel}
          />

          {currentContact && (
            <ActionButtons
              linkedinUrl={currentContact.linkedin_url}
              message={message}
              onMarkSent={handleMarkSent}
              onSkip={handleSkip}
            />
          )}
        </div>

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
          <span><kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">⌘</kbd> + <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Enter</kbd> Mark Sent</span>
          <span><kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">⌘</kbd> + <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">⇧</kbd> + <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">C</kbd> Copy</span>
          <span><kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">⌘</kbd> + <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">O</kbd> Open LinkedIn</span>
        </span>
      </div>
    </div>
  );
}
