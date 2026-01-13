---
name: react-supabase
description: Specialized patterns for building React applications with Supabase backend. Use when working with Supabase authentication, database operations, real-time subscriptions, storage, or edge functions. Covers Row Level Security (RLS), type generation, and Supabase-specific best practices.
---

# React + Supabase Development Skill

Patterns for building production applications with React and Supabase.

## Supabase Project Setup

### Initialize Supabase in Next.js

```bash
# Install dependencies
bun add @supabase/supabase-js @supabase/ssr

# For type generation
bun add -D supabase
```

### Client Configuration

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from Server Component
          }
        },
      },
    }
  );
}
```

### Type Generation

```bash
# Generate types from your Supabase schema
bunx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.ts

# Or from local database
bunx supabase gen types typescript --local > types/database.ts
```

```typescript
// types/database.ts (generated, then you can extend)
export type Database = {
  public: {
    Tables: {
      contacts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          email: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          email?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          email?: string | null;
          created_at?: string;
        };
      };
    };
  };
};

// Convenience types
export type Contact = Database['public']['Tables']['contacts']['Row'];
export type ContactInsert = Database['public']['Tables']['contacts']['Insert'];
export type ContactUpdate = Database['public']['Tables']['contacts']['Update'];
```

## Authentication Patterns

### Auth Provider Setup

```typescript
// components/providers/auth-provider.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

type AuthContext = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContext | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
```

### Auth Middleware

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Redirect to login if accessing protected routes
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
};
```

### OAuth Login

```typescript
// app/(auth)/login/page.tsx
'use client';

import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const supabase = createClient();

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <Button onClick={() => handleOAuthLogin('google')}>
        Continue with Google
      </Button>
      <Button onClick={() => handleOAuthLogin('github')}>
        Continue with GitHub
      </Button>
    </div>
  );
}
```

## Database Operations

### Query Patterns with React Query

```typescript
// hooks/use-contacts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { Contact, ContactInsert } from '@/types/database';

export function useContacts() {
  const supabase = createClient();
  
  return useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Contact[];
    },
  });
}

export function useContact(id: string) {
  const supabase = createClient();
  
  return useQuery({
    queryKey: ['contacts', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Contact;
    },
    enabled: !!id,
  });
}

export function useCreateContact() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (contact: ContactInsert) => {
      const { data, error } = await supabase
        .from('contacts')
        .insert(contact)
        .select()
        .single();
      
      if (error) throw error;
      return data as Contact;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

export function useDeleteContact() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}
```

### Server-Side Data Fetching

```typescript
// app/dashboard/contacts/page.tsx
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ContactList } from '@/components/contacts/contact-list';

export default async function ContactsPage() {
  const supabase = await createServerSupabaseClient();
  
  const { data: contacts, error } = await supabase
    .from('contacts')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    throw new Error('Failed to load contacts');
  }
  
  return <ContactList initialContacts={contacts} />;
}
```

## Row Level Security (RLS)

### Common RLS Policies

```sql
-- Enable RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Users can only see their own contacts
CREATE POLICY "Users can view own contacts"
  ON contacts FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own contacts
CREATE POLICY "Users can insert own contacts"
  ON contacts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own contacts
CREATE POLICY "Users can update own contacts"
  ON contacts FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own contacts
CREATE POLICY "Users can delete own contacts"
  ON contacts FOR DELETE
  USING (auth.uid() = user_id);

-- Team-based access (more complex)
CREATE POLICY "Team members can view team contacts"
  ON contacts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = contacts.team_id
      AND team_members.user_id = auth.uid()
    )
  );
```

### Testing RLS Locally

```typescript
// Use service role to bypass RLS in tests
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Bypasses RLS
);
```

## Real-time Subscriptions

### Subscribe to Changes

```typescript
// hooks/use-realtime-contacts.ts
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { Contact } from '@/types/database';

export function useRealtimeContacts() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const channel = supabase
      .channel('contacts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contacts',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            queryClient.setQueryData<Contact[]>(
              ['contacts'],
              (old) => old ? [payload.new as Contact, ...old] : [payload.new as Contact]
            );
          } else if (payload.eventType === 'UPDATE') {
            queryClient.setQueryData<Contact[]>(
              ['contacts'],
              (old) => old?.map((c) =>
                c.id === payload.new.id ? (payload.new as Contact) : c
              ) ?? []
            );
          } else if (payload.eventType === 'DELETE') {
            queryClient.setQueryData<Contact[]>(
              ['contacts'],
              (old) => old?.filter((c) => c.id !== payload.old.id) ?? []
            );
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, supabase]);
}
```

## Storage Operations

### File Upload

```typescript
// lib/supabase/storage.ts
import { createClient } from './client';

export async function uploadFile(
  bucket: string,
  path: string,
  file: File
): Promise<string> {
  const supabase = createClient();
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });
  
  if (error) throw error;
  
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);
  
  return publicUrl;
}

// Usage in component
async function handleFileUpload(file: File, userId: string) {
  const path = `${userId}/${Date.now()}-${file.name}`;
  const url = await uploadFile('attachments', path, file);
  return url;
}
```

### Signed URLs for Private Files

```typescript
export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn = 3600
): Promise<string> {
  const supabase = createClient();
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);
  
  if (error) throw error;
  return data.signedUrl;
}
```

## Edge Functions

### Create Edge Function

```typescript
// supabase/functions/generate-message/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { transcription, channel, contactContext } = await req.json();
    
    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: `Transform this voice input into a ${channel} message: "${transcription}"`,
          },
        ],
      }),
    });
    
    const data = await response.json();
    
    return new Response(
      JSON.stringify({ message: data.content[0].text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
```

### Call Edge Function from Client

```typescript
const supabase = createClient();

const { data, error } = await supabase.functions.invoke('generate-message', {
  body: {
    transcription: 'Hey Sarah, loved your post about PLG...',
    channel: 'linkedin',
    contactContext: { name: 'Sarah', company: 'Acme' },
  },
});
```

## Migration Best Practices

### Migration File Structure

```sql
-- supabase/migrations/20260113000000_create_contacts.sql

-- Create contacts table
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  linkedin_url TEXT,
  company TEXT,
  role TEXT,
  source TEXT CHECK (source IN ('event', 'inbound', 'cold')),
  tags TEXT[],
  context_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_contacts_user_id ON public.contacts(user_id);
CREATE INDEX idx_contacts_created_at ON public.contacts(created_at DESC);

-- Enable RLS
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage own contacts"
  ON public.contacts
  FOR ALL
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## Common Pitfalls

1. **Forgetting RLS** - Always enable and test RLS policies
2. **Missing indexes** - Add indexes for frequently queried columns
3. **Not using types** - Always generate and use TypeScript types
4. **Client-side service role** - Never expose service role key to client
5. **Missing error handling** - Always handle Supabase errors
6. **Skipping migrations** - Use migrations for schema changes, not direct SQL
7. **Realtime without cleanup** - Always unsubscribe from channels
