"use client";

import { useState } from "react";
import type { Outreach } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

type Props = {
  contacts: Outreach[];
};

function escapeCSVField(value: string | null): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  // If the field contains commas, quotes, or newlines, wrap in quotes and escape internal quotes
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatDate(date: string | null): string {
  if (!date) return "";
  return new Date(date).toISOString();
}

function generateCSV(contacts: Outreach[]): string {
  const headers = [
    "name",
    "company",
    "email",
    "linkedin_url",
    "channel",
    "message",
    "source",
    "sent_at",
    "notes",
  ];

  const rows = contacts.map((contact) => [
    escapeCSVField(contact.name),
    escapeCSVField(contact.company),
    escapeCSVField(contact.email),
    escapeCSVField(contact.linkedin_url),
    escapeCSVField(contact.channel),
    escapeCSVField(contact.message),
    escapeCSVField(contact.source),
    escapeCSVField(formatDate(contact.sent_at)),
    escapeCSVField(contact.notes),
  ]);

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

export function CSVExport({ contacts }: Props) {
  const [isExporting, setIsExporting] = useState(false);

  const sentContacts = contacts.filter((c) => c.status === "sent");

  const handleExport = () => {
    if (sentContacts.length === 0) return;

    setIsExporting(true);

    try {
      const csv = generateCSV(sentContacts);
      const date = new Date().toISOString().split("T")[0];
      downloadCSV(csv, `flowsend-export-${date}.csv`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleExport}
      disabled={isExporting || sentContacts.length === 0}
      title={sentContacts.length === 0 ? "No sent contacts to export" : `Export ${sentContacts.length} sent contacts`}
    >
      <Download className="h-4 w-4 mr-2" />
      {isExporting ? "Exporting..." : "Export CSV"}
    </Button>
  );
}
