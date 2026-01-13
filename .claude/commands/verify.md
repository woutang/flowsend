---
description: Run all checks before committing (typecheck, lint, test, build)
---

!`bun run typecheck && bun run lint && bun run test 2>/dev/null; bun run build`

Report pass/fail for each step. If any fail, show the errors and suggest fixes.
