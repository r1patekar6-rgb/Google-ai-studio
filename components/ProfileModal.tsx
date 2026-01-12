
import React, { useState, useRef } from 'react';
import { useTranslation } from './TranslationContext';
import { User } from '../types';

interface ProfileModalProps {
  user: User;
  onClose: () => void;
  onUpdate: (updatedUser: User) => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, onUpdate }) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(user.profileImage || null);
  const [error, setError] = useState('');

  const hasTwoAlphabets = (s: string) => (s.match(/[a-zA-Z]/g) || []).length >= 2;
  const hasOneSymbol = (s: string) => /[!@#$%^&*(),.?":{}|<>]/.test(s);
  const hasThreeDigits = (s: string) => (s.match(/[0-9]/g) || []).length >= 3;

  const isPasswordSecure = formData.password === '' || (
    hasTwoAlphabets(formData.password) && 
    hasOneSymbol(formData.password) && 
    hasThreeDigits(formData.password)
  );

  const passwordsMatch = formData.password === formData.confirmPassword;
  const canSave = isPasswordSecure && passwordsMatch;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Image too large. Please select a file under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setProfileImage(reader.result as string);
        setError('');
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setProfileImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = () => {
    if (!canSave) {
      setError('Passwords do not match or requirements not met.');
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      const updatedUser: User = {
        ...user,
        profileImage: profileImage,
        password: formData.password || user.password
      };
      
      // Update global ledger for reporting
      const userLedger = JSON.parse(localStorage.getItem('bp_user_ledger') || '[]');
      const updatedLedger = userLedger.map((u: User) => u.email === user.email ? updatedUser : u);
      localStorage.setItem('bp_user_ledger', JSON.stringify(updatedLedger));
      
      onUpdate(updatedUser);
      setIsSaving(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-[#020617]/95 backdrop-blur-2xl animate-in fade-in duration-300">
      <div className="w-full max-w-2xl glass-card rounded-[3rem] border border-blue-500/30 shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden relative">
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-blue-400 hover:bg-white/10 transition-colors z-20"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        <div className="p-12 space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black text-white tracking-tight">Studio Profile</h2>
            <p className="text-blue-300/50 text-[10px] font-black uppercase tracking-[0.3em]">Account Management</p>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex flex-col items-center gap-6">
              <div className="relative group">
                {/* Avatar Container */}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-40 h-40 rounded-full overflow-hidden border-4 border-blue-600/30 shadow-3xl bg-blue-900/20 flex items-center justify-center relative cursor-pointer group/avatar transition-all hover:border-blue-500"
                >
                  {profileImage ? (
                    <img src={profileImage} className="w-full h-full object-cover transition-transform group-hover/avatar:scale-110" alt="Profile" />
                  ) : (
                    <span className="text-6xl font-black text-blue-500">{user.name.charAt(0).toUpperCase()}</span>
                  )}
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-blue-600/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-[2px]">
                    <i className="fa-solid fa-camera text-white text-2xl"></i>
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Update Photo</span>
                  </div>
                </div>

                {/* Remove Photo Button */}
                {profileImage && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); removePhoto(); }}
                    className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg border-2 border-[#020617] hover:bg-rose-400 transition-colors"
                    title="Remove Photo"
                  >
                    <i className="fa-solid fa-trash-can text-xs"></i>
                  </button>
                )}

                {/* Floating Camera Icon */}
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center border-4 border-[#020617] hover:bg-blue-500 transition-all hover:scale-110 shadow-lg"
                >
                  <i className="fa-solid fa-pen-to-square text-xs"></i>
                </button>
                <input ref={fileInputRef} type="file" hidden accept="image/*" onChange={handleImageChange} />
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-xl font-black text-white">{user.name}</h3>
                <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20 inline-block">
                  Studio Member
                </p>
              </div>
            </div>

            <div className="flex-grow space-y-6 w-full">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-2">New Password</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Leave blank to keep current"
                      className="w-full bg-blue-900/10 border border-blue-500/20 rounded-2xl py-4 px-6 text-white placeholder:text-blue-900/40 focus:outline-none focus:border-blue-500 transition-all font-bold"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500/50 hover:text-blue-400"
                    >
                      <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-2">Confirm New Password</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="Enter same password again"
                      className={`w-full bg-blue-900/10 border rounded-2xl py-4 px-6 text-white placeholder:text-blue-900/40 focus:outline-none transition-all font-bold ${
                        formData.confirmPassword === '' ? 'border-blue-500/20' : 
                        passwordsMatch ? 'border-emerald-500/40' : 'border-rose-500/40'
                      }`}
                    />
                    {formData.confirmPassword !== '' && (
                       <div className={`absolute right-4 top-1/2 -translate-y-1/2 ${passwordsMatch ? 'text-emerald-500' : 'text-rose-500'}`}>
                        <i className={`fa-solid ${passwordsMatch ? 'fa-circle-check' : 'fa-circle-xmark'}`}></i>
                      </div>
                    )}
                  </div>
                  {formData.confirmPassword !== '' && !passwordsMatch && (
                    <p className="text-[9px] font-black uppercase text-rose-500 tracking-tighter ml-2 mt-1">
                      Mismatch detected. Enter same password again.
                    </p>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 space-y-2">
                <div className={`flex items-center gap-3 text-[9px] font-black uppercase tracking-tighter transition-colors ${isPasswordSecure ? 'text-emerald-500' : 'text-blue-500/40'}`}>
                  <i className="fa-solid fa-lock text-[8px]"></i>
                  {t('password_req')}
                </div>
                {formData.password !== '' && (
                   <div className={`flex items-center gap-3 text-[9px] font-black uppercase tracking-tighter transition-colors ${passwordsMatch ? 'text-emerald-500' : 'text-rose-500'}`}>
                    <i className="fa-solid fa-code-compare text-[8px]"></i>
                    {passwordsMatch ? 'Perfectly Matched' : 'Passwords Mismatch'}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/5">
            {error && (
              <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest text-center bg-rose-500/5 py-3 rounded-xl border border-rose-500/10">
                <i className="fa-solid fa-triangle-exclamation mr-2"></i>
                {error}
              </p>
            )}

            <button 
              onClick={handleSave}
              disabled={isSaving || !canSave}
              className={`w-full py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 ${
                isSaving || !canSave
                ? 'bg-blue-900/40 text-blue-800 cursor-not-allowed border border-blue-500/10' 
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-3xl shadow-emerald-600/30 active:scale-[0.98]'
              }`}
            >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <i className="fa-solid fa-floppy-disk"></i>
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
