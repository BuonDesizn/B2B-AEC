# Product Management Flow Audit (Legacy)

## Dashboard Entry
- **Role**: Product Seller / Manufacturer.
- **Entry Point**: /dashboard-seller -> "Add Product" button or /products -> "+" icon.

## Product Form Structure
The "Add Product" flow is a comprehensive single-page form divided into four major sections.

### 1. Basic Product Details
- **Product Name**: Required textbox.
- **Material Category**: Combobox (e.g., Tiles, Cement, Bricks).
- **Material Type**: Dependent combobox.
- **Product Description**: Multiline textbox (Max 250 characters).
- **Area of Application**: Multiline textbox.

### 2. Media Uploads
- **Product Images**: Drag & drop or click-to-add. (JPG, PNG, Max 5 images, 5MB each).
- **Product Catalog**: File upload (.pdf, 10MB).
- **Product Video**: File upload (.mov, .mp4, up to 50MB).

### 3. Specifications & Commercial Info
- **Model No.**: Required textbox.
- **Manufactured by**: Required textbox.
- **Minimum Order Qty (MOQ)**: Required textbox (Numeric only).
- **Lead Time**: Textbox.
- **Manufacturing Location**: Required textbox.
- **Size (L x B x H)**: Required textbox (Format constrained).
- **Unit of Measurement (UOM)**: Combobox (e.g., cubic centimeter, square feet).
- **Color Options**: Multi-select and Color picker (`ColorWell`).
- **Commercials**:
    - Price/Unit (INR): Required.
    - Discount Price/Unit: Optional.
    - Warranty (Years): Optional.
- **Compliance**: "Green Building Compliant?" (Yes/No).
- **Promotion**: "Is Featured?" (Yes/No).
- **Searchability**: "Product Tag" (Comma-separated).

### 4. Material Properties (Dynamic)
- Users can add multiple technical attributes.
- **Fields**: Attribute Name (Combobox), Unit (Combobox), Value, Testing Standard.
- **Logic**: "+" button to append new rows.

## Modernization Opportunities (Phase 1)
1. **AI Tagging**: Auto-generate "Product Tags" from images using Sightengine or GPT-4o.
2. **Dynamic Specs**: Adaptive form fields based on "Material Category" (e.g., specific specs for Cement vs. Lighting).
3. **Price Indexing**: Real-time comparison with market averages.
4. **Validation**: Enforce standard "Size" format via structured inputs (3 separate fields) instead of a single string.
