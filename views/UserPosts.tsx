
import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { storage } from '../services/storage';
import { subscribeToPosts, addPostFB, likePostFB, addCommentFB, deletePostFB, updatePostFB, updateCommentsFB } from '../services/firebaseService';
import { UserPost, User, Language, Comment } from '../types';
import { LanguageContext } from '../App';
import { t } from '../services/i18n';
import { compressImage } from '../services/imageCompression';

const UserPosts: React.FC = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<'feed' | 'publish'>('feed');
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [caption, setCaption] = useState('');
  const [mediaData, setMediaData] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingCaption, setEditingCaption] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  
  const { language } = useContext(LanguageContext);

  useEffect(() => {
    setCurrentUser(storage.getCurrentUser());
    
    // Subscribe to Firebase posts
    const unsubscribe = subscribeToPosts((firebasePosts) => {
      setPosts(firebasePosts);
    });

    return () => unsubscribe();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError('');
    if (file) {
      readFile(file);
    }
  };

  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      let data = event.target?.result as string;
      if (file.type.startsWith('image/')) {
        try {
          data = await compressImage(data);
        } catch (err) {
          console.error('Compression failed', err);
        }
      }
      setMediaData(data);
      setMediaType(file.type);
    };
    reader.readAsDataURL(file);
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) { navigate('/login'); return; }
    if (!mediaData) {
      setError(language === Language.PT ? 'Por favor, selecione uma imagem.' : 'Please select an image.');
      return;
    }

    setIsUploading(true);
    try {
      await addPostFB({
        userId: currentUser.id,
        userName: currentUser.name,
        userPhoto: currentUser.photo,
        caption: caption,
        media: mediaData,
        mediaType: mediaType,
        isImage: mediaType.startsWith('image/'),
        timestamp: new Date().toISOString(),
        likes: 0,
        likedBy: [],
        comments: []
      });
      
      setCaption(''); 
      setMediaData(null); 
      setIsUploading(false); 
      setView('feed');
    } catch (err) {
      setError('Erro ao publicar. Tente novamente.');
      setIsUploading(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!currentUser) { navigate('/login'); return; }
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const hasLiked = post.likedBy?.includes(currentUser.id) || false;
    await likePostFB(postId, currentUser.id, hasLiked);
  };

  const handleAddComment = async (postId: string) => {
    if (!currentUser) { navigate('/login'); return; }
    if (!commentText.trim()) return;
    
    const newComment: Comment = { 
      id: Math.random().toString(36).substr(2, 9),
      authorId: currentUser.id,
      authorName: currentUser.name, 
      authorPhoto: currentUser.photo, 
      text: commentText, 
      timestamp: new Date().toISOString() 
    };

    await addCommentFB(postId, newComment);
    setCommentText(''); 
    setActiveCommentId(null);
  };

  const handleDeletePost = async (postId: string) => {
    await deletePostFB(postId);
  };

  const handleUpdatePost = async (postId: string) => {
    await updatePostFB(postId, { caption: editingCaption });
    setEditingPostId(null);
    setEditingCaption('');
  };

  const handleUpdateComment = async (postId: string, commentId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    const updatedComments = post.comments.map(c => 
      c.id === commentId ? { ...c, text: editingCommentText } : c
    );
    
    await updateCommentsFB(postId, updatedComments);
    setEditingCommentId(null);
    setEditingCommentText('');
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    const updatedComments = post.comments.filter(c => c.id !== commentId);
    await updateCommentsFB(postId, updatedComments);
  };

  return (
    <Layout 
      title={t('posts', language)} 
      backTo="/" 
      actions={
        currentUser ? (
          <button 
            onClick={() => {
              setError('');
              setView(view === 'feed' ? 'publish' : 'feed');
            }} 
            className="bg-white text-ev-blue px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-sm hover:scale-105 transition-transform"
          >
            {view === 'feed' ? t('publish', language) : t('view', language)}
          </button>
        ) : (
          <button 
            onClick={() => navigate('/login')}
            className="bg-white/10 text-white px-4 py-1.5 rounded-full text-xs font-black uppercase border border-white/20 hover:bg-white/20 transition-all"
          >
            {t('login', language)} para Publicar
          </button>
        )
      }
    >
      {fullScreenImage && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 animate-fadeIn backdrop-blur-sm" onClick={() => setFullScreenImage(null)}>
          <button className="absolute top-6 right-6 text-white text-3xl hover:scale-125 transition-transform"><i className="fas fa-times"></i></button>
          <img src={fullScreenImage} className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl animate-zoomIn border-4 border-ev-brown" alt="" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      <div className="w-full pb-10">
        {view === 'publish' && currentUser ? (
          <div className="bg-white dark:bg-gray-800 p-8 rounded-4xl shadow-xl animate-fadeIn border border-gray-100 dark:border-gray-700">
            <h2 className="text-2xl font-black text-ev-blue dark:text-white uppercase mb-8 tracking-tighter">{t('publish', language)}</h2>
            <form onSubmit={handlePublish} className="space-y-6">
              {error && <p className="bg-red-50 text-red-500 p-4 rounded-3xl text-xs font-bold text-center border border-red-100 animate-bounce">{error}</p>}
              
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">Legenda da Publicação</label>
                <textarea className="w-full p-5 rounded-3xl bg-gray-50 dark:bg-gray-700 dark:text-white shadow-inner focus:ring-2 focus:ring-ev-blue resize-none border-none outline-none font-medium" rows={3} placeholder="O que está a acontecer no curso?" value={caption} onChange={(e) => setCaption(e.target.value)} />
              </div>

              <div className="relative border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-5xl p-12 text-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group">
                <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handleFileChange} />
                {mediaData ? (
                  <div className="space-y-4">
                    <img src={mediaData} className="max-h-80 mx-auto rounded-3xl shadow-lg border-2 border-ev-brown" alt="" />
                    <p className="text-[10px] font-black text-ev-blue uppercase tracking-widest">Toque para alterar o ficheiro</p>
                  </div>
                ) : (
                  <div className="text-gray-400">
                    <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-3xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <i className="fas fa-camera-retro text-4xl text-ev-blue"></i>
                    </div>
                    <p className="font-black uppercase tracking-widest text-xs">Adicionar Foto</p>
                  </div>
                )}
              </div>

              <button type="submit" disabled={!mediaData || isUploading} className={`w-full py-5 rounded-3xl font-black shadow-xl uppercase transition-all tracking-widest text-sm flex items-center justify-center gap-3 ${!mediaData || isUploading ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-ev-blue text-white hover:bg-blue-600 active:scale-95'}`}>
                {isUploading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <><i className="fas fa-paper-plane"></i> {t('publish', language)}</>
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-12">
            {posts.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 p-20 rounded-5xl shadow-sm text-center border border-dashed border-gray-200 dark:border-gray-700 animate-fadeIn">
                <div className="w-24 h-24 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-200">
                  <i className="fas fa-images text-5xl"></i>
                </div>
                <h3 className="text-xl font-black text-gray-400 uppercase tracking-widest">Feed de Notícias Vazio</h3>
                <p className="text-sm text-gray-400 mt-2 italic">Ainda não existem publicações. Seja o primeiro!</p>
                {currentUser ? (
                  <button onClick={() => setView('publish')} className="mt-8 bg-ev-blue text-white px-8 py-3 rounded-full font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-blue-600 transition-all active:scale-95">Publicar Agora</button>
                ) : (
                  <button onClick={() => navigate('/login')} className="mt-8 bg-ev-brown text-white px-8 py-3 rounded-full font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-[#5a331a] transition-all active:scale-95">Fazer Login</button>
                )}
              </div>
            ) : (
              posts.map((post, idx) => (
                <div key={post.id} className="bg-white dark:bg-gray-800 rounded-4xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden animate-fadeIn" style={{ animationDelay: `${idx * 0.1}s` }}>
                  <div className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {post.userPhoto && (
                        <img src={post.userPhoto} onClick={() => setFullScreenImage(post.userPhoto)} className="w-12 h-12 rounded-full object-cover border-2 border-ev-brown shadow-sm cursor-pointer hover:scale-105 transition-transform" alt="" />
                      )}
                      <div><h4 className="font-black text-gray-800 dark:text-white uppercase tracking-tight leading-tight">{post.userName}</h4><p className="text-[10px] text-gray-400 font-bold uppercase">{new Date(post.timestamp).toLocaleDateString()}</p></div>
                    </div>
                    {currentUser && post.userId === currentUser.id && (
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingPostId(post.id); setEditingCaption(post.caption); }} className="text-gray-400 hover:text-ev-blue transition-colors"><i className="fas fa-edit"></i></button>
                        <button onClick={() => handleDeletePost(post.id)} className="text-gray-400 hover:text-red-500 transition-colors"><i className="fas fa-trash"></i></button>
                      </div>
                    )}
                  </div>
                  {editingPostId === post.id ? (
                    <div className="px-6 pb-4 space-y-2">
                      <textarea className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-700 dark:text-white text-sm border-none focus:ring-2 focus:ring-ev-blue" rows={2} value={editingCaption} onChange={(e) => setEditingCaption(e.target.value)} />
                      <div className="flex gap-2">
                        <button onClick={() => handleUpdatePost(post.id)} className="bg-ev-blue text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">Salvar</button>
                        <button onClick={() => setEditingPostId(null)} className="bg-gray-200 text-gray-500 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    post.caption && <div className="px-6 pb-4"><p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-medium">{post.caption}</p></div>
                  )}
                  <div className="bg-black aspect-video flex items-center justify-center relative">
                    {post.media && (
                      <img src={post.media} onClick={() => setFullScreenImage(post.media)} className="w-full h-full object-contain cursor-pointer hover:opacity-90 transition-opacity" alt="" />
                    )}
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex gap-8 border-b border-gray-50 dark:border-gray-700 pb-4">
                      <button onClick={() => handleLike(post.id)} className={`flex items-center gap-2 text-xs font-black uppercase transition-colors ${currentUser && post.likedBy?.includes(currentUser.id) ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}><i className={`${currentUser && post.likedBy?.includes(currentUser.id) ? 'fas' : 'far'} fa-heart text-xl`}></i> {(post.likes || 0)} Adoros</button>
                      <button onClick={() => setActiveCommentId(activeCommentId === post.id ? null : post.id)} className="flex items-center gap-2 text-gray-400 text-xs font-black uppercase hover:text-ev-blue transition-colors"><i className="far fa-comment text-xl"></i> {(post.comments?.length || 0)} Comentários</button>
                    </div>
                    {post.comments && post.comments.length > 0 && (
                      <div className="space-y-4 max-h-60 overflow-y-auto no-scrollbar pr-2">
                        {post.comments.map((comment, cidx) => (
                          <div key={cidx} className="flex gap-3 animate-fadeIn">
                            {comment.authorPhoto && (
                              <img src={comment.authorPhoto} onClick={() => setFullScreenImage(comment.authorPhoto)} className="w-9 h-9 rounded-full object-cover border-2 border-ev-brown flex-shrink-0 cursor-pointer" alt="" />
                            )}
                            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-3xl flex-1 shadow-inner relative group/comment">
                              <div className="flex justify-between items-start mb-1">
                                <p className="text-[9px] font-black text-ev-blue uppercase tracking-tighter">{comment.authorName}</p>
                                {currentUser && comment.authorId === currentUser.id && (
                                  <div className="flex gap-2 opacity-0 group-hover/comment:opacity-100 transition-opacity">
                                    <button onClick={() => { setEditingCommentId(comment.id); setEditingCommentText(comment.text); }} className="text-[10px] text-gray-400 hover:text-ev-blue"><i className="fas fa-edit"></i></button>
                                    <button onClick={() => handleDeleteComment(post.id, comment.id)} className="text-[10px] text-gray-400 hover:text-red-500"><i className="fas fa-trash"></i></button>
                                  </div>
                                )}
                              </div>
                              {editingCommentId === comment.id ? (
                                <div className="space-y-2">
                                  <textarea className="w-full p-3 rounded-2xl bg-white dark:bg-gray-600 dark:text-white text-xs border-none focus:ring-2 focus:ring-ev-blue" rows={2} value={editingCommentText} onChange={(e) => setEditingCommentText(e.target.value)} />
                                  <div className="flex gap-2">
                                    <button onClick={() => handleUpdateComment(post.id, comment.id)} className="bg-ev-blue text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Salvar</button>
                                    <button onClick={() => setEditingCommentId(null)} className="bg-gray-200 text-gray-500 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Cancelar</button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-xs text-gray-600 dark:text-gray-200 leading-relaxed">{comment.text}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-3 pt-2">
                      <input 
                        type="text" 
                        placeholder={currentUser ? "Dê a sua opinião..." : "Faça login para interagir"} 
                        readOnly={!currentUser} 
                        onClick={() => !currentUser && navigate('/login')} 
                        className="flex-1 bg-gray-50 dark:bg-gray-700 border-none rounded-full px-6 py-4 text-xs dark:text-white shadow-inner focus:ring-2 focus:ring-ev-blue" 
                        value={activeCommentId === post.id ? commentText : ''} 
                        onChange={(e) => { if (currentUser) { setActiveCommentId(post.id); setCommentText(e.target.value); } }} 
                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)} 
                      />
                      <button onClick={() => handleAddComment(post.id)} disabled={!commentText.trim()} className={`bg-ev-blue text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90 ${!commentText.trim() ? 'opacity-50' : 'hover:bg-blue-600'}`}>
                        <i className="fas fa-paper-plane text-xs"></i>
                      </button>
                    </div>
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

export default UserPosts;
