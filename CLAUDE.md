# FlowSend v1

## What This Is
Voice-first outreach queue for Max. Wispr Flow handles voice→text, we handle the workflow.

## Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict)
- **Styling**: TailwindCSS + Shadcn/UI
- **Database**: Supabase (PostgreSQL + Auth)
- **Hosting**: Vercel
- **Package Manager**: npm

## Commands
```bash
npm run dev        # Dev server on :3000
npm run build      # Production build
npm run lint       # ESLint
npm run typecheck  # TypeScript check
npm run test       # Run tests
```

## Database
One table: `outreach`. That's it.

```sql
-- See supabase/migrations/001_create_outreach.sql for full schema
SELECT * FROM outreach WHERE user_id = auth.uid() AND status = 'pending';
```

## Key Files
```
src/app/page.tsx           # Main queue UI
src/components/
  contact-card.tsx         # Current contact + message input
  action-buttons.tsx       # Open LinkedIn / Copy / Mark Sent
  queue-list.tsx           # Pending contacts sidebar
src/hooks/use-outreach.ts  # All CRUD operations
```

## Code Rules
- `type` over `interface`
- No `enum` → use `'pending' | 'sent' | 'skipped'`
- No `any` → use `unknown` and narrow
- React Query for server state
- Supabase client for all DB operations (no custom API routes except CSV export)

## Component Pattern
```tsx
type Props = {
  contact: Contact;
  onMarkSent: () => void;
};

export function ContactCard({ contact, onMarkSent }: Props) {
  // ...
}
```

## The One Thing That Matters
The textarea must auto-focus when a contact loads. This is where Wispr Flow types.

```tsx
const textareaRef = useRef<HTMLTextAreaElement>(null);

useEffect(() => {
  textareaRef.current?.focus();
}, [currentContact]);
```

## Don't Do
- ❌ Custom voice recording (Wispr does this)
- ❌ LinkedIn automation (manual only)
- ❌ HubSpot API calls (CSV export only)
- ❌ Multiple tables (one table is enough)
- ❌ Over-engineering (Max is the only user)

---

## PLAN FIRST (Important!)

Before writing ANY code, always:

1. **State what you're about to build** in plain English
2. **List the files you'll create/modify**
3. **Identify edge cases** (empty state, errors, missing data)
4. **Wait for confirmation** if the task is complex

This prevents wasted work and catches misunderstandings early.

Example:
```
I'll build the contact-card component:
- Create src/components/contact-card.tsx
- Display: name, company, LinkedIn URL, notes
- Textarea for message (auto-focus for Wispr)
- Character count (300 for connection request, 8000 for message)

Edge cases to handle:
- No LinkedIn URL → disable "Open LinkedIn" button
- No company → show just the name
- Empty message → disable "Copy" button

Proceed?
```

---

## Self-Review (Before Completing ANY Task)

Before marking any task complete, review your own code:

1. **Security**: Is user input validated? Are auth checks in place? Is RLS enabled?
2. **Error Handling**: Are all async operations in try/catch? Are errors shown to user?
3. **Types**: Any `any` types? Any type assertions (`as`) hiding problems?
4. **Conventions**: Does it follow the rules above?
5. **Edge Cases**: Empty data? Null values? Network failure?
6. **UX**: Loading states? Error states? Feedback on actions?

If you find issues, **fix them before presenting the code**.

---

## Available Agents

Use these for deeper review:

- **code-reviewer**: Security, bugs, types, performance (`/review`)
- **ui-ux-reviewer**: Accessibility, UX, visual consistency (`/ux-review`)
- **code-simplifier**: Dead code, duplication, complexity (`/simplify`)
- **test-writer**: Comprehensive tests with edge cases (`/test [component]`)

---

## Slash Commands

- `/review` - Critical code review before commit
- `/ux-review` - UI/UX and accessibility review
- `/simplify` - Clean up working code
- `/test [name]` - Write tests for a component/hook
- `/verify` - Run typecheck, lint, test, build
- `/commit-push-pr` - Stage, commit, push with PR summary
