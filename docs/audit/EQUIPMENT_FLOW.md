# Equipment Management Flow Audit (Legacy)

## Dashboard Entry
- **Role**: Equipment Dealer / Rental Agency.
- **Entry Point**: /dashboard-equipment -> "Add Equipment" button or /equipments -> "+" icon.

## Equipment Form Structure
The "Add Equipment" flow is optimized for heavy machinery and construction tools, with specific fields for logistics and financing.

### 1. Basic Equipment Details
- **Equipment Name**: Required textbox.
- **Equipment Category**: Combobox (e.g., Excavators, Cranes, Generators).
- **Manufactured On**: Date picker (Day/Month/Year).
- **Equipment Description**: Multiline textbox.
- **Financing/Legal**:
    - "Hypothecated to any Bank or NBFC?": Yes/No (Critical for title transfer/sale).
    - "Registration Certificate Available?": Yes/No (RC Status).

### 2. Media Uploads
- **Equipment Images**: Drag & drop or click-to-add. (JPG, PNG, Max 5 images, 5MB each).
- **Equipment Catalog**: File upload (.pdf, 10MB).
- **Equipment Video**: File upload (.mov, .mp4, up to 50MB).

### 3. Pricing & Location
- **Monthly Rental Price (INR)**: Textbox (Primary for rental business).
- **Selling Price/no. (INR)**: Textbox (Primary for equipment sales).
- **Current Location**: Required textbox (Vital for mobilization cost estimation).

### 4. Equipment Performance (Dynamic)
- Technical spec builder similar to the Product flow.
- **Fields**: Select Property (e.g., Engine HP, Lifting Capacity), Unit, Value, Testing Standard.
- **Logic**: "+" button to add rows.

## Modernization Opportunities (Phase 1)
1. **IoT Readiness**: Add a field for "GPS Tracker ID" or "Telematics Provider" to support real-time machine tracking.
2. **Availability Calendar**: Replace static pricing with a dynamic availability/booking calendar.
3. **Mobilization Calculator**: Auto-calculate transport costs based on "Current Location" vs. the searching Project's location.
4. **Maintenance Logs**: Add a section to upload "Last Service Certificate" or "Fitness Certificate" to boost trust (DQS).
