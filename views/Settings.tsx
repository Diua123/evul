
import React, { useState, useEffect, useContext, useRef } from 'react';
import Layout from '../components/Layout';
import { storage } from '../services/storage';
import { updateUserFB } from '../services/firebaseService';
import { User, Theme, Language } from '../types';
import { useNavigate } from 'react-router-dom';
import { LanguageContext } from '../App';
import { t } from '../services/i18n';
import { compressImage } from '../services/imageCompression';

interface SettingsProps {
  onLogout: () => void;
  toggleTheme: () => void;
  isDark: boolean;
}

const Settings: React.FC<SettingsProps> = ({ onLogout, toggleTheme, isDark }) => {
  const [user, setUser] = useState<User | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', photo: '' });
  const [successMsg, setSuccessMsg] = useState('');
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { language, setLanguage } = useContext(LanguageContext);

  useEffect(() => {
    const currentUser = storage.getCurrentUser();
    if (currentUser) { setUser(currentUser); setFormData({ name: currentUser.name, photo: currentUser.photo }); }
  }, []);

  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      // Find the document ID. In our case, we stored the doc ID in storage.getCurrentUserId()
      const docId = storage.getCurrentUserId();
      if (!docId) return;

      await updateUserFB(docId, { name: formData.name, photo: formData.photo });
      
      const updatedUser = { ...user, name: formData.name, photo: formData.photo };
      storage.setCachedUser(updatedUser);
      setUser(updatedUser);
      
      setIsEditing(false); 
      setSuccessMsg(t('success_update', language));
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        let data = event.target?.result as string;
        try {
          data = await compressImage(data, 200, 200, 0.8); // Profile photos can be smaller
        } catch (err) {
          console.error('Compression failed', err);
        }
        setFormData({ ...formData, photo: data });
      };
      reader.readAsDataURL(file);
    }
  };

  if (!user) return null;

  return (
    <Layout title={t('settings', language)} backTo="/">
      {fullScreenImage && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 animate-fadeIn" onClick={() => setFullScreenImage(null)}>
          <button className="absolute top-6 right-6 text-white text-2xl"><i className="fas fa-times"></i></button>
          <img src={fullScreenImage} className="max-w-full max-h-full object-contain rounded-lg animate-zoomIn" alt="" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      <div className="space-y-6">
        {successMsg && <div className="bg-green-100 text-green-700 p-4 rounded-3xl font-bold text-center animate-bounce shadow-sm">{successMsg}</div>}

        <div className="bg-white dark:bg-gray-800 p-6 rounded-4xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4 animate-fadeIn">
          <div className="relative group">
            {(isEditing ? formData.photo : user.photo) && (
              <img 
                src={isEditing ? formData.photo : user.photo} 
                onClick={() => !isEditing && setFullScreenImage(user.photo)}
                className={`w-20 h-20 rounded-full object-cover border-4 border-ev-brown shadow-lg ${!isEditing ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`} 
                alt="" 
              />
            )}
            {isEditing && (
              <button onClick={() => fileInputRef.current?.click()} className="absolute inset-0 bg-black/50 rounded-full flex flex-col items-center justify-center text-white transition-opacity">
                <i className="fas fa-camera text-xl"></i><span className="text-[8px] font-bold uppercase mt-1">Trocar</span>
              </button>
            )}
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoChange} />
          </div>
          <div><h2 className="text-xl font-black text-gray-800 dark:text-white leading-tight">{isEditing ? formData.name || '...' : user.name}</h2><p className="text-sm text-gray-500 font-medium">#{user.Number} • {user.anoFrequencia}º Ano</p></div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { id: 'profile', title: t('profile', language), icon: 'fa-user' },
            { id: 'security', title: t('security', language), icon: 'fa-lock' },
            { id: 'notifications', title: t('notifications', language), icon: 'fa-bell' },
            { id: 'prefs', title: t('preferences', language), icon: 'fa-cog' },
          ].map(s => (
            <button key={s.id} onClick={() => { setActiveSection(s.id); setIsEditing(false); }} className={`flex flex-col items-center justify-center p-4 rounded-3xl transition-all shadow-sm ${activeSection === s.id ? 'bg-ev-blue text-white scale-95 shadow-lg' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>
              <i className={`fas ${s.icon} text-xl mb-1`}></i><span className="text-[10px] font-bold uppercase tracking-widest">{s.title}</span>
            </button>
          ))}
        </div>

        {activeSection === 'profile' && (
          <div className="bg-white dark:bg-gray-800 p-8 rounded-4xl shadow-md border border-gray-100 dark:border-gray-700 animate-fadeIn">
            <div className="flex items-center justify-between mb-8"><h3 className="font-black text-ev-blue dark:text-white uppercase tracking-tighter">{t('profile', language)}</h3>{!isEditing && <button onClick={() => setIsEditing(true)} className="bg-ev-blue/10 text-ev-blue px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-ev-blue hover:text-white transition-all">{t('edit_profile', language)}</button>}</div>
            {isEditing ? (
              <div className="space-y-6">
                <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{t('full_name', language)}</label><input type="text" className="w-full p-4 rounded-3xl border-none bg-gray-50 dark:bg-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-ev-blue shadow-inner" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
                <div className="flex gap-3 pt-4"><button onClick={handleSaveProfile} className="flex-1 bg-ev-blue text-white py-4 rounded-3xl font-black shadow-xl uppercase text-xs tracking-widest">{t('save', language)}</button><button onClick={() => setIsEditing(false)} className="px-6 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-3xl text-xs font-black uppercase">Voltar</button></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-5 bg-gray-50 dark:bg-gray-700/50 rounded-3xl border border-gray-100"><span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-1">{t('full_name', language)}</span><span className="text-base font-bold text-gray-800 dark:text-white">{user.name}</span></div>
                <div className="grid grid-cols-2 gap-3"><div className="p-5 bg-gray-50 dark:bg-gray-700/50 rounded-3xl border border-gray-100"><span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-1">{t('student_number', language)}</span><span className="text-base font-bold text-gray-800 dark:text-white">{user.Number}</span></div><div className="p-5 bg-gray-50 dark:bg-gray-700/50 rounded-3xl border border-gray-100"><span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-1">{t('year', language)}</span><span className="text-base font-bold text-gray-800 dark:text-white">{user.anoFrequencia}º Ano</span></div></div>
                <div className="pt-6"><button onClick={() => { storage.logout(); navigate('/login'); }} className="w-full text-left p-6 rounded-3xl hover:bg-red-50 text-red-500 border border-red-100 flex items-center justify-between transition-all group"><div className="flex items-center gap-3"><i className="fas fa-sign-out-alt"></i><span className="text-sm font-black uppercase tracking-widest">{t('logout', language)}</span></div><i className="fas fa-chevron-right text-[10px] opacity-30"></i></button></div>
              </div>
            )}
          </div>
        )}

        {activeSection === 'prefs' && (
          <div className="bg-white dark:bg-gray-800 p-8 rounded-4xl shadow-md border border-gray-100 dark:border-gray-700 animate-fadeIn">
            <h3 className="font-black text-ev-blue dark:text-white uppercase tracking-tighter mb-8">{t('preferences', language)}</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-5 bg-gray-50 dark:bg-gray-700 rounded-3xl border border-gray-100"><div className="flex flex-col"><span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t('theme', language)}</span><span className="text-sm font-bold dark:text-white">{isDark ? 'Modo Escuro' : 'Modo Claro'}</span></div><button onClick={toggleTheme} className={`w-14 h-8 flex items-center rounded-full p-1 shadow-inner transition-all ${isDark ? 'bg-ev-blue' : 'bg-gray-300'}`}><div className={`bg-white w-6 h-6 rounded-full transform transition-all ${isDark ? 'translate-x-6' : 'translate-x-0'}`}></div></button></div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Settings;
