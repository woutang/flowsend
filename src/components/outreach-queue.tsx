"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useOutreach } from "@/hooks/use-outreach";
import { ContactCard } from "@/components/contact-card";
import { ActionButtons } from "@/components/action-buttons";
import { QueueList } from "@/components/queue-list";
import { QueueFilters, type SourceFilter, type StatusFilter } from "@/components/queue-filters";
import { StatsBar } from "@/components/stats-bar";
import { ContactForm } from "@/components/contact-form";
import { CSVImport } from "@/components/csv-import";
import { CSVExport } from "@/components/csv-export";
import { isValidHttpUrl } from "@/lib/url-validation";
import type { Channel, Outreach, OutreachUpdate } from "@/types/database";

// Extracted component to handle message state, reset via key prop when contact changes
function MessageEditor({
  contact,
  onMarkSent,
  onSkip,
  onUpdate,
}: {
  contact: Outreach;
  onMarkSent: (message: string) => Promise<void>;
  onSkip: () => Promise<void>;
  onUpdate: (id: string, updates: OutreachUpdate) => Promise<{ error: string | null }>;
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
        onUpdate={onUpdate}
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
    importContacts,
    updateContact,
    markSent,
    skipContact,
    selectContact,
    getStats,
  } = useOutreach();

  // Filter state
  const [filters, setFilters] = useState<{
    source: SourceFilter;
    status: StatusFilter;
    search: string;
  }>({ source: "all", status: "pending", search: "" });

  // Filter contacts based on current filters
  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      // Filter by source
      if (filters.source !== "all" && contact.source !== filters.source) {
        return false;
      }
      // Filter by status
      if (filters.status !== "all" && contact.status !== filters.status) {
        return false;
      }
      // Filter by search
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const nameMatch = contact.name.toLowerCase().includes(searchLower);
        const companyMatch = contact.company?.toLowerCase().includes(searchLower) ?? false;
        if (!nameMatch && !companyMatch) {
          return false;
        }
      }
      return true;
    });
  }, [contacts, filters]);

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
        <div className="flex items-center gap-2">
          <CSVExport contacts={contacts} />
          <CSVImport onImport={importContacts} />
          <ContactForm onAdd={addContact} />
        </div>
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
            onUpdate={updateContact}
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
        <div className="lg:border-l lg:pl-6 space-y-4">
          <QueueFilters onFilterChange={setFilters} />
          <QueueList
            contacts={filteredContacts}
            currentContactId={currentContact?.id ?? null}
            onSelectContact={selectContact}
            showStatusBadge={filters.status === "all"}
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
