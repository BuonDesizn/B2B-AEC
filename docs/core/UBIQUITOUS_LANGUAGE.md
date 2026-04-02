# 📖 Ubiquitous Language: BuonDesizn Glossary

This is the **Master Authority** for domain terms. All agents must use these terms correctly in code, documentation, and logic.

---

## 🎭 Master Role Identities (The 5 Personas)

| Role | Code | Entity Type | Description |
| :--- | :--- | :--- | :--- |
| **Project Professional** | `PP` | Individual | Independent professionals (Architects, Engineers) with a locked **PAN-based** identity. |
| **Consultant** | `C` | Firm/Inst. | Specialized consulting firms with GSTIN-based linking. |
| **Contractor** | `CON` | Workforce | Execution agencies focused on site-based work and compliance. |
| **Product Seller** | `PS` | SKU/Catalog | Material suppliers and showroom owners. |
| **Equipment Dealer** | `ED` | Fleet/Asset | Heavy machinery and tool rental/sales providers. |

---

## 🧭 Core Mechanics

### 1. **Handshake Economy**
*   **Definition**: A trust-based data disclosure model where PII (Contact Info) is masked until an explicit connection is accepted.
*   **States**: `MASKED` ➡️ `REQUESTED` ➡️ `ACCEPTED` (Unmasked).

### 2. **DQS (Discovery Quality Score)**
*   **Definition**: A multi-factor profile rating (Verified status, GSTIN age, Portfolio depth).
*   **The Master Rule**: Discovery ranking is **70% DQS / 30% Distance**.

### 3. **Proximity Paradox**
*   **Definition**: The architectural requirement that distance must be a primary filter but cannot override verified quality.
*   **Constraint**: PostGIS `GIST` indexing is mandatory for all geo-spatial queries.
*   **Standard Radius**: **50km** for initial discovery broadcasts.

---

## 🧬 Identity Architecture

### **Company DNA (GSTIN-Linking)**
*   Identity logic where multiple individuals (`PP`) can belong to a single firm (`GSTIN`).
*   **Rule**: Permission inheritance flows from the Firm to the Individual.

### **Identity Key (PAN)**
*   Permanent account number. Individual identity is immutable and globally unique.

---

## 🛠️ Technical Primitives

- **PPR**: Partial Prerendering (Next.js 15).
- **RLS**: Row-Level Security (Supabase/Postgres).
- **PostGIS**: Spatial database extension for proximity calculations.
- **SDD Loop**: Streamlined Development Loop (The autonomous developer pipeline).
