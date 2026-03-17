
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { storage } from '../services/storage';
import { isFirebaseConfigured } from '../services/firebase';
import { subscribeToMessages, subscribeToPublications, subscribeToAllMyMessages } from '../services/firebaseService';
import { LanguageContext } from '../App';
import { t } from '../services/i18n';
import Footer from '../components/Footer';
import { Language } from '../types';

interface HomeProps {
  toggleTheme: () => void;
  isDark: boolean;
  onLogout: () => void;
}

const Home: React.FC<HomeProps> = ({ toggleTheme, isDark, onLogout }) => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [hasNewPubs, setHasNewPubs] = useState(false);
  const { language, setLanguage } = useContext(LanguageContext);
  const LOGO_URL = "up.png"; // Coloque aqui o link da imagem do seu logo (ex: https://imgur.com/...)

  const slides = [
    { url: "1.png", caption: "Campus Coalane - Quelimane" },
    { url: "2.png", caption: "Campus Coalane - Quelimane" },
    { url: "3.png", caption: "Campus Coalane - Quelimane" },
    { url: "4.png", caption: "Campus Coalane - Quelimane" }
  ];

  const stats = [
    { label: `${t('students', language)} 1º Ano`, value: 38 },
    { label: `${t('students', language)} 2º Ano`, value: 26 },
    { label: `${t('students', language)} 3º Ano`, value: 22 },
    { label: `${t('students', language)} 4º Ano`, value: 20 },
    { label: t('professors', language), value: 7 }
  ];

  const staff = [
    { name: "Dr. Samuel Bernardo Phuelle", role: "Director do Curso", email: "samuelphuelle@unilicungo.ac.mz" },
    { name: "Enoque", role: "Chefe de Turma - 1º Ano", email: "enoque@unilicungo.ac.mz" },
    { name: "Lapson Esmael", role: "Chefe de Turma - 2º Ano", email: "lapson@unilicungo.ac.mz" },
    { name: "Gavini Fernando", role: "Chefe de Turma - 3º Ano", email: "gavini@unilicungo.ac.mz" },
    { name: "Paulo Cumbane", role: "Chefe de Turma - 4º Ano", email: "paulo@unilicungo.ac.mz" }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 20000);

    const lastChatView = storage.getLastViewedChat();
    const lastPubsView = storage.getLastViewedPubs();
    
    // Subscribe to publications for red dot
    const unsubPubs = subscribeToPublications((pubs) => {
      setHasNewPubs(pubs.some(p => new Date(p.date).getTime() > lastPubsView));
    });

    return () => {
      clearInterval(timer);
      unsubPubs();
    };
  }, [slides.length]);

  const currentUser = storage.getCurrentUser();

  useEffect(() => {
    if (!currentUser) return;
    const unsubChat = subscribeToAllMyMessages(currentUser.id, (msgs) => {
      // Check if any message is unread based on its conversation's last viewed time
      const hasUnread = msgs.some(m => {
        if (m.authorId === currentUser.id) return false;
        const convId = m.to === 'general' ? 'general' : (m.to === currentUser.id ? m.authorId : m.to);
        const lastViewed = storage.getLastViewedConversation(convId);
        return m.time > lastViewed;
      });
      setHasNewMessages(hasUnread);
    });
    return () => unsubChat();
  }, [currentUser?.id]);

  const toggleDropdown = (id: string) => {
    setOpenDropdown(openDropdown === id ? null : id);
  };

  const handleLogoutClick = () => {
    onLogout();
    navigate('/login');
  };

  const RedDot = () => (
    <span className="absolute top-3 right-1/2 translate-x-4 flex h-2.5 w-2.5">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
    </span>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-ev-dark transition-colors duration-300">
      {!isFirebaseConfigured && (
        <div className="bg-amber-500 text-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-center animate-pulse z-[100]">
          <i className="fas fa-exclamation-triangle mr-2"></i>
          Firebase não configurado. Sincronização offline.
        </div>
      )}
      {fullScreenImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 animate-fadeIn backdrop-blur-sm"
          onClick={() => setFullScreenImage(null)}
        >
          <button className="absolute top-6 right-6 text-white text-3xl hover:scale-125 transition-transform">
            <i className="fas fa-times"></i>
          </button>
          <img 
            src={fullScreenImage} 
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-zoomIn border-4 border-ev-brown" 
            alt="Full screen view"
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}

      {/* Alerta de Configuração Firebase */}
      {!isFirebaseConfigured && (
        <div className="bg-red-600 text-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-center animate-pulse z-[60]">
          <i className="fas fa-exclamation-triangle mr-2"></i>
          Firebase não configurado. Algumas funcionalidades podem não funcionar.
        </div>
      )}

      <header className="bg-ev-blue text-white px-4 py-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] flex items-center justify-between shadow-md z-50">
        <div className="flex items-center gap-4">
          <div className="bg-white p-2 rounded-full w-12 h-12 flex items-center justify-center shadow-lg border-2 border-ev-brown hover:scale-105 transition-transform overflow-hidden">
            {LOGO_URL ? (
              <img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <i className="fas fa-graduation-cap text-ev-blue text-2xl"></i>
            )}
          </div>
          <h1 className="text-xl font-bold tracking-tight uppercase tracking-tighter">Educação Visual - UL</h1>
        </div>
        <div className="flex items-center gap-3">
          {!currentUser ? (
            <div className="flex items-center gap-3">
              <button 
                onClick={toggleTheme} 
                className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors shadow-sm"
                title="Alternar Tema"
              >
                <i className={`fas ${isDark ? 'fa-sun' : 'fa-moon'}`}></i>
              </button>
              <button 
                onClick={() => navigate('/login')}
                className="w-10 h-10 rounded-full bg-ev-brown text-white flex items-center justify-center hover:bg-[#5a331a] transition-all shadow-md active:scale-95 ml-1"
                title={t('login', language)}
              >
                <i className="fas fa-sign-in-alt"></i>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {currentUser.photo && (
                <img src={currentUser.photo} className="w-9 h-9 rounded-full object-cover border-2 border-ev-brown shadow-md" alt="Profile" />
              )}
              <button 
                onClick={handleLogoutClick}
                className="bg-ev-brown text-white px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-[#5a331a] transition-all shadow-md active:scale-95"
              >
                {t('logout', language)}
              </button>
            </div>
          )}
        </div>
      </header>

      <nav className="bg-ev-blue border-t border-white/10 shadow-lg relative z-40">
        <div className="flex flex-wrap">
          <button onClick={() => toggleDropdown('menu')} className="flex-1 flex flex-col items-center justify-center py-4 text-white hover:bg-ev-brown transition-colors">
            <i className="fas fa-bars text-lg mb-1"></i>
            <span className="text-[9px] font-black uppercase tracking-tighter">Menu</span>
          </button>
          <button onClick={() => navigate('/posts')} className="flex-1 flex flex-col items-center justify-center py-4 text-white hover:bg-ev-brown transition-colors border-l border-white/5">
            <i className="fas fa-camera-retro text-lg mb-1"></i>
            <span className="text-[9px] font-black uppercase tracking-tighter">{t('posts', language)}</span>
          </button>
          <button onClick={() => toggleDropdown('library')} className="flex-1 flex flex-col items-center justify-center py-4 text-white hover:bg-ev-brown transition-colors border-l border-white/5">
            <i className="fas fa-book text-lg mb-1"></i>
            <span className="text-[9px] font-black uppercase tracking-tighter">{t('library', language)}</span>
          </button>
          <button onClick={() => toggleDropdown('communities')} className="flex-1 flex flex-col items-center justify-center py-4 text-white hover:bg-ev-brown transition-colors border-l border-white/5 relative">
            {hasNewPubs && <RedDot />}
            <i className="fas fa-bullhorn text-lg mb-1"></i>
            <span className="text-[9px] font-black uppercase tracking-tighter">{t('communities', language)}</span>
          </button>
          <button onClick={() => navigate('/chat')} className="flex-1 flex flex-col items-center justify-center py-4 text-white hover:bg-ev-brown transition-colors border-l border-white/5 relative">
            {hasNewMessages && <RedDot />}
            <i className="fas fa-comments text-lg mb-1"></i>
            <span className="text-[9px] font-black uppercase tracking-tighter">{t('chat', language)}</span>
          </button>
        </div>
        
        {/* Dropdowns */}
        {openDropdown === 'menu' && (
          <div className="absolute top-full left-0 w-48 bg-ev-blue shadow-2xl rounded-b-3xl border-t border-white/10 animate-fadeIn z-50">
            <Link to="/settings" className="block px-6 py-4 text-white text-xs font-black uppercase tracking-widest hover:bg-ev-brown border-b border-white/5">{t('settings', language)}</Link>
            <Link to="/about" className="block px-6 py-4 text-white text-xs font-black uppercase tracking-widest hover:bg-ev-brown">{t('about', language)}</Link>
          </div>
        )}
        
        {openDropdown === 'library' && (
          <div className="absolute top-full left-[20%] w-60 bg-ev-blue shadow-2xl rounded-b-3xl border-t border-white/10 animate-fadeIn z-50">
            <Link to="/library/trabalhos" className="block px-6 py-3.5 text-white text-[10px] font-black uppercase tracking-widest hover:bg-ev-brown border-b border-white/5">{t('scientific_works', language)}</Link>
            <Link to="/library/mono" className="block px-6 py-3.5 text-white text-[10px] font-black uppercase tracking-widest hover:bg-ev-brown border-b border-white/5">{t('monographs', language)}</Link>
            <Link to="/library/planos" className="block px-6 py-3.5 text-white text-[10px] font-black uppercase tracking-widest hover:bg-ev-brown border-b border-white/5">{t('analytical_plans', language)}</Link>
            <Link to="/library/horarios" className="block px-6 py-3.5 text-white text-[10px] font-black uppercase tracking-widest hover:bg-ev-brown border-b border-white/5">{t('schedules', language)}</Link>
            <Link to="/library/materiais" className="block px-6 py-3.5 text-white text-[10px] font-black uppercase tracking-widest hover:bg-ev-brown">{t('academic_materials', language)}</Link>
          </div>
        )}

        {openDropdown === 'communities' && (
          <div className="absolute top-full left-[40%] md:left-[60%] w-60 bg-ev-blue shadow-2xl rounded-b-3xl border-t border-white/10 animate-fadeIn z-50">
            <Link to="/communities/geral" className="block px-6 py-3.5 text-white text-[10px] font-black uppercase tracking-widest hover:bg-ev-brown border-b border-white/5">Canal Geral</Link>
            <Link to="/communities/ano1" className="block px-6 py-3.5 text-white text-[10px] font-black uppercase tracking-widest hover:bg-ev-brown border-b border-white/5">1º Ano</Link>
            <Link to="/communities/ano2" className="block px-6 py-3.5 text-white text-[10px] font-black uppercase tracking-widest hover:bg-ev-brown border-b border-white/5">2º Ano</Link>
            <Link to="/communities/ano3" className="block px-6 py-3.5 text-white text-[10px] font-black uppercase tracking-widest hover:bg-ev-brown border-b border-white/5">3º Ano</Link>
            <Link to="/communities/ano4" className="block px-6 py-3.5 text-white text-[10px] font-black uppercase tracking-widest hover:bg-ev-brown">4º Ano</Link>
          </div>
        )}
      </nav>

      <section className="relative w-full h-[320px] md:h-[450px] overflow-hidden bg-black shadow-inner">
        {slides.map((slide, index) => (
          <div 
            key={index} 
            className={`absolute inset-0 w-full h-full transition-opacity duration-[2000ms] ease-in-out ${
              currentSlide === index ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            {slide.url && (
              <img src={slide.url} alt={slide.caption} className="w-full h-full object-cover opacity-75" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30"></div>
            <div className="absolute bottom-0 left-0 right-0 p-8 text-center">
              <h3 className="text-white text-lg md:text-2xl font-black mb-2 uppercase tracking-tighter">{slide.caption}</h3>
              <div className="w-16 h-1 bg-ev-blue mx-auto rounded-full"></div>
            </div>
          </div>
        ))}
      </section>

      <main className="w-full p-6 space-y-12 py-10">
        <section className="bg-white dark:bg-gray-800 rounded-5xl shadow-xl p-8 border border-gray-100 dark:border-gray-700 animate-fadeIn">
          <h2 className="text-2xl font-black text-ev-blue dark:text-white mb-8 flex items-center gap-3 uppercase tracking-tighter">
            <i className="fas fa-chart-line"></i> {t('statistics', language)}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-4xl text-center border border-gray-100 dark:border-gray-600">
                <div className="text-3xl font-black text-ev-blue dark:text-blue-400 mb-1">{stat.value}</div>
                <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-tight">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white dark:bg-gray-800 rounded-5xl shadow-xl p-8 border border-gray-100 dark:border-gray-700 animate-fadeIn">
          <h2 className="text-2xl font-black text-ev-blue dark:text-white mb-8 flex items-center gap-3 uppercase tracking-tighter">
            <i className="fas fa-user-shield"></i> {t('leadership', language)}
          </h2>
          <div className="grid grid-cols-1 gap-6">
            {staff.map((person, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-4xl border border-transparent hover:border-ev-blue/20 transition-all shadow-sm">
                <div className="text-ev-blue dark:text-blue-400 font-black uppercase tracking-tight">{person.name}</div>
                <div className="text-[10px] italic text-gray-400 font-bold uppercase tracking-tighter mb-4">{person.role}</div>
                <div className="pt-3 border-t border-gray-200 dark:border-gray-600 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <i className="fas fa-envelope mr-2"></i> {person.email}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Home;
