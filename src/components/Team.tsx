import React, { useState, useRef } from 'react';
import { TeamMember, Site } from '../App';

interface SubVendorFormProps {
    onAddSubVendor: (name: string, role: string, mobile: string, photo: string | null, password?: string, email?: string, companyName?: string, gstNumber?: string, address?: string) => void;
    inputStyles: string;
    labelStyles: string;
}

const SubVendorForm: React.FC<SubVendorFormProps> = ({ onAddSubVendor, inputStyles, labelStyles }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [gstNumber, setGstNumber] = useState('');
    const [address, setAddress] = useState('');
    const [error, setError] = useState('');
    const photoInputRef = useRef<HTMLInputElement>(null);
    const [photo, setPhoto] = useState<string | null>(null);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhoto(reader.result as string);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleSubmit = () => {
        if (!name.trim() || !mobile.trim() || !email.trim()) {
            setError('Please fill in Name, Mobile, and Email.');
            return;
        }
        setError('');
        // Call onAddMember with sub-vendor flag embedded in role
        onAddSubVendor(name, 'Sub-Vendor', mobile, photo, password, email, companyName, gstNumber, address);
        // Reset form
        setName('');
        setMobile('');
        setEmail('');
        setPassword('');
        setCompanyName('');
        setGstNumber('');
        setAddress('');
        setPhoto(null);
        if (photoInputRef.current) photoInputRef.current.value = "";
        setIsOpen(false);
    };

    return (
        <>
            <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-blue-900">Sub-Vendor Registration</h3>
                        <p className="text-sm text-blue-700 mt-1">Add sub-vendor details with company information</p>
                    </div>
                    <button 
                        onClick={() => setIsOpen(true)}
                        className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        + Add Sub-Vendor
                    </button>
                </div>
            </div>

            {isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-900">Add Sub-Vendor</h2>
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="sv-name" className={labelStyles}>Name *</label>
                                    <input id="sv-name" type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputStyles} />
                                </div>
                                <div>
                                    <label htmlFor="sv-mobile" className={labelStyles}>Mobile Number *</label>
                                    <input id="sv-mobile" type="text" value={mobile} onChange={(e) => setMobile(e.target.value)} className={inputStyles} />
                                </div>
                                <div>
                                    <label htmlFor="sv-email" className={labelStyles}>Email *</label>
                                    <input id="sv-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputStyles} />
                                </div>
                                <div>
                                    <label htmlFor="sv-password" className={labelStyles}>Password</label>
                                    <input id="sv-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputStyles} placeholder="Defaults to mobile number" />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-200">
                                <h3 className="text-md font-semibold text-gray-800 mb-3">Company Details</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="sv-company" className={labelStyles}>Company Name</label>
                                        <input id="sv-company" type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={inputStyles} />
                                    </div>
                                    <div>
                                        <label htmlFor="sv-gst" className={labelStyles}>GST Number</label>
                                        <input id="sv-gst" type="text" value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} className={inputStyles} />
                                    </div>
                                    <div>
                                        <label htmlFor="sv-address" className={labelStyles}>Address</label>
                                        <textarea id="sv-address" value={address} onChange={(e) => setAddress(e.target.value)} className={inputStyles} rows={2} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 pt-4">
                                <button type="button" onClick={() => photoInputRef.current?.click()} className="text-sm px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">Upload Photo</button>
                                <input type="file" ref={photoInputRef} onChange={handlePhotoChange} accept="image/*" className="hidden" />
                                {photo && <img src={photo} alt="Preview" className="w-12 h-12 rounded-full object-cover" />}
                            </div>

                            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                        </div>

                        <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="px-6 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSubmit}
                                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Add Sub-Vendor
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

interface TeamProps {
    sites: Site[];
    teamMembers: TeamMember[];
    onAddMember: (name: string, role: string, mobile: string, photo: string | null, password?: string) => void;
    onDeleteMember: (id: string) => void;
    onViewDetails: (id: string) => void;
    onViewSiteDetails: (siteName: string) => void;
    onEditMember: (member: TeamMember) => void;
    canManageTeam: boolean;
    onDownloadInventoryReport: () => void;
    canDownloadInventoryReport: boolean;
}

const predefinedRoles = ['Civil', 'Electricals', 'Electrical + Civil', 'Manager', 'Supervisor', 'Accountant', 'Transporter'];

const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
};

export const Team: React.FC<TeamProps> = ({ sites, teamMembers, onAddMember, onDeleteMember, onViewDetails, onEditMember, canManageTeam, onDownloadInventoryReport, onViewSiteDetails, canDownloadInventoryReport }) => {
    const [newName, setNewName] = useState('');
    const [newRole, setNewRole] = useState(predefinedRoles[0]);
    const [newMobile, setNewMobile] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newPhoto, setNewPhoto] = useState<string | null>(null);
    const [error, setError] = useState('');
    const photoInputRef = useRef<HTMLInputElement>(null);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewPhoto(reader.result as string);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleAddClick = () => {
        if (!newName.trim() || !newMobile.trim()) {
            setError('Please enter a name and mobile number.');
            return;
        }
        try {
            setError('');
            console.log('Adding team member:', { newName, newRole, newMobile });
            onAddMember(newName, newRole, newMobile, newPhoto, newPassword);
            setNewName('');
            setNewRole(predefinedRoles[0]);
            setNewMobile('');
            setNewPassword('');
            setNewPhoto(null);
            if (photoInputRef.current) photoInputRef.current.value = "";
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error';
            setError(`Failed to add team member: ${errorMsg}`);
            console.error('Error adding team member:', err);
        }
    };
    
    const inputStyles = "w-full bg-white border border-gray-300 rounded-md py-2 px-3 text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition";
    const labelStyles = "block text-sm font-medium text-gray-700 mb-1";

    return (
        <div className="w-full animate-fade-in">
            <div className="bg-white backdrop-blur-sm border border-gray-200 rounded-2xl shadow-2xl p-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-gray-300 pb-3 mb-6">
                    <h2 className="text-2xl font-semibold text-gray-900">Manage Team</h2>
                    {canDownloadInventoryReport && (
                        <button 
                            onClick={onDownloadInventoryReport} 
                            className="text-sm px-4 py-2 bg-orange-500 text-gray-700 font-semibold rounded-lg hover:bg-orange-600 flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            Download Inventory Report
                        </button>
                    )}
                </div>
                
                {canManageTeam && (
                    <>
                        <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-4">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3">Add Regular Team Member</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="new-member-name" className={labelStyles}>Name</label>
                                    <input id="new-member-name" type="text" value={newName} onChange={(e) => setNewName(e.target.value)} className={inputStyles} />
                                </div>
                                <div>
                                    <label htmlFor="new-member-role" className={labelStyles}>Role</label>
                                    <select id="new-member-role" value={newRole} onChange={(e) => setNewRole(e.target.value)} className={inputStyles}>
                                        {predefinedRoles.map(role => <option key={role} value={role}>{role}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="new-member-mobile" className={labelStyles}>Mobile Number</label>
                                    <input id="new-member-mobile" type="text" value={newMobile} onChange={(e) => setNewMobile(e.target.value)} className={inputStyles} />
                                </div>
                                <div>
                                    <label htmlFor="new-member-password" className={labelStyles}>Password</label>
                                    <input id="new-member-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputStyles} placeholder="Defaults to mobile number" />
                                </div>
                            </div>
                            <div className="flex items-center gap-4 mt-4">
                                <button type="button" onClick={() => photoInputRef.current?.click()} className="text-sm px-4 py-2 bg-orange-500 rounded-lg hover:bg-orange-600">Upload Photo</button>
                                <input type="file" ref={photoInputRef} onChange={handlePhotoChange} accept="image/*" className="hidden" />
                                {newPhoto && <img src={newPhoto} alt="Preview" className="w-12 h-12 rounded-full object-cover" />}
                            </div>
                            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
                            <div className="flex justify-end pt-2">
                                <button onClick={handleAddClick} className="px-8 py-2 bg-orange-600 text-white font-semibold rounded-lg">Add Member</button>
                            </div>
                        </div>
                        
                        <SubVendorForm onAddSubVendor={onAddMember} inputStyles={inputStyles} labelStyles={labelStyles} />
                    </>
                )}

                <div className="space-y-3">
                    {teamMembers.map(member => {
                        const assignedSites = sites.filter(site => site.siteManagerId === member.id);
                        return (
                            <div key={member.id} className="flex items-start justify-between gap-4 bg-white p-3 rounded-lg border border-gray-200">
                                <div onClick={() => onViewDetails(member.id)} className="flex-grow flex items-start gap-4 cursor-pointer">
                                    {member.photo ? (
                                        <img src={member.photo} alt={member.name} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center font-bold text-white flex-shrink-0">
                                            {getInitials(member.name)}
                                        </div>
                                    )}
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold text-gray-900">{member.name}</p>
                                            {member.isSubVendor && (
                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full border border-blue-300">
                                                    SUB-VENDOR
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500">{member.role} &bull; {member.mobile}</p>
                                        {member.email && (
                                            <p className="text-sm text-gray-500">📧 {member.email}</p>
                                        )}
                                        {member.isSubVendor && member.subVendorDetails?.companyName && (
                                            <p className="text-xs text-blue-600 mt-1">🏢 {member.subVendorDetails.companyName}</p>
                                        )}
                                        {assignedSites.length > 0 && (
                                            <div className="mt-2">
                                                <p className="text-xs text-gray-600 mb-1">Assigned Sites:</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {assignedSites.map(site => (
                                                        <button 
                                                            key={site.id} 
                                                            onClick={(e) => { e.stopPropagation(); onViewSiteDetails(site.siteName); }}
                                                            className="text-xs px-2 py-1 bg-orange-500 text-gray-700 rounded-md hover:bg-orange-600 transition-colors"
                                                        >
                                                            {site.siteName}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {canManageTeam && (
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <button onClick={() => onEditMember(member)} className="text-gray-500 hover:text-white"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg></button>
                                        <button onClick={() => onDeleteMember(member.id)} className="text-red-500 hover:text-red-400"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
};
