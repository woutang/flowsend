"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import type { Source, Status } from "@/types/database";

type SourceFilter = Source | "all";
type StatusFilter = Status | "all";

type Props = {
  onFilterChange: (filters: {
    source: SourceFilter;
    status: StatusFilter;
    search: string;
  }) => void;
};

const SOURCE_VALUES: SourceFilter[] = ["all", "cold", "event", "inbound", "referral"];
const STATUS_VALUES: StatusFilter[] = ["all", "pending", "sent", "skipped"];

const SOURCES: { value: SourceFilter; label: string }[] = [
  { value: "all", label: "All Sources" },
  { value: "cold", label: "Cold" },
  { value: "event", label: "Event" },
  { value: "inbound", label: "Inbound" },
  { value: "referral", label: "Referral" },
];

const STATUSES: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "sent", label: "Sent" },
  { value: "skipped", label: "Skipped" },
];

function isValidSourceFilter(value: string): value is SourceFilter {
  return SOURCE_VALUES.includes(value as SourceFilter);
}

function isValidStatusFilter(value: string): value is StatusFilter {
  return STATUS_VALUES.includes(value as StatusFilter);
}

export function QueueFilters({ onFilterChange }: Props) {
  const [source, setSource] = useState<SourceFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("pending");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Notify parent of filter changes
  const notifyChange = useCallback(() => {
    onFilterChange({ source, status, search: debouncedSearch });
  }, [source, status, debouncedSearch, onFilterChange]);

  useEffect(() => {
    notifyChange();
  }, [notifyChange]);

  return (
    <div className="space-y-3">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or company..."
          className="pl-9"
        />
      </div>

      {/* Filter dropdowns */}
      <div className="flex gap-2">
        <select
          value={source}
          onChange={(e) => {
            const value = e.target.value;
            if (isValidSourceFilter(value)) {
              setSource(value);
            }
          }}
          aria-label="Filter by source"
          className="h-9 rounded-md border border-input bg-background px-3 text-sm flex-1"
        >
          {SOURCES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => {
            const value = e.target.value;
            if (isValidStatusFilter(value)) {
              setStatus(value);
            }
          }}
          aria-label="Filter by status"
          className="h-9 rounded-md border border-input bg-background px-3 text-sm flex-1"
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export type { SourceFilter, StatusFilter };
