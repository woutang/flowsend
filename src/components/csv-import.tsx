"use client";

import { useState, useRef } from "react";
import type { OutreachInsert, Source } from "@/types/database";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Upload } from "lucide-react";

type Props = {
  onImport: (contacts: OutreachInsert[]) => Promise<{ error: string | null; count: number }>;
};

type ParsedRow = {
  name: string;
  company: string;
  linkedin_url: string;
  email: string;
  notes: string;
  source: string;
};

const VALID_SOURCES: Source[] = ["cold", "event", "inbound", "referral"];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_ROW_COUNT = 500;

function parseCSV(text: string): ParsedRow[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];

  // Parse header
  const header = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""));

  const rows: ParsedRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // Handle quoted CSV fields with RFC 4180 escaped quotes ("")
    const values: string[] = [];
    let current = "";
    let inQuotes = false;
    let j = 0;

    while (j < line.length) {
      const char = line[j];
      const nextChar = line[j + 1];

      if (char === '"') {
        if (!inQuotes) {
          // Starting a quoted field
          inQuotes = true;
        } else if (nextChar === '"') {
          // RFC 4180: "" inside quotes means escaped quote
          current += '"';
          j++; // Skip the next quote
        } else {
          // Ending a quoted field
          inQuotes = false;
        }
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
      j++;
    }
    values.push(current.trim());

    const row: ParsedRow = {
      name: "",
      company: "",
      linkedin_url: "",
      email: "",
      notes: "",
      source: "",
    };

    header.forEach((col, index) => {
      const value = values[index]?.replace(/^"|"$/g, "") ?? "";
      if (col === "name") row.name = value;
      else if (col === "company") row.company = value;
      else if (col === "linkedin_url") row.linkedin_url = value;
      else if (col === "email") row.email = value;
      else if (col === "notes") row.notes = value;
      else if (col === "source") row.source = value.toLowerCase();
    });

    // Only include rows with a name
    if (row.name) {
      rows.push(row);
    }
  }

  return rows;
}

function convertToOutreach(rows: ParsedRow[]): OutreachInsert[] {
  return rows.map((row) => ({
    name: row.name,
    company: row.company || null,
    linkedin_url: row.linkedin_url || null,
    email: row.email || null,
    notes: row.notes || null,
    source: VALID_SOURCES.includes(row.source as Source) ? (row.source as Source) : null,
    channel: "linkedin" as const,
    status: "pending" as const,
  }));
}

export function CSVImport({ onImport }: Props) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ParsedRow[]>([]);
  const [allRows, setAllRows] = useState<ParsedRow[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size limit
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(`File too large. Maximum size is 5MB (yours is ${(file.size / 1024 / 1024).toFixed(1)}MB).`);
      return;
    }

    setError(null);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const result = event.target?.result;
        // Validate that result is a string
        if (typeof result !== "string") {
          setError("Failed to read file as text.");
          return;
        }

        const rows = parseCSV(result);

        if (rows.length === 0) {
          setError("No valid contacts found in CSV. Make sure you have a 'name' column.");
          return;
        }

        // Check row count limit
        if (rows.length > MAX_ROW_COUNT) {
          setError(`Too many contacts. Maximum is ${MAX_ROW_COUNT} per import (found ${rows.length}).`);
          return;
        }

        setAllRows(rows);
        setPreview(rows.slice(0, 5));
      } catch {
        setError("Failed to parse CSV file.");
      }
    };

    reader.onerror = () => {
      setError("Failed to read file.");
    };

    reader.readAsText(file);
  };

  const handleImport = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const contacts = convertToOutreach(allRows);
      const result = await onImport(contacts);

      if (result.error) {
        setError(result.error);
      } else {
        setOpen(false);
        setPreview([]);
        setAllRows([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    } catch {
      setError("Failed to import contacts.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setPreview([]);
    setAllRows([]);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => isOpen ? setOpen(true) : handleClose()}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Contacts from CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Upload a CSV file with columns: name, company, linkedin_url, email, notes, source
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-muted-foreground
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-medium
                file:bg-primary file:text-primary-foreground
                hover:file:bg-primary/90
                cursor-pointer"
            />
          </div>

          {preview.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Preview ({allRows.length} contacts total)
              </p>
              <div className="border rounded-md overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-3 py-2 text-left">Name</th>
                      <th className="px-3 py-2 text-left">Company</th>
                      <th className="px-3 py-2 text-left">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-3 py-2">{row.name}</td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {row.company || "-"}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {row.source || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {allRows.length > 5 && (
                <p className="text-xs text-muted-foreground">
                  Showing first 5 of {allRows.length} contacts
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={isLoading || allRows.length === 0}
            >
              {isLoading ? "Importing..." : `Import ${allRows.length} Contacts`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
