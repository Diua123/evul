
import { User, Message, Publication, Artwork, Theme, Language, LibraryItem, UserPost } from '../types';

const USERS_KEY = 'ev_ul_users';
const CURRENT_USER_ID_KEY = 'ev_ul_current_id';
const CACHED_USER_KEY = 'ev_ul_cached_user';
const MESSAGES_KEY = 'ev_ul_messages';
const PUBLICATIONS_KEY = 'ev_ul_publications';
const ARTWORKS_KEY = 'ev_ul_artworks';
const POSTS_KEY = 'ev_ul_user_posts';
const LIBRARY_ITEMS_KEY = 'ev_ul_library_items';
const THEME_KEY = 'ev_ul_theme';
const LANG_KEY = 'ev_ul_lang';
const LAST_VIEWED_CHAT = 'ev_ul_last_chat_view';
const LAST_VIEWED_PUBS = 'ev_ul_last_pubs_view';

export const storage = {
  getUsers: (): User[] => JSON.parse(localStorage.getItem(USERS_KEY) || '[]'),
  setUsers: (users: User[]) => localStorage.setItem(USERS_KEY, JSON.stringify(users)),
  
  getCurrentUserId: (): string | null => localStorage.getItem(CURRENT_USER_ID_KEY),
  setCurrentUserId: (id: string | null) => {
    if (id) localStorage.setItem(CURRENT_USER_ID_KEY, id);
    else localStorage.removeItem(CURRENT_USER_ID_KEY);
  },
  
  getMessages: (): Message[] => JSON.parse(localStorage.getItem(MESSAGES_KEY) || '[]'),
  setMessages: (messages: Message[]) => localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages)),
  
  getPublications: (): Publication[] => JSON.parse(localStorage.getItem(PUBLICATIONS_KEY) || '[]'),
  setPublications: (pubs: Publication[]) => localStorage.setItem(PUBLICATIONS_KEY, JSON.stringify(pubs)),
  
  getArtworks: (): Artwork[] => JSON.parse(localStorage.getItem(ARTWORKS_KEY) || '[]'),
  setArtworks: (art: Artwork[]) => localStorage.setItem(ARTWORKS_KEY, JSON.stringify(art)),

  getPosts: (): UserPost[] => JSON.parse(localStorage.getItem(POSTS_KEY) || '[]'),
  setPosts: (posts: UserPost[]) => localStorage.setItem(POSTS_KEY, JSON.stringify(posts)),

  getLibraryItems: (): LibraryItem[] => JSON.parse(localStorage.getItem(LIBRARY_ITEMS_KEY) || '[]'),
  setLibraryItems: (items: LibraryItem[]) => localStorage.setItem(LIBRARY_ITEMS_KEY, JSON.stringify(items)),
  
  getTheme: (): Theme => (localStorage.getItem(THEME_KEY) as Theme) || Theme.LIGHT,
  setTheme: (theme: Theme) => localStorage.setItem(THEME_KEY, theme),

  getLastViewedChat: (): number => parseInt(localStorage.getItem(LAST_VIEWED_CHAT) || '0'),
  setLastViewedChat: () => localStorage.setItem(LAST_VIEWED_CHAT, Date.now().toString()),

  getLastViewedConversation: (conversationId: string): number => {
    const data = JSON.parse(localStorage.getItem('ev_ul_last_viewed_convs') || '{}');
    return data[conversationId] || 0;
  },
  setLastViewedConversation: (conversationId: string) => {
    const data = JSON.parse(localStorage.getItem('ev_ul_last_viewed_convs') || '{}');
    data[conversationId] = Date.now();
    localStorage.setItem('ev_ul_last_viewed_convs', JSON.stringify(data));
  },

  getLastViewedPubs: (): number => parseInt(localStorage.getItem(LAST_VIEWED_PUBS) || '0'),
  setLastViewedPubs: () => localStorage.setItem(LAST_VIEWED_PUBS, Date.now().toString()),
  
  getCurrentUser: (): User | null => {
    const cached = localStorage.getItem(CACHED_USER_KEY);
    if (cached) return JSON.parse(cached);
    return null;
  },

  setCachedUser: (user: User | null) => {
    if (user) localStorage.setItem(CACHED_USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(CACHED_USER_KEY);
  },

  logout: () => {
    storage.setCurrentUserId(null);
    storage.setCachedUser(null);
  }
};
