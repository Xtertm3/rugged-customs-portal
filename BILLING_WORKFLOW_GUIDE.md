# 📋 Billing Workflow - Quick Start Guide

## 🎯 Overview
The billing system is **site-based**: each billing request starts from an individual site and progresses through 8 approval stages.

---

## 🚀 Quick Start (3 Steps)

### Step 1: Initiate Billing Request
1. Go to **Sites** page
2. Click on any site to open details
3. Look for the green button: **"✅ Request Approval for Billing"**
4. Click it to create a billing record
5. Initial status: "Quotation Sent"

> **Note**: Button only shows if no billing exists for that site yet.

### Step 2: Update Billing Details
1. Notice the new **status badge** next to site name (e.g., 💰 Quotation Sent)
2. Go to **Billing Overview** page (navigation menu)
3. Find your site in the table
4. Click **"Edit"** button
5. Enter:
   - **Quotation Amount**: Initial quoted price
   - **Yet To Bill Amount**: Final billing amount (usually > quotation)
   - **Expense**: Actual costs (Admin only)
6. Click **"Update Billing"**

### Step 3: Progress Through Stages
Update the **Status** dropdown as work progresses:

```
Quotation Sent → Yet To Bill → Approval Pending → 
Add PR Process → Add PR Done → Waiting For Amendment → 
WCC Done → Billing Completed
```

---

## 📊 Status Stage Details

| Stage | What to Do | Pending With |
|-------|-----------|--------------|
| **1. Quotation Sent** | Enter initial quotation amount | Client |
| **2. Yet To Bill** | Update final billing amount | - |
| **3. Approval Pending** | Wait for client approval | Set to Client name |
| **4. Add PR Process** | Start purchase request, enter vendor | - |
| **5. Add PR Done** | PR completed | Set to Vendor name |
| **6. Waiting For Amendment** | Awaiting corrections | - |
| **7. WCC Done** | Work completion certificate received | - |
| **8. Billing Completed** | Actual billing auto-calculated, GST added | - |

---

## 🎨 Visual Indicators

### On Site Detail Page:
- **No Badge**: No billing request yet → Show "Request Approval" button
- **Blue Badge (💰 Quotation Sent)**: Initial stage
- **Yellow Badge (💰 Yet To Bill)**: Amount finalized
- **Orange Badge (💰 Approval Pending)**: Waiting for client
- **Purple Badge (💰 Add PR Process)**: PR in progress
- **Indigo Badge (💰 Add PR Done)**: PR completed
- **Amber Badge (💰 Waiting For Amendment)**: Changes needed
- **Teal Badge (💰 WCC Done)**: Certificate received
- **Green Badge (💰 Billing Completed)**: Fully billed ✅

### On Dashboard (Admin/Manager):
- **Total Quoted**: Sum of all quotation amounts
- **Yet To Bill**: Sum of amounts to be billed
- **Actual Billing**: Sum of completed billings (with GST)
- **Total Expense**: Sum of all expenses
- **Total Profit**: Actual Billing - Expense

---

## 💡 Tips & Best Practices

### ✅ Do's:
- **Start billing early**: Request approval as soon as quotation is ready
- **Update amounts**: Keep quotation and yet-to-bill amounts up to date
- **Track expenses**: Admin should update expenses regularly (for profit calculation)
- **Use "Pending With"**: Always specify who is holding up progress
- **Progress sequentially**: Move through stages in order

### ❌ Don'ts:
- **Don't skip stages**: Follow the 8-stage sequence
- **Don't forget expenses**: Profit calculation depends on accurate expenses
- **Don't duplicate**: Each site should have only ONE billing request
- **Don't rush to "Completed"**: Only mark complete when fully billed

---

## 🔍 Common Scenarios

### Scenario 1: Simple Project
```
Day 1: Request Approval (Quotation Sent)
Day 2: Enter ₹100,000 quotation
Day 5: Update to ₹120,000 Yet To Bill
Day 7: Client approves (Approval Pending → Add PR Process)
Day 10: PR done (Add PR Done)
Day 15: Certificate received (WCC Done)
Day 20: Mark Billing Completed
        → Actual Billing: ₹141,600 (₹120,000 + 18% GST)
        → Profit: ₹141,600 - Expense
```

### Scenario 2: Project with Amendments
```
Day 1: Request Approval (Quotation Sent)
Day 2: Enter ₹150,000 quotation
Day 5: Client requests changes (Waiting For Amendment)
Day 10: Update to ₹180,000, resume workflow
Day 20: Complete billing
```

### Scenario 3: Multiple Sites
```
Site A: Billing Completed ✅
Site B: Approval Pending ⏳
Site C: Yet To Bill 🟡
Site D: No billing yet (no request made)

Dashboard shows aggregate:
- Total Quoted: Site A + B + C
- Actual Billing: Only Site A (completed)
- Profit: Only from Site A
```

---

## 🛠️ Troubleshooting

### Problem: "Request Approval" button not showing
**Solution**: Check if:
1. You're Admin, Manager, or Backoffice
2. The site doesn't already have a billing record
3. You're on the Site Detail page (not Sites list)

### Problem: Can't edit expense
**Solution**: Only **Admin** can edit expense field. Manager can view but not edit.

### Problem: Profit showing negative
**Solution**: This is normal if expenses exceed billing. Check:
1. Expense amount is correct
2. Yet-to-bill amount is finalized
3. Consider updating quotation if under-quoted

### Problem: Can't delete billing
**Solution**: Only **Admin** can delete. Manager can only edit.

### Problem: Status badge not updating
**Solution**: 
1. Make sure you clicked "Update Billing" in the modal
2. Refresh the page if needed (real-time sync should auto-update)
3. Check Billing Overview page to confirm status

---

## 📱 Mobile Usage

### On Mobile:
1. Tap **Billing** icon in bottom navigation
2. Horizontal scroll to see all columns
3. Use search and filters to find sites quickly
4. Forms stack vertically for easy input

### Site Detail on Mobile:
1. Status badge appears below site name
2. Tap badge to view full billing details
3. "Request Approval" button is full-width for easy tapping

---

## 🔐 Role Permissions Quick Reference

| Action | Admin | Manager | Backoffice | Others |
|--------|-------|---------|------------|--------|
| Request Billing | ✅ | ✅ | ✅ | ❌ |
| View Status Badge | ✅ | ✅ | ✅ | ❌ |
| Edit Billing | ✅ | ✅ | ❌ | ❌ |
| Edit Expense | ✅ | ❌ | ❌ | ❌ |
| View Profit | ✅ | ✅ | ❌ | ❌ |
| Delete Billing | ✅ | ❌ | ❌ | ❌ |
| Export CSV | ✅ | ✅ | ❌ | ❌ |

---

## 📞 Need Help?

- **View all billings**: Go to Billing Overview page
- **Check specific site**: Click site → Look for status badge
- **Track progress**: Status history shows all changes with timestamps
- **Export data**: Use "Export CSV" button on Billing page

---

## 🎓 Key Concepts

### Optional Billing
- Not every site needs billing
- Only create billing requests when quotation is ready
- Sites without billing continue to work normally

### Auto-Calculations
- **GST**: Automatically 18% of actual billing basic
- **Total Billing**: Basic + GST
- **Profit**: Total Billing - Expense

### Audit Trail
- Every status change is logged
- Includes: Status, Timestamp, User who changed it
- View history in status dropdown area

### Real-Time Sync
- All changes sync immediately
- All users see updates without refresh
- Firestore provides live updates

---

**Last Updated**: November 29, 2025  
**Version**: 1.0 (Site-Initiated Workflow)
