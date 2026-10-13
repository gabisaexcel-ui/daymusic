import React, { createContext, useContext, useState, useEffect } from 'react';
import { Track, UserPlaylist } from '../types/ytmusic';

interface LibraryContextType {
  favorites: Track[];
  playlists: UserPlaylist[];
  history: Track[];
  toggleFavorite: (track: Track) => void;
  isFavorite: (trackId: string) => boolean;
  createPlaylist: (name: string, description?: string) => UserPlaylist;
  deletePlaylist: (playlistId: string) => void;
  addTrackToPlaylist: (playlistId: string, track: Track) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  addToHistory: (track: Track) => void;
  clearHistory: () => void;
  exportBackup: () => void;
  importBackup: (jsonStr: string) => boolean;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

const STORAGE_KEY_FAVORITES = 'ytmusic_favs';
const STORAGE_KEY_PLAYLISTS = 'ytmusic_playlists';
const STORAGE_KEY_HISTORY = 'ytmusic_history';

export const LibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<Track[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FAVORITES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [playlists, setPlaylists] = useState<UserPlaylist[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PLAYLISTS);
      return saved ? JSON.parse(saved) : [
        {
          id: 'pl-favorites',
          name: 'Liked Songs',
          description: 'Your favorite tracks',
          tracks: [],
          createdAt: Date.now(),
        }
      ];
    } catch {
      return [];
    }
  });

  const [history, setHistory] = useState<Track[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Persist changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(favorites));
    } catch (e) {
      console.warn('Failed to save favorites to localStorage', e);
    }
  }, [favorites]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PLAYLISTS, JSON.stringify(playlists));
    } catch (e) {
      console.warn('Failed to save playlists to localStorage', e);
    }
  }, [playlists]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
    } catch (e) {
      console.warn('Failed to save history to localStorage', e);
    }
  }, [history]);

  const toggleFavorite = (track: Track) => {
    setFavorites((prev) => {
      const exists = prev.some((t) => t.id === track.id);
      if (exists) {
        return prev.filter((t) => t.id !== track.id);
      } else {
        return [track, ...prev];
      }
    });
  };

  const isFavorite = (trackId: string): boolean => {
    return favorites.some((t) => t.id === trackId);
  };

  const createPlaylist = (name: string, description?: string): UserPlaylist => {
    const newPlaylist: UserPlaylist = {
      id: `pl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: name.trim() || 'My Playlist',
      description,
      tracks: [],
      createdAt: Date.now(),
    };
    setPlaylists((prev) => [newPlaylist, ...prev]);
    return newPlaylist;
  };

  const deletePlaylist = (playlistId: string) => {
    setPlaylists((prev) => prev.filter((pl) => pl.id !== playlistId));
  };

  const addTrackToPlaylist = (playlistId: string, track: Track) => {
    setPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id === playlistId && !pl.tracks.some((t) => t.id === track.id)) {
          return { ...pl, tracks: [...pl.tracks, track] };
        }
        return pl;
      })
    );
  };

  const removeTrackFromPlaylist = (playlistId: string, trackId: string) => {
    setPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id === playlistId) {
          return { ...pl, tracks: pl.tracks.filter((t) => t.id !== trackId) };
        }
        return pl;
      })
    );
  };

  const addToHistory = (track: Track) => {
    setHistory((prev) => {
      const filtered = prev.filter((t) => t.id !== track.id);
      return [track, ...filtered].slice(0, 50); // Keep last 50
    });
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const exportBackup = () => {
    const data = {
      favorites,
      playlists,
      history,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ytmusic-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importBackup = (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (Array.isArray(data.favorites)) setFavorites(data.favorites);
      if (Array.isArray(data.playlists)) setPlaylists(data.playlists);
      if (Array.isArray(data.history)) setHistory(data.history);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <LibraryContext.Provider
      value={{
        favorites,
        playlists,
        history,
        toggleFavorite,
        isFavorite,
        createPlaylist,
        deletePlaylist,
        addTrackToPlaylist,
        removeTrackFromPlaylist,
        addToHistory,
        clearHistory,
        exportBackup,
        importBackup,
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
};

export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (!context) throw new Error('useLibrary must be used within LibraryProvider');
  return context;
};
