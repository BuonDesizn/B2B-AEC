# Mock Data Blueprint: AEC B2B Context

This document defines the **realistic data shapes** required for autonomous testing and TDD. Every mock entry must align with the `db_schema.md` and `STYLEGUIDE.md` definitions.

## 1. System Configuration (Marketplace Governance)

### 1.1 Governance Parameters
```json
{
  "table": "system_config",
  "data": [
    {
      "key": "discovery_ranking_split",
      "value": {"quality_weight": 0.7, "distance_weight": 0.3},
      "description": "Weighting for DQS vs Distance in search results."
    },
    {
      "key": "dqs_sub_weights",
      "value": {"responsiveness": 0.4, "trust_loops": 0.3, "verification": 0.2, "profile_depth": 0.1},
      "description": "Internal weights for calculating DQS."
    }
  ]
}
```

## 2. Identity Anchors (Profiles)

### 2.1 Individual Professional (PAN Linked)
```json
{
  "id": "u-prof-001",
  "persona_type": "PP",
  "full_name": "Ar. Arjun Mehta",
  "pan": "ABCDE1234F",
  "is_individual": true,
  "location": "POINT(77.1025 28.7041)", 
  "city": "New Delhi",
  "state": "Delhi",
  "dqs_score": 0.85,
  "verification_status": "VERIFIED"
}
```

### 2.2 Corporate Entity (GSTIN Linked - 2-Step Gate)
```json
{
  "id": "u-firm-001",
  "persona_type": "C",
  "org_name": "Skyline Engineering Consultants",
  "gstin": "07AAAAA0000A1Z5",
  "is_individual": false,
  "location": "POINT(72.8777 19.0760)",
  "city": "Mumbai",
  "state": "Maharashtra",
  "dqs_score": 0.92,
  "verification_status": "PENDING_ADMIN", 
  "notes": "API Lookup Passed. Waiting for SUPER_ADMIN sign-off."
}
```

## 3. PII Gateway (get_visible_contact_info)

### 3.1 Scenario: No Active Handshake (Anonymous)
- **Input**: `target_profile_id: 'u-firm-001'`, `viewer_id: 'u-prof-001'`
- **Internal State**: No accepted record in `connections`.
- **Expected Output**:
```json
{
  "phone_primary": "+91-XXXXX-123",
  "email_business": "a*******@skyline.com",
  "status": "MASKED",
  "reason": "Handshake Required"
}
```

### 3.2 Scenario: Active Handshake (Unmasked)
- **Input**: `target_profile_id: 'u-firm-001'`, `viewer_id: 'u-prof-001'`
- **Internal State**: `connections` row exists with `status: 'ACCEPTED'`.
- **Expected Output**:
```json
{
  "phone_primary": "+91-98200-12345",
  "email_business": "admin@skyline.com",
  "status": "UNMASKED",
  "audit_ref": "audit-uuid-456"
}
```

## 4. Role-Specific Data

### 4.1 Project Professional (PP)
- **Designation**: Architect
- **COA Number**: CA/2015/12345
- **Portfolio**: `[{"title": "Lutyens Villa Refurb", "year": 2022}]`

### 4.2 Contractor (CON)
- **Work Categories**: ["Structural Steel", "RCC", "HVAC"]
- **Equipment Fleet**: `[{"type": "JCB 3DX", "count": 2}, {"type": "Tower Crane", "count": 1}]`

## 5. Dynamic Ranking Scenarios
To test the Quality-First priority (currently 70/30 in `system_config`):
- **Profile A**: DQS 0.95 | Distance: 50km
- **Profile B**: DQS 0.60 | Distance: 5km
- **Target Logic**: Profile A must rank higher despite being further away due to Quality-First priority.
- **Edge Case**: If `discovery_ranking_split` is flipped to `proximity: 0.8 / quality: 0.2` by SUPER_ADMIN, Profile B must instantly jump to the top.
