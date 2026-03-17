
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { storage } from '../services/storage';
import { Artwork, User } from '../types';

const ArtGallery: React.FC = () => {
  const [view, setView] = useState<'feed' | 'publish'>('feed');
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [description, setDescription] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);

  useEffect(() => {
    setArtworks(storage.getArtworks());
    setCurrentUser(storage.getCurrentUser());
  }, []);

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!mediaFile) {
      alert('Selecione uma imagem');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const newArt: Artwork = {
        userId: currentUser.id,
        userName: currentUser.name,
        userPhoto: currentUser.photo,
        description: description,
        media: event.target?.result as string,
        mediaType: mediaFile.type,
        isImage: true,
        likes: 0,
        likedBy: [],
        comments: [],
        timestamp: new Date().toISOString()
      };

      const updated = [newArt, ...artworks];
      setArtworks(updated);
      storage.setArtworks(updated);
      setDescription('');
      setMediaFile(null);
      setView('feed');
    };
    reader.readAsDataURL(mediaFile);
  };

  const handleLike = (index: number) => {
    if (!currentUser) {
      alert('Faça login para curtir');
      return;
    }
    const updated = [...artworks];
    const art = updated[index];
    if (art.likedBy.includes(currentUser.id)) return;

    art.likes += 1;
    art.likedBy.push(currentUser.id);
    setArtworks(updated);
    storage.setArtworks(updated);
  };

  const addComment = (index: number, comment: string) => {
    if (!comment.trim()) return;
    const updated = [...artworks];
    updated[index].comments.push(`${currentUser?.name || 'Visitante'}: ${comment}`);
    setArtworks(updated);
    storage.setArtworks(updated);
  };

  return (
    <Layout title="Galeria de Arte" backTo="/" actions={
      <button 
        onClick={() => setView(view === 'feed' ? 'publish' : 'feed')}
        className="bg-white text-ev-blue px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-sm"
      >
        {view === 'feed' ? 'Publicar' : 'Ver Feed'}
      </button>
    }>
      <div className="space-y-6">
        {view === 'publish' ? (
          <div className="bg-white dark:bg-gray-800 p-8 rounded-4xl shadow-lg border border-gray-100 dark:border-gray-700 w-full animate-fadeIn">
            <h2 className="text-xl font-black mb-6 text-ev-blue dark:text-white uppercase tracking-tighter">Compartilhe sua Arte</h2>
            {!currentUser ? (
              <div className="text-center p-6 bg-orange-50 dark:bg-orange-900/20 rounded-3xl">
                <i className="fas fa-lock text-3xl text-ev-brown mb-2"></i>
                <p className="text-sm text-gray-700 dark:text-gray-300">Você precisa estar logado para publicar conteúdo.</p>
                <a href="#/login" className="inline-block mt-4 bg-ev-blue text-white px-6 py-2 rounded-2xl text-sm font-bold">Login</a>
              </div>
            ) : (
              <form onSubmit={handlePublish} className="space-y-4">
                <textarea
                  placeholder="Descrição da obra..."
                  className="w-full p-4 rounded-3xl border-none bg-gray-50 dark:bg-gray-700 dark:text-white shadow-inner focus:ring-2 focus:ring-ev-blue resize-none"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <div className="relative border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-3xl p-8 text-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group">
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
                  />
                  <div className="text-gray-400">
                    <i className="fas fa-cloud-upload-alt text-4xl mb-2 group-hover:scale-110 transition-transform"></i>
                    <p className="text-xs font-bold uppercase tracking-widest">{mediaFile ? mediaFile.name : 'Selecione uma Imagem'}</p>
                  </div>
                </div>
                <button type="submit" className="w-full bg-ev-blue text-white py-4 rounded-3xl font-black shadow-xl hover:bg-blue-600 transition-all uppercase tracking-widest">
                  Publicar Obra
                </button>
              </form>
            )}
          </div>
        ) : (
          <div className="space-y-10">
            {artworks.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 p-12 rounded-4xl shadow-sm text-center text-gray-400 animate-fadeIn">
                <i className="fas fa-palette text-5xl mb-4 opacity-20"></i>
                <p className="text-lg font-bold uppercase tracking-widest">Nenhuma obra publicada ainda.</p>
                <button onClick={() => setView('publish')} className="mt-4 text-ev-blue font-bold underline">Seja o primeiro!</button>
              </div>
            ) : (
              artworks.map((art, idx) => (
                <div key={idx} className="bg-white dark:bg-gray-800 rounded-4xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-700 animate-fadeIn" style={{ animationDelay: `${idx * 0.1}s` }}>
                  <div className="p-5 flex items-center gap-3">
                    {art.userPhoto && (
                      <img src={art.userPhoto} className="w-10 h-10 rounded-full object-cover ring-2 ring-ev-blue/10" alt="" />
                    )}
                    <div>
                      <h4 className="font-bold text-gray-800 dark:text-gray-100 leading-tight">{art.userName}</h4>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest">{new Date(art.timestamp).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <div className="px-5 pb-4">
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{art.description}</p>
                  </div>

                  <div className="bg-black/5 dark:bg-black/20 aspect-video flex items-center justify-center">
                    {art.media && (
                      <img src={art.media} className="w-full h-full object-contain" alt="" />
                    )}
                  </div>

                  <div className="p-5 border-t border-gray-50 dark:border-gray-700">
                    <div className="flex items-center gap-6 mb-4">
                      <button 
                        onClick={() => handleLike(idx)}
                        disabled={currentUser ? art.likedBy.includes(currentUser.id) : false}
                        className={`flex items-center gap-2 transition-all ${
                          currentUser && art.likedBy.includes(currentUser.id) ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                        }`}
                      >
                        <i className={`${currentUser && art.likedBy.includes(currentUser.id) ? 'fas' : 'far'} fa-heart text-xl`}></i>
                        <span className="text-xs font-black">{art.likes} Adoros</span>
                      </button>
                      <button className="flex items-center gap-2 text-gray-400 hover:text-ev-blue transition-all">
                        <i className="far fa-comment text-xl"></i>
                        <span className="text-xs font-black">{art.comments.length} Comentários</span>
                      </button>
                    </div>

                    <div className="space-y-2 mb-4">
                      {art.comments.slice(-3).map((comment, cidx) => (
                        <p key={cidx} className="text-xs text-gray-600 dark:text-gray-400">
                          {comment}
                        </p>
                      ))}
                    </div>

                    {currentUser && (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Adicionar comentário..."
                          className="flex-1 bg-gray-50 dark:bg-gray-700 border-none rounded-full px-5 py-2.5 text-xs dark:text-white shadow-inner"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              addComment(idx, (e.target as HTMLInputElement).value);
                              (e.target as HTMLInputElement).value = '';
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ArtGallery;
