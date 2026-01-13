# FlowSend v1 - Product Requirements Document

## Overview

**Product:** FlowSend - Voice-first outreach queue  
**Version:** 1.0 (MVP)  
**Owner:** CVT / Max Melnick  
**Timeline:** 4 weeks  
**Target User:** Max (and only Max for v1)

---

## Problem

Max spends 40+ hours per 1,000 contacts on outreach. Voice dictation (via Wispr Flow) has compressed message *creation* from minutes to seconds. But the *execution* bottleneck remains:

- Switching between apps (Wispr → LinkedIn → HubSpot)
- Copy-pasting messages one by one
- Manually tracking what was sent to whom
- No unified queue to work through

**Goal:** Eliminate app-switching and provide a single interface where Max can speak, review, send, and track—all without leaving the app.

---

## Solution

A simple web app with one screen:

```
┌─────────────────────────────────────────────────────────────┐
│  FlowSend                                     [Export CSV]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Contact Queue (3 remaining)              [+ Add Contact]   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Sarah Chen · Acme Corp                             │   │
│  │  linkedin.com/in/sarahchen                          │   │
│  │                                                     │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │ [Voice input field - Wispr types here]      │   │   │
│  │  │                                             │   │   │
│  │  │ Hey Sarah! Loved your post about PLG...     │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  │                                                     │   │
│  │  [Open LinkedIn]  [Copy Message]  [Mark Sent ✓]    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  │  John Smith · Beta Inc                      [Pending]   │
│  │  Maria Garcia · Gamma LLC                   [Pending]   │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│  Sent Today: 12  │  This Week: 47  │  Total: 203           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## How It Works

### The Workflow (Per Contact)

1. **Max sees the current contact** - Name, company, LinkedIn URL, any notes
2. **Max activates Wispr Flow** (his existing hotkey) and speaks his message
3. **Wispr types into FlowSend's text field** (no integration needed—Wispr types wherever cursor is)
4. **Max reviews/edits** the message if needed
5. **Max clicks "Open LinkedIn"** → Opens the contact's LinkedIn profile/message thread in a new tab
6. **Max clicks "Copy Message"** → Message copied to clipboard
7. **Max pastes in LinkedIn, sends manually**
8. **Max returns to FlowSend, clicks "Mark Sent"**
9. **Next contact appears automatically**

### Why This Works

- **No Wispr API needed** - Wispr Flow outputs text to the focused input field. FlowSend just needs a text input.
- **No LinkedIn automation** - User manually opens one tab, pastes, sends. Zero ban risk.
- **No HubSpot integration** - CSV export at end of session. Import to HubSpot manually or via their import tool.
- **Minimal context switching** - FlowSend is the home base. LinkedIn is just for the send action.

---

## Functional Requirements

### FR1: Contact Management

#### FR1.1: Add Contacts
- **Single add:** Form with fields (name, company, LinkedIn URL, email, notes, source)
- **Bulk add:** CSV upload with column mapping
- **Required:** Name
- **Optional:** Everything else

#### FR1.2: Contact Fields
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | text | ✅ | Full name |
| company | text | ❌ | Company name |
| linkedin_url | url | ❌ | Full LinkedIn profile or message URL |
| email | email | ❌ | For email channel |
| notes | text | ❌ | Context, how you met, etc. |
| source | enum | ❌ | 'cold', 'event', 'inbound', 'referral' |

#### FR1.3: Contact Queue
- Contacts appear in queue ordered by: date added (oldest first)
- Filter by: source, status (pending/sent)
- Search by: name, company

### FR2: Message Composition

#### FR2.1: Voice Input via Wispr Flow
- Large text input field (textarea)
- Cursor auto-focuses when contact loads
- User activates Wispr Flow externally (their hotkey)
- Wispr types into the focused textarea
- No audio processing in FlowSend—Wispr handles everything

#### FR2.2: Message Editing
- Standard textarea with character count
- LinkedIn limit indicator (300 chars for connection request, 8000 for message)
- Basic formatting preserved (line breaks)

#### FR2.3: Channel Selection
- Toggle: LinkedIn / Email
- Affects: character limit display, export format
- Default: LinkedIn (90% of Max's volume)

### FR3: Send Workflow

#### FR3.1: Open LinkedIn
- Button: "Open LinkedIn"
- Action: Opens `linkedin_url` in new browser tab
- If no URL: Button disabled, shows "No LinkedIn URL"

#### FR3.2: Copy Message
- Button: "Copy Message"
- Action: Copies textarea content to clipboard
- Feedback: Button text changes to "Copied!" for 2 seconds

#### FR3.3: Mark as Sent
- Button: "Mark Sent ✓"
- Action: 
  - Records `sent_at` timestamp
  - Saves final message text
  - Moves to next contact in queue
- Keyboard shortcut: `Cmd+Enter` (Mac) / `Ctrl+Enter` (Windows)

#### FR3.4: Skip Contact
- Button: "Skip" (secondary)
- Action: Moves to next contact without marking sent
- Use case: Not ready to message this person yet

### FR4: Tracking & Export

#### FR4.1: Session Stats
- Sent today: count
- Sent this week: count
- Total sent: count

#### FR4.2: CSV Export
- Button: "Export CSV"
- Exports all contacts with status = 'sent'
- Columns:
  ```
  name, company, email, linkedin_url, message, channel, source, sent_at, notes
  ```
- Format compatible with HubSpot import

#### FR4.3: History View
- Simple table of sent messages
- Columns: Name, Company, Channel, Sent Date, Message (truncated)
- Click to expand full message

---

## Non-Functional Requirements

### Performance
- Page load: < 2 seconds
- Copy to clipboard: < 100ms
- Mark sent + load next: < 500ms

### Browser Support
- Chrome (primary - Max uses Chrome)
- Safari, Firefox (should work, not primary)

### Data
- All data stored in Supabase
- User authentication via Supabase Auth (email/password or Google)
- Row Level Security: users only see their own data

---

## Technical Specification

### Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Frontend | Next.js 14 + React | Fast, simple, good DX |
| Styling | TailwindCSS + Shadcn/UI | Rapid UI development |
| Backend | Supabase | Auth, DB, hosting in one |
| Database | PostgreSQL (via Supabase) | Reliable, familiar |
| Hosting | Vercel | Zero-config Next.js hosting |

### Database Schema

One table. That's it.

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Main table
CREATE TABLE outreach (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Contact info
  name TEXT NOT NULL,
  company TEXT,
  linkedin_url TEXT,
  email TEXT,
  notes TEXT,
  source TEXT CHECK (source IN ('cold', 'event', 'inbound', 'referral')),
  
  -- Message
  channel TEXT NOT NULL DEFAULT 'linkedin' CHECK (channel IN ('linkedin', 'email')),
  message TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'skipped')),
  sent_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_outreach_user_id ON outreach(user_id);
CREATE INDEX idx_outreach_status ON outreach(status);
CREATE INDEX idx_outreach_created_at ON outreach(created_at);

-- RLS
ALTER TABLE outreach ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own outreach"
  ON outreach FOR ALL
  USING (auth.uid() = user_id);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON outreach
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

### Project Structure

```
flowsend/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Main queue interface
│   │   ├── history/page.tsx      # Sent history
│   │   ├── login/page.tsx        # Auth
│   │   └── api/
│   │       └── export/route.ts   # CSV export endpoint
│   ├── components/
│   │   ├── ui/                   # Shadcn components
│   │   ├── contact-card.tsx      # Current contact display
│   │   ├── contact-form.tsx      # Add/edit contact
│   │   ├── message-input.tsx     # Textarea for Wispr
│   │   ├── action-buttons.tsx    # Open/Copy/Send buttons
│   │   ├── queue-list.tsx        # Pending contacts list
│   │   └── stats-bar.tsx         # Sent counts
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   └── server.ts
│   │   └── utils.ts
│   ├── hooks/
│   │   ├── use-outreach.ts       # CRUD operations
│   │   └── use-keyboard.ts       # Keyboard shortcuts
│   └── types/
│       └── database.ts           # Generated types
├── supabase/
│   └── migrations/
│       └── 001_create_outreach.sql
├── CLAUDE.md
└── .claude/
    ├── settings.json
    └── commands/
```

### API Endpoints

Minimal—most operations are direct Supabase queries from client.

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/export` | Generate and download CSV |

Everything else (CRUD) uses Supabase client directly with RLS.

---

## User Interface Details

### Main Screen Components

#### Contact Card (Current)
```
┌─────────────────────────────────────────────────────────────┐
│  Sarah Chen                                          [Edit] │
│  Product Lead · Acme Corp                                   │
│  🔗 linkedin.com/in/sarahchen                               │
│                                                             │
│  Notes: Met at SaaStr, interested in PLG tools              │
│  Source: event                                              │
├─────────────────────────────────────────────────────────────┤
│  Message                                        [LinkedIn ▼]│
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │  Hey Sarah! Great meeting you at SaaStr...          │   │
│  │                                                     │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                              142/300 chars  │
├─────────────────────────────────────────────────────────────┤
│  [Open LinkedIn]    [📋 Copy]    [Skip]    [✓ Mark Sent]   │
└─────────────────────────────────────────────────────────────┘
```

#### Queue List (Remaining)
```
┌─────────────────────────────────────────────────────────────┐
│  Up Next (3)                                                │
├─────────────────────────────────────────────────────────────┤
│  • John Smith · Beta Inc                             cold   │
│  • Maria Garcia · Gamma LLC                          event  │
│  • Alex Wong · Delta Co                              cold   │
└─────────────────────────────────────────────────────────────┘
```

#### Stats Bar
```
┌─────────────────────────────────────────────────────────────┐
│  Today: 12 sent  │  This Week: 47  │  All Time: 203        │
└─────────────────────────────────────────────────────────────┘
```

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+Enter` | Mark Sent (same as clicking button) |
| `Cmd+Shift+C` | Copy Message |
| `Cmd+O` | Open LinkedIn |
| `Tab` | Move focus through form fields |
| `Esc` | Close any open modal |

### Mobile Considerations

Not a priority for v1. Max works from laptop. Responsive is nice-to-have, not required.

---

## Implementation Plan

### Week 1: Foundation
- [ ] Initialize Next.js project with TypeScript
- [ ] Set up Supabase project and database schema
- [ ] Implement authentication (email/password)
- [ ] Create basic layout and navigation
- [ ] Build contact form (add single contact)

### Week 2: Core Queue
- [ ] Build contact card component
- [ ] Build message textarea (Wispr-compatible)
- [ ] Implement "Open LinkedIn" button
- [ ] Implement "Copy Message" button
- [ ] Implement "Mark Sent" flow
- [ ] Auto-advance to next contact

### Week 3: Bulk & Export
- [ ] CSV import for contacts
- [ ] CSV export for sent messages
- [ ] Queue filtering (by source, status)
- [ ] Search contacts
- [ ] History view (sent messages)

### Week 4: Polish
- [ ] Keyboard shortcuts
- [ ] Stats bar
- [ ] Loading states and error handling
- [ ] Empty states (no contacts, all done)
- [ ] Basic mobile responsiveness
- [ ] Bug fixes from Max's testing

---

## Success Criteria

### Quantitative
| Metric | Current (Manual) | Target | How to Measure |
|--------|------------------|--------|----------------|
| Time per 20 contacts | ~45 min | < 20 min | Max times himself |
| App switches per contact | 3-4 | 1 | Observation |
| Messages tracked | ~50% | 100% | CSV export count vs sent |

### Qualitative
- Max uses it for his weekly batch (not going back to old workflow)
- Max doesn't complain about missing features
- Max recommends it to colleagues

---

## Out of Scope for v1

Explicitly NOT building:
- ❌ HubSpot API integration (CSV export instead)
- ❌ Email sending (just copy/paste)
- ❌ LinkedIn automation of any kind
- ❌ Voice recording/transcription (Wispr handles this)
- ❌ AI message generation (Max writes his own)
- ❌ Templates system
- ❌ Team features / multi-user
- ❌ Analytics dashboard
- ❌ Mobile app
- ❌ Browser extension

These are all reasonable v2+ features, but not v1.

---

## Future Considerations (v2+)

If v1 works for Max, consider:

1. **AI Message Assist** - Optional Claude-powered suggestions based on contact context
2. **HubSpot Integration** - Direct sync instead of CSV
3. **Email Channel** - Draft emails in Gmail/Outlook
4. **Templates** - Save and reuse message structures
5. **Team Mode** - Multiple users, shared contacts
6. **Analytics** - Response tracking, conversion metrics

But only after v1 is validated.

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Wispr Flow changes behavior | Low | High | Text input is standard; would still work with any dictation tool |
| Max doesn't adopt it | Medium | High | Build with Max, get feedback weekly, iterate fast |
| LinkedIn changes URLs | Low | Medium | Just affects "Open LinkedIn" button; easy to update |
| Supabase outage | Low | Medium | Local state preservation; retry logic |

---

## Appendix: CSV Formats

### Import Format (Contacts)
```csv
name,company,linkedin_url,email,notes,source
Sarah Chen,Acme Corp,https://linkedin.com/in/sarahchen,sarah@acme.com,Met at SaaStr,event
John Smith,Beta Inc,https://linkedin.com/in/johnsmith,,Cold outreach,cold
```

### Export Format (Sent Messages)
```csv
name,company,email,linkedin_url,channel,message,source,sent_at,notes
Sarah Chen,Acme Corp,sarah@acme.com,https://linkedin.com/in/sarahchen,linkedin,"Hey Sarah! Great meeting you at SaaStr...",event,2026-01-13T14:30:00Z,Met at SaaStr
```

This format is compatible with HubSpot's contact import. The `message` field can be imported as a note.

---

## Appendix: Wispr Flow Compatibility

FlowSend doesn't integrate with Wispr Flow—it just works alongside it.

**How Wispr Flow works:**
1. User presses hotkey (e.g., `Cmd+Shift+Space`)
2. User speaks
3. Wispr transcribes and types text into the currently focused input field
4. User releases hotkey

**FlowSend's job:**
1. Present a focused textarea when a contact loads
2. Accept whatever text appears (from Wispr or typed manually)
3. That's it

No API, no integration, no dependency. If Wispr changes or Max switches tools, FlowSend still works.

---

*Document Version: 2.0*  
*Last Updated: January 2026*  
*Status: Ready for Development*
