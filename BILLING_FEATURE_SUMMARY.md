# Billing Overview Feature - Implementation Summary

## 🆕 **IMPORTANT: Site-Initiated Billing Workflow**

The billing process now starts from individual **Sites** with a **"Request Approval for Billing"** button:

1. **Site Detail Page** → Click "✅ Request Approval for Billing" (Admin/Manager/Backoffice only)
2. Creates initial billing record with status "Quotation Sent"
3. Billing status badge appears on site detail page (color-coded by stage)
4. Click billing badge to navigate to Billing Overview page
5. Update quotation amounts and progress through 8 workflow stages
6. Complete with "Billing Completed" status

**Key Point**: Billing is **optional per site** - not all sites need billing requests.

---

## ✅ Completed Implementation

### 1. Data Structures (App.tsx)
- **BillingStatus Type**: 8-stage workflow
  ```typescript
  'Quotation Sent' | 'Yet To Bill' | 'Approval Pending' | 'Add PR Process' | 
  'Add PR Done' | 'Waiting For Amendment' | 'WCC Done' | 'Billing Completed'
  ```

- **BillingOverview Interface**: Complete data model with 18 fields
  - Site information: `siteId`, `siteName`, `clientName`, `vendorName`
  - Financial tracking: `quotationAmount`, `yetToBillAmount`, `actualBillingBasic`, `actualBillingGST`, `actualBillingTotal`, `expense`, `profit`
  - Workflow: `status`, `pendingWithType`, `pendingWithId`, `pendingWithName`
  - Audit trail: `statusHistory` array with timestamps and user IDs
  - Metadata: `createdAt`, `updatedAt`, `createdBy`

### 2. Backend Operations (firebaseService.ts)
Implemented 5 Firestore CRUD operations:
- ✅ `saveBillingOverview(billing)` - Create new billing record
- ✅ `getAllBillingOverviews()` - Fetch all billing records
- ✅ `deleteBillingOverview(id)` - Delete billing record
- ✅ `updateBillingOverview(id, updates)` - Update billing record
- ✅ `subscribeToBillingOverviews(callback)` - Real-time subscription

All operations use `pruneUndefined()` for Firestore compatibility.

### 3. Dashboard Card Component (BillingOverviewCard.tsx)
**Purpose**: Display aggregate billing metrics on the dashboard

**Features**:
- 5 calculated metrics using `useMemo`:
  - 💰 Total Quoted Amount
  - ⏳ Yet To Bill Amount
  - ✅ Actual Billing Total
  - 💸 Total Expense
  - 📈 Total Profit (Actual Billing - Expense)
- Color-coded StatCard sub-components:
  - Blue: Total Quoted
  - Yellow: Yet To Bill
  - Green: Actual Billing
  - Red: Expense
  - Emerald/Red: Profit (conditional based on value)
- Loss alert banner when `totalProfit < 0`
- Responsive grid: 1 column (mobile) → 2 columns (tablet) → 5 columns (desktop)
- Glass morphism design with backdrop blur
- Site count badge

**Usage**: Shows on Dashboard for Admin/Manager roles only when billings exist

### 4. Billing Report Component (BillingOverviewReport.tsx)
**Purpose**: Comprehensive billing management table

**Features**:
- **Table with 10+ columns**:
  - Site Name, Client, Quotation, Yet To Bill, Actual Billing
  - Expense (Admin/Manager only), Profit (Admin/Manager only)
  - Status, Pending With, Actions
- **Search & Filters**:
  - Text search by site/client name
  - Status dropdown filter (All / 8 statuses)
- **Color-coded status badges**:
  - Blue: Quotation Sent
  - Yellow: Yet To Bill
  - Orange: Approval Pending
  - Purple: Add PR Process
  - Indigo: Add PR Done
  - Amber: Waiting For Amendment
  - Teal: WCC Done
  - Green: Billing Completed
- **CSV Export**: Downloads filtered data with filename including date
- **Add/Edit Modal**:
  - Site selection dropdown
  - Status workflow dropdown (8 stages)
  - Quotation amount input
  - Yet To Bill amount input
  - Expense input (Admin only)
  - Conditional vendor name field (for PR statuses)
  - Conditional "Pending With" fields (for Approval Pending / Add PR Done)
  - Auto-calculation note for GST @ 18%
- **Business Logic**:
  - Actual billing only calculates when status = "Billing Completed"
  - Auto-calculates: `actualBillingGST = actualBillingBasic * 0.18`
  - Auto-calculates: `actualBillingTotal = actualBillingBasic + actualBillingGST`
  - Auto-calculates: `profit = actualBillingTotal - expense`
  - Status history logging on status changes
- **Role-based permissions**:
  - Profit column: Admin/Manager only
  - Expense edits: Admin only
  - Delete action: Admin only

### 5. App Integration (App.tsx)
**State Management**:
- Added `billingOverviews` state with `BillingOverview[]` type
- Real-time Firestore subscription in `useEffect`
- Cleanup on unmount

**Handlers**:
- `handleAddBilling(billingData)`: Creates new billing with ID
- `handleUpdateBilling(id, updates)`: 
  - Appends to status history on status change
  - Auto-calculates GST and profit
  - Updates timestamp
- `handleDeleteBilling(id)`: Deletes billing record

**Routing**:
- Added `billingOverview` view to MainViews
- Passes all required props to BillingOverviewReport

**Navigation**:
- Desktop: Added "💰 Billing" button (Admin/Manager only)
- Mobile: Added to bottom tab navigation (Admin/Manager only)

**Dashboard Integration**:
- Added `billings` prop to Dashboard component
- Shows BillingOverviewCard when role is Admin/Manager and billings exist

### 6. Navigation Updates
**Desktop Navigation** (App.tsx):
```tsx
{(currentUser?.role === 'Admin' || currentUser?.role === 'Manager') && 
  <NavButton view="billingOverview" label="💰 Billing" />}
```

**Mobile Navigation** (MobileNav.tsx):
```tsx
{ view: 'billingOverview', label: 'Billing', icon: '💰', roles: ['Admin', 'Manager'] }
```

### 7. Dashboard Updates (Dashboard.tsx)
**Added Props**:
- `billings?: BillingOverview[]` - Optional billing data

**Updated Imports**:
- Added `BillingOverview` type from App
- Added `BillingOverviewCard` component

**Conditional Rendering**:
```tsx
{currentUser && (currentUser.role === 'Admin' || currentUser.role === 'Manager') 
  && billings.length > 0 && (
  <BillingOverviewCard billings={billings} />
)}
```

---

## 🎯 Key Features Implemented

### ✅ Workflow Management
- 8-stage sequential billing lifecycle
- Status history tracking with timestamps and user IDs
- Pending With tracking (client vs. vendor)

### ✅ Financial Calculations
- Auto-calculates GST @ 18% on actual billing
- Auto-calculates total billing (basic + GST)
- Auto-calculates profit (actual billing - expense)
- Displays profit/loss with color coding

### ✅ Role-Based Security
- **Admin**: Full access (view, edit, delete, manage expense)
- **Manager**: View all, edit billings, view profit (cannot edit expense)
- **Other Roles**: No access to billing module

### ✅ Data Export
- CSV export with current date in filename
- Includes/excludes profit column based on user role
- Filters applied to exported data

### ✅ Real-Time Sync
- Firestore real-time listeners
- Automatic updates across all users
- No manual refresh needed

### ✅ Responsive Design
- Mobile-first approach
- Horizontal scroll for wide tables on mobile
- Stacked form fields on mobile
- Bottom tab navigation integration

---

## 📊 Database Schema

**Collection**: `billing_overview`

**Document Structure**:
```javascript
{
  id: "timestamp-string",
  siteId: "site-id",
  siteName: "Site Name",
  clientName: "Client/Vendor Name",
  vendorName: "Vendor Name (optional)",
  quotationAmount: 100000,
  yetToBillAmount: 120000,
  actualBillingBasic: 120000,
  actualBillingGST: 21600,  // auto-calculated: basic * 0.18
  actualBillingTotal: 141600,  // auto-calculated: basic + GST
  expense: 95000,
  profit: 46600,  // auto-calculated: total - expense
  status: "Billing Completed",
  pendingWithType: "client" | "vendor" | undefined,
  pendingWithId: "vendor-id" | undefined,
  pendingWithName: "Vendor Name" | undefined,
  statusHistory: [
    {
      status: "Quotation Sent",
      timestamp: "2025-01-15T10:30:00Z",
      updatedBy: "admin-user-id"
    },
    // ... more history entries
  ],
  createdAt: "2025-01-15T10:30:00Z",
  updatedAt: "2025-01-20T14:45:00Z",
  createdBy: "admin-user-id"
}
```

---

## 🚀 How to Use

### For Admins/Managers/Backoffice:

1. **Initiate Billing from Site** (NEW):
   - Go to **Sites** → Click on any site
   - In site detail page, click "✅ **Request Approval for Billing**" button
   - This creates a billing record with initial status "Quotation Sent"
   - Button only shows if no billing exists for that site
   - Roles allowed: Admin, Manager, Backoffice

2. **View Billing Status on Site**:
   - After requesting approval, a **color-coded status badge** appears next to site name
   - Badge shows current billing stage (e.g., "💰 Approval Pending")
   - Click the badge to navigate to Billing Overview page

3. **Access Billing Overview**:
   - Desktop: Click "💰 Billing" button in top navigation
   - Mobile: Tap "Billing" in bottom tab navigation

4. **View Dashboard Summary**:
   - Billing metrics card appears on Dashboard
   - Shows 5 key financial indicators
   - Red banner if total profit is negative

5. **Update Billing Details**:
   - Click "Edit" on the billing row for your site
   - **First Time**: Enter quotation amount and yet-to-bill amount
   - Progress through workflow stages:
     - **Quotation Sent** → Update amounts, send to client
     - **Yet To Bill** → Finalize billing amount
     - **Approval Pending** → Set "Pending With" = Client name
     - **Add PR Process** → Enter vendor name
     - **Add PR Done** → Set "Pending With" = Vendor name
     - **Waiting For Amendment** → Awaiting changes
     - **WCC Done** → Work completion certificate
     - **Billing Completed** → Actual billing auto-calculates
   - Add expense (Admin only)
   - Status history automatically logged

6. **Manual Add Billing** (Alternative):
   - Click "➕ Add Billing" button in Billing Overview
   - Select site from dropdown
   - Enter quotation amount
   - Enter yet-to-bill amount (usually > quotation)
   - Set initial status (default: "Quotation Sent")
   - Add expense (Admin only)
   - Add vendor name if doing PR process
   - Set "Pending With" if status requires it

7. **Edit Billing**:
   - Click "Edit" on any row
   - Update amounts, status, or pending fields
   - Status history is automatically logged
   - GST and profit auto-calculate

5. **Delete Billing** (Admin only):
   - Click "Delete" on any row
   - Confirm deletion

6. **Export Data**:
   - Click "📥 Export CSV" button
   - File downloads with current date in name
   - Includes profit column for Admin/Manager

7. **Search & Filter**:
   - Use search box to find sites/clients
   - Use status dropdown to filter by workflow stage

---

## 🔒 Security & Permissions

| Feature | Admin | Manager | Backoffice | Other Roles |
|---------|-------|---------|------------|-------------|
| Request Approval Button | ✅ | ✅ | ✅ | ❌ |
| View Billing Status Badge | ✅ | ✅ | ✅ | ❌ |
| View Billing Page | ✅ | ✅ | ❌ | ❌ |
| View Dashboard Card | ✅ | ✅ | ❌ | ❌ |
| Add Billing | ✅ | ✅ | ❌ | ❌ |
| Edit Billing | ✅ | ✅ | ❌ | ❌ |
| Delete Billing | ✅ | ❌ | ❌ | ❌ |
| View Profit | ✅ | ✅ | ❌ | ❌ |
| Edit Expense | ✅ | ❌ | ❌ | ❌ |
| Export CSV | ✅ | ✅ | ❌ | ❌ |

---

## 📝 Complete Workflow (Site to Billing)

```
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: INITIATE FROM SITE                                     │
└─────────────────────────────────────────────────────────────────┘
   Sites → Click Site → "✅ Request Approval for Billing" button
                              ↓
                    Creates Billing Record
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: BILLING STATUS STAGES (8 Stages)                      │
└─────────────────────────────────────────────────────────────────┘

1. 🔵 Quotation Sent
   └─ Enter quotation amount
   └─ Set pending with client
         ↓
2. 🟡 Yet To Bill
   └─ Update final billing amount (usually > quotation)
         ↓
3. 🟠 Approval Pending
   └─ Set "Pending With" = Client name
   └─ Awaiting client approval
         ↓
4. 🟣 Add PR Process
   └─ Enter vendor name
   └─ Begin PR (Purchase Request) processing
         ↓
5. 🔵 Add PR Done
   └─ Set "Pending With" = Vendor name
   └─ PR completed, vendor notified
         ↓
6. 🟡 Waiting For Amendment
   └─ Awaiting changes/corrections
         ↓
7. 🔷 WCC Done
   └─ Work Completion Certificate received
         ↓
8. 🟢 Billing Completed
   └─ Actual billing = Yet To Bill amount
   └─ GST auto-calculated @ 18%
   └─ Profit auto-calculated (Billing - Expense)

┌─────────────────────────────────────────────────────────────────┐
│  STEP 3: VIEW & TRACK                                           │
└─────────────────────────────────────────────────────────────────┘
   • Site Detail: Shows color-coded status badge
   • Click badge: Navigate to Billing Overview
   • Dashboard: Shows aggregate metrics (Admin/Manager)
   • Billing Page: Full table with all sites
```

---

## 🎨 UI Components

### BillingOverviewCard (Dashboard)
- Location: Dashboard page (Admin/Manager only)
- Layout: 5-column grid (responsive)
- Metrics: Quoted, Yet-to-Bill, Actual, Expense, Profit
- Design: Glass morphism with color-coded borders

### BillingOverviewReport (Main Table)
- Location: Dedicated Billing page
- Layout: Full-width table with horizontal scroll
- Filters: Search + Status dropdown
- Actions: Add, Edit, Delete, Export CSV
- Modal: Full-screen add/edit form with validations

---

## ✅ Testing Checklist

- [x] TypeScript compilation with no errors
- [x] Real-time Firestore sync working
- [x] Add billing creates new record
- [x] Edit billing updates existing record
- [x] Delete billing removes record (Admin only)
- [x] Status history logging on status change
- [x] Auto-calculation of GST (18%)
- [x] Auto-calculation of profit
- [x] Role-based UI visibility (Admin/Manager)
- [x] Role-based permission enforcement
- [x] CSV export functionality
- [x] Search and filter working
- [x] Responsive design on mobile
- [x] Dashboard card showing metrics
- [x] Navigation integration (desktop + mobile)

---

## 🔮 Future Enhancements (Optional)

### Phase 2 (Future):
- [ ] PDF export with formatted table
- [ ] Date range filters (created date, updated date)
- [ ] Bulk status updates
- [ ] Email notifications on status changes
- [ ] Billing analytics charts (profit trends, status distribution)
- [ ] Client/vendor dropdown integration (if vendor management expanded)
- [ ] Attachment uploads (invoices, receipts)
- [ ] Comments/notes per billing record
- [ ] Approval workflow with multi-level sign-offs
- [ ] Budget vs. actual comparison
- [ ] Currency formatting preferences
- [ ] Multi-currency support

### Phase 3 (Future):
- [ ] Billing templates for common project types
- [ ] Recurring billing schedules
- [ ] Payment milestones tracking
- [ ] Integration with accounting software
- [ ] Advanced reporting dashboard
- [ ] Profit margin alerts
- [ ] Automated expense categorization
- [ ] Tax calculation based on location
- [ ] Invoice generation

---

## 📚 Files Modified

### New Files:
1. ✅ `src/components/BillingOverviewCard.tsx` - Dashboard metrics card
2. ✅ `src/components/BillingOverviewReport.tsx` - Main billing table

### Modified Files:
1. ✅ `src/App.tsx` - Types, state, handlers (including handleRequestApproval), routing, navigation
2. ✅ `src/services/firebaseService.ts` - Firestore CRUD operations
3. ✅ `src/components/Dashboard.tsx` - Props and billing card integration
4. ✅ `src/components/MobileNav.tsx` - Added billing tab
5. ✅ `src/components/SiteDetail.tsx` - **NEW**: Request Approval button, billing status badge, click-to-navigate

---

## �️ Site Integration Details

### Request Approval Button
**Location**: Site Detail page, below site name and vendor info  
**Visibility**: Admin, Manager, Backoffice roles only  
**Condition**: Only shows when NO billing record exists for the site  
**Action**: Creates billing record with:
- Status: "Quotation Sent"
- Client Name: Copied from site vendor
- Quotation/Yet-to-Bill: Initially 0 (user updates later)
- Status history: First entry with timestamp

### Billing Status Badge
**Location**: Site Detail page, next to site name  
**Display**: Color-coded pill with emoji and status text  
**Example**: `💰 Approval Pending` (orange background)  
**Interactive**: Click to navigate to Billing Overview page  
**Colors**:
- Blue: Quotation Sent
- Yellow: Yet To Bill
- Orange: Approval Pending
- Purple: Add PR Process
- Indigo: Add PR Done
- Amber: Waiting For Amendment
- Teal: WCC Done
- Green: Billing Completed

### Workflow Benefits
1. **Context-Aware**: Billing starts from the site context, ensuring correct site-billing linkage
2. **Optional**: Not all sites need billing - button only appears when needed
3. **Visual Tracking**: Status badge provides at-a-glance billing progress
4. **Quick Navigation**: Click badge to jump to full billing details
5. **Audit Trail**: Every status change logged with user ID and timestamp

---

## �🎉 Success!

The Billing Overview feature is now fully functional and integrated into your Rugged Customs application. 

- **Admin and Manager users** can now track the complete billing lifecycle from quotation to completion
- **Real-time updates** ensure all users see the latest data
- **Auto-calculations** reduce manual errors in GST and profit calculations
- **Role-based permissions** maintain data security
- **Responsive design** works seamlessly on mobile and desktop

The feature is production-ready and follows the same design patterns as your existing codebase.
