
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  arrayUnion, 
  arrayRemove,
  Timestamp,
  getDocs,
  where,
  increment
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import { UserPost, Comment, Publication, Message, User, LibraryItem } from "../types";

// --- USERS ---
export const getUsersFB = async (): Promise<User[]> => {
  if (!isFirebaseConfigured) return [];
  const snapshot = await getDocs(collection(db, "users"));
  return snapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id
  })) as User[];
};

export const getUserFB = async (userId: string): Promise<User | null> => {
  if (!isFirebaseConfigured) return null;
  const userDoc = await getDocs(query(collection(db, "users"), where("id", "==", userId)));
  if (userDoc.empty) {
    // Try by document ID if the custom ID field isn't found
    const docSnap = await getDocs(query(collection(db, "users"), where("__name__", "==", userId)));
    if (docSnap.empty) return null;
    return { ...docSnap.docs[0].data(), id: docSnap.docs[0].id } as User;
  }
  return { ...userDoc.docs[0].data(), id: userDoc.docs[0].id } as User;
};

export const createUserFB = async (user: User) => {
  if (!isFirebaseConfigured) throw new Error("Firebase not configured");
  return await addDoc(collection(db, "users"), user);
};

export const updateUserFB = async (docId: string, data: Partial<User>) => {
  if (!isFirebaseConfigured) throw new Error("Firebase not configured");
  const userRef = doc(db, "users", docId);
  return await updateDoc(userRef, data);
};

export const updateUserStatusFB = async (userId: string, isOnline: boolean) => {
  if (!isFirebaseConfigured) return;
  try {
    // Primeiro tentamos encontrar o documento pelo campo 'id' customizado
    const q = query(collection(db, "users"), where("id", "==", userId));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const userDoc = snapshot.docs[0];
      await updateDoc(doc(db, "users", userDoc.id), {
        isOnline,
        lastSeen: Date.now()
      });
    } else {
      // Se não encontrar pelo 'id' customizado, tenta pelo ID do documento
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        isOnline,
        lastSeen: Date.now()
      });
    }
  } catch (err) {
    console.error("Erro ao atualizar status online:", err);
  }
};

export const subscribeToUsers = (callback: (users: User[]) => void) => {
  if (!isFirebaseConfigured) {
    callback([]);
    return () => {};
  }
  const q = query(collection(db, "users"));
  return onSnapshot(q, (snapshot) => {
    const users = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as User[];
    callback(users);
  });
};

// --- POSTS (Feed) ---
export const subscribeToPosts = (callback: (posts: UserPost[]) => void) => {
  if (!isFirebaseConfigured) {
    callback([]);
    return () => {};
  }
  // Remove orderBy to avoid index requirement, sort in memory
  const q = query(collection(db, "posts"));
  return onSnapshot(q, (snapshot) => {
    const posts = snapshot.docs
      .map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as UserPost[];
    
    // Sort by timestamp descending
    posts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    callback(posts);
  });
};

export const addPostFB = async (post: Omit<UserPost, 'id'>) => {
  if (!isFirebaseConfigured) throw new Error("Firebase not configured");
  return await addDoc(collection(db, "posts"), {
    ...post,
    timestamp: new Date().toISOString()
  });
};

export const likePostFB = async (postId: string, userId: string, isLiked: boolean) => {
  if (!isFirebaseConfigured) return;
  const postRef = doc(db, "posts", postId);
  await updateDoc(postRef, {
    likedBy: isLiked ? arrayRemove(userId) : arrayUnion(userId),
    likes: isLiked ? increment(-1) : increment(1)
  });
};

// Helper to get current likes count (simplified)
const getDocCount = async (postId: string, field: string) => {
  return 0; 
};

export const addCommentFB = async (postId: string, comment: Comment) => {
  if (!isFirebaseConfigured) return;
  const postRef = doc(db, "posts", postId);
  await updateDoc(postRef, {
    comments: arrayUnion(comment)
  });
};

export const deletePostFB = async (postId: string) => {
  if (!isFirebaseConfigured) return;
  await deleteDoc(doc(db, "posts", postId));
};

export const updatePostFB = async (postId: string, data: Partial<UserPost>) => {
  if (!isFirebaseConfigured) return;
  const postRef = doc(db, "posts", postId);
  await updateDoc(postRef, data);
};

export const updateCommentsFB = async (postId: string, comments: Comment[]) => {
  if (!isFirebaseConfigured) return;
  const postRef = doc(db, "posts", postId);
  await updateDoc(postRef, { comments });
};

// --- PUBLICATIONS (Communities) ---
export const subscribeToPublications = (callback: (pubs: Publication[]) => void) => {
  if (!isFirebaseConfigured) {
    callback([]);
    return () => {};
  }
  // Remove orderBy to avoid index requirement, sort in memory
  const q = query(collection(db, "publications"));
  return onSnapshot(q, (snapshot) => {
    const pubs = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as any[];
    
    // Sort by date descending
    pubs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    callback(pubs);
  });
};

export const addPublicationFB = async (pub: Omit<Publication, 'id'>) => {
  if (!isFirebaseConfigured) throw new Error("Firebase not configured");
  return await addDoc(collection(db, "publications"), {
    ...pub,
    date: new Date().toISOString()
  });
};

export const deletePublicationFB = async (pubId: string) => {
  if (!isFirebaseConfigured) return;
  await deleteDoc(doc(db, "publications", pubId));
};

// --- CHAT ---
export const subscribeToAllMyMessages = (userId: string, callback: (messages: Message[]) => void) => {
  if (!isFirebaseConfigured) {
    callback([]);
    return () => {};
  }
  const q = query(collection(db, "messages"));
  
  return onSnapshot(q, (snapshot) => {
    const msgs = snapshot.docs
      .map(doc => ({ ...doc.data(), id: doc.id } as Message))
      .filter(m => m.to === userId || m.authorId === userId || m.to === 'general')
      .sort((a, b) => a.time - b.time);
    callback(msgs);
  });
};

export const subscribeToMessages = (userId1: string, userId2: string, callback: (messages: Message[]) => void) => {
  if (!isFirebaseConfigured) {
    callback([]);
    return () => {};
  }
  // Remove orderBy to avoid index requirement, sort in memory
  const q = query(collection(db, "messages"));
  
  return onSnapshot(q, (snapshot) => {
    const msgs = snapshot.docs
      .map(doc => ({ ...doc.data(), id: doc.id } as Message))
      .filter(m => 
        (m.to === userId1 && m.authorId === userId2) || 
        (m.to === userId2 && m.authorId === userId1) ||
        (m.to === 'general' && (userId1 === 'general' || userId2 === 'general'))
      )
      .sort((a, b) => a.time - b.time);
    callback(msgs);
  });
};

export const subscribeToGeneralChat = (callback: (messages: Message[]) => void) => {
  if (!isFirebaseConfigured) {
    callback([]);
    return () => {};
  }
  // Remove orderBy to avoid index requirement, sort in memory
  const q = query(collection(db, "messages"), where("to", "==", "general"));
  return onSnapshot(q, (snapshot) => {
    const msgs = snapshot.docs
      .map(doc => ({ ...doc.data(), id: doc.id } as Message))
      .sort((a, b) => a.time - b.time);
    callback(msgs);
  });
};

export const sendMessageFB = async (message: Message) => {
  if (!isFirebaseConfigured) throw new Error("Firebase not configured");
  const { id, ...msgData } = message;
  return await addDoc(collection(db, "messages"), {
    ...msgData,
    time: Date.now()
  });
};

export const updateMessageFB = async (messageId: string, text: string) => {
  if (!isFirebaseConfigured) return;
  const msgRef = doc(db, "messages", messageId);
  await updateDoc(msgRef, { text });
};

export const deleteMessageFB = async (messageId: string) => {
  if (!isFirebaseConfigured) return;
  await deleteDoc(doc(db, "messages", messageId));
};

// --- LIBRARY ---
export const subscribeToLibrary = (category: string, callback: (items: LibraryItem[]) => void) => {
  if (!isFirebaseConfigured) {
    callback([]);
    return () => {};
  }
  const q = query(collection(db, "library"), where("category", "==", category));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as LibraryItem[];
    
    // Ordenar por data decrescente
    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    callback(items);
  });
};

export const addLibraryItemFB = async (item: Omit<LibraryItem, 'id'>) => {
  if (!isFirebaseConfigured) throw new Error("Firebase not configured");
  return await addDoc(collection(db, "library"), {
    ...item,
    date: new Date().toISOString().split('T')[0]
  });
};

export const deleteLibraryItemFB = async (itemId: string) => {
  if (!isFirebaseConfigured) return;
  await deleteDoc(doc(db, "library", itemId));
};
