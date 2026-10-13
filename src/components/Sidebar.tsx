import React from 'react';
import { Home, Compass, Library, Plus, Heart, Music, Cloud } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';

interface SidebarProps {
  currentTab: 'home' | 'explore' | 'library' | 'playlist';
  onSelectTab: (tab: 'home' | 'explore' | 'library') => void;
  onOpenNewPlaylist: () => void;
  onSelectPlaylist: (playlistId: string) => void;
  selectedPlaylistId?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenNewPlaylist,
  onSelectPlaylist,
  selectedPlaylistId,
}) => {
  const { favorites, playlists } = useLibrary();

  return (
    <aside className="sidebar">
      {/* Primary Navigation */}
      <button
        className={`sidebar-nav-item ${currentTab === 'home' && !selectedPlaylistId ? 'active' : ''}`}
        onClick={() => onSelectTab('home')}
      >
        <Home size={20} />
        <span>Home</span>
      </button>

      <button
        className={`sidebar-nav-item ${currentTab === 'explore' ? 'active' : ''}`}
        onClick={() => onSelectTab('explore')}
      >
        <Compass size={20} />
        <span>Explore</span>
      </button>

      <button
        className={`sidebar-nav-item ${currentTab === 'library' && !selectedPlaylistId ? 'active' : ''}`}
        onClick={() => onSelectTab('library')}
      >
        <Library size={20} />
        <span>Library</span>
      </button>

      <div className="sidebar-divider" />

      {/* Playlist Actions */}
      <button
        onClick={onOpenNewPlaylist}
        className="sidebar-nav-item"
        style={{ color: 'var(--text-primary)' }}
      >
        <Plus size={20} />
        <span>New playlist</span>
      </button>

      <button
        className={`sidebar-nav-item ${selectedPlaylistId === 'liked' ? 'active' : ''}`}
        onClick={() => onSelectPlaylist('liked')}
      >
        <Heart size={20} color="var(--accent-red)" />
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <span>Liked Music</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Auto playlist • {favorites.length} songs
          </span>
        </div>
      </button>

      {/* Custom User Playlists */}
      {playlists.length > 0 && (
        <>
          <div className="sidebar-section-title">Playlists</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {playlists.map((pl) => (
              <button
                key={pl.id}
                className={`sidebar-playlist-item ${selectedPlaylistId === pl.id ? 'active' : ''}`}
                onClick={() => onSelectPlaylist(pl.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                  <Music size={16} color="var(--text-muted)" />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {pl.name}
                  </span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {pl.tracks.length}
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* DaySheet Group & Cloudflare Personal Badge */}
      <div style={{ marginTop: 'auto', padding: '12px', borderRadius: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/logo.png" alt="DaySheet" style={{ width: '22px', height: '22px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)' }} />
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
            DaySheet Group
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-secondary)' }}>
          <Cloud size={14} color="#F38020" />
          <span>Cloudflare Edge Ready</span>
        </div>
      </div>
    </aside>
  );
};
