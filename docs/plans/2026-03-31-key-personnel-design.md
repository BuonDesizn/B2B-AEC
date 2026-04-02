# Task: Key Personnel Management (Module 1)

**Status**: Verified & Ready for Implementation
**Designation**: High-Trust Team Management

## Objective
Enable Master Representatives (PP, C, CON, PS, ED) to manage their firm's roster independently of individual user accounts, ensuring that team data is synchronized via the **Company DNA** (GSTIN) and protected by Row Level Security (RLS).

## Core Architecture: The "Company DNA" Synchronization

Unlike legacy systems that tied personnel to a single user, BuonDesizn uses the **GSTIN** as the anchor. If a handshake is accepted with ANY representative of a firm, the entire team's contact information is unmasked for that connection.

### 1. Database Implementation (`company_personnel`)
- **Public Layer**: Name, Designation, Qualification, Specialty, Experience, LinkedIn.
- **Masked Layer**: Email, Phone, Detailed Bio, Profile Image.
- **Linkage**: Managed by a `profile_id` (Master Rep) but unmasked via `company_gstin`.

### 2. Row Level Security (RLS) Policy
The policy unmasks the `email` and `phone` fields if:
- `auth.uid()` matches the `profile_id` (the owner).
- An `ACCEPTED` connection exists between the viewer and ANY `profile` sharing the same `gstin` as the personnel record.

## Implementation Steps

### Phase 1: Database Migration
- [ ] Execute `CREATE TABLE company_personnel` with RLS enabled.
- [ ] Implement the `Personnel Visibility via Company DNA` policy.
- [ ] Create indexes on `company_gstin` and `profile_id`.

### Phase 2: Management UI
- [ ] Build the "My Team" dashboard for Master Representatives.
- [ ] Implement the bulk CSV import flow with background job tracking.
- [ ] Add the single-entry form for rapid personnel updates.

### Phase 3: Discovery Integration
- [ ] Update the Profile View to fetch linked personnel via the `company_personnel` table.
- [ ] Implement the unmasking trigger on the frontend after handshake acceptance.

## Verification Checklist
- [ ] Verify that unlinked users see "Masked" indicators for email/phone.
- [ ] Verify that accepting a handshake with the Master Rep unmasks the entire team for the requester.
- [ ] Test bulk CSV upload with 100+ entries for performance.
