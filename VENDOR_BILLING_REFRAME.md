# Vendor Billing Line Items - Complete Reframe

## 🔄 NEW REQUIREMENTS (November 29, 2025)

### Previous System:
- ❌ Single billing record per site
- ❌ Started from site detail page
- ❌ Complex 8-stage workflow

### New System:
- ✅ **Multiple approval requests** per site
- ✅ **Line items** with predefined categories
- ✅ **Email integration** with Outlook
- ✅ **Simplified 5-stage** status tracking

---

## 📋 Complete Workflow

### Step 1: Request Approval (Site Card)
**Location**: Sites page - on each site card
**Button**: "Request Approval"
**Roles**: Admin, Manager, Backoffice

**Action**:
- Click button → Opens "Add Line Items" modal
- Button text changes to "Request Approval Sent"
- Multiple requests allowed per site

---

### Step 2: Add Line Items (Modal)

**Predefined Line Items**:
1. Tree Cutting
2. Dewatering
3. HardRock Excavation
4. Head Loading
5. Crane Charges
6. **Custom Item** (user can add)

**Fields per Item**:
- ☑️ Select checkbox
- Item Code (auto-generated)
- Description
- Quantity
- Rate (₹)
- Total (auto-calculated: Qty × Rate)

**Example**:
```
☑️ Tree Cutting
   Item Code: 2D-500000-C-00-ZZ-ZZ-A01
   Description: Uprooting of trees/Tree Cutting Charges
   Qty: 5
   Rate: ₹1,000
   Total: ₹5,000
```

---

### Step 3: Email Generation (Outlook)

**Template**:
```
Subject: Approval Request - [Site Name]

Hi sir,

With reference to the above subject, we have executed tree cutting activity 
at the below mentioned site. Kindly approve of the same.

Project ID   | Site ID     | Site Name | Item Code                  | Description                      | Qty | Rate        | Total
-------------|-------------|-----------|----------------------------|----------------------------------|-----|-------------|-------------
R/RL-7849273 | IN-1251585  | Nimbal    | 2D-500000-C-00-ZZ-ZZ-A01  | Tree Cutting Charges (Capex)   | 5   | ₹1,000.00   | ₹5,000.00

[Additional rows for each selected line item]

Best regards,
[User Name]
```

**Action**: Opens Outlook with pre-filled email

---

### Step 4: Billing Overview Report

**Table Columns**:
1. Site ID (e.g., IN-1251585)
2. RL ID (Project ID, e.g., R/RL-7849273)
3. Site Name (e.g., Nimbal)
4. Line Items (expandable/collapsible)
5. Total Amount
6. **Status Dropdown**:
   - PR Process
   - PR Done
   - Waiting For Amendment
   - WCC Done
   - Billing Done
7. Last Updated
8. Actions (View, Edit, Delete)

---

## 🗂️ Data Structure

### VendorBillingRequest Interface
```typescript
{
  id: string;
  siteId: string;
  siteName: string;
  siteIdCode: string; // IN-1251585
  rlId: string; // R/RL-7849273
  lineItems: LineItem[];
  status: 'PR Process' | 'PR Done' | 'Waiting For Amendment' | 'WCC Done' | 'Billing Done';
  totalAmount: number;
  requestedBy: string;
  requestedAt: string;
  lastUpdated: string;
  emailSent: boolean;
}

interface LineItem {
  id: string;
  itemCode: string; // 2D-500000-C-00-ZZ-ZZ-A01
  category: 'Tree Cutting' | 'Dewatering' | 'HardRock Excavation' | 'Head Loading' | 'Crane Charges' | 'Custom';
  description: string;
  quantity: number;
  rate: number;
  total: number; // qty * rate
}
```

---

## 🎨 UI Components Needed

### 1. Updated Sites Component
- Add "Request Approval" button to each site card
- Button shows "Request Approval Sent" if requests exist
- Shows count of pending requests

### 2. NEW: Line Items Modal
- Checkbox list of predefined items
- "Add Custom Item" button
- Input fields: Description, Qty, Rate
- Auto-calculate totals
- Submit → Generate email

### 3. NEW: Vendor Billing Overview Page
- Table with all vendor billing requests
- Status dropdown per row
- Expandable line items view
- Filter by site, status
- Export to CSV

### 4. Email Template Function
- Generate HTML email body
- Open mailto: or Outlook COM
- Pre-fill subject, body, recipient

---

## 🔧 Implementation Plan

### Phase 1: Data Structure
- [ ] Create VendorBillingRequest interface
- [ ] Create LineItem interface
- [ ] Add Firestore collection: vendor_billing_requests
- [ ] Add CRUD operations

### Phase 2: Line Items Modal
- [ ] Create LineItemsModal component
- [ ] Predefined items list
- [ ] Custom item form
- [ ] Calculate totals
- [ ] Validation

### Phase 3: Email Integration
- [ ] Generate email template
- [ ] Outlook integration (mailto or COM)
- [ ] Format table in email body

### Phase 4: Billing Overview
- [ ] Update BillingOverviewReport for vendor requests
- [ ] Add columns: Site ID, RL ID
- [ ] Add status dropdown (5 stages)
- [ ] Remove profit/expense columns
- [ ] Add line items expansion

### Phase 5: Sites Integration
- [ ] Add "Request Approval" button to site cards
- [ ] Show approval count
- [ ] Open line items modal on click

---

## 🚧 Changes to Existing Code

### Remove/Modify:
- ❌ Remove "Request Approval" from SiteDetail page
- ❌ Simplify billing workflow (remove 8 stages)
- ❌ Remove single billing per site constraint
- ❌ Remove profit/expense tracking (vendor-specific)

### Keep:
- ✅ Internal team billing (unchanged)
- ✅ Payment request system (unchanged)
- ✅ Role-based permissions
- ✅ Dashboard metrics (separate from vendor billing)

---

## 📊 Billing Overview - New Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 💰 Vendor Billing Overview                                              │
│                                                                          │
│ [Search...] [Status Filter ▼] [Export CSV]                             │
│                                                                          │
│ Site ID     │ RL ID        │ Site Name │ Status ▼        │ Total       │
│─────────────┼──────────────┼───────────┼─────────────────┼─────────────│
│ IN-1251585  │ R/RL-7849273 │ Nimbal    │ [PR Process ▼] │ ₹5,000      │
│ ▶ Line Items (3)                                                        │
│─────────────┼──────────────┼───────────┼─────────────────┼─────────────│
│ IN-1251586  │ R/RL-7849274 │ Site B    │ [PR Done ▼]    │ ₹12,500     │
│ ▶ Line Items (5)                                                        │
└─────────────────────────────────────────────────────────────────────────┘

When expanded:
┌─────────────────────────────────────────────────────────────────────────┐
│ IN-1251585  │ R/RL-7849273 │ Nimbal    │ [PR Process ▼] │ ₹5,000      │
│ ▼ Line Items (3)                                                        │
│   • Tree Cutting: 5 × ₹1,000 = ₹5,000                                  │
│   • Dewatering: 2 × ₹500 = ₹1,000                                      │
│   • Head Loading: 10 × ₹200 = ₹2,000                                   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📧 Email Template Format

```
To: client@example.com
Subject: Approval Request - Nimbal Site (IN-1251585)

Hi sir,

With reference to the above subject, we have executed tree cutting activity 
at the below mentioned site. Kindly approve of the same.

┌─────────────┬────────────┬───────────┬──────────────────────┬────────────────────────────┬─────┬──────────┬──────────┐
│ Project ID  │ Site ID    │ Site Name │ Item Code            │ Description                │ Qty │ Rate     │ Total    │
├─────────────┼────────────┼───────────┼──────────────────────┼────────────────────────────┼─────┼──────────┼──────────┤
│ R/RL-7849273│ IN-1251585 │ Nimbal    │ 2D-500000-C-00-ZZ-ZZ│ Tree Cutting Charges       │ 5   │ ₹1,000   │ ₹5,000   │
│             │            │           │ -A01                 │ (As per Indus Standards)   │     │          │          │
└─────────────┴────────────┴───────────┴──────────────────────┴────────────────────────────┴─────┴──────────┴──────────┘

Grand Total: ₹5,000

Best regards,
[User Name]
Rugged Customs
```

---

## ✅ Next Steps

1. Confirm this workflow matches your requirements
2. Implement data structures
3. Create LineItemsModal component
4. Update Sites component with button
5. Create email generation function
6. Update BillingOverviewReport for vendor requests
7. Test complete flow

---

This is a **complete redesign** focused on vendor billing with line items and email approval workflow.
