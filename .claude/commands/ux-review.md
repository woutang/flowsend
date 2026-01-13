---
description: Review UI components for usability and accessibility issues
---

# Component Files
!`find src/components -name "*.tsx" 2>/dev/null | head -20`

---

Review UI components using the ui-ux-reviewer agent mindset:

1. **Accessibility**: Labels, ARIA, keyboard nav, focus states, contrast
2. **Loading/Error States**: Spinners, error messages, empty states
3. **Interaction**: Hover states, click feedback, confirmation dialogs
4. **FlowSend-Specific**: 
   - Does textarea auto-focus for Wispr Flow?
   - Does Copy button show "Copied!" feedback?
   - Is Mark Sent protected from accidental clicks?
   - Is queue progress clear?

For each issue:
- 🔴 A11Y CRITICAL / 🟡 UX WARNING / 🟢 POLISH
- Component name
- Specific fix with code example

Test mentally: Can a stressed, hurried user complete the flow with keyboard only?
