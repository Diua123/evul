
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { storage } from '../services/storage';
import { subscribeToAllMyMessages, sendMessageFB, updateMessageFB, deleteMessageFB, subscribeToUsers } from '../services/firebaseService';
import { notificationService } from '../services/notifications';
import { User, Message } from '../types';
import { compressImage } from '../services/imageCompression';

const Chat: React.FC = () => {
  const navigate = useNavigate();
  const [selectedUser, setSelectedUser] = useState<User | 'general' | null>(null);
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [showMediaMenu, setShowMediaMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingMessageText, setEditingMessageText] = useState('');
  
  const [usersWithStatus, setUsersWithStatus] = useState<User[]>([]);
  
  const currentUser = storage.getCurrentUser();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToUsers((allUsers) => {
      setUsersWithStatus(allUsers);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = subscribeToAllMyMessages(currentUser.id, (msgs) => {
      setAllMessages(msgs);
    });
    return () => unsubscribe();
  }, [currentUser?.id]);

  const isUserTrulyOnline = (user: User) => {
    if (!user.isOnline) return false;
    if (!user.lastSeen) return false;
    const now = Date.now();
    return (now - user.lastSeen) < 300000;
  };

  const onlineCount = useMemo(() => {
    return usersWithStatus.filter(u => isUserTrulyOnline(u)).length;
  }, [usersWithStatus]);

  const formatLastSeen = (timestamp?: number) => {
    if (!timestamp) return 'há muito tempo';
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'há menos de um minuto';
    if (diff < 3600000) {
      const mins = Math.floor(diff / 60000);
      return `há ${mins} min`;
    }
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `há ${hours} h`;
    }
    const days = Math.floor(diff / 86400000);
    return `há ${days} d`;
  };

  const filteredMessages = useMemo(() => {
    if (!selectedUser || !currentUser) return [];
    if (selectedUser === 'general') {
      return allMessages.filter(m => m.to === 'general');
    }
    return allMessages.filter(m => 
      (m.to === currentUser.id && m.authorId === selectedUser.id) || 
      (m.to === selectedUser.id && m.authorId === currentUser.id)
    ).sort((a, b) => a.time - b.time);
  }, [allMessages, selectedUser, currentUser]);

  useEffect(() => {
    if (selectedUser) {
      const convId = selectedUser === 'general' ? 'general' : selectedUser.id;
      storage.setLastViewedConversation(convId);
      storage.setLastViewedChat();
    }
  }, [selectedUser, filteredMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [filteredMessages, selectedUser]);

  useEffect(() => {
    const handlePopState = () => {
      if (selectedUser) {
        setSelectedUser(null);
        window.history.pushState(null, '', window.location.href);
      }
    };
    if (selectedUser) {
      window.history.pushState(null, '', window.location.href);
      window.addEventListener('popstate', handlePopState);
    }
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedUser]);

  const saveMessage = async (msg: Partial<Message>) => {
    if (!selectedUser || !currentUser) return;
    const newMessage: Message = {
      authorId: currentUser.id,
      text: msg.text || '',
      time: Date.now(),
      to: typeof selectedUser === 'string' ? 'general' : selectedUser.id,
      media: msg.media || null,
      mediaType: msg.mediaType || null,
      fileName: msg.fileName || null
    };
    
    await sendMessageFB(newMessage);
    const convId = typeof selectedUser === 'string' ? 'general' : selectedUser.id;
    storage.setLastViewedConversation(convId);
    storage.setLastViewedChat();
  };

  const handleSend = () => {
    if (!inputText.trim()) return;
    saveMessage({ text: inputText });
    setInputText('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'audio') => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
    setShowMediaMenu(false);
  };

  const processFile = (file: File) => {
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
      saveMessage({ media: data, mediaType: file.type, fileName: file.name });
    };
    reader.readAsDataURL(file);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = (e) => saveMessage({ media: e.target?.result as string, mediaType: 'audio/webm', fileName: `record_${Date.now()}.webm` });
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } catch { alert('Não foi possível acessar o microfone.'); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const downloadMedia = (media: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = media; link.download = fileName;
    document.body.appendChild(link); link.click();
    document.body.removeChild(link);
  };

  const handleDeleteMessage = async (messageId: string) => {
    await deleteMessageFB(messageId);
  };

  const handleUpdateMessage = async (messageId: string) => {
    if (!editingMessageText.trim()) return;
    await updateMessageFB(messageId, editingMessageText);
    setEditingMessageId(null);
    setEditingMessageText('');
  };

  const getAuthorName = (authorId: string) => {
      if (authorId === currentUser?.id) return 'Você';
      if (authorId === 'bot_general') return 'Estudante';
      
      const user = usersWithStatus.find(u => u.id === authorId);
      if (user) {
        if (user.role === 'chefe') return `Chefe de Turma (${user.anoFrequencia}º Ano)`;
        return user.name;
      }
      return 'Usuário';
  };
  
  const getAuthorPhoto = (authorId: string) => {
      if (authorId === 'bot_general') return 'https://picsum.photos/seed/student/200';
      return usersWithStatus.find(u => u.id === authorId)?.photo || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgZmlsbD0iI2NjYyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjQwIiBmaWxsPSIjZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+8J+RpDwvdGV4dD48L3N2Zz4=';
  }

  // Calculate unread counts and sort users
  const generalChatMessages = allMessages.filter(m => m.to === 'general');
  const lastViewedGeneral = storage.getLastViewedConversation('general');
  const unreadGeneralCount = generalChatMessages.filter(m => m.time > lastViewedGeneral && m.authorId !== currentUser?.id).length;

  const sortedUsers = useMemo(() => {
    if (!currentUser) return [];
    const usersWithStats = usersWithStatus.filter(u => u.id !== currentUser.id).map(user => {
      const userMessages = allMessages.filter(m => 
        (m.to === currentUser.id && m.authorId === user.id) || 
        (m.to === user.id && m.authorId === currentUser.id)
      );
      const latestMessageTime = userMessages.length > 0 ? Math.max(...userMessages.map(m => m.time)) : 0;
      const lastViewed = storage.getLastViewedConversation(user.id);
      const unreadCount = userMessages.filter(m => m.time > lastViewed && m.authorId === user.id).length;
      
      return { ...user, latestMessageTime, unreadCount };
    });

    return usersWithStats.sort((a, b) => b.latestMessageTime - a.latestMessageTime);
  }, [usersWithStatus, allMessages, currentUser]);

  // Renderização da Tela de Chat (Full Screen)
  if (selectedUser) {
    const user = selectedUser === 'general' ? {
      name: 'Chat Geral',
      photo: 'https://picsum.photos/seed/general/200',
      isOnline: true,
      lastSeen: ''
    } : selectedUser;

    return (
      <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 animate-fadeIn relative overflow-hidden">
        {fullScreenImage && (
          <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 animate-fadeIn backdrop-blur-sm" onClick={() => setFullScreenImage(null)}>
            <button className="absolute top-6 right-6 text-white text-3xl hover:scale-125 transition-transform"><i className="fas fa-times"></i></button>
            <img src={fullScreenImage} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-zoomIn" alt="Full screen" onClick={(e) => e.stopPropagation()} />
          </div>
        )}

        {/* Cabeçalho Fixo Full Screen */}
        <header className="bg-ev-blue text-white px-3 py-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] flex items-center gap-3 shadow-md z-20 shrink-0">
          <button 
            onClick={() => setSelectedUser(null)} 
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
          >
            <i className="fas fa-arrow-left text-lg"></i>
          </button>
          
          <div className="flex items-center gap-3 flex-1 overflow-hidden cursor-pointer" onClick={() => setFullScreenImage(user.photo)}>
            <div className="relative shrink-0">
              {user.photo && (
                <img 
                  src={user.photo} 
                  className="w-10 h-10 rounded-full object-cover border-2 border-white/20" 
                  alt="" 
                />
              )}
              {(selectedUser === 'general' || user.isOnline) && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-ev-blue rounded-full"></div>}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base leading-tight truncate">
                  {selectedUser !== 'general' && selectedUser.role === 'chefe' 
                    ? `Chefe de Turma (${selectedUser.anoFrequencia}º Ano)` 
                    : user.name}
              </h3>
              <p className="text-[10px] text-ev-text-light font-medium uppercase tracking-widest truncate">
                {selectedUser === 'general' ? `${onlineCount} ${onlineCount === 1 ? 'usuário' : 'usuários'} online` : (isUserTrulyOnline(user) ? 'Online agora' : `Esteve online ${formatLastSeen(user.lastSeen)}`)}
              </p>
            </div>
          </div>
        </header>

        {/* Área de Mensagens Expandida */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50 dark:bg-black/20" style={{backgroundImage: "url('https://www.transparenttextures.com/patterns/subtle-white-feathers.png')", backgroundBlendMode: 'multiply'}}>
          {filteredMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-40">
              <i className="fas fa-comments text-7xl mb-4 text-gray-300 dark:text-gray-600"></i>
              <p className="font-black uppercase tracking-widest text-xs text-gray-400">Inicie uma conversa</p>
            </div>
          ) : (
            filteredMessages.map((msg, idx) => {
              const isMine = msg.authorId === currentUser?.id;
              return (
                <div key={idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                  <div className={`flex gap-2 max-w-[85%] sm:max-w-[70%] ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                    {!isMine && getAuthorPhoto(msg.authorId) && (
                      <img src={getAuthorPhoto(msg.authorId)} onClick={() => setFullScreenImage(getAuthorPhoto(msg.authorId))} className="w-8 h-8 rounded-full flex-shrink-0 mt-1 shadow-sm cursor-pointer hover:scale-110 transition-transform border border-gray-200 dark:border-gray-700" alt="" />
                    )}
                    {!isMine && !getAuthorPhoto(msg.authorId) && (
                      <div className="w-8 h-8 rounded-full flex-shrink-0 mt-1 bg-gray-200 dark:bg-gray-700 flex items-center justify-center"><i className="fas fa-user text-xs text-gray-400"></i></div>
                    )}
                    <div className="flex flex-col">
                      {(selectedUser === 'general' || msg.authorId === 'bot_general') && !isMine && <p className="text-[10px] font-black text-ev-blue ml-2 mb-0.5 uppercase tracking-tighter">{getAuthorName(msg.authorId)}</p>}
                      <div className={`p-3 rounded-2xl text-sm shadow-sm relative group ${isMine ? 'bg-ev-blue text-white rounded-tr-none' : 'bg-white dark:bg-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-100 dark:border-gray-700'}`}>
                        {isMine && (
                          <div className="absolute -top-6 right-0 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-gray-800 p-1 rounded-lg shadow-md border border-gray-100 dark:border-gray-700 z-10">
                            <button onClick={() => { setEditingMessageId(msg.id!); setEditingMessageText(msg.text); }} className="text-[10px] text-gray-400 hover:text-ev-blue"><i className="fas fa-edit"></i></button>
                            <button onClick={() => handleDeleteMessage(msg.id!)} className="text-[10px] text-gray-400 hover:text-red-500"><i className="fas fa-trash"></i></button>
                          </div>
                        )}
                        {editingMessageId === msg.id ? (
                          <div className="space-y-2 min-w-[150px]">
                            <textarea className="w-full p-2 rounded-xl bg-white/10 text-white text-xs border-none focus:ring-1 focus:ring-white outline-none" rows={2} value={editingMessageText} onChange={(e) => setEditingMessageText(e.target.value)} />
                            <div className="flex gap-2">
                              <button onClick={() => handleUpdateMessage(msg.id!)} className="bg-white text-ev-blue px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Salvar</button>
                              <button onClick={() => setEditingMessageId(null)} className="bg-white/20 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Cancelar</button>
                            </div>
                          </div>
                        ) : (
                          msg.text && <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        )}
                        {msg.media && (
                          <div className="mt-2 space-y-2">
                            {msg.mediaType?.startsWith('image/') ? (
                              msg.media && <img src={msg.media} onClick={() => setFullScreenImage(msg.media!)} className="max-w-full rounded-lg shadow-md cursor-pointer hover:opacity-95" alt="" />
                            ) : msg.mediaType?.startsWith('audio/') ? (
                              msg.media && <audio src={msg.media} controls className="max-w-full h-10" />
                            ) : null}
                            <button onClick={() => downloadMedia(msg.media!, msg.fileName || 'anexo')} className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-widest py-1.5 px-4 rounded-full transition-all mt-1 ${isMine ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-ev-blue/10 hover:bg-ev-blue text-ev-blue hover:text-white'}`}><i className="fas fa-download"></i> Baixar</button>
                          </div>
                        )}
                        <p className={`text-[9px] mt-1 text-right font-black uppercase tracking-widest ${isMine ? 'text-white/70' : 'text-gray-400'}`}>{new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Menu de Mídia Flutuante */}
        {showMediaMenu && (
          <div className="absolute bottom-20 left-4 right-4 bg-white dark:bg-gray-800 p-5 rounded-4xl shadow-2xl border border-gray-100 dark:border-gray-700 grid grid-cols-2 gap-4 animate-slideUp z-30">
            <label className="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-gray-700 rounded-3xl cursor-pointer hover:bg-ev-blue hover:text-white transition-all shadow-sm"><i className="fas fa-image text-2xl"></i><span className="text-[10px] font-black uppercase tracking-widest">Galeria</span><input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'image')} /></label>
            <label className="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-gray-700 rounded-3xl cursor-pointer hover:bg-ev-blue hover:text-white transition-all shadow-sm"><i className="fas fa-file-audio text-2xl"></i><span className="text-[10px] font-black uppercase tracking-widest">Áudio</span><input type="file" accept="audio/*" className="hidden" onChange={(e) => handleFileUpload(e, 'audio')} /></label>
            <button onClick={startRecording} className="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-gray-700 rounded-3xl hover:bg-red-500 hover:text-white transition-all shadow-sm"><i className="fas fa-microphone text-2xl"></i><span className="text-[10px] font-black uppercase tracking-widest">Gravar Voz</span></button>
          </div>
        )}

        {/* Área de Input Fixa */}
        <div className="p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 z-20">
          {isRecording ? (
            <div className="flex items-center justify-between gap-4 bg-red-50 dark:bg-red-900/20 p-3 rounded-full border border-red-100 animate-fadeIn"><div className="flex items-center gap-3 px-2"><div className="w-3 h-3 bg-red-500 rounded-full animate-ping"></div><span className="text-xs font-black text-red-600 uppercase tracking-widest">Gravando: {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}</span></div><button onClick={stopRecording} className="bg-red-500 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-md"><i className="fas fa-stop"></i></button></div>
          ) : (
            <div className="flex gap-2 items-center">
              <button onClick={() => setShowMediaMenu(!showMediaMenu)} className={`w-11 h-11 flex items-center justify-center rounded-full transition-all shadow-sm ${showMediaMenu ? 'bg-ev-brown text-white rotate-45' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300'}`}><i className="fas fa-plus"></i></button>
              <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Mensagem" className="flex-1 bg-gray-100 dark:bg-gray-700 border-none rounded-full px-5 py-3 text-sm focus:ring-2 focus:ring-ev-blue shadow-inner dark:text-white font-medium" />
              <button onClick={handleSend} disabled={!inputText.trim()} className={`w-11 h-11 rounded-full flex items-center justify-center shadow-md transition-all ${!inputText.trim() ? 'bg-gray-200 text-gray-400 dark:bg-gray-700' : 'bg-ev-blue text-white hover:bg-blue-600 active:scale-90'}`}><i className="fas fa-paper-plane"></i></button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Renderização da Lista de Contatos (Layout Padrão)
  return (
    <Layout title="Mensagens" backTo="/" showBackButton={true} onBack={() => navigate('/')}>
      {fullScreenImage && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 animate-fadeIn" onClick={() => setFullScreenImage(null)}>
          <button className="absolute top-6 right-6 text-white text-2xl hover:scale-110 transition-transform"><i className="fas fa-times"></i></button>
          <img src={fullScreenImage} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-zoomIn" alt="Full screen" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      <div className="space-y-4">
        {currentUser?.role !== 'docente' && (
          <div onClick={() => setSelectedUser('general')} className="flex items-center gap-4 bg-white dark:bg-gray-800 p-5 rounded-4xl shadow-sm border border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all hover:scale-[1.02] animate-fadeIn">
            <div className="relative"><div className="w-14 h-14 bg-ev-blue rounded-full flex items-center justify-center text-white shadow-inner cursor-pointer border-2 border-ev-brown" onClick={(e) => { e.stopPropagation(); setFullScreenImage('https://picsum.photos/seed/general/200'); }}><i className="fas fa-users text-2xl"></i></div><div className="absolute bottom-0.5 right-0.5 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full shadow-sm animate-pulse"></div></div>
            <div className="flex-1">
              <h3 className="font-black dark:text-white uppercase tracking-tight">Chat Geral</h3>
              <p className="text-[10px] text-green-500 font-black uppercase tracking-[0.2em] mt-0.5">{onlineCount} {onlineCount === 1 ? 'usuário' : 'usuários'} online</p>
            </div>
            {unreadGeneralCount > 0 && (
              <div className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold shadow-md">
                {unreadGeneralCount > 99 ? '99+' : unreadGeneralCount}
              </div>
            )}
          </div>
        )}
        <div className="mt-10 mb-4 ml-4"><h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Meus Contatos</h4></div>
        <div className="space-y-3 pb-20">
          {sortedUsers.map((user, idx) => (
            <div key={user.id} onClick={() => setSelectedUser(user)} className="flex items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-4xl shadow-sm border border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-[1.01] animate-fadeIn" style={{ animationDelay: `${idx * 0.05}s` }}>
              <div className="relative">
                {user.photo && (
                  <img src={user.photo} onClick={(e) => { e.stopPropagation(); setFullScreenImage(user.photo); }} className="w-14 h-14 rounded-full object-cover border-2 border-ev-brown shadow-sm cursor-pointer hover:scale-105 transition-transform" alt="" />
                )}
                {isUserTrulyOnline(user) && <div className="absolute bottom-0.5 right-0.5 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full shadow-sm"></div>}
              </div>
              <div className="flex-1">
                <h3 className="font-black dark:text-white uppercase tracking-tight leading-tight">
                  {user.role === 'chefe' ? `Chefe (${user.anoFrequencia}º Ano)` : user.name}
                </h3>
                <p className={`text-[10px] font-black uppercase tracking-widest mt-0.5 ${isUserTrulyOnline(user) ? 'text-green-500' : 'text-gray-400'}`}>{isUserTrulyOnline(user) ? 'Online agora' : 'Esteve online ' + formatLastSeen(user.lastSeen)}</p>
              </div>
              {user.unreadCount > 0 ? (
                <div className="w-6 h-6 rounded-full bg-ev-blue text-white flex items-center justify-center text-xs font-bold shadow-md">
                  {user.unreadCount > 99 ? '99+' : user.unreadCount}
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-gray-300"><i className="fas fa-chevron-right text-xs"></i></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Chat;
