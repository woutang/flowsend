"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, Loader2 } from "lucide-react";
import type { NormalizedHubSpotContact } from "@/types/hubspot";

type Props = {
  onImportComplete: () => void;
};

type FetchState = "idle" | "loading" | "loaded" | "error";

export function HubSpotImport({ onImportComplete }: Props) {
  const [open, setOpen] = useState(false);
  const [fetchState, setFetchState] = useState<FetchState>("idle");
  const [contacts, setContacts] = useState<NormalizedHubSpotContact[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    imported: number;
    skipped: number;
  } | null>(null);

  const fetchContacts = useCallback(async () => {
    setFetchState("loading");
    setError(null);

    try {
      const response = await fetch("/api/hubspot/contacts");

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch contacts");
      }

      const data = await response.json();
      setContacts(data.contacts);
      // Select all by default
      setSelectedIds(
        new Set(data.contacts.map((c: NormalizedHubSpotContact) => c.hubspotId))
      );
      setFetchState("loaded");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch contacts");
      setFetchState("error");
    }
  }, []);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && fetchState === "idle") {
      fetchContacts();
    }
    if (!isOpen) {
      // Reset state on close
      setFetchState("idle");
      setContacts([]);
      setSelectedIds(new Set());
      setError(null);
      setImportResult(null);
    }
  };

  const toggleContact = (hubspotId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(hubspotId)) {
        next.delete(hubspotId);
      } else {
        next.add(hubspotId);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === contacts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(contacts.map((c) => c.hubspotId)));
    }
  };

  const handleImport = async () => {
    const selectedContacts = contacts.filter((c) =>
      selectedIds.has(c.hubspotId)
    );

    if (selectedContacts.length === 0) {
      setError("No contacts selected");
      return;
    }

    setIsImporting(true);
    setError(null);

    try {
      const response = await fetch("/api/hubspot/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contacts: selectedContacts }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to import contacts");
      }

      const result = await response.json();
      setImportResult({ imported: result.imported, skipped: result.skipped });

      // Notify parent to refresh outreach list
      onImportComplete();

      // Close dialog after short delay so user sees result
      setTimeout(() => {
        setOpen(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import contacts");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Import Contacts
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Import from HubSpot</DialogTitle>
          <DialogDescription>
            Select contacts to add to your outreach queue. Duplicates (by email)
            will be skipped.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
              {error}
            </div>
          )}

          {importResult && (
            <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md">
              Imported {importResult.imported} contacts
              {importResult.skipped > 0 &&
                ` (${importResult.skipped} duplicates skipped)`}
            </div>
          )}

          {fetchState === "loading" && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">
                Loading contacts from HubSpot...
              </span>
            </div>
          )}

          {fetchState === "loaded" && contacts.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No contacts found in your HubSpot account.
            </div>
          )}

          {fetchState === "loaded" && contacts.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedIds.size === contacts.length}
                    onCheckedChange={toggleAll}
                  />
                  <span className="text-sm text-muted-foreground">
                    Select all ({contacts.length} contacts)
                  </span>
                </div>
                <span className="text-sm font-medium">
                  {selectedIds.size} selected
                </span>
              </div>

              <div className="border rounded-md overflow-y-auto flex-1 max-h-[400px]">
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left w-10"></th>
                      <th className="px-3 py-2 text-left">Name</th>
                      <th className="px-3 py-2 text-left">Email</th>
                      <th className="px-3 py-2 text-left">Company</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map((contact) => (
                      <tr
                        key={contact.hubspotId}
                        className="border-t hover:bg-muted/50 cursor-pointer"
                        onClick={() => toggleContact(contact.hubspotId)}
                      >
                        <td className="px-3 py-2">
                          <Checkbox
                            checked={selectedIds.has(contact.hubspotId)}
                            onCheckedChange={() =>
                              toggleContact(contact.hubspotId)
                            }
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td className="px-3 py-2">{contact.name}</td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {contact.email || "-"}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {contact.company || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isImporting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={
                isImporting || selectedIds.size === 0 || fetchState !== "loaded"
              }
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                `Import ${selectedIds.size} Contacts`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
