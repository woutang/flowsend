---
name: fullstack-dev
description: Comprehensive fullstack development patterns for modern web applications. Use when building React/Next.js applications with TypeScript, setting up project architecture, implementing API routes, managing state, or following development best practices. Includes patterns for authentication, database integration, testing, and deployment.
---

# Fullstack Development Skill

Guide for building production-grade fullstack applications with modern best practices.

## Project Initialization

### Start with Architecture

Before writing code, establish:
1. **Tech stack confirmation** - Verify framework versions, package choices
2. **Directory structure** - Create scalable folder organization
3. **Configuration files** - TypeScript, ESLint, Prettier, environment
4. **Database schema** - Design before implementation
5. **API contracts** - Define endpoints and types

### Recommended Directory Structure

```
project/
├── .claude/
│   ├── CLAUDE.md           # Project-specific instructions
│   ├── settings.json       # Permissions and hooks
│   └── commands/           # Slash commands
├── src/
│   ├── app/                # Next.js App Router pages
│   ├── components/
│   │   ├── ui/             # Reusable UI primitives
│   │   ├── forms/          # Form components
│   │   └── [feature]/      # Feature-specific components
│   ├── lib/
│   │   ├── api/            # API client utilities
│   │   ├── db/             # Database utilities
│   │   └── utils/          # General utilities
│   ├── hooks/              # Custom React hooks
│   ├── types/              # TypeScript type definitions
│   └── styles/             # Global styles
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── scripts/                # Build/deploy scripts
```

## TypeScript Patterns

### Type Definitions

```typescript
// Prefer type over interface for most cases
type User = {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
};

// Use interface only for extension/declaration merging
interface ApiResponse<T> {
  data: T;
  error: string | null;
  status: number;
}

// Never use enum, use const objects or unions
// ❌ Bad
enum Status { Active, Inactive }

// ✅ Good
const STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;
type Status = typeof STATUS[keyof typeof STATUS];

// Or simpler
type Status = 'active' | 'inactive';
```

### Strict Mode Essentials

```typescript
// Always handle null/undefined
function getUser(id: string): User | null {
  // ...
}

// Use narrowing
function processValue(value: string | number) {
  if (typeof value === 'string') {
    return value.toUpperCase();
  }
  return value * 2;
}

// Prefer unknown over any
function parseJson(json: string): unknown {
  return JSON.parse(json);
}
```

## React Patterns

### Component Structure

```typescript
// Standard component pattern
type ButtonProps = {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
};

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  onClick,
}: ButtonProps) {
  return (
    <button
      className={cn(
        'rounded font-medium transition-colors',
        variants[variant],
        sizes[size],
        isLoading && 'opacity-50 cursor-not-allowed'
      )}
      onClick={onClick}
      disabled={isLoading}
    >
      {isLoading ? <Spinner /> : children}
    </button>
  );
}
```

### Custom Hooks

```typescript
// Data fetching hook pattern
function useContacts() {
  return useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

// Form state hook
function useForm<T>(initialValues: T) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  
  const handleChange = (field: keyof T) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setValues(prev => ({ ...prev, [field]: e.target.value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };
  
  return { values, errors, handleChange, setErrors };
}
```

## API Design

### Next.js Route Handlers

```typescript
// app/api/contacts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const CreateContactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  company: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = CreateContactSchema.parse(body);
    
    const contact = await db.contacts.create({
      data: validated,
    });
    
    return NextResponse.json({ data: contact }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Failed to create contact:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Error Handling

```typescript
// Centralized error types
class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Error handler utility
function handleApiError(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }
  
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: 'Validation failed', details: error.errors },
      { status: 400 }
    );
  }
  
  console.error('Unhandled error:', error);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
```

## State Management

### React Query for Server State

```typescript
// Query configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// Mutation with optimistic updates
function useUpdateContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (contact: Partial<Contact> & { id: string }) => {
      const { data, error } = await supabase
        .from('contacts')
        .update(contact)
        .eq('id', contact.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onMutate: async (newContact) => {
      await queryClient.cancelQueries({ queryKey: ['contacts'] });
      const previous = queryClient.getQueryData(['contacts']);
      
      queryClient.setQueryData(['contacts'], (old: Contact[]) =>
        old.map(c => c.id === newContact.id ? { ...c, ...newContact } : c)
      );
      
      return { previous };
    },
    onError: (err, newContact, context) => {
      queryClient.setQueryData(['contacts'], context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}
```

### Zustand for Client State

```typescript
// Simple store pattern
type AppStore = {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  currentBatch: string | null;
  setCurrentBatch: (id: string | null) => void;
};

const useAppStore = create<AppStore>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  currentBatch: null,
  setCurrentBatch: (id) => set({ currentBatch: id }),
}));
```

## Testing Patterns

### Unit Tests with Vitest

```typescript
// Component test
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledOnce();
  });
  
  it('shows loading state', () => {
    render(<Button isLoading>Submit</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### API Route Tests

```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('POST /api/contacts', () => {
  it('creates a contact with valid data', async () => {
    const response = await fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'John Doe',
        email: 'john@example.com',
      }),
    });
    
    expect(response.status).toBe(201);
    const { data } = await response.json();
    expect(data.name).toBe('John Doe');
  });
  
  it('returns 400 for invalid data', async () => {
    const response = await fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '' }),
    });
    
    expect(response.status).toBe(400);
  });
});
```

## Common Pitfalls to Avoid

1. **Don't fetch in useEffect** - Use React Query or Server Components
2. **Don't use `any`** - Use `unknown` and narrow types
3. **Don't skip error boundaries** - Wrap features in error boundaries
4. **Don't hardcode URLs** - Use environment variables
5. **Don't forget loading states** - Every async operation needs UI feedback
6. **Don't ignore TypeScript errors** - Fix them, don't suppress
7. **Don't use `index` as key** - Use stable identifiers
8. **Don't mutate state directly** - Always create new references

## Performance Checklist

- [ ] Code splitting with dynamic imports
- [ ] Image optimization with next/image
- [ ] Database queries are indexed
- [ ] API responses are cached appropriately
- [ ] Bundle size is analyzed and optimized
- [ ] Lighthouse score > 90

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Error monitoring enabled (Sentry)
- [ ] Analytics configured
- [ ] SSL certificates valid
- [ ] Health check endpoint working
- [ ] Rate limiting configured
- [ ] Backup strategy in place
