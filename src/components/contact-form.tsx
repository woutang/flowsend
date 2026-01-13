"use client";

import { useState } from "react";
import type { OutreachInsert, Source, Channel } from "@/types/database";
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
import { Plus } from "lucide-react";

type Props = {
  onAdd: (contact: OutreachInsert) => Promise<{ error: string | null }>;
};

const SOURCES: Source[] = ["cold", "event", "inbound", "referral"];

function isValidLinkedInUrl(url: string): boolean {
  if (!url) return true; // Optional field
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

export function ContactForm({ onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [source, setSource] = useState<Source | "">("");
  const [channel, setChannel] = useState<Channel>("linkedin");

  const resetForm = () => {
    setName("");
    setCompany("");
    setLinkedinUrl("");
    setEmail("");
    setNotes("");
    setSource("");
    setChannel("linkedin");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validate LinkedIn URL before submit
    const trimmedLinkedinUrl = linkedinUrl.trim();
    if (trimmedLinkedinUrl && !isValidLinkedInUrl(trimmedLinkedinUrl)) {
      setError("Please enter a valid LinkedIn URL (e.g., https://linkedin.com/in/username)");
      setIsLoading(false);
      return;
    }

    const contact: OutreachInsert = {
      name: name.trim(),
      company: company.trim() || null,
      linkedin_url: linkedinUrl.trim() || null,
      email: email.trim() || null,
      notes: notes.trim() || null,
      source: source || null,
      channel,
      message: null,
      status: "pending",
      sent_at: null,
    };

    const result = await onAdd(contact);

    setIsLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      resetForm();
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Contact
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Contact</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sarah Chen"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Acme Corp"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkedin">LinkedIn URL</Label>
            <Input
              id="linkedin"
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/sarahchen"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sarah@acme.com"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="source">Source</Label>
            <select
              id="source"
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
            <Label htmlFor="channel">Channel</Label>
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
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
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
              {isLoading ? "Adding..." : "Add Contact"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
