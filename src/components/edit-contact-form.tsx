"use client";

import { useState } from "react";
import type { Outreach, OutreachUpdate, Source, Channel } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pencil } from "lucide-react";

type Props = {
  contact: Outreach;
  onUpdate: (id: string, updates: OutreachUpdate) => Promise<{ error: string | null }>;
};

const SOURCES: Source[] = ["cold", "event", "inbound", "referral"];

function isValidLinkedInUrl(url: string): boolean {
  if (!url) return true;
  try {
    const parsed = new URL(url);
    return (
      (parsed.protocol === "https:" || parsed.protocol === "http:") &&
      parsed.hostname.endsWith("linkedin.com")
    );
  } catch {
    return false;
  }
}

export function EditContactForm({ contact, onUpdate }: Props) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(contact.name);
  const [company, setCompany] = useState(contact.company ?? "");
  const [linkedinUrl, setLinkedinUrl] = useState(contact.linkedin_url ?? "");
  const [email, setEmail] = useState(contact.email ?? "");
  const [notes, setNotes] = useState(contact.notes ?? "");
  const [source, setSource] = useState<Source | "">(contact.source ?? "");
  const [channel, setChannel] = useState<Channel>(contact.channel);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const trimmedLinkedinUrl = linkedinUrl.trim();
    if (trimmedLinkedinUrl && !isValidLinkedInUrl(trimmedLinkedinUrl)) {
      setError("Please enter a valid LinkedIn URL (e.g., https://linkedin.com/in/username)");
      setIsLoading(false);
      return;
    }

    const updates: OutreachUpdate = {
      name: name.trim(),
      company: company.trim() || null,
      linkedin_url: linkedinUrl.trim() || null,
      email: email.trim() || null,
      notes: notes.trim() || null,
      source: source || null,
      channel,
    };

    const result = await onUpdate(contact.id, updates);

    setIsLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setOpen(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      // Reset form to current contact values when opening
      setName(contact.name);
      setCompany(contact.company ?? "");
      setLinkedinUrl(contact.linkedin_url ?? "");
      setEmail(contact.email ?? "");
      setNotes(contact.notes ?? "");
      setSource(contact.source ?? "");
      setChannel(contact.channel);
      setError(null);
    }
    setOpen(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Contact</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="edit-name">Name *</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sarah Chen"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-company">Company</Label>
            <Input
              id="edit-company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Acme Corp"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-linkedin">LinkedIn URL</Label>
            <Input
              id="edit-linkedin"
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/sarahchen"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sarah@acme.com"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-source">Source</Label>
            <select
              id="edit-source"
              value={source}
              onChange={(e) => setSource(e.target.value as Source | "")}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              disabled={isLoading}
            >
              <option value="">Select source...</option>
              {SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-channel">Channel</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={channel === "linkedin" ? "default" : "outline"}
                size="sm"
                onClick={() => setChannel("linkedin")}
                disabled={isLoading}
              >
                LinkedIn
              </Button>
              <Button
                type="button"
                variant={channel === "email" ? "default" : "outline"}
                size="sm"
                onClick={() => setChannel("email")}
                disabled={isLoading}
              >
                Email
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea
              id="edit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Met at SaaStr, interested in PLG tools..."
              disabled={isLoading}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !name.trim()}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
