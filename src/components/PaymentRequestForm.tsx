import React, { useState, useCallback, useEffect } from 'react';
import { PaymentRequestData as BasePaymentRequestData } from '../services/geminiService';
import { Spinner } from './Spinner';
import { FileInput } from './FileInput';
import { PaymentRequest, Site } from '../App';


interface PaymentRequestFormProps {
    onSubmit: (data: BasePaymentRequestData & {id?: string}, photos: File[], documents: File[]) => Promise<boolean>;
    onBack: () => void;
    isLoading: boolean;
    error: string | null;
    sites: Site[];
    initialData?: PaymentRequest | null;
    initialSiteId?: string | null;
}

const paymentForOptions = [
  "Advance", "Final Payment", "Transportation", "parcel Charges", "Diesel",
  "Audit Fees", "Material Purchase", "Owner settlement", "Equipmental Rent"
];

const initialFormData: BasePaymentRequestData & {id?: string} = {
    siteName: '',
    location: '',
    latitude: '',
    longitude: '',
    projectType: '',
    amount: '',
    paymentFor: paymentForOptions[0],
    reasons: '',
};

export const PaymentRequestForm: React.FC<PaymentRequestFormProps> = ({
    onSubmit,
    onBack,
    isLoading,
    error,
    sites = [],
    initialData = null,
    initialSiteId = null,
}) => {
    const isEditing = !!initialData;
    const [formData, setFormData] = useState<BasePaymentRequestData & {id?: string}>(initialFormData);
    const [photos, setPhotos] = useState<File[]>([]);
    const [documents, setDocuments] = useState<File[]>([]);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const clearForm = useCallback(() => {
        setFormData(initialFormData);
        setPhotos([]);
        setDocuments([]);
        setValidationErrors({});
    }, []);

    useEffect(() => {
        if (initialData) {
            setFormData({
                id: initialData.id,
                siteName: initialData.siteName,
                location: initialData.location,
                latitude: initialData.latitude || '',
                longitude: initialData.longitude || '',
                projectType: initialData.projectType,
                amount: initialData.amount || '',
                paymentFor: initialData.paymentFor || paymentForOptions[0],
                reasons: initialData.reasons || '',
            });
            setPhotos([]);
            setDocuments([]);
        } else if (initialSiteId) {
            const site = sites.find(s => s.id === initialSiteId);
            if (site) {
                setFormData({
                    ...initialFormData,
                    siteName: site.siteName,
                    location: site.location,
                    projectType: site.projectType,
                    latitude: site.latitude || '',
                    longitude: site.longitude || '',
                });
            }
        }
    }, [initialData, initialSiteId, sites]);

    const validateForm = useCallback(() => {
        const errors: Record<string, string> = {};
        if (!formData.siteName.trim()) errors.siteName = 'A site must be selected.';
        if (!formData.amount?.trim()) errors.amount = 'Amount is required.';
        if (isNaN(Number(formData.amount))) errors.amount = 'Amount must be a valid number.';
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    }, [formData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (sites.length === 0) {
            setValidationErrors({ siteName: 'No sites available. Please create a site first.' });
            return;
        }
        if (!validateForm()) return;

        const success = await onSubmit(formData, photos, documents);
        if (success && !isEditing) {
          clearForm();
        }
    };
    
    const handleBackClick = () => {
        clearForm();
        onBack();
    };

    // Updated light theme styles for better readability
    const inputStyles = "w-full bg-white border border-gray-300 rounded-lg py-2 px-3 text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition disabled:opacity-50";
    const labelStyles = "block text-sm font-semibold text-gray-700 mb-2";

    const submitButtonText = isEditing ? 'Update Submission' : 'Submit for Review';
    return (
        <div className="w-full animate-fade-in">
            <button onClick={handleBackClick} className="flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300 font-semibold mb-6">
                 &larr; Back
            </button>
          <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl shadow-xl p-8 space-y-8">
              <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-200 pb-4">
                   {isEditing ? `Editing Submission for: ${initialData?.siteName}` : `Submit Completion Docs for: ${formData.siteName}`}
                 </h2>

                 {sites.length === 0 && (
                     <div className="p-4 bg-yellow-900/30 text-yellow-300 border border-yellow-700 rounded-lg text-center">
                         No sites have been created yet. Please go to the 'Sites' page to create a site before making a submission.
                     </div>
                 )}

                <div>
                    <label htmlFor="siteName" className={labelStyles}>Site Name</label>
                    <input id="siteName" name="siteName" type="text" value={formData.siteName} readOnly className={`${inputStyles} bg-gray-100`} />
                    {validationErrors.siteName && <p className="text-red-400 text-xs mt-1">{validationErrors.siteName}</p>}
                </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="location" className={labelStyles}>Location</label>
                        <input id="location" name="location" type="text" value={formData.location} readOnly className={`${inputStyles} bg-gray-100`} />
                    </div>
                    <div>
                        <label htmlFor="projectType" className={labelStyles}>Project Type</label>
                        <input id="projectType" name="projectType" type="text" value={formData.projectType} readOnly className={`${inputStyles} bg-gray-100`} />
                    </div>
                 </div>

                <div className="pt-6 border-t border-gray-200 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="paymentFor" className={labelStyles}>Payment For</label>
                            <select id="paymentFor" name="paymentFor" value={formData.paymentFor} onChange={handleChange} className={inputStyles}>
                                {paymentForOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="amount" className={labelStyles}>Amount</label>
                            <input id="amount" name="amount" type="text" value={formData.amount} onChange={handleChange} placeholder="e.g., 5000" className={inputStyles} />
                            {validationErrors.amount && <p className="text-red-400 text-xs mt-1">{validationErrors.amount}</p>}
                        </div>
                    </div>
                    <div>
                        <label htmlFor="reasons" className={labelStyles}>Reasons / Notes (Optional)</label>
                        <textarea id="reasons" name="reasons" rows={3} value={formData.reasons} onChange={handleChange} className={inputStyles} placeholder="Add any final notes or reasons for this payment..."></textarea>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
                    <FileInput
                        id="activity-photos"
                        label="Add Photos"
                        files={photos}
                        onFilesChange={setPhotos}
                        acceptedFileTypes="image/*"
                        iconColorClass="text-blue-400"
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" /></svg>}
                        showCameraButton={true}
                    />
                    <FileInput
                        id="activity-documents"
                        label="Add Documents"
                        files={documents}
                        onFilesChange={setDocuments}
                        acceptedFileTypes=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                        iconColorClass="text-purple-400"
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h2a2 2 0 002-2V4a2 2 0 00-2-2H9z" /><path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm10.293-9.293a1 1 0 00-1.414 1.414L13 7.414V13a1 1 0 102 0V7.414l-.293.293a1 1 0 00-1.414-1.414z" clipRule="evenodd" /></svg>}
                    />
                </div>

                 {error && <div className="p-3 bg-red-900/30 text-red-300 border border-red-700 rounded-md text-sm">{error}</div>}

                <div className="flex justify-end items-center gap-4 pt-6 border-t border-gray-200">
                    <button type="button" onClick={handleBackClick} className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700">Cancel</button>
                    <button type="submit" disabled={isLoading || sites.length === 0} className="w-48 flex justify-center items-center px-6 py-2 bg-orange-600 text-white font-semibold rounded-lg shadow-lg hover:bg-orange-700 disabled:bg-orange-800/50 disabled:cursor-not-allowed">
                        {isLoading ? <Spinner /> : submitButtonText}
                    </button>
                </div>
            </form>
        </div>
    );
};