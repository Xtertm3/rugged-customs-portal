import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  updateDoc,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
// Utility: remove undefined values recursively to satisfy Firestore constraints
const pruneUndefined = (value: any): any => {
  if (Array.isArray(value)) {
    return value
      .map((v) => pruneUndefined(v))
      .filter((v) => v !== undefined);
  }
  if (value && typeof value === 'object') {
    const result: any = {};
    for (const [key, val] of Object.entries(value)) {
      const cleaned = pruneUndefined(val);
      if (cleaned !== undefined) {
        result[key] = cleaned;
      }
    }
    return result;
  }
  return value === undefined ? undefined : value;
};

// Collection names
const COLLECTIONS = {
  TEAM_MEMBERS: 'teamMembers',
  SITES: 'sites',
  PAYMENT_REQUESTS: 'paymentRequests',
  INVENTORY: 'inventory',
  MATERIAL_USAGE_LOGS: 'materialUsageLogs',
  TRANSPORTERS: 'transporters',
  JOB_CARDS: 'jobCards',
  VENDORS: 'vendors',
  BILLING_OVERVIEW: 'billing_overview',
  VENDOR_BILLING_REQUESTS: 'vendor_billing_requests'
};

// ============ TEAM MEMBERS ============
export const saveTeamMember = async (member: any) => {
  await setDoc(doc(db, COLLECTIONS.TEAM_MEMBERS, member.id), member);
};

export const getAllTeamMembers = async (): Promise<any[]> => {
  const snapshot = await getDocs(collection(db, COLLECTIONS.TEAM_MEMBERS));
  return snapshot.docs.map(doc => doc.data());
};

export const deleteTeamMember = async (id: string) => {
  await deleteDoc(doc(db, COLLECTIONS.TEAM_MEMBERS, id));
};

export const updateTeamMember = async (id: string, updates: any) => {
  await updateDoc(doc(db, COLLECTIONS.TEAM_MEMBERS, id), updates);
};

export const subscribeToTeamMembers = (callback: (members: any[]) => void) => {
  return onSnapshot(collection(db, COLLECTIONS.TEAM_MEMBERS), (snapshot) => {
    const members = snapshot.docs.map(doc => doc.data());
    callback(members);
  });
};

// ============ SITES ============
export const saveSite = async (site: any) => {
  const cleaned = pruneUndefined(site);
  await setDoc(doc(db, COLLECTIONS.SITES, site.id), cleaned);
};

export const getAllSites = async (): Promise<any[]> => {
  const snapshot = await getDocs(collection(db, COLLECTIONS.SITES));
  return snapshot.docs.map(doc => doc.data());
};

export const deleteSite = async (id: string) => {
  await deleteDoc(doc(db, COLLECTIONS.SITES, id));
};

export const updateSite = async (id: string, updates: any) => {
  const cleaned = pruneUndefined(updates);
  await updateDoc(doc(db, COLLECTIONS.SITES, id), cleaned);
};

export const subscribeToSites = (callback: (sites: any[]) => void) => {
  return onSnapshot(collection(db, COLLECTIONS.SITES), (snapshot) => {
    const sites = snapshot.docs.map(doc => doc.data());
    callback(sites);
  });
};

// ============ PAYMENT REQUESTS ============
export const savePaymentRequest = async (request: any) => {
  await setDoc(doc(db, COLLECTIONS.PAYMENT_REQUESTS, request.id), request);
};

export const getAllPaymentRequests = async (): Promise<any[]> => {
  const snapshot = await getDocs(collection(db, COLLECTIONS.PAYMENT_REQUESTS));
  return snapshot.docs.map(doc => doc.data());
};

export const deletePaymentRequest = async (id: string) => {
  await deleteDoc(doc(db, COLLECTIONS.PAYMENT_REQUESTS, id));
};

export const updatePaymentRequest = async (id: string, updates: any) => {
  await updateDoc(doc(db, COLLECTIONS.PAYMENT_REQUESTS, id), updates);
};

export const subscribeToPaymentRequests = (callback: (requests: any[]) => void) => {
  return onSnapshot(collection(db, COLLECTIONS.PAYMENT_REQUESTS), (snapshot) => {
    const requests = snapshot.docs.map(doc => doc.data());
    callback(requests);
  });
};

// ============ INVENTORY ============
export const saveInventoryItem = async (item: any) => {
  await setDoc(doc(db, COLLECTIONS.INVENTORY, item.id), item);
};

export const getAllInventory = async (): Promise<any[]> => {
  const snapshot = await getDocs(collection(db, COLLECTIONS.INVENTORY));
  return snapshot.docs.map(doc => doc.data());
};

export const deleteInventoryItem = async (id: string) => {
  await deleteDoc(doc(db, COLLECTIONS.INVENTORY, id));
};

export const updateInventoryItem = async (id: string, updates: any) => {
  await updateDoc(doc(db, COLLECTIONS.INVENTORY, id), updates);
};

export const subscribeToInventory = (callback: (items: any[]) => void) => {
  return onSnapshot(collection(db, COLLECTIONS.INVENTORY), (snapshot) => {
    const items = snapshot.docs.map(doc => doc.data());
    callback(items);
  });
};

// ============ MATERIAL USAGE LOGS ============
export const saveMaterialUsageLog = async (log: any) => {
  await setDoc(doc(db, COLLECTIONS.MATERIAL_USAGE_LOGS, log.id), log);
};

export const getAllMaterialUsageLogs = async (): Promise<any[]> => {
  const snapshot = await getDocs(collection(db, COLLECTIONS.MATERIAL_USAGE_LOGS));
  return snapshot.docs.map(doc => doc.data());
};

export const subscribeToMaterialUsageLogs = (callback: (logs: any[]) => void) => {
  return onSnapshot(collection(db, COLLECTIONS.MATERIAL_USAGE_LOGS), (snapshot) => {
    const logs = snapshot.docs.map(doc => doc.data());
    callback(logs);
  });
};

// ============ TRANSPORTERS ============
export const saveTransporter = async (transporter: any) => {
  await setDoc(doc(db, COLLECTIONS.TRANSPORTERS, transporter.id), transporter);
};

export const getAllTransporters = async (): Promise<any[]> => {
  const snapshot = await getDocs(collection(db, COLLECTIONS.TRANSPORTERS));
  return snapshot.docs.map(doc => doc.data());
};

export const deleteTransporter = async (id: string) => {
  await deleteDoc(doc(db, COLLECTIONS.TRANSPORTERS, id));
};

export const updateTransporter = async (id: string, updates: any) => {
  await updateDoc(doc(db, COLLECTIONS.TRANSPORTERS, id), updates);
};

export const subscribeToTransporters = (callback: (transporters: any[]) => void) => {
  return onSnapshot(collection(db, COLLECTIONS.TRANSPORTERS), (snapshot) => {
    const transporters = snapshot.docs.map(doc => doc.data());
    callback(transporters);
  });
};

// ============ JOB CARDS ============
export const saveJobCard = async (jobCard: any) => {
  await setDoc(doc(db, COLLECTIONS.JOB_CARDS, jobCard.id), jobCard);
};

export const getAllJobCards = async (): Promise<any[]> => {
  const snapshot = await getDocs(collection(db, COLLECTIONS.JOB_CARDS));
  return snapshot.docs.map(doc => doc.data());
};

export const deleteJobCard = async (id: string) => {
  await deleteDoc(doc(db, COLLECTIONS.JOB_CARDS, id));
};

export const updateJobCard = async (id: string, updates: any) => {
  await updateDoc(doc(db, COLLECTIONS.JOB_CARDS, id), updates);
};

export const subscribeToJobCards = (callback: (jobCards: any[]) => void) => {
  return onSnapshot(collection(db, COLLECTIONS.JOB_CARDS), (snapshot) => {
    const jobCards = snapshot.docs.map(doc => doc.data());
    callback(jobCards);
  });
};

// ============ BULK OPERATIONS ============
export const clearAllData = async () => {
  const batch = writeBatch(db);
  
  for (const collectionName of Object.values(COLLECTIONS)) {
    const snapshot = await getDocs(collection(db, collectionName));
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
  }
  
  await batch.commit();
};

// ============ VENDORS ============
export const saveVendor = async (vendor: any) => {
  const cleaned = pruneUndefined(vendor);
  await setDoc(doc(db, COLLECTIONS.VENDORS, vendor.id), cleaned);
};

export const getAllVendors = async (): Promise<any[]> => {
  const snapshot = await getDocs(collection(db, COLLECTIONS.VENDORS));
  return snapshot.docs.map(doc => doc.data());
};

export const deleteVendor = async (id: string) => {
  await deleteDoc(doc(db, COLLECTIONS.VENDORS, id));
};

export const updateVendor = async (id: string, updates: any) => {
  const cleaned = pruneUndefined(updates);
  await updateDoc(doc(db, COLLECTIONS.VENDORS, id), cleaned);
};

export const subscribeToVendors = (callback: (vendors: any[]) => void) => {
  return onSnapshot(collection(db, COLLECTIONS.VENDORS), (snapshot) => {
    const vendors = snapshot.docs.map(doc => doc.data());
    callback(vendors);
  });
};

// ============ BILLING OVERVIEW ============
export const saveBillingOverview = async (billing: any) => {
  const cleaned = pruneUndefined(billing);
  await setDoc(doc(db, COLLECTIONS.BILLING_OVERVIEW, billing.id), cleaned);
};

export const getAllBillingOverviews = async (): Promise<any[]> => {
  const snapshot = await getDocs(collection(db, COLLECTIONS.BILLING_OVERVIEW));
  return snapshot.docs.map(doc => doc.data());
};

export const deleteBillingOverview = async (id: string) => {
  await deleteDoc(doc(db, COLLECTIONS.BILLING_OVERVIEW, id));
};

export const updateBillingOverview = async (id: string, updates: any) => {
  const cleaned = pruneUndefined(updates);
  await updateDoc(doc(db, COLLECTIONS.BILLING_OVERVIEW, id), cleaned);
};

export const subscribeToBillingOverviews = (callback: (billings: any[]) => void) => {
  return onSnapshot(collection(db, COLLECTIONS.BILLING_OVERVIEW), (snapshot) => {
    const billings = snapshot.docs.map(doc => doc.data());
    callback(billings);
  });
};

// ============ VENDOR BILLING REQUESTS (Line Items) ============
export const saveVendorBillingRequest = async (request: any) => {
  const cleanedRequest = pruneUndefined(request);
  await setDoc(doc(db, COLLECTIONS.VENDOR_BILLING_REQUESTS, request.id), cleanedRequest);
};

export const getAllVendorBillingRequests = async (): Promise<any[]> => {
  const snapshot = await getDocs(collection(db, COLLECTIONS.VENDOR_BILLING_REQUESTS));
  return snapshot.docs.map(doc => doc.data());
};

export const deleteVendorBillingRequest = async (id: string) => {
  await deleteDoc(doc(db, COLLECTIONS.VENDOR_BILLING_REQUESTS, id));
};

export const updateVendorBillingRequest = async (id: string, updates: any) => {
  const cleanedUpdates = pruneUndefined(updates);
  await updateDoc(doc(db, COLLECTIONS.VENDOR_BILLING_REQUESTS, id), cleanedUpdates);
};

export const subscribeToVendorBillingRequests = (callback: (requests: any[]) => void) => {
  return onSnapshot(collection(db, COLLECTIONS.VENDOR_BILLING_REQUESTS), (snapshot) => {
    const requests = snapshot.docs.map(doc => doc.data());
    callback(requests);
  });
};

// Initialize default admin user if not exists
export const initializeDefaultAdmin = async () => {
  const adminId = 'admin-1';
  const adminRef = doc(db, COLLECTIONS.TEAM_MEMBERS, adminId);
  const adminDoc = await getDoc(adminRef);
  
  if (!adminDoc.exists()) {
    await setDoc(adminRef, {
      id: adminId,
      name: 'Admin',
      role: 'Admin',
      contactNumber: '1234567890',
      password: 'admin123',
      assignedSites: [],
      assignedMaterials: [],
      photo: ''
    });
  }
};

export default {
  // Team Members
  saveTeamMember,
  getAllTeamMembers,
  deleteTeamMember,
  updateTeamMember,
  subscribeToTeamMembers,
  
  // Sites
  saveSite,
  getAllSites,
  deleteSite,
  updateSite,
  subscribeToSites,
  
  // Payment Requests
  savePaymentRequest,
  getAllPaymentRequests,
  deletePaymentRequest,
  updatePaymentRequest,
  subscribeToPaymentRequests,
  
  // Inventory
  saveInventoryItem,
  getAllInventory,
  deleteInventoryItem,
  updateInventoryItem,
  subscribeToInventory,
  
  // Material Usage Logs
  saveMaterialUsageLog,
  getAllMaterialUsageLogs,
  subscribeToMaterialUsageLogs,
  
  // Transporters
  saveTransporter,
  getAllTransporters,
  deleteTransporter,
  updateTransporter,
  subscribeToTransporters,
  
  // Job Cards
  saveJobCard,
  getAllJobCards,
  deleteJobCard,
  updateJobCard,
  subscribeToJobCards,
  
  // Vendors
  saveVendor,
  getAllVendors,
  deleteVendor,
  updateVendor,
  subscribeToVendors,
  
  // Billing Overview
  saveBillingOverview,
  getAllBillingOverviews,
  deleteBillingOverview,
  updateBillingOverview,
  subscribeToBillingOverviews,
  
  // Vendor Billing Requests (Line Items)
  saveVendorBillingRequest,
  getAllVendorBillingRequests,
  deleteVendorBillingRequest,
  updateVendorBillingRequest,
  subscribeToVendorBillingRequests,
  
  // Utils
  clearAllData,
  initializeDefaultAdmin
};
