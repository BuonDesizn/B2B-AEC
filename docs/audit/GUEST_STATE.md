# Guest State Audit (Legacy)

## Landing Page Structure
The landing page serves as the primary entry point for unauthenticated users, highlighting core value propositions and categories.

### Top Navigation
- **Logo**: Links to home.
- **Search Bar**:
    - Location: "All India" (Default).
    - Category: Combobox for role types.
    - Requirement Search: Textbox for keywords.
- **CTAs**: "Sign In", "Sign Up", "Create RFP".
- **Role Bar**: Horizontal navigation for Project Professionals, Consultants, Contractors, Equipment/Tools, and Products.

### HERO Section
- **Headline**: "Premier Construction Services, Building Materials & Equipment" (Implicit in title).
- **Sub-headline**: "We’re a curated network and discovery platform..."
- **Trust Counters**: Displays counts for BuonNects, Verified Professionals, Leads Generated, and Zero Commission RFPs (Currently "0+" in UAT).

### Sections
1. **Trusted by Leading Brands**: Marquee/Slider with brand logos (Mahindra, Zepto, etc.).
2. **Video Highlights**: Grid of video thumbnails with play icons.
3. **Popular Project Professionals**: Carousel of profile cards.
    - Card: Name, Service Type (e.g., Consulting Services), Rating, Project Count.
4. **Popular Consultants**: Similar carousel to PPs.
5. **Popular Products**: Carousel of product cards.
    - Card: Name, Category, Rating, Price (current and original).
6. **Popular Contractors**: Carousel of contractor cards.
7. **Popular Equipment/Tools**: Carousel of equipment cards.
8. **Final CTA**: "Ready to build better?" with "Create RFP" and "Contact Us".

### Footer
- **Explore**: Links to all role-based search pages.
- **Legal & About**: About Us, Privacy, Terms, Refund, Contact Us.
- **Copyright**: "Copyright © 2025 M/s Buon Desizn".

## Unauthenticated Search Capability
- **Search without Login**: Possible, but unmasking contact details (Mobile/Email) is blocked.
- **RFP Button**: Clicking "Create RFP" redirects to login.
- **Profile Viewing**: Basic profiles are visible, but the "Handshake" mechanism is disabled for guests.
- **Category Browsing**: Deep links (e.g., /all-users?type=contractors) are fully accessible.
