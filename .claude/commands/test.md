---
description: Write tests for a specific component or hook
---

$ARGUMENTS - The component or hook to test (e.g., "contact-card" or "use-outreach")

---

Using the test-writer agent mindset, write comprehensive tests for $ARGUMENTS:

1. **Find the file** and understand what it does
2. **Identify test cases**:
   - Happy path (normal usage)
   - Edge cases (empty, null, very long, etc.)
   - Error cases (network failure, invalid input)
   - User interactions (clicks, typing, keyboard)
3. **Write tests** using React Testing Library
4. **Create mock data** as needed

For FlowSend, always test:
- Empty queue behavior
- Last item in queue behavior
- Missing optional fields (no LinkedIn URL, no email)
- Network failures
- Rapid double-clicks on actions

Output:
1. Complete test file
2. Any mock data files needed
3. List of edge cases covered
4. List of edge cases NOT covered (and why)

Run `bun run test` after writing to verify tests pass.
