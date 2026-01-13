---
description: Clean up and simplify code after a feature is working
---

# All Source Files
!`find src -name "*.ts" -o -name "*.tsx" 2>/dev/null | head -30`

---

Using the code-simplifier agent mindset, review and clean up:

1. **Dead Code**: Unused imports, variables, commented code, console.logs
2. **Duplication**: Extract repeated logic to functions/components/hooks
3. **Complexity**: Flatten nesting, simplify conditionals, split long functions
4. **Naming**: Replace vague names (data, item, handleClick) with specific ones
5. **Types**: Inline one-off types, extract reused types

Process:
1. Run `bun run typecheck` first to ensure it passes
2. Make ONE change at a time
3. Verify typecheck still passes after each change
4. Report what you changed and why

Output format:
```
REMOVED: [what] - [why unnecessary]
EXTRACTED: [what] → [new location]
RENAMED: [old] → [new]
SIMPLIFIED: [what] - [how]
```
