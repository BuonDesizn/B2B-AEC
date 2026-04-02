# UI/UX Pro Max - Design Intelligence

Source: https://www.skills.sh/nextlevelbuilder/ui-ux-pro-max-skill/ui-ux-pro-max

## Core Principles

- **Premium AEC Aesthetics**: Clean lines, subtle shadows, and high-quality typography.
- **Handshake Flow**: Progressive disclosure of contact info only after connection.
- **Mobile First**: 48x48dp touch targets for site professionals.

## Quick Reference

### 1. Accessibility (Critical)
- **Contrast**: 4.5:1 ratio minimum.
- **Focus Rings**: 2-4px visible rings on all AEC directory filters.
- **Aria Labels**: Mandatory for role badges (Contractor vs Consultant).

### 2. Touch & Interaction
- **Loading Buttons**: Always disable and show a shimmer/spinner during RFP submission.
- **Feedback**: Immediate visual confirmation for "Connection Sent" (Handshake start).
- **Safe Areas**: Awareness for Notch and Dynamic Island on mobile.

### 3. Style Selection
- **Role Distinction**: Unique visual signatures (e.g., color accents/icons) for each of the 5 roles.
- **Dark Mode**: High-contrast dark mode for outdoor site visibility.
- **Consistency**: Use a single icon set (e.g., Lucide) across all AEC modules.

## Interaction Pattern: Handshake Escalation
1. **Initial View**: Blurred/Masked contact info. CTA: "Connect to Reveal".
2. **Pending**: Disabled button showing "Handshake Pending".
3. **Accepted**: Unmasked highlight with animation + "Call" and "Email" CTAs visible.
