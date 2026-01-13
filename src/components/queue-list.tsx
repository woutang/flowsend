"use client";

import type { Outreach } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Props = {
  contacts: Outreach[];
  currentContactId: string | null;
  onSelectContact: (id: string) => void;
};

export function QueueList({ contacts, currentContactId, onSelectContact }: Props) {
  const pendingContacts = contacts.filter((c) => c.status === "pending");

  if (pendingContacts.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-4">
        No pending contacts
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="text-sm font-medium text-muted-foreground mb-2">
        Up Next ({pendingContacts.length})
      </div>
      {pendingContacts.map((contact) => (
        <button
          key={contact.id}
          onClick={() => onSelectContact(contact.id)}
          className={cn(
            "w-full text-left px-3 py-2 rounded-md transition-colors",
            "hover:bg-muted",
            contact.id === currentContactId && "bg-muted border-l-2 border-primary"
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="font-medium truncate">{contact.name}</div>
              {contact.company && (
                <div className="text-sm text-muted-foreground truncate">
                  {contact.company}
                </div>
              )}
            </div>
            {contact.source && (
              <Badge variant="outline" className="text-xs shrink-0">
                {contact.source}
              </Badge>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
