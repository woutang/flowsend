import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { HistoryTable } from "@/components/history-table";
import Link from "next/link";
import type { Outreach } from "@/types/database";

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch sent contacts with explicit user_id filter (defensive, in addition to RLS)
  const { data: sentContacts, error: fetchError } = await supabase
    .from("outreach")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "sent")
    .order("sent_at", { ascending: false })
    .returns<Outreach[]>();

  // Handle query error
  if (fetchError) {
    console.error("Failed to fetch sent contacts:", fetchError.message);
  }

  async function signOut() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold">FlowSend</h1>
            <nav className="flex items-center gap-4">
              <Link
                href="/"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Queue
              </Link>
              <Link
                href="/history"
                className="text-sm font-medium"
              >
                History
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <form action={signOut}>
              <Button variant="outline" size="sm" type="submit">
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Sent Messages</h2>
            <p className="text-muted-foreground">
              {fetchError ? "Error loading messages" : `${sentContacts?.length ?? 0} messages sent`}
            </p>
          </div>

          {fetchError ? (
            <div className="p-4 text-sm text-red-600 bg-red-50 rounded-md">
              Failed to load sent messages. Please try refreshing the page.
            </div>
          ) : (
            <HistoryTable contacts={sentContacts ?? []} />
          )}
        </div>
      </main>
    </div>
  );
}
