"use client";

import { useState } from "react";
import type { Outreach } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  contacts: Outreach[];
};

function truncateMessage(message: string | null, maxLength: number = 50): string {
  if (!message) return "-";
  if (message.length <= maxLength) return message;
  return message.slice(0, maxLength) + "...";
}

function formatDate(date: string | null): string {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function HistoryTable({ contacts }: Props) {
  const [selectedContact, setSelectedContact] = useState<Outreach | null>(null);

  if (contacts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No messages sent yet. Start sending to build your history!
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Company</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Channel</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Sent Date</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Message</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {contacts.map((contact) => (
              <tr
                key={contact.id}
                onClick={() => setSelectedContact(contact)}
                className="hover:bg-muted/50 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3 text-sm font-medium">{contact.name}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {contact.company || "-"}
                </td>
                <td className="px-4 py-3 text-sm">
                  <Badge variant="outline">{contact.channel}</Badge>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {formatDate(contact.sent_at)}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate">
                  {truncateMessage(contact.message)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Message detail modal */}
      <Dialog open={!!selectedContact} onOpenChange={() => setSelectedContact(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Message to {selectedContact?.name}</DialogTitle>
          </DialogHeader>

          {selectedContact && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Company: </span>
                  <span>{selectedContact.company || "-"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Channel: </span>
                  <Badge variant="outline">{selectedContact.channel}</Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Sent: </span>
                  <span>{formatDate(selectedContact.sent_at)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Source: </span>
                  <span>{selectedContact.source || "-"}</span>
                </div>
              </div>

              {selectedContact.notes && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Notes: </span>
                  <span>{selectedContact.notes}</span>
                </div>
              )}

              <div className="space-y-2">
                <span className="text-sm font-medium">Message</span>
                <div className="p-4 bg-muted rounded-lg text-sm whitespace-pre-wrap">
                  {selectedContact.message || "No message recorded"}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
