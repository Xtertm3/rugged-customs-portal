# 🎯 VENDOR BILLING WITH LINE ITEMS - Implementation Progress

## ✅ Phase 1: Data Structures & Backend (COMPLETED)

### 1. New TypeScript Interfaces (App.tsx)
```typescript
✅ VendorBillingStatus type (5 stages)
✅ VendorBillingLineItem interface  
✅ VendorBillingRequest interface
```

### 2. Firestore Operations (firebaseService.ts)
```typescript
✅ saveVendorBillingRequest()
✅ getAllVendorBillingRequests()
✅ deleteVendorBillingRequest()
✅ updateVendorBillingRequest()
✅ subscribeToVendorBillingRequests()
```

### 3. Line Items Modal Component (LineItemsModal.tsx)
```typescript
✅ Predefined items: Tree Cutting, Dewatering, HardRock Excavation, Head Loading, Crane Charges
✅ Custom item addition
✅ Quantity & Rate inputs
✅ Auto-calculation of totals
✅ Grand total summary
✅ Two submit options: "Save" or "Save & Send Email"
```

### 4. Email Generation Utility (emailGenerator.ts)
```typescript
✅ generateEmailTemplate() - HTML table format
✅ openOutlookEmail() - mailto: link
✅ generateEmlFile() - Downloadable .eml for Outlook
```

---

## 📋 NEXT STEPS (To Complete)

### Phase 2: Sites Integration
- [ ] Add "Request Approval" button to site cards in Projects.tsx
- [ ] Button shows on ALL site cards
- [ ] Accessible by: Admin, Manager, Backoffice
- [ ] Click opens LineItemsModal
- [ ] After submit: Show "Request Approval Sent" badge
- [ ] Show count of approval requests per site

### Phase 3: State Management (App.tsx)
- [ ] Add `vendorBillingRequests` state
- [ ] Add real-time subscription in useEffect
- [ ] Create `handleAddVendorBillingRequest` handler
- [ ] Create `handleUpdateVendorBillingRequest` handler
- [ ] Create `handleDeleteVendorBillingRequest` handler
- [ ] Generate RL ID (R/RL-XXXXXXX format)
- [ ] Integrate email sending

### Phase 4: Vendor Billing Overview Page
- [ ] Create VendorBillingOverviewReport.tsx component
- [ ] Table columns: Site ID, RL ID, Site Name, Total, Status, Actions
- [ ] Status dropdown per row (5 stages)
- [ ] Expandable line items view
- [ ] Filter by site, status
- [ ] Export to CSV
- [ ] Add to navigation (Admin/Manager/Backoffice only)

### Phase 5: Email Integration
- [ ] Implement email sending on "Save & Send Email"
- [ ] Test mailto: link
- [ ] Test .eml file download
- [ ] Add email sent timestamp tracking

---

## 🎨 UI Flow (Planned)

### Step 1: Sites Page
```
┌────────────────────────────────────────┐
│ Site Card: Nimbal                      │
│ Location: XYZ                          │
│ Vendor: ABC Corp                       │
│                                        │
│ [✅ Request Approval] ← NEW BUTTON    │
│                                        │
│ Requests Sent: 2 ← Badge if exists    │
└────────────────────────────────────────┘
```

### Step 2: Line Items Modal
```
┌─────────────────────────────────────────────────────┐
│ 📋 Add Line Items - Nimbal                         │
│                                                     │
│ Site ID: IN-1251585 | RL ID: R/RL-7849273         │
│                                                     │
│ ☑️ Tree Cutting                                    │
│    Qty: 5  Rate: ₹1,000  Total: ₹5,000           │
│                                                     │
│ ☑️ Dewatering                                      │
│    Qty: 2  Rate: ₹1,500  Total: ₹3,000           │
│                                                     │
│ [➕ Add Custom Item]                               │
│                                                     │
│ Grand Total: ₹8,000                                │
│                                                     │
│ [Cancel] [Save] [📧 Save & Send Email]           │
└─────────────────────────────────────────────────────┘
```

### Step 3: Email (Outlook)
```
To: client@example.com
Subject: Approval Request - Nimbal (IN-1251585)

Hi sir,

With reference to the above subject, we have executed 
tree cutting activity at the below mentioned site...

[TABLE WITH LINE ITEMS]

Grand Total: ₹8,000
```

### Step 4: Vendor Billing Overview
```
┌───────────────────────────────────────────────────────────┐
│ 💰 Vendor Billing Overview                               │
│                                                           │
│ Site ID    │ RL ID        │ Site   │ Status ▼   │ Total │
│────────────┼──────────────┼────────┼────────────┼───────│
│ IN-1251585 │ R/RL-7849273 │ Nimbal │ [PR Done▼] │ ₹8K  │
│ ▶ Line Items (2)                                         │
└───────────────────────────────────────────────────────────┘
```

---

## 🔧 Technical Details

### RL ID Generation (Auto)
```typescript
const generateRLId = () => {
  const randomNum = Math.floor(1000000 + Math.random() * 9000000);
  return `R/RL-${randomNum}`;
};
```

### Site ID Code
- Use existing site.id or generate format: `IN-XXXXXXX`

### Item Codes (Predefined)
```
Tree Cutting:        2D-500000-C-00-ZZ-ZZ-A01
Dewatering:          2D-500001-C-00-ZZ-ZZ-A02
HardRock Excavation: 2D-500002-C-00-ZZ-ZZ-A03
Head Loading:        2D-500003-C-00-ZZ-ZZ-A04
Crane Charges:       2D-500004-C-00-ZZ-ZZ-A05
Custom:              CUSTOM-XXX (user enters)
```

### Status Workflow
```
1. PR Process
2. PR Done
3. Waiting For Amendment
4. WCC Done
5. Billing Done
```

---

## 📊 Data Flow

```
User clicks "Request Approval" on Site Card
          ↓
Line Items Modal Opens
          ↓
User selects items, enters quantities
          ↓
Clicks "Save & Send Email"
          ↓
1. Save to Firestore (vendor_billing_requests)
2. Generate email template
3. Open Outlook with pre-filled email
4. Mark emailSent: true
          ↓
Site card shows "Request Approval Sent" badge
          ↓
Admin/Manager updates status in Vendor Billing Overview
          ↓
Status changes: PR Process → PR Done → ... → Billing Done
```

---

## 🗂️ Files Created/Modified

### ✅ Created:
1. `src/components/LineItemsModal.tsx` - Line items selection UI
2. `src/utils/emailGenerator.ts` - Email template generation
3. `VENDOR_BILLING_REFRAME.md` - Requirements document

### ✅ Modified:
1. `src/App.tsx` - Added VendorBilling interfaces
2. `src/services/firebaseService.ts` - Added CRUD operations

### ⏳ To Create:
1. `src/components/VendorBillingOverviewReport.tsx` - Main overview table
2. Update `src/components/Projects.tsx` - Add request approval button

### ⏳ To Modify:
1. `src/App.tsx` - Add state, handlers, navigation
2. `src/components/MobileNav.tsx` - Add vendor billing tab

---

## ✅ Completion Status: 40%

- [x] Data structures defined
- [x] Firestore operations implemented
- [x] Line items modal created
- [x] Email generation utility created
- [ ] Sites integration (button on cards)
- [ ] App state management
- [ ] Vendor billing overview page
- [ ] Navigation integration
- [ ] Email sending implementation
- [ ] Testing & debugging

---

## 🎯 Next Immediate Step

**Update Projects.tsx to add "Request Approval" button to site cards**

This will:
1. Add button to each site card
2. Show button only for Admin/Manager/Backoffice
3. Open LineItemsModal on click
4. Show approval count badge if requests exist

Would you like me to proceed with this step?
