---
description: Review recent code changes critically before committing
---

# Recent Changes
!`git diff --name-only HEAD~5 2>/dev/null || git diff --name-only`

# Modified Files Content
!`git diff --cached 2>/dev/null || git diff`

---

Review the changes above using the code-reviewer agent mindset:

1. **Security**: Any user input unvalidated? Auth checks missing? Data exposed?
2. **Bugs**: Null handling? Error cases? Logic errors?
3. **Types**: Any `any`? Missing narrowing? Type assertions hiding problems?
4. **Conventions**: Check against CLAUDE.md rules

For each issue, state:
- 🔴 CRITICAL / 🟡 WARNING / 🟢 SUGGESTION
- File and line
- Specific fix

If no issues found, explicitly state what you verified.
