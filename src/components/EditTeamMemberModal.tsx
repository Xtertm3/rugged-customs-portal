import React, { useState, useRef, useEffect } from 'react';
import { TeamMember } from '../App';

interface EditTeamMemberModalProps {
    member: TeamMember;
    onClose: () => void;
    onUpdate: (updatedMember: TeamMember) => void;
}

const predefinedRoles = ['Civil', 'Electricals', 'Electrical + Civil', 'Manager', 'Supervisor', 'Accountant', 'Transporter'];

export const EditTeamMemberModal: React.FC<EditTeamMemberModalProps> = ({ member, onClose, onUpdate }) => {
    const [name, setName] = useState(member.name);
    const [role, setRole] = useState(member.role);
    const [mobile, setMobile] = useState(member.mobile);
    const [password, setPassword] = useState('');
    const [photo, setPhoto] = useState<string | null>(member.photo);
    const [error, setError] = useState('');
    const photoInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setName(member.name);
        setRole(member.role);
        setMobile(member.mobile);
        setPhoto(member.photo);
        setPassword(''); // Don't pre-fill password for security
    }, [member]);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhoto(reader.result as string);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };
    
    const handleUpdateClick = () => {
        if (!name.trim() || !mobile.trim()) {
            setError('Name and mobile number cannot be empty.');
            return;
        }
        setError('');
        onUpdate({ ...member, name, role, mobile, photo, password: password || undefined });
    };

    const inputStyles = "w-full bg-zinc-700/50 border border-zinc-600 rounded-md py-2 px-3 text-zinc-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition";
    const labelStyles = "block text-sm font-medium text-zinc-300 mb-1";

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-zinc-800 border border-zinc-700 w-full max-w-lg rounded-2xl shadow-2xl p-8" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-zinc-100 mb-6">Edit Team Member</h2>
                <div className="space-y-4">
                     <div>
                        <label htmlFor="edit-member-name" className={labelStyles}>Name</label>
                        <input id="edit-member-name" type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputStyles} />
                    </div>
                    <div>
                        <label htmlFor="edit-member-role" className={labelStyles}>Role</label>
                        <select id="edit-member-role" value={role} onChange={(e) => setRole(e.target.value)} className={inputStyles}>
                            {predefinedRoles.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="edit-member-mobile" className={labelStyles}>Mobile Number</label>
                        <input id="edit-member-mobile" type="text" value={mobile} onChange={(e) => setMobile(e.target.value)} className={inputStyles} />
                    </div>
                     <div>
                        <label htmlFor="edit-member-password" className={labelStyles}>New Password</label>
                        <input
                            id="edit-member-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Leave blank to keep unchanged"
                            className={inputStyles}
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        <button type="button" onClick={() => photoInputRef.current?.click()} className="text-sm px-4 py-2 bg-zinc-700 rounded-lg hover:bg-zinc-600">Change Photo</button>
                        <input type="file" ref={photoInputRef} onChange={handlePhotoChange} accept="image/*" className="hidden" />
                        {photo && <img src={photo} alt="Preview" className="w-12 h-12 rounded-full object-cover" />}
                    </div>
                    {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
                    <div className="flex justify-end pt-4 gap-4">
                         <button onClick={onClose} className="px-6 py-2 bg-zinc-600 text-white font-semibold rounded-lg">Cancel</button>
                         <button onClick={handleUpdateClick} className="px-8 py-2 bg-blue-700 text-white font-semibold rounded-lg">Update Member</button>
                    </div>
                </div>
            </div>
        </div>
    );
};
