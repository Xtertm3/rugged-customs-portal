import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { generatePaymentRequestSummary, PaymentRequestData, MaterialItem } from './services/geminiService';
import { Dashboard } from './components/Dashboard';
import { PaymentRequestForm } from './components/PaymentRequestForm';
import { Projects } from './components/Projects';
import { BulkUploadModal } from './components/BulkUploadModal';
import { Team } from './components/Team';
import { Transporter as TransporterPage } from './components/Transporter';
import { SiteDetail } from './components/SiteDetail';
import { NewJobCardModal } from './components/NewJobCardModal';
import { TeamMemberDetail } from './components/TeamMemberDetail';
import { TransporterDetail } from './components/TransporterDetail';
import { NotificationBell } from './components/NotificationBell';
import { EditTeamMemberModal } from './components/EditTeamMemberModal';
import { EditJobCardModal } from './components/EditJobCardModal';
import { Login } from './components/Login';
import { TransporterDashboard } from './components/TransporterDashboard';
import { EditTransporterModal } from './components/EditTransporterModal';
import { SiteForm } from './components/SiteForm';
import firebaseService from './services/firebaseService';
import { Spinner } from './components/Spinner';
import { Inventory } from './components/Inventory';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { MaterialUsageModal } from './components/MaterialUsageModal';
import { OpeningBalanceModal } from './components/OpeningBalanceModal';
import { TransactionReport } from './components/TransactionReport';
import { InventoryDetailReport } from './components/InventoryDetailReport';
import { PaymentRequestDetail } from './components/PaymentRequestDetail';
import { DocumentLibrary } from './components/DocumentLibrary';


export interface StatusChange {
  status: 'Pending' | 'Approved' | 'Paid';
  timestamp: string;
  userId: string;
  userName: string;
}

export interface RequestAttachment {
  name: string;
  dataUrl: string;
}

export interface PaymentRequest extends PaymentRequestData {
  id: string;
  timestamp: string;
  status: 'Pending' | 'Approved' | 'Paid';
  summary: string;
  photos: RequestAttachment[];
  documents: RequestAttachment[];
  statusHistory: StatusChange[];
  materials?: MaterialItem[];
  assignTo?: string;
  stage?: 'Civil' | 'Electricals';
  transporterId?: string;
}

export interface SiteAttachment {
  name: string;
  dataUrl: string;
}

export interface Site {
  id: string;
  siteName: string;
  location: string;
  latitude?: string;
  longitude?: string;
  projectType: string;
  workType?: 'Civil' | 'Electrical';
  initialMaterials: MaterialItem[];
  siteManagerId?: string;
  photos?: SiteAttachment[];
  documents?: SiteAttachment[];
}

export interface ProjectSummary {
  id: string;
  name: string;
  requestCount: number;
  siteStatus: 'Open' | 'Closed' | 'No Activity';
  siteManagerId?: string;
  totalPaid: number;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  mobile: string;
  photo: string | null;
  password?: string;
  passwordChanged?: boolean;
  assignedMaterials?: MaterialItem[];
}

export interface Transporter {
  id: string;
  contactPerson: string;
  contactNumber: string;
  password?: string;
  passwordChanged?: boolean;
}

export interface JobCard {
  id: string;
  transporterId: string;
  pickFrom: string;
  dropPoints: string[];
  description: string;
  status: 'Assigned' | 'In Transit' | 'Completed';
  timestamp: string;
}

export interface InventoryItem {
    id: number;
    teamMemberName: string;
    teamMemberRole: string;
    assignedSite: string;
    materialName: string;
    initialUnits: number;
    usedUnits: number;
    remainingUnits: number;
}

export interface MaterialUsageLog {
  id: string;
  teamMemberId: string;
  teamMemberName: string;
  siteId: string;
  siteName: string;
  materialName: string;
  quantityUsed: number;
  timestamp: string;
  notes?: string;
}



const VAPID_PUBLIC_KEY = 'BPhgW-wTt6-7K5f-k_Gf5l_3hJ1jJ7fH9qV4eW_bY9gL-rP8kX1fW_aG-zY3cK4bE7nF-t_R_uJ9eA';

const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
};

const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
};


const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<TeamMember | null>(null);
  const [viewHistory, setViewHistory] = useState<string[]>(['dashboard']);

  const [sites, setSites] = useState<Site[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [transporters, setTransporters] = useState<Transporter[]>([]);
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [materialUsageLogs, setMaterialUsageLogs] = useState<MaterialUsageLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDbLoading, setIsDbLoading] = useState(true);

  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  const [isNewJobCardModalOpen, setIsNewJobCardModalOpen] = useState(false);
  const [isEditTeamMemberModalOpen, setIsEditTeamMemberModalOpen] = useState(false);
  const [isEditJobCardModalOpen, setIsEditJobCardModalOpen] = useState(false);
  const [isEditTransporterModalOpen, setIsEditTransporterModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isForcedPasswordChange, setIsForcedPasswordChange] = useState(false);
  
  const [selectedSiteName, setSelectedSiteName] = useState<string | null>(null);
  const [selectedTeamMemberId, setSelectedTeamMemberId] = useState<string | null>(null);
  const [selectedTransporterId, setSelectedTransporterId] = useState<string | null>(null);
  const [selectedPaymentRequestId, setSelectedPaymentRequestId] = useState<string | null>(null);
  
  const [editingPaymentRequest, setEditingPaymentRequest] = useState<PaymentRequest | null>(null);
  const [editingTeamMember, setEditingTeamMember] = useState<TeamMember | null>(null);
  const [editingJobCard, setEditingJobCard] = useState<JobCard | null>(null);
  const [editingTransporter, setEditingTransporter] = useState<Transporter | null>(null);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [initialSiteIdForCompletion, setInitialSiteIdForCompletion] = useState<string | null>(null);


  const [isSubscribed, setIsSubscribed] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  const currentView = viewHistory[viewHistory.length - 1];
  
  const navigateTo = (view: string) => setViewHistory(prev => [...prev, view]);
  const navigateBack = () => {
      setEditingPaymentRequest(null);
      setEditingSite(null);
      setInitialSiteIdForCompletion(null);
      setViewHistory(prev => {
          if (prev.length > 1) return prev.slice(0, -1);
          return ['dashboard'];
      });
  };

  // All save functions removed - Firebase real-time listeners auto-sync all data changes


  // Initialize Firebase real-time listeners for ALL data
  useEffect(() => {
    const initializeFirebase = async () => {
      try {
        // Initialize default admin if needed
        await firebaseService.initializeDefaultAdmin();

        // Restore logged-in user from session
        const storedUser = sessionStorage.getItem('currentUser');
        if (storedUser) {
          setCurrentUser(JSON.parse(storedUser));
        }

        // Setup real-time listeners for ALL collections
        const unsubscribeTeam = firebaseService.subscribeToTeamMembers((members) => {
          setTeamMembers(members);
        });

        const unsubscribeSites = firebaseService.subscribeToSites((sites) => {
          const migratedSites = sites.map(s => ({
            ...s, 
            initialMaterials: s.initialMaterials || [], 
            photos: s.photos || [], 
            documents: s.documents || []
          }));
          setSites(migratedSites);
        });

        const unsubscribeRequests = firebaseService.subscribeToPaymentRequests((requests) => {
          const migratedRequests = requests.map((req: any): PaymentRequest => {
            let newReq = {...req};
            if (!newReq.statusHistory || newReq.statusHistory.length === 0) {
              newReq.statusHistory = [{
                status: newReq.status,
                timestamp: newReq.timestamp,
                userId: 'system',
                userName: 'System'
              }];
            }
            newReq.photos = newReq.photos || [];
            newReq.documents = newReq.documents || [];
            return newReq as PaymentRequest;
          });
          setPaymentRequests(migratedRequests);
        });

        const unsubscribeTransporters = firebaseService.subscribeToTransporters((transporters) => {
          setTransporters(transporters);
        });

        const unsubscribeJobCards = firebaseService.subscribeToJobCards((cards) => {
          const migratedJobCards = cards.map((card): JobCard => {
            if (card.dropPoint && !Array.isArray(card.dropPoints)) {
              const { dropPoint, ...rest } = card;
              return { ...rest, dropPoints: [dropPoint] };
            }
            if (!Array.isArray(card.dropPoints)) {
              return { ...card, dropPoints: [] };
            }
            return card;
          });
          setJobCards(migratedJobCards);
        });

        const unsubscribeMaterialLogs = firebaseService.subscribeToMaterialUsageLogs((logs) => {
          setMaterialUsageLogs(logs || []);
        });

        setIsDbLoading(false);

        // Service worker for notifications
        if ('Notification' in window && 'serviceWorker' in navigator) {
          setNotificationPermission(Notification.permission);
          navigator.serviceWorker.ready.then(reg => {
            reg.pushManager.getSubscription().then(sub => {
              if (sub) setIsSubscribed(true);
            });
          });
        }

        // Cleanup function to unsubscribe when component unmounts
        return () => {
          unsubscribeTeam();
          unsubscribeSites();
          unsubscribeRequests();
          unsubscribeTransporters();
          unsubscribeJobCards();
          unsubscribeMaterialLogs();
        };

      } catch (err) {
        console.error("Failed to initialize Firebase:", err);
        setError("Could not connect to cloud database. Please check your internet connection.");
        setIsDbLoading(false);
      }
    };

    const cleanup = initializeFirebase();
    
    // Cleanup subscriptions on unmount
    return () => {
      cleanup.then(unsubFn => unsubFn && unsubFn());
    };
  }, []);

  const handleLogin = (mobile: string, pass: string): boolean => {
    if (mobile === '9986277180' && pass === '9986') {
      const adminUser: TeamMember = { id: 'admin', name: 'Admin', role: 'Admin', mobile, photo: null, passwordChanged: true };
      setCurrentUser(adminUser);
      sessionStorage.setItem('currentUser', JSON.stringify(adminUser));
      return true;
    }
    const member = teamMembers.find(m => m.mobile === mobile && (m.password || m.mobile) === pass);
    if (member) {
       if (!member.passwordChanged) {
        setCurrentUser(member);
        sessionStorage.setItem('currentUser', JSON.stringify(member));
        setIsForcedPasswordChange(true);
        setIsChangePasswordModalOpen(true);
      } else {
        setCurrentUser(member);
        sessionStorage.setItem('currentUser', JSON.stringify(member));
      }
      return true;
    }
    const transporter = transporters.find(t => t.contactNumber === mobile && (t.password || t.contactNumber) === pass);
    if (transporter) {
       const transporterUser: TeamMember = { id: transporter.id, name: transporter.contactPerson, role: 'Transporter', mobile: transporter.contactNumber, photo: null };
       const originalTransporter = transporters.find(t => t.id === transporter.id)!;
       
       if (!originalTransporter.passwordChanged) {
            setCurrentUser(transporterUser);
            sessionStorage.setItem('currentUser', JSON.stringify(transporterUser));
            setIsForcedPasswordChange(true);
            setIsChangePasswordModalOpen(true);
       } else {
           setCurrentUser(transporterUser);
           sessionStorage.setItem('currentUser', JSON.stringify(transporterUser));
       }
       return true;
    }
    return false;
  };

  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('currentUser');
    setViewHistory(['dashboard']);
  };
  
  const permissions = useMemo(() => {
    const role = currentUser?.role;
    return {
      canApprove: role === 'Admin' || role === 'Manager',
  canEdit: role === 'Admin' || role === 'Manager' || role === 'Accountant',
  canEditMaterials: role === 'Admin' || role === 'Manager' || role === 'Accountant' || role === 'Team Member',
      canManageSites: role === 'Admin' || role === 'Manager' || role === 'Accountant',
      canManageTeam: role === 'Admin' || role === 'Manager' || role === 'Accountant',
      canManageTransporters: role === 'Admin' || role === 'Manager' || role === 'Accountant',
      canDownloadInventoryReport: role === 'Admin' || role === 'Manager' || role === 'Accountant' || role === 'Supervisor',
    };
  }, [currentUser]);

  const handleUpdateRequestStatus = useCallback(async (requestId: string, status: 'Pending' | 'Approved' | 'Paid') => {
    if (!currentUser) return;
    const req = paymentRequests.find(r => r.id === requestId);
    if (!req) return;
    
    const newHistoryEntry: StatusChange = {
      status,
      timestamp: new Date().toLocaleString(),
      userId: currentUser.id,
      userName: currentUser.name,
    };
    
    const updatedRequest = {
      ...req,
      status,
      statusHistory: [...req.statusHistory, newHistoryEntry]
    };
    
    await firebaseService.updatePaymentRequest(requestId, updatedRequest);
    // State will auto-update via Firebase listener
  }, [currentUser, paymentRequests]);

  const handleSubmitRequest = useCallback(async (formData: PaymentRequestData & {id?: string}, photos: File[], documents: File[]): Promise<boolean> => {
    if (!currentUser) {
      setError("You must be logged in to perform this action.");
      return false;
    }
    setIsLoading(true);
    setError(null);
    
    try {
        const photoAttachments = await Promise.all(photos.map(async (file) => ({ name: file.name, dataUrl: await fileToDataUrl(file) })));
        const documentAttachments = await Promise.all(documents.map(async (file) => ({ name: file.name, dataUrl: await fileToDataUrl(file) })));
        const summary = await generatePaymentRequestSummary(formData);
      
        const initialStatus = 'Pending';

        const statusEntry: StatusChange = {
            status: initialStatus,
            timestamp: new Date().toLocaleString(),
            userId: currentUser.id,
            userName: currentUser.name
        };

        if (formData.id) {
            const req = paymentRequests.find(r => r.id === formData.id);
            if (req) {
              const updatedRequest: PaymentRequest = {
                ...req,
                ...formData,
                summary,
                photos: photos.length > 0 ? photoAttachments : req.photos,
                documents: documents.length > 0 ? documentAttachments : req.documents,
                status: initialStatus,
                statusHistory: [...req.statusHistory, { ...statusEntry, status: initialStatus }],
              };
              await firebaseService.updatePaymentRequest(formData.id, updatedRequest);
              navigateBack();
              return true;
            }
        } else {
            const newRequest: PaymentRequest = { 
                ...formData, 
                id: new Date().toISOString(), 
                timestamp: new Date().toLocaleString(), 
                status: initialStatus, 
                summary, 
                photos: photoAttachments, 
                documents: documentAttachments,
                statusHistory: [statusEntry]
            };
            await firebaseService.savePaymentRequest(newRequest);
            if (isSubscribed && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
              navigator.serviceWorker.controller.postMessage({ type: 'SHOW_NOTIFICATION', title: `New Submission: ${newRequest.siteName}`, body: `A completion report was submitted for ${newRequest.location}.` });
            }
            navigateBack();
            return true;
        }
        return false;

    } catch (err) {
      setError(`Failed to process request: ${err instanceof Error ? err.message : 'Unknown error'}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [navigateBack, isSubscribed, currentUser, paymentRequests]);
  
   const handleBulkUpload = useCallback(async (file: File): Promise<{success: number, failed: number, errors: string[]}> => {
    if (!currentUser) {
       setError("You must be logged in to perform this action.");
       return { success: 0, failed: 0, errors: ["User not logged in."] };
    }
    setIsLoading(true);
    setError(null);
    const reader = new FileReader();

    return new Promise((resolve) => {
      reader.onload = async (event) => {
        const text = event.target?.result as string;
        const rows = text.split('\n');
        const requestsToProcess: (PaymentRequestData & { assignTo: string, stage: 'Civil' | 'Electricals' })[] = [];
        const errors: string[] = [];

        rows.forEach((row, index) => {
          if (!row.trim()) return; 
          const columns = row.split(',').map(c => c.trim());
          if (columns.length !== 3) { // siteName, assignTo, stage
             errors.push(`Row ${index + 1}: Expected 3 columns, found ${columns.length}.`);
             return;
          }
          const [siteName, assignTo, stage] = columns;

          const site = sites.find(s => s.siteName === siteName);
          if (!site) {
              errors.push(`Row ${index + 1}: Site '${siteName}' not found. Please create the site first.`);
              return;
          }
          
          if (stage !== 'Civil' && stage !== 'Electricals') {
            errors.push(`Row ${index + 1}: Invalid stage '${stage}'. Must be 'Civil' or 'Electricals'.`);
            return;
          }

          requestsToProcess.push({ 
            ...site,
            assignTo, 
            stage,
            amount: '0', // Bulk uploads are legacy, treat as no-payment activities
            paymentFor: 'Bulk Upload Activity',
          });
        });

        const results = await Promise.allSettled(
          requestsToProcess.map(req => generatePaymentRequestSummary(req))
        );

        const newRequests: PaymentRequest[] = [];
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            const statusEntry: StatusChange = {
                status: 'Approved', // Legacy bulk uploads are auto-approved
                timestamp: new Date().toLocaleString(),
                userId: currentUser.id,
                userName: currentUser.name
            };
            newRequests.push({
              ...requestsToProcess[index],
              id: `${new Date().toISOString()}-${index}`,
              timestamp: new Date().toLocaleString(),
              status: 'Approved',
              summary: result.value,
              photos: [], documents: [],
              statusHistory: [statusEntry]
            });
          } else {
            errors.push(`Row ${index + 1}: API Error - ${result.reason instanceof Error ? result.reason.message : 'Unknown'}`);
          }
        });

        if (newRequests.length > 0) {
           // Save all requests to Firebase
           await Promise.all(
             newRequests.map(req => firebaseService.savePaymentRequest(req))
           );
           // State auto-updates via Firebase listener
        }
        
        setIsLoading(false);
        resolve({ success: newRequests.length, failed: errors.length, errors });
      };
      reader.readAsText(file);
    });
  }, [currentUser, sites, paymentRequests]);

  const handleAddTeamMember = async (name: string, role: string, mobile: string, photo: string | null, password?: string) => {
    const newMember: TeamMember = { id: Date.now().toString(), name, role, mobile, photo, password: password || mobile, passwordChanged: false };
    await firebaseService.saveTeamMember(newMember);
    // State auto-updates via Firebase listener
  };
  
  const handleDeleteTeamMember = async (memberId: string) => {
    const memberToDelete = teamMembers.find(m => m.id === memberId);
    if (!memberToDelete) return;

    const isManagerOfSite = sites.some(s => s.siteManagerId === memberId);
    if (isManagerOfSite) {
        alert(`Cannot delete ${memberToDelete.name}. They are assigned as a manager to one or more sites. Please reassign the site manager first.`);
        return;
    }

    if (window.confirm(`Are you sure you want to permanently delete ${memberToDelete.name}? This action cannot be undone.`)) {
        await firebaseService.deleteTeamMember(memberId);
        // State auto-updates via Firebase listener
    }
  };
  
  const handleUpdateTeamMember = async (updatedMember: TeamMember) => {
    const existing = teamMembers.find(m => m.id === updatedMember.id);
    if (existing) {
      const wasPasswordUpdated = !!updatedMember.password;
      const updated = { 
        ...existing, 
        ...updatedMember,
        password: updatedMember.password || existing.password,
        passwordChanged: wasPasswordUpdated ? false : existing.passwordChanged
      };
      await firebaseService.updateTeamMember(updatedMember.id, updated);
      // State auto-updates via Firebase listener
    }
    setIsEditTeamMemberModalOpen(false);
    setEditingTeamMember(null);
  };

  const handleAddTransporter = async (contactPerson: string, contactNumber: string, password?: string) => {
    const newTransporter: Transporter = { id: Date.now().toString(), contactPerson, contactNumber, password: password || contactNumber, passwordChanged: false };
    await firebaseService.saveTransporter(newTransporter);
  };

  const handleUpdateTransporter = async (updatedTransporter: Transporter) => {
    const existing = transporters.find(t => t.id === updatedTransporter.id);
    if (existing) {
      const wasPasswordUpdated = !!updatedTransporter.password;
      const updated = { 
        ...existing, 
        ...updatedTransporter,
        password: updatedTransporter.password || existing.password,
        passwordChanged: wasPasswordUpdated ? false : existing.passwordChanged
      };
      await firebaseService.updateTransporter(updatedTransporter.id, updated);
    }
    setIsEditTransporterModalOpen(false);
    setEditingTransporter(null);
  };

  const handleDeleteTransporter = async (transporterId: string) => {
    await firebaseService.deleteTransporter(transporterId);
  };

  const handleAddJobCard = async (data: Omit<JobCard, 'id' | 'status' | 'timestamp'>) => {
    const newCard: JobCard = { ...data, id: Date.now().toString(), status: 'Assigned', timestamp: new Date().toLocaleString() };
    await firebaseService.saveJobCard(newCard);
  };

  const handleUpdateJobCard = async (updatedCard: JobCard) => {
    await firebaseService.updateJobCard(updatedCard.id, updatedCard);
    setIsEditJobCardModalOpen(false);
    setEditingJobCard(null);
  };
  
  const handleUpdateJobCardStatus = async (cardId: string, status: 'Assigned' | 'In Transit' | 'Completed') => {
    const card = jobCards.find(c => c.id === cardId);
    if (card) {
      await firebaseService.updateJobCard(cardId, { ...card, status });
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    const requestToDelete = paymentRequests.find(r => r.id === requestId);
    if (!requestToDelete) return;

    if (window.confirm(`Are you sure you want to delete the submission for "${requestToDelete.siteName}" created at ${requestToDelete.timestamp}? This action is permanent.`)) {
        await firebaseService.deletePaymentRequest(requestId);
    }
  };

  const handleAddSite = async (siteData: Omit<Site, 'id'>) => {
    const newSite: Site = { ...siteData, id: Date.now().toString() };
    await firebaseService.saveSite(newSite);
    navigateBack();
  };

  const handleUpdateSite = async (updatedSite: Site) => {
    await firebaseService.updateSite(updatedSite.id, updatedSite);
    setEditingSite(null);
    navigateBack();
  };

  const handleDeleteSite = async (siteId: string) => {
    const siteToDelete = sites.find(s => s.id === siteId);
    if (!siteToDelete) return;

    const isSiteInUse = paymentRequests.some(req => req.siteName === siteToDelete.siteName);
    if (isSiteInUse) {
        alert(`Cannot delete site "${siteToDelete.siteName}". It has associated submissions. Please clear site submissions first.`);
        return;
    }

    if (window.confirm(`Are you sure you want to permanently delete the site "${siteToDelete.siteName}"? This action cannot be undone.`)) {
        await firebaseService.deleteSite(siteId);
    }
  };

  const handleViewSiteDetails = (siteName: string) => { setSelectedSiteName(siteName); navigateTo('siteDetail'); };
  const handleViewRequestDetails = (requestId: string) => { setSelectedPaymentRequestId(requestId); navigateTo('requestDetail'); };
  const handleViewTeamMemberDetails = (memberId: string) => { setSelectedTeamMemberId(memberId); navigateTo('teamMemberDetail'); };
  const handleViewTransporterDetails = (transporterId: string) => { setSelectedTransporterId(transporterId); navigateTo('transporterDetail'); };
  const handleEditRequest = (request: PaymentRequest) => { setEditingPaymentRequest(request); navigateTo('form'); };
  const handleEditTeamMember = (member: TeamMember) => { setEditingTeamMember(member); setIsEditTeamMemberModalOpen(true); };
  const handleEditJobCard = (jobCard: JobCard) => { setEditingJobCard(jobCard); setIsEditJobCardModalOpen(true); };
  const handleEditTransporter = (transporter: Transporter) => { setEditingTransporter(transporter); setIsEditTransporterModalOpen(true); };
  const handleNavigateToCreateSite = () => { setEditingSite(null); navigateTo('siteForm'); };
  const handleNavigateToEditSite = (site: Site) => { setEditingSite(site); navigateTo('siteForm'); };
  const handleNavigateToCompletionForm = (siteId: string) => {
    setInitialSiteIdForCompletion(siteId);
    setEditingPaymentRequest(null);
    navigateTo('form');
  };

  const handleNotificationToggle = async () => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      alert("Push Notifications are not supported in your browser.");
      return;
    }
    if (notificationPermission === 'denied') {
        alert("Notification permission blocked. Please enable it in your browser settings.");
        return;
    }
    if (isSubscribed) {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
            await sub.unsubscribe();
            setIsSubscribed(false);
        }
    } else {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        if (permission === 'granted') {
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });
            console.log("PushSubscription:", sub);
            setIsSubscribed(true);
        }
    }
  };

  const handleChangePassword = async (newPassword: string): Promise<void> => {
    if (!currentUser) throw new Error("No user is currently logged in.");

    let success = false;
    let updatedUserForSession: TeamMember | null = null;
    
    const isTeamMember = teamMembers.some(m => m.id === currentUser.id);
    if (isTeamMember) {
        const member = teamMembers.find(m => m.id === currentUser.id);
        if (member) {
            const updatedMember = { ...member, password: newPassword, passwordChanged: true };
            await firebaseService.updateTeamMember(currentUser.id, updatedMember);
            updatedUserForSession = { ...updatedMember };
            success = true;
        }
    } else {
        const isTransporter = transporters.some(t => t.id === currentUser.id);
        if (isTransporter) {
            const transporter = transporters.find(t => t.id === currentUser.id);
            if (transporter) {
                const updatedTransporter = { ...transporter, password: newPassword, passwordChanged: true };
                await firebaseService.updateTransporter(currentUser.id, updatedTransporter);
                updatedUserForSession = {
                    id: updatedTransporter.id,
                    name: updatedTransporter.contactPerson,
                    role: 'Transporter',
                    mobile: updatedTransporter.contactNumber,
                    photo: null
                };
                success = true;
            }
        }
    }

    if (success && updatedUserForSession) {
        setCurrentUser(updatedUserForSession);
        sessionStorage.setItem('currentUser', JSON.stringify(updatedUserForSession));
        setIsChangePasswordModalOpen(false);
        setIsForcedPasswordChange(false);
    } else {
        throw new Error("Failed to update password in the database.");
    }
};

  const projectSummaries = useMemo((): ProjectSummary[] => {
    return sites.map(site => {
      const requestsForSite = paymentRequests.filter(req => req.siteName === site.siteName);
      
      let siteStatus: 'Open' | 'Closed' | 'No Activity' = 'No Activity';
      if (requestsForSite.length > 0) {
        if (requestsForSite.every(r => r.status === 'Paid')) {
            siteStatus = 'Closed';
        } else {
            siteStatus = 'Open';
        }
      }

      // Calculate total paid amount for this site (sum of ALL paid requests)
      const totalPaid = requestsForSite
        .filter(r => r.status === 'Paid' && r.amount)
        .reduce((sum, req) => {
          // Remove all non-numeric characters except decimal point and minus
          const cleanAmount = (req.amount || '').replace(/[^0-9.-]/g, '');
          const amount = parseFloat(cleanAmount) || 0;
          return sum + amount;
        }, 0);

      return { 
        id: site.id, 
        name: site.siteName, 
        requestCount: requestsForSite.length, 
        siteStatus, 
        siteManagerId: site.siteManagerId,
        totalPaid
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [sites, paymentRequests]);
  
  const ongoingSiteNames = useMemo(() => {
    return projectSummaries
        .filter(summary => summary.siteStatus === 'Open' || summary.siteStatus === 'No Activity')
        .map(summary => summary.name)
        .sort();
  }, [projectSummaries]);

  const NavButton: React.FC<{ view: string, label: string }> = ({ view, label }) => (
    <button 
        onClick={() => setViewHistory([view])} 
        className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
            currentView === view 
            ? 'bg-primary text-white shadow-md' 
            : 'bg-white text-gray-700 hover:bg-orange-50 border border-gray-200'
        }`}
    >
      {label}
    </button>
  );

  const ongoingProjects = useMemo(() => new Set(paymentRequests.filter(req => req.status === 'Pending' || req.status === 'Approved').map(req => req.siteName)).size, [paymentRequests]);
  const completedThisMonth = useMemo(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return paymentRequests.filter(req => req.status === 'Paid' && new Date(req.timestamp.split(',')[0]) >= firstDay).length;
  }, [paymentRequests]);
  
  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const arrayToCSV = (data: any[], headers: { key: string; label: string }[]) => {
    const escapeCSVField = (field: any): string => {
      const str = String(field ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    const headerRow = headers.map(h => escapeCSVField(h.label)).join(',');
    const dataRows = data.map(row => 
      headers.map(header => escapeCSVField(row[header.key])).join(',')
    );
    return [headerRow, ...dataRows].join('\n');
  };

  const handleDownloadTransporterJobReport = useCallback((transporterId: string) => {
      const transporter = transporters.find(t => t.id === transporterId);
      if (!transporter) return;

      const assignedJobs = jobCards.filter(j => j.transporterId === transporterId);
      if (assignedJobs.length === 0) {
          alert(`No jobs assigned to ${transporter.contactPerson} to export.`);
          return;
      }
      
      const headers = [
        { key: 'timestamp', label: 'Timestamp' },
        { key: 'pickFrom', label: 'Pick From' },
        { key: 'dropPoints', label: 'Drop Points' },
        { key: 'status', label: 'Status' },
        { key: 'description', label: 'Description' },
      ];
      
      const jobsForCSV = assignedJobs.map(job => ({
        ...job,
        dropPoints: job.dropPoints.join(', ')
      }));

      const csvContent = arrayToCSV(jobsForCSV, headers);
      downloadCSV(csvContent, `job_report_${transporter.contactPerson.replace(/\s/g, '_')}.csv`);
  }, [jobCards, transporters]);
  
  const inventoryData = useMemo<InventoryItem[]>(() => {
    const reportData: Omit<InventoryItem, 'id'>[] = [];

    // Build inventory from teamMembers assignedMaterials (team-scoped opening balances)
    teamMembers.forEach(member => {
      const managedSite = sites.find(s => s.siteManagerId === member.id);
      const assignedSiteName = managedSite ? managedSite.siteName : 'N/A';

      if (!member.assignedMaterials || member.assignedMaterials.length === 0) {
        reportData.push({
          teamMemberName: member.name,
          teamMemberRole: member.role,
          assignedSite: assignedSiteName,
          materialName: 'No materials assigned',
          initialUnits: 0,
          usedUnits: 0,
          remainingUnits: 0,
        });
        return;
      }

      member.assignedMaterials.forEach(mat => {
        const initialUnits = Number(mat.units || 0);
        const usedUnits = Number(mat.used || 0);
        const remaining = initialUnits - usedUnits;
        reportData.push({
          teamMemberName: member.name,
          teamMemberRole: member.role,
          assignedSite: assignedSiteName,
          materialName: mat.name,
          initialUnits,
          usedUnits,
          remainingUnits: remaining,
        });
      });
    });

    // attach teamRole for filtering
    let itemsWithTeam: (Omit<InventoryItem, 'id'> & { teamRole?: string })[] = reportData.map(r => ({ ...r, teamRole: r.teamMemberRole }));

    const privileged = currentUser && ['Admin', 'Manager', 'Accountant'].includes(currentUser.role);
    if (!privileged && currentUser) {
      // show only items for the current user's role/team
      itemsWithTeam = itemsWithTeam.filter(i => i.teamRole === currentUser.role);
    }

    return itemsWithTeam.map((item, index) => ({ ...item, id: index } as InventoryItem));
  }, [teamMembers, sites, currentUser]);

  // Inventory manipulation handlers (Admin/Manager/Accountant only)
  const handleEditInventoryItem = async (siteName: string, materialName: string, newInitialUnits: number) => {
    if (!currentUser) return false;
    if (!['Admin', 'Manager', 'Accountant'].includes(currentUser.role)) {
      alert('You do not have permission to edit inventory items.');
      return false;
    }
    const site = sites.find(s => s.siteName === siteName);
    if (!site) return false;
    const updatedMaterials = (site.initialMaterials || []).map(m => m.name === materialName ? { ...m, units: String(newInitialUnits) } : m);
    const updatedSite = { ...site, initialMaterials: updatedMaterials };
    await firebaseService.updateSite(site.id, updatedSite);
    return true;
  };

  const handleDeleteInventoryItem = async (siteName: string, materialName: string) => {
    if (!currentUser) return false;
    if (!['Admin', 'Manager', 'Accountant'].includes(currentUser.role)) {
      alert('You do not have permission to delete inventory items.');
      return false;
    }
    const site = sites.find(s => s.siteName === siteName);
    if (!site) return false;
    const updatedMaterials = (site.initialMaterials || []).filter(m => m.name !== materialName);
    const updatedSite = { ...site, initialMaterials: updatedMaterials };
    await firebaseService.updateSite(site.id, updatedSite);
    return true;
  };

  const handleAddInventoryItem = async (siteId: string, name: string, units: number) => {
    if (!currentUser) return false;
    if (!['Admin', 'Manager', 'Accountant'].includes(currentUser.role)) {
      alert('You do not have permission to add inventory items.');
      return false;
    }
    const site = sites.find(s => s.id === siteId);
    if (!site) return false;
    const newMat = { id: Date.now().toString(), name, units: String(units), used: '0' };
    const updatedSite = { ...site, initialMaterials: [...(site.initialMaterials || []), newMat] };
    await firebaseService.updateSite(site.id, updatedSite);
    return true;
  };

  const [isMaterialUsageModalOpen, setIsMaterialUsageModalOpen] = useState(false);
  const [isOpeningBalanceModalOpen, setIsOpeningBalanceModalOpen] = useState(false);
  const [isTransactionReportOpen, setIsTransactionReportOpen] = useState(false);
  const [isInventoryDetailReportOpen, setIsInventoryDetailReportOpen] = useState(false);

  const handleSaveOpeningBalance = async (teamId: string, materialsList: { name: string; openingBalance: number }[]): Promise<boolean> => {
    if (!currentUser) {
      setError('You must be logged in to set opening balance.');
      return false;
    }
    setIsLoading(true);
    try {
      const member = teamMembers.find(t => t.id === teamId);
      if (!member) {
        setError('Selected team not found.');
        return false;
      }

      // Merge: keep existing materials not in the new list, and add/update materials from the new list
      const existingMaterials = member.assignedMaterials || [];
      
      // Create new materials with unique IDs
      const newMaterials = materialsList.map(m => ({
        id: Date.now().toString() + Math.random(),
        name: m.name,
        units: String(m.openingBalance),
        used: '0',
      }));

      // Build merged list: replace materials with matching names, keep others
      const newNames = new Set(newMaterials.map(m => m.name));
      const keptExisting = existingMaterials.filter(m => !newNames.has(m.name));
      
      // Remove duplicates from newMaterials (in case same material added twice in modal)
      const uniqueNew: typeof newMaterials = [];
      const seenNames = new Set<string>();
      for (const mat of newMaterials) {
        if (!seenNames.has(mat.name)) {
          uniqueNew.push(mat);
          seenNames.add(mat.name);
        }
      }

      const mergedMaterials = [...keptExisting, ...uniqueNew];

      const updatedMember = { ...member, assignedMaterials: mergedMaterials };
      await firebaseService.updateTeamMember(member.id, updatedMember);
      setIsOpeningBalanceModalOpen(false);
      return true;
    } catch (err) {
      console.error('Failed to save opening balance', err);
      setError('Failed to save opening balance.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogMaterialUsage = async (siteId: string, materialName: string, quantityUsed: number, notes?: string): Promise<boolean> => {
    if (!currentUser) {
      setError('You must be logged in to log material usage.');
      return false;
    }
    setIsLoading(true);
    try {
      const site = sites.find(s => s.id === siteId);
      const siteName = site ? site.siteName : 'Unknown Site';

      // find the team that owns this material (prefer same role as current user)
      let owner = teamMembers.find(tm => (tm.assignedMaterials || []).some(m => m.name === materialName && tm.role === currentUser.role));
      if (!owner) {
        owner = teamMembers.find(tm => (tm.assignedMaterials || []).some(m => m.name === materialName));
      }

      // If no owner found, offer to add to current user's assignedMaterials
      if (!owner) {
        if (!window.confirm(`${materialName} is not assigned to any team. Add it to your team's opening balance and log usage?`)) {
          return false;
        }
        const currentMember = teamMembers.find(tm => tm.id === currentUser.id);
        if (currentMember) {
          const newMat = { id: Date.now().toString(), name: materialName, units: String(quantityUsed), used: String(quantityUsed) };
          const updatedMember = { ...currentMember, assignedMaterials: [...(currentMember.assignedMaterials || []), newMat] };
          await firebaseService.updateTeamMember(currentUser.id, updatedMember);
        }
      } else {
        // update owner's assignedMaterials used count
        const mat = (owner.assignedMaterials || []).find(m => m.name === materialName)!;
        const initialUnits = Number(mat.units || 0);
        const currentUsed = Number(mat.used || 0);
        const remaining = initialUnits - currentUsed;
        if (quantityUsed > remaining) {
          if (!window.confirm(`You are logging ${quantityUsed}m but only ${remaining}m is available in ${owner.name}'s inventory. Proceed?`)) {
            return false;
          }
        }
        const updatedAssigned = (owner.assignedMaterials || []).map(am => am.name === materialName ? { ...am, used: String(Number(am.used || 0) + quantityUsed) } : am);
        const updatedOwner = { ...owner, assignedMaterials: updatedAssigned };
        await firebaseService.updateTeamMember(owner.id, updatedOwner);
      }

      const newLog: MaterialUsageLog = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
        teamMemberId: currentUser.id,
        teamMemberName: currentUser.name,
        siteId: siteId,
        siteName,
        materialName,
        quantityUsed,
        timestamp: new Date().toLocaleString(),
        notes,
      };

      await firebaseService.saveMaterialUsageLog(newLog);
      // State auto-updates via Firebase listener

      // Notify service worker / show notification
      if (isSubscribed && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
        try {
          navigator.serviceWorker.controller.postMessage({ type: 'MATERIAL_USAGE_LOG', payload: newLog });
          navigator.serviceWorker.controller.postMessage({ type: 'SHOW_NOTIFICATION', title: `Material Used: ${materialName}`, body: `${currentUser.name} logged ${quantityUsed}m at ${siteName}` });
        } catch (err) {
          console.warn('Failed to postMessage to service worker', err);
        }
      }

      return true;
    } catch (err) {
      console.error('Failed to log material usage', err);
      setError('Failed to log material usage.');
      return false;
    } finally {
      setIsLoading(false);
      setIsMaterialUsageModalOpen(false);
    }
  };


  const handleDownloadTeamInventoryReport = useCallback(() => {
    const headers = [
        { key: 'teamMemberName', label: 'Team Member Name' },
        { key: 'teamMemberRole', label: 'Team Member Role' },
        { key: 'assignedSite', label: 'Assigned Site' },
        { key: 'materialName', label: 'Material Name' },
        { key: 'initialUnits', label: 'Initial Units (m)' },
        { key: 'usedUnits', label: 'Used Units (m)' },
        { key: 'remainingUnits', label: 'Remaining Units (m)' },
    ];

    const csvContent = arrayToCSV(inventoryData, headers);
    downloadCSV(csvContent, 'team_inventory_report.csv');
  }, [inventoryData]);

  const handleDownloadMyInventoryReport = useCallback(() => {
    if (!currentUser) return;
    
    // Build comprehensive inventory data: ALL teams + ALL usage
    const comprehensiveData: {
      teamMemberName: string;
      materialName: string;
      openingBalance: number;
      totalUsed: number;
      remaining: number;
      sites: string;
    }[] = [];

    // Aggregate materials from ALL team members
    teamMembers.forEach(member => {
      if (member.assignedMaterials && member.assignedMaterials.length > 0) {
        member.assignedMaterials.forEach((mat: any) => {
          // Find all usage for this team member and material
          const usageLogs = materialUsageLogs.filter(
            log => log.teamMemberName === member.name && log.materialName === mat.name
          );
          const totalUsed = usageLogs.reduce((sum, log) => sum + (Number(log.quantityUsed) || 0), 0);
          const sitesUsed = [...new Set(usageLogs.map(log => log.siteName).filter(Boolean))].join(', ') || 'N/A';

          comprehensiveData.push({
            teamMemberName: member.name,
            materialName: mat.name,
            openingBalance: Number(mat.units) || 0,
            totalUsed,
            remaining: (Number(mat.units) || 0) - totalUsed,
            sites: sitesUsed,
          });
        });
      }
    });

    if (comprehensiveData.length === 0) {
      alert("No inventory data available.");
      return;
    }

    // Create CSV with comprehensive data
    const headers = [
      'Team Member',
      'Material Name',
      'Opening Balance (m)',
      'Total Used (m)',
      'Remaining (m)',
      'Sites Used',
    ];

    const rows = comprehensiveData.map(item => [
      item.teamMemberName,
      item.materialName,
      String(item.openingBalance),
      String(item.totalUsed),
      String(item.remaining),
      item.sites,
    ]);

    const csv = [headers, ...rows]
      .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'comprehensive_inventory_report.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [teamMembers, materialUsageLogs, currentUser]);


  const stats = { ongoingProjects, completedThisMonth };
  const selectedTeamMember = teamMembers.find(m => m.id === selectedTeamMemberId);
  const selectedTransporter = transporters.find(t => t.id === selectedTransporterId);
  const selectedSite = sites.find(s => s.siteName === selectedSiteName);
  const selectedPaymentRequest = paymentRequests.find(r => r.id === selectedPaymentRequestId);

  if (isDbLoading) {
    return (
      <div className="min-h-screen bg-background text-text-primary flex flex-col items-center justify-center">
        <Spinner />
        <p className="mt-4 text-text-secondary">Loading application data...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }
  
  if (isForcedPasswordChange) {
    return (
        <ChangePasswordModal 
            isForced={true}
            onSubmit={handleChangePassword}
            onClose={() => {}} // Should not be closable
        />
    );
  }

  if (currentUser.role === 'Transporter') {
    const transporterDetails = transporters.find(t => t.id === currentUser.id);
    if (!transporterDetails) {
      return <div>Error: Transporter details not found. <button onClick={handleLogout}>Logout</button></div>;
    }
    
    const handleTransporterRequestPayment = async (jobCard: JobCard, amount: string) => {
      // Find the destination site from job card
      const siteName = jobCard.dropPoints[0];
      const site = sites.find(s => s.siteName === siteName);
      
      if (!site) {
        setError(`Site "${siteName}" not found.`);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Create payment request automatically for transportation
        const initialStatus = 'Pending';
        const statusEntry: StatusChange = {
          status: initialStatus,
          timestamp: new Date().toLocaleString(),
          userId: currentUser.id,
          userName: currentUser.name
        };

        const newRequest: PaymentRequest = {
          siteName: site.siteName,
          location: site.location,
          projectType: site.projectType,
          latitude: site.latitude,
          longitude: site.longitude,
          amount: amount, // Amount entered by transporter
          paymentFor: 'Transportation',
          reasons: `Transportation service for job: ${jobCard.pickFrom} → ${jobCard.dropPoints.join(', ')}${jobCard.description ? ` - ${jobCard.description}` : ''}`,
          id: new Date().toISOString(),
          timestamp: new Date().toLocaleString(),
          status: initialStatus,
          summary: `Payment request for transportation service from ${jobCard.pickFrom} to ${jobCard.dropPoints.join(', ')}. Amount: ₹${amount}`,
          photos: [],
          documents: [],
          statusHistory: [statusEntry],
          assignTo: currentUser.id // Assign to transporter for tracking
        };

        await firebaseService.savePaymentRequest(newRequest);
        
        if (isSubscribed && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'SHOW_NOTIFICATION',
            title: `Payment Request Created`,
            body: `Transportation payment request for ${siteName} (₹${amount}) has been submitted.`
          });
        }
        
        setIsLoading(false);
        // Show success message or refresh the view
      } catch (err) {
        setIsLoading(false);
        setError(err instanceof Error ? err.message : 'Failed to create payment request');
      }
    };
    
    return <TransporterDashboard 
              transporter={transporterDetails}
              jobCards={jobCards.filter(j => j.transporterId === currentUser.id)}
              paymentRequests={paymentRequests}
              onRequestPaymentForJob={handleTransporterRequestPayment}
              onLogout={handleLogout}
           />;
  }
  
  const getPageTitle = () => `Logged in as: ${currentUser.name} (${currentUser.role})`;

  const MainViews: { [key: string]: React.ReactNode } = {
  dashboard: <Dashboard requests={paymentRequests} stats={stats} currentUser={currentUser} sites={sites} onUpdateRequestStatus={handleUpdateRequestStatus} onViewRequestDetails={handleViewRequestDetails} onEditRequest={handleEditRequest} canApprove={permissions.canApprove} canEdit={permissions.canEdit} onDeleteRequest={handleDeleteRequest} jobCards={jobCards} transporters={transporters} onUpdateJobCardStatus={handleUpdateJobCardStatus} canManageTransporters={permissions.canManageTransporters} onDownloadMyInventoryReport={handleDownloadMyInventoryReport} onCreateRequest={handleNavigateToCompletionForm} onOpenTransactionsReport={() => setIsTransactionReportOpen(true)} />,
    projects: <Projects sites={sites} projectSummaries={projectSummaries} teamMembers={teamMembers} onBulkUploadClick={() => setIsBulkUploadModalOpen(true)} onViewSiteDetails={handleViewSiteDetails} canManageSites={permissions.canManageSites} onCreateSite={handleNavigateToCreateSite} onEditSite={handleNavigateToEditSite} onDeleteSite={handleDeleteSite} currentUser={currentUser} onCompletionSubmitClick={handleNavigateToCompletionForm} />,
  inventory: <Inventory inventoryData={inventoryData} currentUser={currentUser} onEditItem={handleEditInventoryItem} onDeleteItem={handleDeleteInventoryItem} onAddItem={handleAddInventoryItem} sites={sites} onOpenUsageModal={() => setIsMaterialUsageModalOpen(true)} onOpenBalanceModal={() => setIsOpeningBalanceModalOpen(true)} />,
    team: <Team sites={sites} teamMembers={teamMembers} onAddMember={handleAddTeamMember} onDeleteMember={handleDeleteTeamMember} onViewDetails={handleViewTeamMemberDetails} onEditMember={handleEditTeamMember} canManageTeam={permissions.canManageTeam} onDownloadInventoryReport={handleDownloadTeamInventoryReport} onViewSiteDetails={handleViewSiteDetails} canDownloadInventoryReport={permissions.canDownloadInventoryReport} />,
    transporter: <TransporterPage transporters={transporters} onAddTransporter={handleAddTransporter} onDeleteTransporter={handleDeleteTransporter} onNewJobCard={() => setIsNewJobCardModalOpen(true)} onViewDetails={handleViewTransporterDetails} onEditTransporter={handleEditTransporter} />,
  siteDetail: selectedSite ? <SiteDetail site={selectedSite} requests={paymentRequests} teamMembers={teamMembers} onBack={navigateBack} onUpdateRequestStatus={handleUpdateRequestStatus} onEditRequest={handleEditRequest} canApprove={permissions.canApprove} canEdit={permissions.canEdit} canEditMaterials={permissions.canEditMaterials} onEditSite={handleNavigateToEditSite} onDeleteRequest={handleDeleteRequest} /> : null,
  teamMemberDetail: selectedTeamMember ? <TeamMemberDetail member={selectedTeamMember} requests={paymentRequests} teamMembers={teamMembers} onBack={navigateBack} onUpdateRequestStatus={handleUpdateRequestStatus} onEditRequest={handleEditRequest} canApprove={permissions.canApprove} canEdit={permissions.canEdit} onDeleteRequest={handleDeleteRequest} /> : null,
    transporterDetail: selectedTransporter ? <TransporterDetail transporter={selectedTransporter} jobCards={jobCards} onBack={navigateBack} onUpdateStatus={handleUpdateJobCardStatus} onEditJobCard={handleEditJobCard} transporters={transporters} canEdit={permissions.canManageTransporters} onDownloadReport={handleDownloadTransporterJobReport} /> : null,
    requestDetail: selectedPaymentRequest ? <PaymentRequestDetail request={selectedPaymentRequest} onBack={navigateBack} currentUser={currentUser} /> : null,
    documentLibrary: <DocumentLibrary sites={sites} paymentRequests={paymentRequests} teamMembers={teamMembers} onBack={navigateBack} />,
    form: <PaymentRequestForm sites={sites} onSubmit={handleSubmitRequest} onBack={navigateBack} isLoading={isLoading} error={error} initialData={editingPaymentRequest} initialSiteId={initialSiteIdForCompletion} />,
  siteForm: <SiteForm onBack={navigateBack} onSubmit={async (siteData) => { if (editingSite) { await handleUpdateSite(siteData as Site); } else { await handleAddSite(siteData as Omit<Site, 'id'>); } }} initialData={editingSite} teamMembers={teamMembers} canAddAttachments={permissions.canManageSites} />,
  };

  return (
    <div className="min-h-screen bg-background text-text-primary font-sans">
      <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
    <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8 animate-fade-in">
      <div className="flex items-center gap-4">
        <img
          src="/Ruggedcustoms Logo.png"
          alt="Rugged Customs"
          className="w-12 h-12 object-contain"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
        <div>
          <h1 className="text-3xl font-extrabold text-text-primary">
            Rugged Customs
          </h1>
          <p className="text-text-secondary mt-1">{getPageTitle()}</p>
        </div>
      </div>
            <div className="flex items-center gap-2">
               <NotificationBell isSubscribed={isSubscribed} permission={notificationPermission} onClick={handleNotificationToggle} />
               <button onClick={() => setIsChangePasswordModalOpen(true)} className="text-sm px-3 py-2 bg-surface border border-border text-text-secondary rounded-lg hover:bg-slate-100 hover:text-text-primary transition-colors">Change Password</button>
               <button onClick={handleLogout} className="text-sm px-3 py-2 bg-surface border border-border text-text-secondary rounded-lg hover:bg-slate-100 hover:text-text-primary transition-colors">Logout</button>
            </div>
        </header>
        
        {!['form', 'siteForm', 'siteDetail', 'teamMemberDetail', 'transporterDetail'].includes(currentView) && (
            <nav className="mb-8 p-2 bg-gray-50 border border-gray-200 rounded-xl flex justify-center items-center flex-wrap gap-3 animate-slide-up shadow-sm">
                <NavButton view="dashboard" label="Dashboard" />
                <NavButton view="projects" label="Sites" />
                <NavButton view="inventory" label="Inventory" />
                {(permissions.canManageTeam || permissions.canDownloadInventoryReport) && <NavButton view="team" label="Team" />}
                {permissions.canManageTransporters && <NavButton view="transporter" label="Transporter" />}
                {/* Transactions quick access for eligible roles (Admins/Managers/Accountant etc.) */}
                {currentUser && !['Transporter','Civil','Electricals','Electrical + Civil','Supervisor'].includes(currentUser.role) && (
                  <button onClick={() => setIsTransactionReportOpen(true)} className="px-4 py-2 bg-primary text-white rounded-lg font-semibold shadow-md hover:bg-primary-dark transition-all">Transactions</button>
                )}
                {/* Inventory Report for Admin/Manager/Accountant/Supervisor */}
                {currentUser && !['Transporter','Civil','Electricals','Electrical + Civil'].includes(currentUser.role) && (
                  <button onClick={() => setIsInventoryDetailReportOpen(true)} className="px-4 py-2 bg-primary text-white rounded-lg font-semibold shadow-md hover:bg-primary-dark transition-all">Inventory Report</button>
                )}
                {/* Document Library for Admin/Manager/Backoffice/Accountant */}
                {currentUser && ['Admin', 'Manager', 'Backoffice', 'Accountant'].includes(currentUser.role) && (
                  <NavButton view="documentLibrary" label="Documents" />
                )}
            </nav>
        )}
        
        {error && <div className="p-4 bg-red-500/10 text-red-600 border border-red-500/20 rounded-xl text-sm mb-6 animate-fade-in">{error}</div>}
        
        <main className="animate-slide-up" style={{ animationDelay: '100ms' }}>
            {MainViews[currentView]}
        </main>
      </div>
      
       {isChangePasswordModalOpen && !isForcedPasswordChange && (
            <ChangePasswordModal
                isForced={false}
                onSubmit={handleChangePassword}
                onClose={() => setIsChangePasswordModalOpen(false)}
            />
        )}

       {isBulkUploadModalOpen && (
          <BulkUploadModal
            onClose={() => setIsBulkUploadModalOpen(false)}
            onUpload={handleBulkUpload}
          />
       )}
       {isNewJobCardModalOpen && (
          <NewJobCardModal
            transporters={transporters}
            ongoingSites={ongoingSiteNames}
            onClose={() => setIsNewJobCardModalOpen(false)}
            onSubmit={handleAddJobCard}
          />
       )}
       {isEditTeamMemberModalOpen && editingTeamMember && (
          <EditTeamMemberModal
            member={editingTeamMember}
            onClose={() => setIsEditTeamMemberModalOpen(false)}
            onUpdate={handleUpdateTeamMember}
          />
        )}
        {isEditJobCardModalOpen && editingJobCard && (
           <EditJobCardModal
             jobCard={editingJobCard}
             transporters={transporters}
             ongoingSites={ongoingSiteNames} 
             onClose={() => setIsEditJobCardModalOpen(false)}
             onUpdate={handleUpdateJobCard}
           />
        )}
        {isEditTransporterModalOpen && editingTransporter && (
           <EditTransporterModal
             transporter={editingTransporter}
             onClose={() => setIsEditTransporterModalOpen(false)}
             onUpdate={handleUpdateTransporter}
           />
        )}
         {isMaterialUsageModalOpen && (
           <MaterialUsageModal
             isOpen={isMaterialUsageModalOpen}
             sites={sites}
             currentUser={currentUser}
             onClose={() => setIsMaterialUsageModalOpen(false)}
             onSubmit={handleLogMaterialUsage}
             isLoading={isLoading}
           />
         )}
         {isOpeningBalanceModalOpen && (
           <OpeningBalanceModal
             isOpen={isOpeningBalanceModalOpen}
              teamMembers={teamMembers}
             onClose={() => setIsOpeningBalanceModalOpen(false)}
             onSubmit={handleSaveOpeningBalance}
             isLoading={isLoading}
           />
         )}
          {isTransactionReportOpen && (
            <TransactionReport
              isOpen={isTransactionReportOpen}
              onClose={() => setIsTransactionReportOpen(false)}
              paymentRequests={paymentRequests}
              materialUsageLogs={materialUsageLogs}
              sites={sites}
              teamMembers={teamMembers}
            />
          )}
          {isInventoryDetailReportOpen && (
            <InventoryDetailReport
              isOpen={isInventoryDetailReportOpen}
              onClose={() => setIsInventoryDetailReportOpen(false)}
              teamMembers={teamMembers}
              materialUsageLogs={materialUsageLogs}
              sites={sites}
            />
          )}
    </div>
  );
};

export default App;