
import React, { useState, useEffect, useContext } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import { storage } from '../services/storage';
import { subscribeToPublications, addPublicationFB, deletePublicationFB } from '../services/firebaseService';
import { Publication, Language } from '../types';
import { LanguageContext } from '../App';
import { t } from '../services/i18n';

const Communities: React.FC = () => {
  const { tab } = useParams<{ tab: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>(tab || 'geral');
  const [publications, setPublications] = useState<Publication[]>([]);
  const [form, setForm] = useState({ title: '', category: 'geral', content: '' });
  const [successMsg, setSuccessMsg] = useState('');
  const { language } = useContext(LanguageContext);
  
  const currentUser = storage.getCurrentUser();
  const canPublish = currentUser?.role === 'chefe' || currentUser?.role === 'docente';

  useEffect(() => {
    const unsubscribe = subscribeToPublications((firebasePubs) => {
      setPublications(firebasePubs);
    });
    storage.setLastViewedPubs(); // Marcar comunicados como vistos
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (tab && tab !== activeTab) {
      if (tab === 'publicar' && !canPublish) {
        navigate('/communities/geral');
        return;
      }
      setActiveTab(tab);
      storage.setLastViewedPubs(); // Atualizar visto ao navegar entre abas
    }
  }, [tab, activeTab, canPublish, navigate]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    navigate(`/communities/${tabId}`, { replace: true });
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      await addPublicationFB({
        title: form.title,
        category: form.category,
        content: form.content,
        date: new Date().toISOString(),
        authorName: currentUser.name,
        authorRole: currentUser.role
      });

      storage.setLastViewedPubs(); 
      setForm({ title: '', category: 'geral', content: '' });
      setSuccessMsg(language === Language.PT ? 'Informação publicada com sucesso!' : 'Information published successfully!');
      setTimeout(() => {
        setSuccessMsg('');
        handleTabChange(form.category);
      }, 1500);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (pubId: string) => {
    try {
      await deletePublicationFB(pubId);
    } catch (err) {
      console.error(err);
    }
  };

  const tabs = [
    { id: 'geral', label: 'Geral', icon: 'fa-info-circle' },
    { id: 'ano1', label: '1º Ano', icon: 'fa-user-graduate' },
    { id: 'ano2', label: '2º Ano', icon: 'fa-user-graduate' },
    { id: 'ano3', label: '3º Ano', icon: 'fa-user-graduate' },
    { id: 'ano4', label: '4º Ano', icon: 'fa-user-graduate' },
  ];

  if (canPublish) {
    tabs.push({ id: 'publicar', label: t('publish', language), icon: 'fa-plus-circle' });
  }

  const filtered = publications.filter(pub => {
    if (activeTab === 'geral') return pub.category === 'geral';
    if (activeTab === 'publicar') return false;
    return pub.category === activeTab || pub.category === 'geral';
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-ev-dark">
      <header className="bg-ev-blue text-white px-4 py-3 flex items-center justify-between shadow-md z-50">
        <div className="flex items-center gap-4">
          <Link to="/" className="hover:scale-110 transition-transform">
            <i className="fas fa-arrow-left text-xl"></i>
          </Link>
          <h1 className="text-xl font-bold tracking-tight uppercase tracking-tighter">{t('communities', language)}</h1>
        </div>
      </header>

      <div className="bg-ev-blue shadow-lg border-t border-white/10 z-40 sticky top-[52px]">
        <div className="w-full flex overflow-x-auto no-scrollbar">
          {tabs.map(tabItem => (
            <button
              key={tabItem.id}
              onClick={() => handleTabChange(tabItem.id)}
              className={`flex-shrink-0 flex flex-col items-center justify-center py-4 px-8 transition-all min-w-[100px] border-b-4 ${
                activeTab === tabItem.id ? 'bg-ev-brown border-white text-white' : 'text-white/60 border-transparent hover:bg-white/10'
              }`}
            >
              <i className={`fas ${tabItem.icon} mb-1 text-sm`}></i>
              <span className="text-[10px] font-black uppercase tracking-widest">{tabItem.label}</span>
            </button>
          ))}
        </div>
      </div>

      <main className="w-full p-6 flex-1 py-10">
        {activeTab === 'publicar' && canPublish ? (
          <div className="bg-white dark:bg-gray-800 p-8 md:p-12 rounded-4xl shadow-xl border border-gray-100 dark:border-gray-700 animate-fadeIn">
            <h2 className="text-3xl font-black text-ev-blue dark:text-white uppercase tracking-tighter mb-8 text-center">{t('publish', language)}</h2>
            
            <form onSubmit={handlePublish} className="space-y-6">
              {successMsg && <div className="bg-green-100 text-green-700 p-4 rounded-3xl font-black text-center animate-bounce uppercase text-xs tracking-widest shadow-sm">{successMsg}</div>}
              
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-3xl flex items-center gap-3 mb-6">
                 <div className="w-10 h-10 bg-ev-blue text-white rounded-full flex items-center justify-center flex-shrink-0"><i className={`fas ${currentUser?.role === 'docente' ? 'fa-chalkboard-teacher' : 'fa-user-tie'}`}></i></div>
                 <div>
                    <p className="text-[10px] font-black text-ev-blue uppercase tracking-widest">Publicando como</p>
                    <p className="font-bold text-sm dark:text-white">{currentUser?.name} ({currentUser?.role === 'docente' ? 'Docente' : 'Chefe'})</p>
                 </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Título do Comunicado</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Entrega de Notas"
                    className="w-full p-4 rounded-3xl border-none bg-gray-50 dark:bg-gray-700 dark:text-white shadow-inner focus:ring-2 focus:ring-ev-blue font-bold"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Canal de Destino</label>
                  <select
                    className="w-full p-4 rounded-3xl border-none bg-gray-50 dark:bg-gray-700 dark:text-white shadow-inner focus:ring-2 focus:ring-ev-blue appearance-none cursor-pointer font-bold uppercase text-xs tracking-widest"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    <option value="geral">Todos os Anos (Geral)</option>
                    <option value="ano1">Estudantes do 1º Ano</option>
                    <option value="ano2">Estudantes do 2º Ano</option>
                    <option value="ano3">Estudantes do 3º Ano</option>
                    <option value="ano4">Estudantes do 4º Ano</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Conteúdo da Informação</label>
                <textarea
                  required
                  rows={6}
                  placeholder="Escreva os detalhes aqui..."
                  className="w-full p-5 rounded-3xl border-none bg-gray-50 dark:bg-gray-700 dark:text-white shadow-inner focus:ring-2 focus:ring-ev-blue resize-none font-medium text-sm"
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                ></textarea>
              </div>
              <div className="flex flex-col gap-4 pt-4">
                <button type="submit" className="flex-1 bg-ev-blue text-white py-5 rounded-3xl font-black shadow-xl hover:bg-blue-600 transition-all uppercase tracking-[0.2em] text-xs">
                  <i className="fas fa-bullhorn mr-2"></i> Emitir Aviso
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="space-y-6">
            {filtered.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 p-20 rounded-5xl shadow-sm text-center text-gray-300 border border-dashed border-gray-200 dark:border-gray-700 animate-fadeIn">
                <i className="fas fa-bullhorn text-6xl mb-6 opacity-20"></i>
                <p className="text-lg font-black uppercase tracking-widest text-gray-400">Sem comunicados recentes</p>
                <p className="text-xs mt-2 italic">As informações oficiais para esta comunidade aparecerão aqui.</p>
              </div>
            ) : (
              filtered.map((pub, idx) => (
                <div key={pub.id} className="bg-white dark:bg-gray-800 p-8 rounded-4xl shadow-sm border-l-[8px] border-ev-blue hover:shadow-lg transition-all border-gray-100 dark:border-gray-700 animate-fadeIn" style={{ animationDelay: `${idx * 0.1}s` }}>
                  <div className="flex justify-between items-start mb-5">
                    <h3 className="text-xl font-black text-gray-800 dark:text-white leading-tight uppercase tracking-tight">{pub.title}</h3>
                    <span className="text-[9px] font-black text-gray-400 bg-gray-50 dark:bg-gray-700 px-4 py-2 rounded-full uppercase tracking-[0.2em] shadow-inner">
                      {new Date(pub.date).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm whitespace-pre-wrap font-medium">{pub.content}</p>
                  <div className="mt-8 flex items-center justify-between pt-4 border-t border-gray-50 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-ev-blue/10 rounded-full flex items-center justify-center text-[10px] text-ev-blue border border-ev-blue/20">
                        <i className="fas fa-tag"></i>
                      </div>
                      <span className="text-[9px] font-black text-ev-blue dark:text-ev-text-light uppercase tracking-[0.2em]">
                        {pub.category === 'geral' ? 'Canal Geral' : `Canal: ${pub.category.replace('ano', '')}º Ano`}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic flex items-center gap-2">
                         {pub.authorRole === 'docente' && <i className="fas fa-chalkboard-teacher"></i>}
                         {pub.authorRole === 'chefe' && <i className="fas fa-user-tie"></i>}
                         {pub.authorName || 'EV-UL Oficial'}
                      </div>
                      {canPublish && (
                        <button onClick={() => handleDelete(pub.id!)} className="text-red-500 hover:text-red-700 transition-colors">
                          <i className="fas fa-trash"></i>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Communities;
