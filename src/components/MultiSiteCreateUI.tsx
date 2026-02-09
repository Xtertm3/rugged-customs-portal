import React, { useState } from 'react';
import { SiteForm } from './SiteForm';
import { TeamMember, Vendor, Site } from '../App';

interface MultiSiteCreateUIProps {
  onClose: () => void;
  teamMembers: TeamMember[];
  vendors: Vendor[];
  currentUser: any;
  onAddVendor: (vendor: Omit<Vendor, 'id'>) => Promise<void>;
  onSubmitAll: (sites: Omit<Site, 'id'>[]) => Promise<void>;
}

export const MultiSiteCreateUI: React.FC<MultiSiteCreateUIProps> = ({ onClose, teamMembers, vendors, currentUser, onAddVendor, onSubmitAll }) => {
  const [siteForms, setSiteForms] = useState<Array<{ key: number; data: Omit<Site, 'id'> }>>([
    { key: Date.now(), data: {
      siteName: '',
      siteId: '',
      rlId: '',
      location: '',
      latitude: '',
      longitude: '',
      projectType: 'Solar',
      workType: undefined,
      initialMaterials: [],
      siteManagerId: '',
      vendorId: '',
      vendorName: '',
      technicianName: '',
      technicianPhone: '',
      fscName: '',
      fscPhone: '',
      photos: [],
      documents: [],
      currentStage: 'c1',
      stages: {
        c1: { status: 'not-started', assignedTeamIds: [], startDate: undefined, completionDate: undefined },
        c2: { status: 'not-started', assignedTeamIds: [], startDate: undefined, completionDate: undefined },
        c1_c2_combined: { status: 'not-started', assignedTeamIds: [], startDate: undefined, completionDate: undefined },
        electrical: { status: 'not-started', assignedTeamIds: [], startDate: undefined, completionDate: undefined }
      },
      allocationDate: '',
      planningRecommendation: ''
    } }
  ]);
  const [errors, setErrors] = useState<string[]>([]);

  const handleAddSite = () => {
    setSiteForms(forms => [...forms, { key: Date.now() + Math.random(), data: {
      siteName: '',
      siteId: '',
      rlId: '',
      location: '',
      latitude: '',
      longitude: '',
      projectType: 'Solar',
      workType: undefined,
      initialMaterials: [],
      siteManagerId: '',
      vendorId: '',
      vendorName: '',
      technicianName: '',
      technicianPhone: '',
      fscName: '',
      fscPhone: '',
      photos: [],
      documents: [],
      currentStage: 'c1',
      stages: {
        c1: { status: 'not-started', assignedTeamIds: [], startDate: undefined, completionDate: undefined },
        c2: { status: 'not-started', assignedTeamIds: [], startDate: undefined, completionDate: undefined },
        c1_c2_combined: { status: 'not-started', assignedTeamIds: [], startDate: undefined, completionDate: undefined },
        electrical: { status: 'not-started', assignedTeamIds: [], startDate: undefined, completionDate: undefined }
      },
      allocationDate: '',
      planningRecommendation: ''
    } }]);
  };

  const handleRemoveSite = (key: number) => {
    setSiteForms(forms => forms.length > 1 ? forms.filter(f => f.key !== key) : forms);
  };

  const handleFormChange = (key: number, newData: Omit<Site, 'id'>) => {
    setSiteForms(forms => forms.map(f => f.key === key ? { ...f, data: newData } : f));
  };

  const handleSubmitAll = async () => {
    setErrors([]);
    // Validate all forms (simple required check)
    const invalid = siteForms.some(f => !f.data.siteName || !f.data.location);
    if (invalid) {
      setErrors(['Please fill all required fields for each site.']);
      return;
    }
    await onSubmitAll(siteForms.map(f => f.data));
    onClose();
  };

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-bold text-zinc-100">Add Multiple Sites</h3>
        <button onClick={handleAddSite} className="px-4 py-2 bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-800">+ Add Another Site</button>
      </div>
      {errors.length > 0 && <div className="text-red-400 mb-2">{errors.join(', ')}</div>}
      <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-2">
        {siteForms.map((form) => (
          <div key={form.key} className="relative border border-zinc-600 rounded-xl bg-zinc-900/40 p-4">
            <SiteForm
              onBack={() => handleRemoveSite(form.key)}
              onSubmit={data => handleFormChange(form.key, data as Omit<Site, 'id'>)}
              teamMembers={teamMembers}
              vendors={vendors}
              onAddVendor={onAddVendor}
              canAddAttachments={false}
              currentUser={currentUser}
              initialData={form.data as Site}
            />
            {siteForms.length > 1 && (
              <button onClick={() => handleRemoveSite(form.key)} className="absolute top-2 right-2 text-red-400 hover:text-red-600 text-xl font-bold">&times;</button>
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-end mt-6 gap-4">
        <button onClick={onClose} className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700">Cancel</button>
        <button onClick={handleSubmitAll} className="px-6 py-2 bg-blue-700 text-white font-semibold rounded-lg hover:bg-blue-800">Create All Sites</button>
      </div>
    </div>
  );
};
