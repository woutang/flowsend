"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Outreach, OutreachInsert, OutreachUpdate } from "@/types/database";

export function useOutreach() {
  const [contacts, setContacts] = useState<Outreach[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // Use refs for values needed in callbacks to avoid stale closures
  const contactsRef = useRef(contacts);
  const currentIndexRef = useRef(currentIndex);

  useEffect(() => {
    contactsRef.current = contacts;
  }, [contacts]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  const currentContact = contacts[currentIndex] ?? null;
  const pendingContacts = contacts.filter((c) => c.status === "pending");
  const remainingCount = pendingContacts.length;

  // Move to next pending contact
  const moveToNext = useCallback(() => {
    const currentContacts = contactsRef.current;
    const currentIdx = currentIndexRef.current;

    const nextPendingIndex = currentContacts.findIndex(
      (c, i) => i > currentIdx && c.status === "pending"
    );

    if (nextPendingIndex >= 0) {
      setCurrentIndex(nextPendingIndex);
    } else {
      // Wrap around to find first pending
      const firstPendingIndex = currentContacts.findIndex((c) => c.status === "pending");
      if (firstPendingIndex >= 0) {
        setCurrentIndex(firstPendingIndex);
      }
    }
  }, []);

  // Fetch all contacts for the current user
  const fetchContacts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("outreach")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      const typedData = (data ?? []) as Outreach[];
      setContacts(typedData);

      // Find first pending contact
      const firstPendingIndex = typedData.findIndex((c) => c.status === "pending");
      setCurrentIndex(firstPendingIndex >= 0 ? firstPendingIndex : 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch contacts");
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // Add a new contact
  const addContact = useCallback(
    async (contact: OutreachInsert) => {
      try {
        const { data, error } = await supabase
          .from("outreach")
          .insert(contact)
          .select()
          .single();

        if (error) throw error;
        const typedData = data as Outreach;
        setContacts((prev) => [...prev, typedData]);
        return { data: typedData, error: null };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to add contact";
        return { data: null, error: message };
      }
    },
    [supabase]
  );

  // Update a contact
  const updateContact = useCallback(
    async (id: string, updates: OutreachUpdate) => {
      try {
        const { data, error } = await supabase
          .from("outreach")
          .update(updates)
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;
        const typedData = data as Outreach;
        setContacts((prev) => prev.map((c) => (c.id === id ? typedData : c)));
        return { data: typedData, error: null };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update contact";
        return { data: null, error: message };
      }
    },
    [supabase]
  );

  // Mark contact as sent and move to next
  const markSent = useCallback(
    async (message: string) => {
      if (!currentContact) return { error: "No contact selected" };

      const { error } = await updateContact(currentContact.id, {
        status: "sent",
        message,
        sent_at: new Date().toISOString(),
      });

      if (!error) {
        moveToNext();
      }

      return { error };
    },
    [currentContact, updateContact, moveToNext]
  );

  // Skip current contact and move to next
  const skipContact = useCallback(async () => {
    if (!currentContact) return { error: "No contact selected" };

    const { error } = await updateContact(currentContact.id, {
      status: "skipped",
    });

    if (!error) {
      moveToNext();
    }

    return { error };
  }, [currentContact, updateContact, moveToNext]);

  // Select a specific contact
  const selectContact = useCallback(
    (id: string) => {
      const index = contacts.findIndex((c) => c.id === id);
      if (index >= 0) {
        setCurrentIndex(index);
      }
    },
    [contacts]
  );

  // Get stats
  const getStats = useCallback(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const sentContacts = contacts.filter((c) => c.status === "sent");

    const sentToday = sentContacts.filter(
      (c) => c.sent_at && new Date(c.sent_at) >= today
    ).length;

    const sentThisWeek = sentContacts.filter(
      (c) => c.sent_at && new Date(c.sent_at) >= weekAgo
    ).length;

    const totalSent = sentContacts.length;

    return { sentToday, sentThisWeek, totalSent };
  }, [contacts]);

  // Initial fetch
  useEffect(() => {
    fetchContacts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    contacts,
    currentContact,
    pendingContacts,
    remainingCount,
    isLoading,
    error,
    fetchContacts,
    addContact,
    updateContact,
    markSent,
    skipContact,
    selectContact,
    getStats,
  };
}
