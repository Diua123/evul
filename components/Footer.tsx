
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-ev-blue text-white mt-auto py-12 pb-[calc(env(safe-area-inset-bottom)+3rem)] px-6">
      <div className="w-full grid grid-cols-1 gap-12">
        <div className="space-y-4">
          <h3 className="text-lg font-bold border-b-2 border-white/20 pb-2 uppercase tracking-wider">Universidade Licungo</h3>
          <div className="text-sm space-y-1 text-white/80">
            <p>Departamento de Educação Visual</p>
            <p>Campus Coalane, Quelimane</p>
            <p>Província da Zambézia, Moçambique</p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold border-b-2 border-white/20 pb-2 uppercase tracking-wider">Links Úteis</h3>
          <ul className="text-sm space-y-3">
            <li>
              <a href="https://www.unilicungo.ac.mz" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:translate-x-1 transition-transform">
                <i className="fas fa-external-link-alt text-xs"></i> Universidade Licungo
              </a>
            </li>
            <li>
              <a href="https://sigeul.ac.mz" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:translate-x-1 transition-transform">
                <i className="fas fa-external-link-alt text-xs"></i> SIGEUL
              </a>
            </li>
            <li>
              <a href="https://biblioteca.unilicungo.ac.mz" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:translate-x-1 transition-transform">
                <i className="fas fa-book text-xs"></i> Biblioteca Central
              </a>
            </li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold border-b-2 border-white/20 pb-2 uppercase tracking-wider">Contactos</h3>
          <div className="text-sm space-y-3">
            <a href="mailto:info@unilicungo.ac.mz" className="flex items-center gap-2 hover:text-ev-brown transition-colors">
              <i className="fas fa-envelope"></i> info@unilicungo.ac.mz
            </a>
            <a href="tel:+258872007783" className="flex items-center gap-2 hover:text-ev-brown transition-colors">
              <i className="fas fa-phone"></i> +258 872007783
            </a>
          </div>
          
          <h3 className="text-lg font-bold mt-6 border-b-2 border-white/20 pb-2 uppercase tracking-wider">Redes Sociais</h3>
          <div className="flex gap-4 mt-4">
            <a href="https://facebook.com/unilicungo" target="_blank" rel="noopener noreferrer" className="text-2xl hover:translate-y-[-4px] transition-transform">
              <i className="fab fa-facebook"></i>
            </a>
            <a href="https://youtube.com/unilicungo" target="_blank" rel="noopener noreferrer" className="text-2xl hover:translate-y-[-4px] transition-transform">
              <i className="fab fa-youtube"></i>
            </a>
          </div>
        </div>
      </div>

      <div className="w-full mt-12 pt-8 border-t border-white/20 text-center text-xs text-white/60">
        <p>&copy; 2025 Universidade Licungo - Departamento de Educação Visual. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
};

export default Footer;
