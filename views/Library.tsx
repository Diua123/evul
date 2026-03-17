
import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import { LibraryItem, Language } from '../types';
import { storage } from '../services/storage';
import { subscribeToLibrary, addLibraryItemFB, deleteLibraryItemFB } from '../services/firebaseService';
import { LanguageContext } from '../App';
import { t } from '../services/i18n';

// Itens estáticos da biblioteca (arquivos na pasta public)
const STATIC_LIBRARY_ITEMS: LibraryItem[] = [
  // Adicione os seus ficheiros estáticos aqui
  // Exemplo:
  // {
  //   id: 'static-plano-1',
  //   title: 'Plano Analítico - Matemática I',
  //   author: 'Departamento de Matemática',
  //   category: 'planos',
  //   date: '2026-03-13',
  //   description: 'Plano detalhado da disciplina de Matemática I para o primeiro semestre.',
  //   downloadUrl: '/planos/plano_matematica.pdf'
  // }
 {
  id: 'static-plano-1',
  title: 'Plano Analítico - DCM2 II',
  author: 'Dr. Vali',
 category: 'planos',
 date: '2026',
 description: 'Plano analitico Semestre I',
  downloadUrl: 'PLANO ANALITICO DE MECANICA 2.pdf'
 }
  {
  id: 'static-plano-2',
  title: 'Plano Analítico - DGD II',
  author: 'Dr. Vali',
 category: 'planos',
 date: '2026',
 description: 'Plano analitico Semestre I',
  downloadUrl: 'PLANO ANALITICO DE GD2.pdf'
 }
];

const Library: React.FC = () => {
  const { category } = useParams<{ category: string }>();
  const { language } = useContext(LanguageContext);
  const navigate = useNavigate();
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [view, setView] = useState<'list' | 'add'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState({ title: '', author: '', description: '', file: '' });
  const [isUploading, setIsUploading] = useState(false);

  const currentUser = storage.getCurrentUser();
  const categoryAllowsAdd = ['trabalhos', 'materiais', 'mono'].includes(category || '');

  useEffect(() => {
    if (!category) return;
    
    // Filtra os itens estáticos para a categoria atual
    const staticItems = STATIC_LIBRARY_ITEMS.filter(item => item.category === category);
    
    const unsubscribe = subscribeToLibrary(category, (firebaseItems) => {
      // Junta os itens estáticos com os itens vindos do Firebase
      setItems([...staticItems, ...firebaseItems]);
    });
    return () => unsubscribe();
  }, [category]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setForm({ ...form, file: event.target?.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.file) { alert(t('select_file', language)); return; }
    if (!currentUser) return;
    
    setIsUploading(true);
    try {
      await addLibraryItemFB({
        userId: currentUser.id,
        title: form.title,
        author: form.author,
        category: category as any,
        date: new Date().toISOString().split('T')[0],
        description: form.description,
        downloadUrl: form.file
      });
      
      setForm({ title: '', author: '', description: '', file: '' });
      setView('list');
    } catch (err) {
      console.error(err);
      alert('Erro ao publicar o ficheiro.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    try {
      await deleteLibraryItemFB(itemId);
    } catch (err) {
      console.error(err);
    }
  };

  const getTitle = () => {
    switch (category) {
      case 'trabalhos': return t('scientific_works', language);
      case 'mono': return t('monographs', language);
      case 'planos': return t('analytical_plans', language);
      case 'horarios': return t('schedules', language);
      case 'materiais': return t('academic_materials', language);
      default: return t('library', language);
    }
  };

  const filteredItems = items.filter(item => item.title.toLowerCase().includes(searchTerm.toLowerCase()) || item.author.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-ev-dark transition-colors duration-200">
      <header className="bg-ev-blue text-white px-4 py-3 flex items-center justify-between shadow-md z-50">
        <div className="flex items-center gap-4"><Link to="/" className="hover:scale-110 transition-transform"><i className="fas fa-arrow-left text-xl"></i></Link><h1 className="text-xl font-bold tracking-tight uppercase tracking-tighter">{getTitle()}</h1></div>
        {categoryAllowsAdd && currentUser && (
          <button onClick={() => setView(view === 'list' ? 'add' : 'list')} className="bg-white text-ev-blue px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
            {view === 'list' ? t('add_file', language) : t('cancel', language)}
          </button>
        )}
      </header>

      <main className="w-full p-6 flex-1 py-10">
        {view === 'add' ? (
          (category === 'trabalhos' || category === 'mono') ? (
            <div className="w-full bg-white dark:bg-gray-800 p-10 rounded-5xl shadow-xl border border-gray-100 dark:border-gray-700 animate-fadeIn text-center py-20">
              <i className="fas fa-tools text-6xl text-ev-blue mb-6 opacity-50"></i>
              <h2 className="text-2xl font-black text-ev-blue dark:text-white uppercase mb-4 tracking-tighter">Funcionalidade em desenvolvimento</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-bold">De momento não é possível publicar nesta categoria.</p>
            </div>
          ) : (
            <div className="w-full bg-white dark:bg-gray-800 p-10 rounded-5xl shadow-xl border border-gray-100 animate-fadeIn">
              <h2 className="text-2xl font-black text-ev-blue dark:text-white uppercase mb-8 tracking-tighter">{t('add_file', language)}</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">{t('file_title', language)}</label><input type="text" required className="w-full p-4 rounded-3xl border-none bg-gray-50 dark:bg-gray-700 dark:text-white shadow-inner" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">{t('author_name', language)}</label><input type="text" required className="w-full p-4 rounded-3xl border-none bg-gray-50 dark:bg-gray-700 dark:text-white shadow-inner" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} /></div>
                <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">{t('file_description', language)}</label><textarea required rows={4} className="w-full p-4 rounded-3xl border-none bg-gray-50 dark:bg-gray-700 dark:text-white shadow-inner resize-none" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                <div className="relative border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-4xl p-10 text-center hover:bg-gray-50 transition-colors group"><input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileUpload} /><div className="text-gray-400"><i className="fas fa-file-upload text-5xl mb-3"></i><p className="text-[10px] font-black uppercase tracking-widest">{form.file ? 'Ficheiro Pronto' : t('select_file', language)}</p></div></div>
                <button type="submit" disabled={isUploading} className="w-full bg-ev-blue text-white py-5 rounded-3xl font-black shadow-xl uppercase tracking-widest text-xs">{isUploading ? 'A publicar...' : t('upload', language)}</button>
              </form>
            </div>
          )
        ) : (
          <>
            <div className="mb-10 flex flex-col justify-between gap-6">
              <div><h2 className="text-3xl font-black text-ev-blue dark:text-white uppercase tracking-tighter">{t('library', language)}</h2><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{getTitle()}</p></div>
              <div className="relative"><input type="text" placeholder={t('search', language)} className="w-full bg-white dark:bg-gray-800 border-none rounded-full px-6 py-4 text-sm focus:ring-2 focus:ring-ev-blue shadow-sm dark:text-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /><i className="fas fa-search absolute right-6 top-1/2 -translate-y-1/2 text-gray-300"></i></div>
            </div>
            
            {filteredItems.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 p-24 rounded-5xl shadow-sm text-center border border-dashed border-gray-200 dark:border-gray-700 animate-fadeIn">
                <i className="fas fa-folder-open text-7xl text-gray-200 mb-6"></i>
                <p className="text-xl font-black uppercase tracking-widest text-gray-400">{t('no_files', language)}</p>
                <p className="text-xs mt-2 italic text-gray-400">Contribua com a biblioteca submetendo novos materiais!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-8">
                {filteredItems.map((item, idx) => (
                  <div key={item.id} className="bg-white dark:bg-gray-800 rounded-4xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all animate-fadeIn" style={{ animationDelay: `${idx * 0.1}s` }}>
                    <div className="p-8">
                      <div className="flex justify-between items-start mb-6"><div className="w-12 h-12 bg-ev-blue/10 rounded-2xl flex items-center justify-center text-ev-blue"><i className="fas fa-file-alt text-2xl"></i></div><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.date}</span></div>
                      <h3 className="text-xl font-black text-gray-800 dark:text-white mb-2 leading-tight uppercase tracking-tight">{item.title}</h3>
                      <p className="text-[10px] text-ev-brown font-black mb-4 uppercase italic">Autor: {item.author}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 line-clamp-3 leading-relaxed">{item.description}</p>
                      <div className="flex items-center justify-between pt-6 border-t border-gray-50 dark:border-gray-700">
                        <div className="flex gap-4 items-center">
                          <a href={item.downloadUrl} target="_blank" rel="noopener noreferrer" className="text-ev-blue font-black text-[10px] uppercase tracking-widest hover:underline"><i className="fas fa-eye mr-1"></i> {t('view', language)}</a>
                          {(currentUser?.id === item.userId || currentUser?.role === 'docente') && (
                            <button onClick={() => handleDelete(item.id)} className="text-red-500 font-black text-[10px] uppercase tracking-widest hover:underline">
                              <i className="fas fa-trash mr-1"></i> Apagar
                            </button>
                          )}
                        </div>
                        <a href={item.downloadUrl} download={`${item.title}.pdf`} className="bg-ev-blue text-white px-5 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 transition-colors"><i className="fas fa-download mr-1"></i> {t('download', language)}</a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Library;
