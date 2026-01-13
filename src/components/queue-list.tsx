"use client";

import type { Outreach } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Props = {
  contacts: Outreach[];
  currentContactId: string | null;
  onSelectContact: (id: string) => void;
  showStatusBadge?: boolean;
};

export function QueueList({ contacts, currentContactId, onSelectContact, showStatusBadge = false }: Props) {
  if (contacts.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-4">
        No contacts match filters
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="text-sm font-medium text-muted-foreground mb-2">
        Showing {contacts.length} contact{contacts.length !== 1 ? "s" : ""}
      </div>
      {contacts.map((contact) => (
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
            <div className="flex items-center gap-1 shrink-0">
              {showStatusBadge && (
                <Badge
                  variant={contact.status === "pending" ? "secondary" : "outline"}
                  className="text-xs"
                >
                  {contact.status}
                </Badge>
              )}
              {contact.source && (
                <Badge variant="outline" className="text-xs">
                  {contact.source}
                </Badge>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
