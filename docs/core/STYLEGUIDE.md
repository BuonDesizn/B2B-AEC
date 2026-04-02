# BuonDesizn Style Guide: Visual DNA

This document serves as the **Primary Source of Truth** for UI/UX development. The `@engineer` agent must consume these variables, and the `@qa` agent must audit implementation against these rules.

## 1. Core Typography
- **Headings (Titles)**: `Playfair Display`, Serif. (Architectural feel).
- **Body & Interface**: `Inter`, Sans-serif. (Modern, legible).
- **Fallbacks**: `serif` (Titles), `system-ui` (Body).

## 2. Global Color Palette
Derived from `/audit/images/pp_database_*.png`.

### 2.1 Brand Ecosystem
| Token | Hex | Usage |
| :--- | :--- | :--- |
| `--brand-primary` | `#42207A` | Header, Sidebar icons, Primary Branding |
| `--nav-active` | `#DECEF2` | Sidebar Active State, Highlights |
| `--bg-lavender` | `#F3F0F7` | Global background |
| `--white` | `#FFFFFF` | Card backgrounds, Form inputs |

### 2.2 Role-Specific Persona DNA
Required for dashboard cards and categorization tag.
- **Project Professionals (PP)**: 
  - Bg: `#E7D9F5` | Text: `#6415A5`
- **Consultants (C)**: 
  - Bg: `#D1F2E2` | Text: `#0D6F41`
- **Contractors (CON)**: 
  - Bg: `#F7E9C1` | Text: `#8B5D14`
- **Product Sellers (PS)**: 
  - Bg: `#D9E4F5` | Text: `#1C4E8A`
- **Equipment Dealers (ED)**: 
  - Bg: `#E1D3F5` | Text: `#7045AA`

## 3. Responsive System (Mobile-First)

### 3.1 Breakpoints
- **Mobile**: `< 768px` (Single column stack)
- **Tablet**: `768px - 1024px` (2-column grids)
- **Desktop**: `> 1024px` (Full dashboard layout)

### 3.2 Mobile-First Rules
- **Stacking**: All 12-column grids MUST collapse to a single column (100% width) on Mobile.
- **Touch Targets**: Min-height `48px` for buttons/links.
- **Bottom Navigation**: Persistent bar at `bottom: 0` on screens `< 768px`.
  - Items: Dashboard, RFPs, Handshakes, Profile

## 4. UI Aesthetics (Premium)
- **Glassmorphism**: Use `backdrop-filter: blur(8px)` on modals and navigation overlays.
- **Micro-animations**:
  - `transition: all 0.2s ease-in-out` on all interactive states.
  - Subtle `scale(0.98)` on click/tap to simulate pressure.
- **Shadows**: Use soft, diffuse shadows (`box-shadow: 0 4px 20px rgba(0,0,0,0.05)`).
