
import React, { useState, useEffect, useCallback, createContext } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { WifiOff } from 'lucide-react';
import Home from './views/Home';
import About from './views/About';
import Chat from './views/Chat';
import Communities from './views/Communities';
import ArtGallery from './views/ArtGallery';
import UserPosts from './views/UserPosts';
import Settings from './views/Settings';
import Login from './views/Login';
import Library from './views/Library';
import { storage } from './services/storage';
import { getUserFB, updateUserStatusFB } from './services/firebaseService';
import { notificationService } from './services/notifications';
import { Theme, Language, User } from './types';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const LanguageContext = createContext<LanguageContextType>({
  language: Language.PT,
  setLanguage: () => {},
});

const AppContent: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(storage.getTheme());
  const language = Language.PT;
  const [isAuth, setIsAuth] = useState<boolean>(!!storage.getCurrentUserId());
  const [isAppLoading, setIsAppLoading] = useState<boolean>(true);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Heartbeat para status online
  useEffect(() => {
    if (!isAuth) return;
    
    const userId = storage.getCurrentUserId();
    if (!userId) return;

    // Atualiza imediatamente ao entrar
    updateUserStatusFB(userId, true);

    // Intervalo para manter online (a cada 2 minutos)
    const interval = setInterval(() => {
      updateUserStatusFB(userId, true);
    }, 120000);

    // Listener para quando a aba é fechada ou visibilidade muda
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        updateUserStatusFB(userId, false);
      } else {
        updateUserStatusFB(userId, true);
      }
    };

    window.addEventListener('beforeunload', () => updateUserStatusFB(userId, false));
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', () => updateUserStatusFB(userId, false));
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      updateUserStatusFB(userId, false);
    };
  }, [isAuth]);

  const setLanguage = (lang: Language) => {
    // Language is now fixed to PT
  };

  useEffect(() => {
    const syncUser = async () => {
      const userId = storage.getCurrentUserId();
      if (userId) {
        try {
          const user = await getUserFB(userId);
          if (user) {
            storage.setCachedUser(user);
            setIsAuth(true);
          } else {
            // Apenas desloga se tivermos certeza que o usuário não existe no banco
            // e se o Firebase estiver configurado
            const configured = !!import.meta.env.VITE_FIREBASE_API_KEY;
            if (configured) {
              storage.logout();
              setIsAuth(false);
            }
          }
        } catch (error) {
          console.error("Erro ao sincronizar usuário:", error);
          // Em caso de erro de rede, mantemos o usuário logado com o cache local
          const cached = storage.getCurrentUser();
          if (cached) setIsAuth(true);
        }
      }
      setIsAppLoading(false);
    };
    syncUser();
  }, []);

  useEffect(() => {
    // Solicitar permissão de notificação ao iniciar
    notificationService.requestPermission();

    if (theme === Theme.DARK) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    storage.setTheme(theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === Theme.LIGHT ? Theme.DARK : Theme.LIGHT));
  }, []);

  const handleLoginStatus = useCallback(() => {
    setIsAuth(!!storage.getCurrentUserId());
  }, []);

  const handleLogout = useCallback(() => {
    storage.logout();
    setIsAuth(false);
  }, []);

  const requiresAuth = (component: React.ReactNode) => {
    return isAuth ? component : <Navigate to="/login" replace />;
  };

  const requiresChatAccess = (component: React.ReactNode) => {
    const user = storage.getCurrentUser();
    if (!isAuth) return <Navigate to="/login" replace />;
    // Permitir todos os usuários autenticados no chat (Estudantes, Chefes e Docentes)
    return component;
  };

  if (isOffline) {
    return (
      <div className="min-h-screen bg-gray-200 dark:bg-gray-900 flex justify-center items-center transition-colors duration-200 p-4">
        <div className="bg-white dark:bg-ev-dark p-8 rounded-2xl shadow-xl max-w-md w-full text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
            <WifiOff className="w-10 h-10 text-red-500 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Sem ligação à Internet</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Parece que está offline. Verifique a sua ligação Wi-Fi ou dados móveis para continuar a usar a plataforma.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors w-full"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (isAppLoading) {
    return (
      <div className="min-h-screen bg-gray-200 dark:bg-gray-900 flex justify-center items-center transition-colors duration-200">
        <div className="flex flex-col items-center">
          <div className="flex items-center justify-center h-16 relative w-32">
            <div className="w-5 h-5 bg-blue-500 rounded-full absolute left-4 animate-swap1 shadow-md"></div>
            <div className="w-5 h-5 bg-[#6B3F1F] rounded-full absolute left-12 animate-swap2 shadow-md"></div>
            <div className="w-5 h-5 bg-white rounded-full absolute left-20 animate-swap3 shadow-md border border-gray-200 dark:border-gray-700"></div>
          </div>
          <p className="mt-4 text-gray-600 dark:text-gray-300 font-medium animate-pulse">A carregar a plataforma...</p>
        </div>
      </div>
    );
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      <div className="min-h-screen bg-gray-200 dark:bg-gray-900 flex justify-center transition-colors duration-200">
        <div className="w-full max-w-md bg-gray-50 dark:bg-ev-dark shadow-2xl min-h-screen relative overflow-x-hidden">
          <Routes>
            <Route path="/" element={<Home toggleTheme={toggleTheme} isDark={theme === Theme.DARK} onLogout={handleLogout} />} />
            <Route path="/about" element={<About />} />
            {/* Chat acessível para todos os usuários autenticados */}
            <Route path="/chat" element={requiresChatAccess(<Chat />)} />
            <Route path="/communities" element={requiresAuth(<Communities />)} />
            <Route path="/communities/:tab" element={requiresAuth(<Communities />)} />
            <Route path="/gallery" element={<ArtGallery />} />
            <Route path="/posts" element={<UserPosts />} />
            <Route path="/library/:category" element={<Library />} />
            <Route path="/settings" element={requiresAuth(<Settings onLogout={handleLogout} toggleTheme={toggleTheme} isDark={theme === Theme.DARK} />)} />
            <Route path="/login" element={<Login onLogin={handleLoginStatus} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </LanguageContext.Provider>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
};

export default App;
