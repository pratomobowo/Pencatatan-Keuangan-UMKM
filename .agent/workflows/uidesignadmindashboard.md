---
description: Apply Admin Dashboard Design System to UI components
---

# UI Design Admin Dashboard Workflow

Use this workflow when redesigning or creating new UI components for the Admin Dashboard.

## Steps

1. **Read Design System**
   - Open and read `docs/DESIGN_SYSTEM.md` for reference.

2. **Analyze Current Component**
   - View the target component file.
   - Identify elements that violate the design system (e.g., `font-bold`, gradients, inconsistent spacing).

3. **Apply Design System Rules**
   - **Typography**: Replace `font-bold` with `font-semibold`, use correct text sizes.
   - **Colors**: Use solid colors only, apply semantic colors correctly.
   - **Spacing**: Use `p-6` for cards, `px-4 py-3` for table cells, etc.
   - **Components**: Follow the exact class patterns for buttons, cards, tables, inputs, badges, tabs.
   - **Page Structure**: Use correct header, subheading, filter bar, and empty state patterns.

4. **Verify Build**
   - Run `npm run build` to ensure no errors.

5. **Update Documentation**
   - Update `task.md` and `walkthrough.md` as needed.