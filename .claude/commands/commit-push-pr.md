---
description: Stage, commit with conventional commit message, push, and create PR summary
---

# 1. Check current status
!`git status --short`

# 2. Show what will be committed
!`git diff --cached --stat || git diff --stat`

---

Based on the changes above:

1. **Stage all changes** (if not already staged):
   ```bash
   git add -A
   ```

2. **Create conventional commit message**:
   - feat: new feature
   - fix: bug fix
   - refactor: code change that neither fixes nor adds
   - style: formatting only
   - test: adding tests
   - docs: documentation
   - chore: maintenance
   
   Format: `type(scope): description`
   Example: `feat(queue): add mark-sent functionality with keyboard shortcut`

3. **Commit and push**:
   ```bash
   git commit -m "your message"
   git push origin HEAD
   ```

4. **Generate PR summary** (if pushing a branch):
   - What changed (bullet points)
   - How to test
   - Screenshots if UI changed
