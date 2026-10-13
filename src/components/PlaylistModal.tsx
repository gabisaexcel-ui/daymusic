import React, { useState } from 'react';
import { X, Plus, Music, Check } from 'lucide-react';
import { Track } from '../types/ytmusic';
import { useLibrary } from '../context/LibraryContext';

interface PlaylistModalProps {
  track?: Track | null;
  onClose: () => void;
}

export const PlaylistModal: React.FC<PlaylistModalProps> = ({ track, onClose }) => {
  const { playlists, createPlaylist, addTrackToPlaylist } = useLibrary();
  const [newTitle, setNewTitle] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(!track);
  const [addedIds, setAddedIds] = useState<string[]>([]);

  const handleCreateNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newPl = createPlaylist(newTitle.trim());
    if (track) {
      addTrackToPlaylist(newPl.id, track);
      setAddedIds((prev) => [...prev, newPl.id]);
    }
    setNewTitle('');
    setShowCreateForm(false);
  };

  const handleToggleAdd = (playlistId: string) => {
    if (!track) return;
    addTrackToPlaylist(playlistId, track);
    setAddedIds((prev) => [...prev, playlistId]);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700 }}>
            {track ? 'Add to Playlist' : 'Create New Playlist'}
          </h2>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {track && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px', background: 'var(--bg-surface)', borderRadius: 8 }}>
            <img src={track.thumbnail} alt={track.title} style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover' }} />
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: 600, fontSize: '14px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {track.title}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {track.artist}
              </div>
            </div>
          </div>
        )}

        {/* Existing Playlists Selection */}
        {track && !showCreateForm && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: '200px', overflowY: 'auto' }}>
            {playlists.map((pl) => {
              const alreadyHas = pl.tracks.some((t) => t.id === track.id) || addedIds.includes(pl.id);
              return (
                <button
                  key={pl.id}
                  onClick={() => handleToggleAdd(pl.id)}
                  disabled={alreadyHas}
                  className="sidebar-playlist-item"
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: alreadyHas ? 'var(--bg-highlight)' : 'var(--bg-surface)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Music size={16} />
                    <span>{pl.name}</span>
                  </div>
                  {alreadyHas && <Check size={16} color="var(--accent-red)" />}
                </button>
              );
            })}
          </div>
        )}

        {/* Create Form */}
        {showCreateForm ? (
          <form onSubmit={handleCreateNew} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <input
              type="text"
              placeholder="Playlist title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              autoFocus
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-medium)',
                borderRadius: 8,
                padding: '12px 16px',
                color: '#fff',
                fontSize: '14px',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              {track && (
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  style={{ padding: '8px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                style={{
                  background: 'var(--accent-red)',
                  color: '#fff',
                  borderRadius: 20,
                  padding: '8px 18px',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                Create
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowCreateForm(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: 'var(--text-primary)',
              padding: '10px 14px',
              background: 'var(--bg-surface)',
              borderRadius: 8,
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            <Plus size={18} />
            <span>New playlist</span>
          </button>
        )}
      </div>
    </div>
  );
};
