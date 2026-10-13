import React, { useState } from 'react';
import { Play, Pause, MoreVertical, Heart, ListPlus, Radio } from 'lucide-react';
import { Track } from '../types/ytmusic';
import { useLibrary } from '../context/LibraryContext';
import { usePlayer } from '../context/PlayerContext';

interface SongCardProps {
  track: Track;
  onPlay: () => void;
  onOpenPlaylistModal?: (track: Track) => void;
}

export const SongCard: React.FC<SongCardProps> = ({ track, onPlay, onOpenPlaylistModal }) => {
  const { currentTrack, isPlaying, addToQueue, playNextInQueue } = usePlayer();
  const { isFavorite, toggleFavorite } = useLibrary();
  const [showMenu, setShowMenu] = useState(false);

  const isCurrent = currentTrack?.id === track.id;
  const isFav = isFavorite(track.id);

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPlay();
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu((prev) => !prev);
  };

  return (
    <div className="song-card" onClick={onPlay}>
      <div className="song-card-thumb-wrapper">
        <img
          src={track.thumbnail}
          alt={track.title}
          className="song-card-thumb"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://i.ytimg.com/vi/${track.id}/hqdefault.jpg`;
          }}
        />

        {/* Hover Play Button Overlay */}
        <div className="song-card-play-overlay">
          <button className="card-play-btn" onClick={handlePlayClick}>
            {isCurrent && isPlaying ? <Pause size={22} /> : <Play size={22} style={{ marginLeft: '2px' }} />}
          </button>
        </div>

        {/* Action Menu Trigger */}
        <button
          onClick={handleMenuClick}
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            background: 'rgba(0,0,0,0.6)',
            borderRadius: '50%',
            padding: 4,
            color: '#fff',
            opacity: showMenu ? 1 : 0,
            transition: 'opacity 0.2s',
          }}
          className="card-menu-btn"
          title="More options"
        >
          <MoreVertical size={16} />
        </button>

        {/* Dropdown Menu */}
        {showMenu && (
          <div
            style={{
              position: 'absolute',
              top: 36,
              right: 6,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-medium)',
              borderRadius: '8px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
              zIndex: 30,
              minWidth: '160px',
              padding: '6px 0',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="suggestion-item"
              style={{ width: '100%' }}
              onClick={() => {
                playNextInQueue(track);
                setShowMenu(false);
              }}
            >
              <Radio size={14} />
              <span>Play next</span>
            </button>
            <button
              className="suggestion-item"
              style={{ width: '100%' }}
              onClick={() => {
                addToQueue(track);
                setShowMenu(false);
              }}
            >
              <ListPlus size={14} />
              <span>Add to queue</span>
            </button>
            <button
              className="suggestion-item"
              style={{ width: '100%' }}
              onClick={() => {
                toggleFavorite(track);
                setShowMenu(false);
              }}
            >
              <Heart size={14} color={isFav ? 'var(--accent-red)' : 'currentColor'} />
              <span>{isFav ? 'Remove from Liked' : 'Like song'}</span>
            </button>
            {onOpenPlaylistModal && (
              <button
                className="suggestion-item"
                style={{ width: '100%' }}
                onClick={() => {
                  onOpenPlaylistModal(track);
                  setShowMenu(false);
                }}
              >
                <ListPlus size={14} />
                <span>Add to playlist</span>
              </button>
            )}
          </div>
        )}
      </div>

      <div className="song-card-info">
        <span
          className="song-card-title"
          style={{ color: isCurrent ? 'var(--accent-red)' : 'var(--text-primary)' }}
        >
          {track.title}
        </span>
        <span className="song-card-artist">{track.artist}</span>
      </div>
    </div>
  );
};
