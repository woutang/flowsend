"use client";

import { useCallback, useEffect, useState, useRef, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Outreach, OutreachInsert, OutreachUpdate } from "@/types/database";

export function useOutreach() {
  const [contacts, setContacts] = useState<Outreach[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize Supabase client to prevent recreation on every render
  const supabase = useMemo(() => createClient(), []);

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
        .order("created_at", { ascending: true })
        .returns<Outreach[]>();

      if (error) throw error;
      const fetchedContacts = data ?? [];
      setContacts(fetchedContacts);

      // Find first pending contact
      const firstPendingIndex = fetchedContacts.findIndex((c) => c.status === "pending");
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
        // Get the current user ID
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { data, error } = await supabase
          .from("outreach")
          .insert({ ...contact, user_id: user.id })
          .select()
          .single<Outreach>();

        if (error) throw error;
        if (!data) throw new Error("No data returned from insert");
        setContacts((prev) => [...prev, data]);
        return { data, error: null };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to add contact";
        return { data: null, error: message };
      }
    },
    [supabase]
  );

  // Import multiple contacts from CSV
  const importContacts = useCallback(
    async (contacts: OutreachInsert[]) => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const contactsWithUserId = contacts.map((c) => ({
          ...c,
          user_id: user.id,
        }));

        const { data, error } = await supabase
          .from("outreach")
          .insert(contactsWithUserId)
          .select()
          .returns<Outreach[]>();

        if (error) throw error;
        if (!data) throw new Error("No data returned from insert");

        setContacts((prev) => {
          const wasEmpty = prev.length === 0;
          const newContacts = [...prev, ...data];

          // If this is the first batch and no current contact, set to first pending
          if (wasEmpty && data.length > 0) {
            const firstPendingIndex = data.findIndex((c) => c.status === "pending");
            if (firstPendingIndex >= 0) {
              setCurrentIndex(firstPendingIndex);
            }
          }

          return newContacts;
        });

        return { error: null, count: data.length };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to import contacts";
        return { error: message, count: 0 };
      }
    },
    [supabase]
  );

  // Update a contact
  const updateContact = useCallback(
    async (id: string, updates: OutreachUpdate) => {
      try {
        // Verify contact exists in local state before updating (ownership check)
        const existingContact = contactsRef.current.find((c) => c.id === id);
        if (!existingContact) {
          throw new Error("Contact not found or not owned by current user");
        }

        const { data, error } = await supabase
          .from("outreach")
          .update(updates)
          .eq("id", id)
          .select()
          .single<Outreach>();

        if (error) throw error;
        if (!data) throw new Error("No data returned from update");
        setContacts((prev) => prev.map((c) => (c.id === id ? data : c)));
        return { data, error: null };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update contact";
        return { data: null, error: message };
      }
    },
    [supabase]
  );

  // Log outreach to HubSpot (fire-and-forget, don't block UI)
  const logToHubSpot = useCallback(
    async (outreachId: string, message: string, channel: string) => {
      try {
        const response = await fetch("/api/hubspot/log-outreach", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ outreachId, message, channel }),
        });

        if (!response.ok) {
          console.error("Failed to log outreach to HubSpot");
        }
      } catch (err) {
        console.error("Error logging to HubSpot:", err);
      }
    },
    []
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
        // Fire-and-forget HubSpot sync (don't block UI)
        // Only attempt if contact has a hubspot_contact_id
        if (currentContact.hubspot_contact_id) {
          logToHubSpot(currentContact.id, message, currentContact.channel);
        }
        moveToNext();
      }

      return { error };
    },
    [currentContact, updateContact, moveToNext, logToHubSpot]
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

  // Initial fetch on mount only
  // Intentional: fetch once on mount. fetchContacts is stable via memoized supabase.
  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  return {
    contacts,
    currentContact,
    pendingContacts,
    remainingCount,
    isLoading,
    error,
    fetchContacts,
    addContact,
    importContacts,
    updateContact,
    markSent,
    skipContact,
    selectContact,
    getStats,
  };
}
