import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Heart,
  Maximize2,
  ListMusic,
  FileText,
  Loader2,
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { useLibrary } from '../context/LibraryContext';

export function formatDuration(sec: number): string {
  if (isNaN(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export const PlayerBar: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    isBuffering,
    currentTime,
    duration,
    volume,
    isMuted,
    repeatMode,
    isShuffle,
    mode,
    isExpanded,
    togglePlay,
    seekTo,
    nextTrack,
    previousTrack,
    setVolume,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    setMode,
    setIsExpanded,
  } = usePlayer();

  const { isFavorite, toggleFavorite } = useLibrary();
  const [hoverTime, setHoverTime] = useState<number | null>(null);

  if (!currentTrack) {
    return null;
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const isFav = isFavorite(currentTrack.id);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newPercent = Math.max(0, Math.min(1, clickX / rect.width));
    seekTo(newPercent * duration);
  };

  const handleProgressHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const hoverX = e.clientX - rect.left;
    const hoverPercent = Math.max(0, Math.min(1, hoverX / rect.width));
    setHoverTime(hoverPercent * duration);
  };

  return (
    <footer className="player-bar">
      {/* Interactive Top Timeline Scrubber */}
      <div
        className="player-progress-container"
        onClick={handleProgressClick}
        onMouseMove={handleProgressHover}
        onMouseLeave={() => setHoverTime(null)}
        title={hoverTime !== null ? formatDuration(hoverTime) : undefined}
      >
        <div className="player-progress-bg">
          <div className="player-progress-fill" style={{ width: `${progressPercent}%` }}>
            <div className="player-progress-handle" />
          </div>
        </div>
      </div>

      {/* Left Section: Artwork & Track Details */}
      <div className="player-track-info">
        <div
          className="player-track-thumb-wrapper"
          onClick={() => setIsExpanded(true)}
          title="Expand now playing"
        >
          <img
            src={currentTrack.thumbnail}
            alt={currentTrack.title}
            className="player-track-thumb"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://i.ytimg.com/vi/${currentTrack.id}/hqdefault.jpg`;
            }}
          />
        </div>

        <div className="player-track-meta">
          <span
            className="player-track-title"
            onClick={() => setIsExpanded(true)}
            title={currentTrack.title}
          >
            {currentTrack.title}
          </span>
          <span className="player-track-artist" title={currentTrack.artist}>
            {currentTrack.artist}
          </span>
        </div>

        <button
          className={`player-fav-btn ${isFav ? 'active' : ''}`}
          onClick={() => toggleFavorite(currentTrack)}
          title={isFav ? 'Liked' : 'Like'}
        >
          <Heart size={18} fill={isFav ? 'var(--accent-red)' : 'none'} />
        </button>
      </div>

      {/* Center Section: Playback Controls */}
      <div className="player-center-controls">
        <div className="player-buttons-row">
          <button
            className={`player-btn hide-on-mobile ${isShuffle ? 'active' : ''}`}
            onClick={toggleShuffle}
            title={isShuffle ? 'Shuffle on' : 'Shuffle off'}
          >
            <Shuffle size={18} />
          </button>

          <button
            className="player-btn hide-on-mobile"
            onClick={previousTrack}
            title="Previous track"
          >
            <SkipBack size={20} />
          </button>

          <button
            className="player-play-btn"
            onClick={togglePlay}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isBuffering ? (
              <Loader2 size={22} className="spin-animation" />
            ) : isPlaying ? (
              <Pause size={22} fill="currentColor" />
            ) : (
              <Play size={22} fill="currentColor" style={{ marginLeft: '2px' }} />
            )}
          </button>

          <button
            className="player-btn"
            onClick={nextTrack}
            title="Next track"
          >
            <SkipForward size={20} />
          </button>

          <button
            className={`player-btn hide-on-mobile ${repeatMode !== 'off' ? 'active' : ''}`}
            onClick={toggleRepeat}
            title={`Repeat: ${repeatMode}`}
          >
            {repeatMode === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
          </button>
        </div>

        {/* Time Progress */}
        <div className="player-time-label hide-on-mobile">
          {formatDuration(currentTime)} / {formatDuration(duration)}
        </div>
      </div>

      {/* Right Section: Song/Video Pill, Volume & Fullscreen */}
      <div className="player-right-controls">
        {/* Song / Video Toggle Pill */}
        <div className="mode-toggle-pill hide-on-mobile">
          <button
            className={`mode-toggle-btn ${mode === 'song' ? 'active' : ''}`}
            onClick={() => setMode('song')}
          >
            Song
          </button>
          <button
            className={`mode-toggle-btn ${mode === 'video' ? 'active' : ''}`}
            onClick={() => {
              setMode('video');
              setIsExpanded(true);
            }}
          >
            Video
          </button>
        </div>

        {/* Volume Slider */}
        <div className="volume-control">
          <button
            className="player-btn"
            onClick={toggleMute}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <input
            type="range"
            min={0}
            max={100}
            value={isMuted ? 0 : volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="volume-slider"
            title={`Volume: ${isMuted ? 0 : volume}%`}
          />
        </div>

        {/* Drawer Trigger */}
        <button
          className="player-btn"
          onClick={() => setIsExpanded(!isExpanded)}
          title="Open lyrics and queue"
        >
          <ListMusic size={20} />
        </button>

        <button
          className="player-btn"
          onClick={() => setIsExpanded(true)}
          title="Maximize"
        >
          <Maximize2 size={18} />
        </button>
      </div>
    </footer>
  );
};
