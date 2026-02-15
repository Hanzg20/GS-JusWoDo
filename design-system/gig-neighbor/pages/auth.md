# Auth Page Overrides

> **PROJECT:** Gig Neighbor
> **Generated:** 2026-02-10 22:47:00
> **Page Type:** Authentication

> ⚠️ **IMPORTANT:** Rules in this file **override** the Master file (`design-system/MASTER.md`).
> Only deviations from the Master are documented here. For all other rules, refer to the Master.

---

## Page-Specific Rules

### Layout Overrides

- **Max Width:** 1200px (standard)
- **Layout:** Full-width sections, centered content
- **Sections:** 1. Hero (date/location/countdown), 2. Speakers grid, 3. Agenda/schedule, 4. Sponsors, 5. Register CTA

### Spacing Overrides

- No overrides — use Master spacing

### Typography Overrides

- No overrides — use Master typography

### Color Overrides

- **Strategy:** Urgency colors (countdown). Event branding. Speaker cards professional. Sponsor logos neutral.

### Component Overrides

- Avoid: Force linear unskippable tour
- Avoid: Default keyboard for all inputs
- Avoid: Desktop-first causing mobile issues

---

## Page-Specific Components

- No unique components for this page

---

## Recommendations

- Effects: Small hover (50-100ms), loading spinners, success/error state anim, gesture-triggered (swipe/pinch), haptic
- Onboarding: Provide Skip and Back buttons
- Forms: Use inputmode attribute
- Responsive: Start with mobile styles then add breakpoints
- CTA Placement: Register CTA sticky + After speakers + Bottom
