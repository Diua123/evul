
import React from 'react';
import { useNavigate } from 'react-router-dom';

interface LayoutProps {
  title: string;
  children: React.ReactNode;
  showBackButton?: boolean;
  backTo?: string;
  onBack?: () => void;
  actions?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ title, children, showBackButton = true, backTo, onBack, actions }) => {
  const navigate = useNavigate();
  const LOGO_URL = "up.png"; // Coloque aqui o link da imagem do seu logo (ex: https://imgur.com/...)

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-ev-blue sticky top-0 z-50 shadow-md">
        <div className="w-full px-4 py-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            {showBackButton && (
              <button 
                onClick={handleBack}
                className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition-colors"
                aria-label="Voltar"
              >
                <i className="fas fa-arrow-left"></i>
              </button>
            )}
            {LOGO_URL && (
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center overflow-hidden border border-ev-brown shadow-sm">
                <img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain" />
              </div>
            )}
            <h1 className="text-white font-bold text-lg">{title}</h1>
          </div>
          <div className="flex items-center gap-2">
            {actions}
          </div>
        </div>
      </header>
      <main className="flex-1 w-full p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        {children}
      </main>
    </div>
  );
};

export default Layout;
