
import React from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';

const About: React.FC = () => {
  // Adicione aqui os links das fotos da equipa
  const PHOTOS = {
    CORAGEM: "5.jpg", // Foto de Coragem Diua
    SAMUEL: "",  // Foto do Dr. Samuel Bernardo Phuelle
    MADJER: "",  // Foto do Dr. Madjer Manuel
    VALI: ""     // Foto do Dr. Vali Ruas Jala
  };

  const values = [
    {
      title: 'Criatividade',
      icon: 'fa-paint-brush',
      items: [
        'Liberdade de expressão artística.',
        'Imaginar, Inovar e Criar.',
        'Produção de soluções visuais originais.'
      ]
    },
    {
      title: 'Sensibilidade Estética',
      icon: 'fa-eye',
      items: [
        'Olhar atento e crítico.',
        'Valorização do detalhe.',
        'Apreço pela beleza e diversidade visual.'
      ]
    },
    {
      title: 'Ética e Responsabilidade',
      icon: 'fa-balance-scale',
      items: [
        'Integridade profissional.',
        'Respeito mútuo.',
        'Compromisso com o bem e dignidade humana.'
      ]
    },
    {
      title: 'Identidade Cultural',
      icon: 'fa-globe-africa',
      items: [
        'Valorização da cultura moçambicana.',
        'Respeito às tradições.',
        'Preservação da história e do patrimônio artístico.'
      ]
    },
    {
      title: 'Inovação',
      icon: 'fa-lightbulb',
      items: [
        'Uso criativo de tecnologias.',
        'Novos métodos e materiais.',
        'Evolução das práticas artísticas e educativas.'
      ]
    },
    {
      title: 'Sustentabilidade',
      icon: 'fa-leaf',
      items: [
        'Consciência ambiental.',
        'Uso responsável de recursos.',
        'Reaproveitamento artístico.'
      ]
    },
    {
      title: 'Inclusão e Diversidade',
      icon: 'fa-users',
      items: [
        'Respeito às diferenças.',
        'Valorização da pluralidade.',
        'Igualdade de oportunidades.'
      ]
    },
    {
      title: 'Excelência Académica',
      icon: 'fa-graduation-cap',
      items: [
        'Qualidade técnica e teórica.',
        'Formação pedagógica sólida.',
        'Preparação para o mercado e sociedade.'
      ]
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-ev-dark">
      <header className="bg-ev-blue text-white px-4 py-3 flex items-center justify-between shadow-md z-50">
        <div className="flex items-center gap-4">
          <Link to="/" className="hover:scale-110 transition-transform">
            <i className="fas fa-arrow-left text-xl"></i>
          </Link>
          <h1 className="text-xl font-bold tracking-tight">Sobre a EV-UL</h1>
        </div>
      </header>

      <main className="w-full p-6 space-y-12 py-12">
        
        {/* Hero Section */}
        <section className="text-center space-y-4 animate-fadeIn">
          <h2 className="text-4xl md:text-6xl font-black text-ev-blue dark:text-white uppercase tracking-tighter">
            Educação Visual
          </h2>
          <div className="inline-block bg-ev-brown text-white px-8 py-2 rounded-full shadow-lg transform -rotate-2">
            <p className="text-lg md:text-xl font-serif italic tracking-wide">"Ver, Criar e Transformar"</p>
          </div>
        </section>

        {/* Missão e Visão */}
        <section className="grid grid-cols-1 gap-8 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 p-10 rounded-5xl shadow-xl border-l-8 border-ev-blue relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
               <i className="fas fa-bullseye text-9xl text-ev-blue"></i>
             </div>
             <h3 className="text-2xl font-black text-ev-blue dark:text-white uppercase tracking-widest mb-6 border-b-2 border-gray-100 dark:border-gray-700 pb-4 inline-block">Missão</h3>
             <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed font-medium">
               Inspirar, capacitar e preparar os nossos estudantes para criar, inovar e valorizar a cultura visual moçambicana.
             </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-10 rounded-5xl shadow-xl border-l-8 border-ev-brown relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
               <i className="fas fa-eye text-9xl text-ev-brown"></i>
             </div>
             <h3 className="text-2xl font-black text-ev-brown dark:text-white uppercase tracking-widest mb-6 border-b-2 border-gray-100 dark:border-gray-700 pb-4 inline-block">Visão</h3>
             <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed font-medium">
               Ser referência no ensino de artes visuais em Moçambique formando profissionais criativos e transformadores.
             </p>
          </div>
        </section>

        {/* Valores Institucionais */}
        <section className="animate-fadeIn">
          <div className="text-center mb-10">
            <h3 className="text-3xl font-black text-ev-blue dark:text-white uppercase tracking-tight">Valores Institucionais</h3>
            <div className="w-24 h-1.5 bg-ev-brown mx-auto mt-3 rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            {values.map((val, idx) => (
              <div key={idx} className="bg-white dark:bg-gray-800 p-6 rounded-4xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
                <div className="w-12 h-12 bg-ev-blue/10 rounded-2xl flex items-center justify-center text-ev-blue mb-4">
                  <i className={`fas ${val.icon} text-xl`}></i>
                </div>
                <h4 className="text-lg font-black text-gray-800 dark:text-white mb-4 uppercase leading-tight h-12 flex items-center">{val.title}</h4>
                <ul className="space-y-2 mt-auto">
                  {val.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-500 dark:text-gray-400 leading-snug">
                      <span className="text-ev-brown mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Criador da App (Mantido) */}
        <section className="bg-white dark:bg-gray-800 rounded-5xl overflow-hidden shadow-xl border border-gray-100 dark:border-gray-700 flex flex-col animate-fadeIn mt-12">
          <div className="bg-ev-blue flex items-center justify-center p-12">
            <div className="text-center">
              <div className="w-48 h-48 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border-2 border-white/20 overflow-hidden relative">
                {PHOTOS.CORAGEM ? (
                  <img src={PHOTOS.CORAGEM} alt="Coragem Diua" className="w-full h-full object-cover" />
                ) : (
                  <i className="fas fa-user-circle text-9xl text-white"></i>
                )}
              </div>
              <h4 className="text-3xl font-black text-white uppercase tracking-tighter">Coragem Diua</h4>
              <p className="text-ev-text-light font-bold text-sm tracking-widest uppercase mt-2">Fundador & Lead Developer</p>
            </div>
          </div>
          <div className="p-12 flex flex-col justify-center space-y-6">
            <h3 className="text-3xl font-black text-ev-blue dark:text-white uppercase tracking-tighter">O Visionário</h3>
            <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed italic">
              "Acredito que a arte e a educação ganham força quando compartilhadas. Este projeto nasceu do desejo de ver nossa comunidade mais conectada e informada."
            </p>
            <div className="flex gap-4 pt-4">
              <a href="https://wa.me/258872007783" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center text-ev-blue hover:bg-ev-blue hover:text-white transition-all"><i className="fab fa-whatsapp text-xl"></i></a>
              <a href="https://www.facebook.com/profile.php?id=100077639292175" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center text-ev-blue hover:bg-ev-blue hover:text-white transition-all"><i className="fab fa-facebook-f text-xl"></i></a>
            </div>
          </div>
        </section>

        {/* Equipa e Contribuidores */}
        <section className="animate-fadeIn space-y-8">
          <div className="text-center">
            <h3 className="text-3xl font-black text-ev-blue dark:text-white uppercase tracking-tight">Equipa do Projecto</h3>
            <div className="w-24 h-1.5 bg-ev-brown mx-auto mt-3 rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {/* Dr. Samuel Bernardo Phuelle */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-4xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row items-center gap-6">
              <div className="w-24 h-24 bg-ev-blue/10 rounded-3xl flex items-center justify-center text-ev-blue shrink-0 overflow-hidden border-2 border-ev-blue/20">
                {PHOTOS.SAMUEL ? (
                  <img src={PHOTOS.SAMUEL} alt="Samuel Bernardo Phuelle" className="w-full h-full object-cover" />
                ) : (
                  <i className="fas fa-user-tie text-4xl"></i>
                )}
              </div>
              <div className="text-center md:text-left">
                <h4 className="text-xl font-black text-gray-800 dark:text-white uppercase">Dr. Samuel Bernardo Phuelle</h4>
                <p className="text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                  Apoiou na aprovação do projecto e facilitou o acesso a equipamentos de informática essenciais para o desenvolvimento.
                </p>
              </div>
            </div>

            {/* Design Contributors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 p-8 rounded-4xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center gap-4">
                <div className="w-20 h-20 bg-ev-brown/10 rounded-2xl flex items-center justify-center text-ev-brown overflow-hidden border-2 border-ev-brown/20">
                  {PHOTOS.MADJER ? (
                    <img src={PHOTOS.MADJER} alt="Madjer Manuel" className="w-full h-full object-cover" />
                  ) : (
                    <i className="fas fa-palette text-3xl"></i>
                  )}
                </div>
                <div>
                  <h4 className="text-lg font-black text-gray-800 dark:text-white uppercase">Dr. Madjer Manuel</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Contribuiu significativamente com o design da aplicação.</p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-8 rounded-4xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center gap-4">
                <div className="w-20 h-20 bg-ev-brown/10 rounded-2xl flex items-center justify-center text-ev-brown overflow-hidden border-2 border-ev-brown/20">
                  {PHOTOS.VALI ? (
                    <img src={PHOTOS.VALI} alt="Vali Ruas Jala" className="w-full h-full object-cover" />
                  ) : (
                    <i className="fas fa-pen-nib text-3xl"></i>
                  )}
                </div>
                <div>
                  <h4 className="text-lg font-black text-gray-800 dark:text-white uppercase">Dr. Vali Ruas Jala</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Contribuiu significativamente com o design da aplicação.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Informações de Suporte e Localização (Mantido como rodapé funcional da página) */}
        <section className="grid grid-cols-1 gap-8">
          <div className="bg-white dark:bg-gray-800 p-10 rounded-4xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-6 animate-fadeIn">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-ev-brown text-white rounded-2xl flex items-center justify-center shadow-lg"><i className="fas fa-headset text-xl"></i></div>
              <h3 className="text-2xl font-black text-ev-blue dark:text-white uppercase">Suporte Técnico</h3>
            </div>
            <p className="text-gray-500 text-sm">Problemas com o acesso? Nossa equipe está pronta para ajudar.</p>
            <div className="space-y-3 pt-4">
              <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                <i className="fas fa-envelope text-ev-blue"></i>
                <span className="font-bold">suporte@ev-ul.com</span>
              </div>
              <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                <i className="fas fa-clock text-ev-blue"></i>
                <span>Seg - Sex: 08:00 - 17:00</span>
              </div>
            </div>
          </div>
          
          <div className="bg-ev-brown text-white p-10 rounded-4xl shadow-xl space-y-6 animate-fadeIn">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white text-ev-brown rounded-2xl flex items-center justify-center shadow-lg"><i className="fas fa-map-marker-alt text-xl"></i></div>
              <h3 className="text-2xl font-black uppercase">Localização</h3>
            </div>
            <p className="text-ev-text-light text-sm">Encontre-nos no coração acadêmico de Quelimane.</p>
            <div className="pt-4">
              <p className="font-bold text-lg">Universidade Licungo</p>
              <p className="text-ev-text-light text-sm">Campus Coalane, Bloco B, Sala 12</p>
              <p className="text-ev-text-light text-sm">Quelimane, Moçambique</p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default About;
