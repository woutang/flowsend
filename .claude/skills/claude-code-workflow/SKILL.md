---
name: claude-code-workflow
description: Best practices for Claude Code development workflows based on Boris Cherny's (creator of Claude Code) setup. Use when setting up a new project with Claude Code, creating CLAUDE.md files, configuring slash commands, hooks, subagents, or optimizing the development workflow for maximum productivity.
---

# Claude Code Workflow Skill

Patterns and best practices from the creator of Claude Code for optimal development workflows.

## Project Setup

### CLAUDE.md - The Memory File

Create a `CLAUDE.md` in project root. This is Claude's persistent memory for the project.

```markdown
# Project Name

## Quick Facts
- **Stack**: React, TypeScript, Next.js, Supabase
- **Package Manager**: bun (not npm)
- **Test Command**: `bun run test`
- **Lint Command**: `bun run lint`
- **Build Command**: `bun run build`

## Key Directories
- `src/app/` - Next.js App Router pages
- `src/components/` - React components
- `src/lib/` - Utility functions
- `tests/` - Test files

## Code Style
- TypeScript strict mode always
- Prefer `type` over `interface`
- **Never use `enum`** - use string literal unions
- No `any` - use `unknown` and narrow
- Functional components with hooks only

## Commands
- `bun run dev` - Development server
- `bun run test -- -t "name"` - Single test
- `bun run typecheck` - Type checking

## PR Guidelines
- One feature per PR
- Include tests for new features
- Update CLAUDE.md if conventions change

## Common Mistakes (Don't Do These)
- Don't use npm (use bun)
- Don't commit .env files
- Don't skip error handling
- Don't use any type
```

**Key Practice:** When you see Claude do something wrong, add it to CLAUDE.md immediately. This creates compounding learning.

### Settings Configuration

Create `.claude/settings.json` for permissions and hooks:

```json
{
  "permissions": {
    "allow": [
      "bun run *",
      "bunx *",
      "git *",
      "npx supabase *"
    ],
    "deny": [
      "rm -rf /*"
    ]
  },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "bun run lint --fix",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

## Slash Commands

Store reusable workflows in `.claude/commands/`.

### /commit-push-pr.md

```markdown
---
description: Commit changes, push to remote, and create PR
---

# Git Status
!`git status --short`

# Current Branch
!`git branch --show-current`

# Recent Commits
!`git log -3 --oneline`

Based on the above:
1. Stage all relevant changes
2. Create a descriptive commit message following conventional commits
3. Push to remote
4. Create PR if on feature branch
```

### /test-feature.md

```markdown
---
description: Run tests for a specific feature
---

# Test Files
!`find tests -name "*.test.ts" | head -20`

# Coverage Report
!`bun run test:coverage --reporter=summary`

Run the tests related to the feature I'm working on and summarize results.
```

### /simplify-code.md

```markdown
---
description: Simplify and refactor code after feature is complete
---

Review the recent changes and:
1. Remove any dead code
2. Simplify complex logic
3. Extract repeated patterns
4. Improve naming
5. Add missing types

Don't change functionality - only improve code quality.
```

### /verify-app.md

```markdown
---
description: Verify the app works end-to-end before PR
---

1. Run the full test suite: `bun run test`
2. Check types: `bun run typecheck`
3. Check lint: `bun run lint`
4. Build the app: `bun run build`
5. Report any failures

If all pass, the feature is ready for review.
```

## Subagents

Create specialized agents in `.claude/agents/`.

### code-simplifier.md

```markdown
---
name: code-simplifier
description: Simplifies code after features are complete
---

You are a code simplification specialist. Your job is to:

1. Review recent changes to the codebase
2. Identify opportunities to simplify without changing behavior
3. Remove dead code and unused imports
4. Extract common patterns into utilities
5. Improve naming for clarity

Rules:
- Never change functionality
- Keep all tests passing
- Prefer readability over cleverness
- Document non-obvious simplifications
```

### test-writer.md

```markdown
---
name: test-writer
description: Writes comprehensive tests for new features
---

You are a testing specialist. For any new feature:

1. Identify all code paths to test
2. Write unit tests for utilities and hooks
3. Write integration tests for API routes
4. Write component tests for React components
5. Ensure edge cases are covered

Use:
- Vitest for unit/integration tests
- Testing Library for component tests
- MSW for API mocking

Coverage target: 80%+ for new code.
```

## Workflow Patterns

### Plan Mode First (Critical)

Always start non-trivial tasks in Plan Mode:

```
1. Press Shift+Tab twice to enter Plan Mode
2. Describe what you want to build
3. Iterate on the plan with Claude until it's solid
4. Switch to auto-accept mode (Shift+Tab once)
5. Claude executes the plan
```

**Why:** A good plan makes Claude 2-3x faster and more accurate. Skipping planning to save time usually costs more time in corrections.

### Parallel Sessions

Run multiple Claude Code sessions for maximum productivity:

```
Terminal Setup:
- Tab 1: Main feature development
- Tab 2: Running tests
- Tab 3: Code review
- Tab 4: Documentation
- Tab 5: Bug fixes

Each tab should be a separate git checkout to avoid conflicts.
```

Configure iTerm2/terminal notifications to alert when Claude needs input.

### Verification Loop

**The most important pattern:** Always give Claude a way to verify its work.

Options for verification:
1. **Test suite** - `bun run test`
2. **Type checking** - `bun run typecheck`
3. **Linting** - `bun run lint`
4. **Build** - `bun run build`
5. **Browser testing** - Claude Chrome extension
6. **Manual check** - Describe expected outcome

Without verification, Claude can't iterate. With verification, output quality improves 2-3x.

### Hook Automation

Use hooks for automatic quality gates:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "[ \"$(git branch --show-current)\" != \"main\" ] || exit 2",
            "timeout": 5,
            "description": "Block edits on main branch"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "bun run prettier --write .",
            "timeout": 30,
            "description": "Auto-format code"
          }
        ]
      }
    ]
  }
}
```

## Model Selection

**Use Opus 4.5 with thinking for everything.**

Reasoning:
- Despite being slower per token, you steer it less
- Better tool use means fewer iterations
- Total time is often faster than smaller models
- Quality is consistently higher

The bottleneck isn't token generation speed—it's human time spent correcting mistakes.

## MCP Integrations

Connect external tools via MCP servers:

```bash
# Add MCP servers
claude mcp add slack npx @anthropic/mcp-server-slack
claude mcp add github npx @anthropic/mcp-server-github
```

Common integrations:
- **Slack** - Search and post messages
- **GitHub** - Create PRs, manage issues
- **BigQuery** - Run analytics queries
- **Sentry** - Check error logs

## Code Review Workflow

Use @.claude tagging on PRs to update CLAUDE.md:

1. Reviewer spots something Claude should know
2. Reviewer comments: "@.claude Add to CLAUDE.md: Never use xyz pattern"
3. Claude Code GitHub action updates the file
4. Learning is preserved for future sessions

This creates **compounding engineering** - every correction makes future work better.

## Long-Running Tasks

For tasks that take hours:

```bash
# Option 1: Background agent verification
claude --permission-mode=dontAsk "Build feature X and verify with tests"

# Option 2: Use Stop hook for verification
# Configure in settings.json to run tests on agent stop

# Option 3: Ralph Wiggum plugin
# Auto-commits and verifies on long-running tasks
claude mcp add ralph-wiggum npx ralph-wiggum-mcp
```

## Debugging Workflow

When Claude is stuck:

1. **Reset context** - Start fresh chat
2. **Simplify scope** - Break into smaller tasks
3. **Add verification** - Give Claude a way to test
4. **Check CLAUDE.md** - Maybe conventions are unclear
5. **Use subagent** - Fresh perspective sometimes helps

## Checklist: New Project Setup

- [ ] Create CLAUDE.md with stack and conventions
- [ ] Create .claude/settings.json with permissions
- [ ] Create essential slash commands (/commit-push-pr, /verify)
- [ ] Set up test infrastructure with verification
- [ ] Configure PostToolUse hook for auto-formatting
- [ ] Add project to version control
- [ ] Test workflow end-to-end

## Common Anti-Patterns

1. **No CLAUDE.md** - Claude re-learns conventions every session
2. **Skipping Plan Mode** - More corrections later
3. **No verification** - Can't iterate effectively
4. **Using Sonnet for complex tasks** - False economy
5. **Editing on main** - Recipe for conflicts
6. **Manual repetitive tasks** - Should be slash commands
7. **No hooks** - Missing automatic quality gates
