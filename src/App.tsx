import React, { useState, useEffect } from 'react';
import {
  Play,
  Shuffle,
  Trash2,
  Heart,
  Music,
  Compass,
  Sparkles,
  ListMusic,
  Clock,
  Plus,
} from 'lucide-react';
import { Track, Shelf, UserPlaylist } from './types/ytmusic';
import { getHomeFeed, getExploreFeed, searchMusic } from './services/ytmusic';
import { usePlayer } from './context/PlayerContext';
import { useLibrary } from './context/LibraryContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { ShelfSection } from './components/ShelfSection';
import { SongCard } from './components/SongCard';
import { PlayerBar, formatDuration } from './components/PlayerBar';
import { FullscreenPlayer } from './components/FullscreenPlayer';
import { PlaylistModal } from './components/PlaylistModal';
import { SettingsModal } from './components/SettingsModal';

export const App: React.FC = () => {
  const { playTrack, currentTrack, isPlaying } = usePlayer();
  const { favorites, playlists, history, deletePlaylist, removeTrackFromPlaylist } = useLibrary();

  // Navigation State
  const [currentTab, setCurrentTab] = useState<'home' | 'explore' | 'library'>('home');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeChip, setActiveChip] = useState<string | undefined>(undefined);

  // Data States
  const [homeShelves, setHomeShelves] = useState<Shelf[]>([]);
  const [exploreShelves, setExploreShelves] = useState<Shelf[]>([]);
  const [searchResults, setSearchResults] = useState<{ topResult?: Track; songs: Track[] } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [playlistModalTrack, setPlaylistModalTrack] = useState<Track | null | undefined>(undefined);

  // Load Home Feed on Mount
  useEffect(() => {
    async function loadInitial() {
      setIsLoading(true);
      try {
        const home = await getHomeFeed();
        setHomeShelves(home);
      } catch (err) {
        console.warn('Failed to load initial feed:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadInitial();
  }, []);

  // Load Explore Feed when tab selected
  useEffect(() => {
    if (currentTab === 'explore' && exploreShelves.length === 0) {
      setIsLoading(true);
      getExploreFeed().then((exp) => {
        setExploreShelves(exp);
        setIsLoading(false);
      });
    }
  }, [currentTab, exploreShelves.length]);

  // Handle Search
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setSelectedPlaylistId(undefined);
    setIsLoading(true);
    try {
      const res = await searchMusic(query);
      setSearchResults(res);
    } catch (err) {
      console.warn('Search failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Category Chip Click
  const handleSelectChip = (chip: string) => {
    if (activeChip === chip) {
      setActiveChip(undefined);
      setSearchQuery('');
      setSearchResults(null);
    } else {
      setActiveChip(chip);
      handleSearch(chip);
    }
  };

  const handleHomeClick = () => {
    setSearchQuery('');
    setSearchResults(null);
    setSelectedPlaylistId(undefined);
    setActiveChip(undefined);
    setCurrentTab('home');
  };

  const handleSelectTab = (tab: 'home' | 'explore' | 'library') => {
    setCurrentTab(tab);
    setSelectedPlaylistId(undefined);
    setSearchQuery('');
    setSearchResults(null);
    setActiveChip(undefined);
  };

  const handleSelectPlaylist = (id: string) => {
    setSelectedPlaylistId(id);
    setSearchQuery('');
    setSearchResults(null);
  };

  // Resolve Active Selected Playlist Details
  let activePlaylist: UserPlaylist | null = null;
  if (selectedPlaylistId === 'liked') {
    activePlaylist = {
      id: 'liked',
      name: 'Liked Music',
      description: 'Auto playlist created from your liked tracks',
      tracks: favorites,
      createdAt: Date.now(),
    };
  } else if (selectedPlaylistId) {
    activePlaylist = playlists.find((p) => p.id === selectedPlaylistId) || null;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      {/* Top Navbar */}
      <Navbar
        onSearch={handleSearch}
        onOpenSettings={() => setShowSettings(true)}
        onHomeClick={handleHomeClick}
        activeChip={activeChip}
        onSelectChip={handleSelectChip}
      />

      {/* Main Body */}
      <div className="app-container">
        {/* Left Desktop Sidebar */}
        <Sidebar
          currentTab={selectedPlaylistId ? 'playlist' : currentTab}
          onSelectTab={handleSelectTab}
          onOpenNewPlaylist={() => setPlaylistModalTrack(null)}
          onSelectPlaylist={handleSelectPlaylist}
          selectedPlaylistId={selectedPlaylistId}
        />

        {/* Scrollable Content View */}
        <main className="main-content">
          <div className={`content-scrollable ${currentTrack ? 'has-player' : ''}`}>
            {/* Loading Indicator */}
            {isLoading && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '10px' }}>
                <Sparkles size={22} color="var(--accent-red)" className="spin-animation" />
                <span style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>Loading DayMusic by DaySheet Group...</span>
              </div>
            )}

            {/* VIEW 1: SEARCH RESULTS */}
            {!isLoading && searchQuery && searchResults && (
              <div style={{ padding: '24px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '20px' }}>
                  Search results for "{searchQuery}"
                </h2>

                {/* Top Result Card if available */}
                {searchResults.topResult && (
                  <div style={{ marginBottom: '32px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px' }}>
                      Top result
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '20px',
                        background: 'var(--bg-elevated)',
                        padding: '16px',
                        borderRadius: '12px',
                        border: '1px solid var(--border-subtle)',
                        maxWidth: '540px',
                        cursor: 'pointer',
                      }}
                      onClick={() => playTrack(searchResults.topResult!, searchResults.songs)}
                    >
                      <img
                        src={searchResults.topResult.thumbnail}
                        alt={searchResults.topResult.title}
                        style={{ width: '96px', height: '96px', borderRadius: '8px', objectFit: 'cover' }}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflow: 'hidden' }}>
                        <span style={{ fontSize: '18px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {searchResults.topResult.title}
                        </span>
                        <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                          {searchResults.topResult.artist}
                        </span>
                        <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ background: 'var(--accent-red)', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
                            Song
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Song Results List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px' }}>
                    Songs ({searchResults.songs.length})
                  </div>
                  {searchResults.songs.map((song) => {
                    const isCur = currentTrack?.id === song.id;
                    return (
                      <div
                        key={song.id}
                        className="sidebar-playlist-item"
                        style={{
                          padding: '10px 14px',
                          borderRadius: '8px',
                          background: isCur ? 'var(--bg-highlight)' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                        }}
                        onClick={() => playTrack(song, searchResults.songs)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', overflow: 'hidden' }}>
                          <img
                            src={song.thumbnail}
                            alt={song.title}
                            style={{ width: '44px', height: '44px', borderRadius: '6px', objectFit: 'cover' }}
                          />
                          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            <span style={{ fontWeight: 600, fontSize: '14px', color: isCur ? 'var(--accent-red)' : 'var(--text-primary)' }}>
                              {song.title}
                            </span>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                              {song.artist}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPlaylistModalTrack(song);
                          }}
                          className="player-btn"
                          title="Add to playlist"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* VIEW 2: PLAYLIST DETAILS VIEW */}
            {!isLoading && !searchQuery && activePlaylist && (
              <div style={{ padding: '32px 24px' }}>
                {/* Playlist Header Banner */}
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '28px', marginBottom: '32px' }}>
                  <div
                    style={{
                      width: '180px',
                      height: '180px',
                      borderRadius: '12px',
                      background: 'var(--bg-elevated)',
                      boxShadow: '0 12px 30px rgba(0,0,0,0.6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      flexShrink: 0,
                    }}
                  >
                    {activePlaylist.tracks[0]?.thumbnail ? (
                      <img
                        src={activePlaylist.tracks[0].thumbnail}
                        alt={activePlaylist.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <Music size={54} color="var(--text-muted)" />
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                      Playlist
                    </span>
                    <h1 style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-0.5px' }}>
                      {activePlaylist.name}
                    </h1>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                      {activePlaylist.description || 'Personal playlist'} • {activePlaylist.tracks.length} songs
                    </p>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
                      {activePlaylist.tracks.length > 0 && (
                        <>
                          <button
                            onClick={() => playTrack(activePlaylist.tracks[0], activePlaylist.tracks)}
                            style={{
                              background: '#ffffff',
                              color: '#030303',
                              padding: '10px 22px',
                              borderRadius: '24px',
                              fontWeight: 700,
                              fontSize: '14px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                            }}
                          >
                            <Play size={18} fill="currentColor" /> Play
                          </button>

                          <button
                            onClick={() => {
                              const shuffled = [...activePlaylist.tracks].sort(() => Math.random() - 0.5);
                              playTrack(shuffled[0], shuffled);
                            }}
                            style={{
                              background: 'var(--bg-elevated)',
                              border: '1px solid var(--border-medium)',
                              color: '#ffffff',
                              padding: '10px 20px',
                              borderRadius: '24px',
                              fontWeight: 600,
                              fontSize: '14px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                            }}
                          >
                            <Shuffle size={16} /> Shuffle
                          </button>
                        </>
                      )}

                      {selectedPlaylistId !== 'liked' && (
                        <button
                          onClick={() => {
                            if (confirm(`Delete playlist "${activePlaylist.name}"?`)) {
                              deletePlaylist(activePlaylist.id);
                              setSelectedPlaylistId(undefined);
                            }
                          }}
                          className="player-btn"
                          title="Delete playlist"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Playlist Tracks List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {activePlaylist.tracks.length === 0 ? (
                    <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <p style={{ fontSize: '16px' }}>No songs in this playlist yet.</p>
                      <p style={{ fontSize: '13px', marginTop: '4px' }}>Search for any song or browse Home to add songs here.</p>
                    </div>
                  ) : (
                    activePlaylist.tracks.map((track, idx) => {
                      const isCur = currentTrack?.id === track.id;
                      return (
                        <div
                          key={`${track.id}-${idx}`}
                          className="sidebar-playlist-item"
                          style={{
                            padding: '8px 16px',
                            borderRadius: '8px',
                            background: isCur ? 'var(--bg-highlight)' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                          }}
                          onClick={() => playTrack(track, activePlaylist!.tracks)}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', overflow: 'hidden' }}>
                            <span style={{ width: '20px', fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>
                              {idx + 1}
                            </span>
                            <img
                              src={track.thumbnail}
                              alt={track.title}
                              style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }}
                            />
                            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                              <span style={{ fontWeight: 600, fontSize: '14px', color: isCur ? 'var(--accent-red)' : 'var(--text-primary)' }}>
                                {track.title}
                              </span>
                              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                {track.artist}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeTrackFromPlaylist(activePlaylist!.id, track.id);
                            }}
                            className="player-btn"
                            title="Remove from playlist"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* VIEW 3: HOME TAB */}
            {!isLoading && !searchQuery && !selectedPlaylistId && currentTab === 'home' && (
              <div>
                {homeShelves.map((shelf, idx) => (
                  <ShelfSection
                    key={`${shelf.title}-${idx}`}
                    title={shelf.title}
                    items={shelf.items}
                    onPlayTrack={(track, allTracks) => playTrack(track, allTracks)}
                    onOpenPlaylistModal={(track) => setPlaylistModalTrack(track)}
                  />
                ))}
              </div>
            )}

            {/* VIEW 4: EXPLORE TAB */}
            {!isLoading && !searchQuery && !selectedPlaylistId && currentTab === 'explore' && (
              <div>
                {exploreShelves.map((shelf, idx) => (
                  <ShelfSection
                    key={`exp-${shelf.title}-${idx}`}
                    title={shelf.title}
                    items={shelf.items}
                    onPlayTrack={(track, allTracks) => playTrack(track, allTracks)}
                    onOpenPlaylistModal={(track) => setPlaylistModalTrack(track)}
                  />
                ))}
              </div>
            )}

            {/* VIEW 5: LIBRARY TAB */}
            {!isLoading && !searchQuery && !selectedPlaylistId && currentTab === 'library' && (
              <div style={{ padding: '24px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '24px' }}>Your Music Library</h1>

                {/* Liked Music Card */}
                <div className="library-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px', marginBottom: '36px' }}>
                  <div
                    className="song-card"
                    style={{ width: '100%', background: 'linear-gradient(135deg, #450a0a 0%, #1f1f1f 100%)', borderRadius: '12px', padding: '16px' }}
                    onClick={() => handleSelectPlaylist('liked')}
                  >
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--accent-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                      <Heart size={24} fill="#fff" color="#fff" />
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>Liked Music</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Auto playlist • {favorites.length} songs</div>
                  </div>

                  {playlists.map((pl) => (
                    <div
                      key={pl.id}
                      className="song-card"
                      style={{ width: '100%', background: 'var(--bg-elevated)', borderRadius: '12px', padding: '16px' }}
                      onClick={() => handleSelectPlaylist(pl.id)}
                    >
                      <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                        <Music size={24} color="var(--text-muted)" />
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {pl.name}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {pl.tracks.length} songs
                      </div>
                    </div>
                  ))}
                </div>

                {/* Recently Played History */}
                {history.length > 0 && (
                  <ShelfSection
                    title="Recently Played"
                    subtitle="History"
                    items={history}
                    onPlayTrack={(track, allTracks) => playTrack(track, allTracks)}
                    onOpenPlaylistModal={(track) => setPlaylistModalTrack(track)}
                  />
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav currentTab={currentTab} onSelectTab={handleSelectTab} />

      {/* Sticky Bottom Player */}
      <PlayerBar />

      {/* Expanded / Fullscreen Now Playing Drawer */}
      <FullscreenPlayer />

      {/* Add To Playlist Modal */}
      {playlistModalTrack !== undefined && (
        <PlaylistModal
          track={playlistModalTrack}
          onClose={() => setPlaylistModalTrack(undefined)}
        />
      )}

      {/* Settings Modal */}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
};
