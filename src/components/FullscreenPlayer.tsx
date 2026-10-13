import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Heart,
  Volume2,
  VolumeX,
  Trash2,
  Sparkles,
  Music,
  Share2,
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { useLibrary } from '../context/LibraryContext';
import { formatDuration } from './PlayerBar';

export const FullscreenPlayer: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    repeatMode,
    isShuffle,
    isAutoplay,
    toggleAutoplay,
    mode,
    isExpanded,
    queue,
    queueIndex,
    lyricsData,
    isLoadingLyrics,
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
    removeFromQueue,
    clearQueue,
    playTrack,
  } = usePlayer();

  const { isFavorite, toggleFavorite } = useLibrary();
  const [activeTab, setActiveTab] = useState<'queue' | 'lyrics' | 'related'>('queue');
  const activeLyricRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll synced lyric to center when active line changes
  useEffect(() => {
    if (activeLyricRef.current && activeTab === 'lyrics') {
      activeLyricRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentTime, activeTab]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isExpanded) return;
      if (e.key === 'Escape') {
        setIsExpanded(false);
      } else if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'INPUT') {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded, togglePlay, setIsExpanded]);

  if (!isExpanded || !currentTrack) return null;

  const isFav = isFavorite(currentTrack.id);
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Find active synced lyric index
  let activeLyricIndex = -1;
  if (lyricsData?.synced && lyricsData.synced.length > 0) {
    for (let i = 0; i < lyricsData.synced.length; i++) {
      if (currentTime >= lyricsData.synced[i].time) {
        activeLyricIndex = i;
      } else {
        break;
      }
    }
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newPercent = Math.max(0, Math.min(1, clickX / rect.width));
    seekTo(newPercent * duration);
  };

  return (
    <div className="fullscreen-player-modal">
      {/* Dynamic Ambient Blur Backdrop */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${currentTrack.thumbnail})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(80px) brightness(0.25)',
          transform: 'scale(1.2)',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      {/* Top Header */}
      <div className="fullscreen-topbar" style={{ position: 'relative', zIndex: 10 }}>
        <button
          className="fullscreen-collapse-btn"
          onClick={() => setIsExpanded(false)}
          title="Minimize player"
        >
          <ChevronDown size={28} />
        </button>

        {/* Song / Video Toggle Pill */}
        <div className="mode-toggle-pill" style={{ padding: '3px' }}>
          <button
            className={`mode-toggle-btn ${mode === 'song' ? 'active' : ''}`}
            onClick={() => setMode('song')}
            style={{ padding: '6px 16px', fontSize: '13px' }}
          >
            Song
          </button>
          <button
            className={`mode-toggle-btn ${mode === 'video' ? 'active' : ''}`}
            onClick={() => setMode('video')}
            style={{ padding: '6px 16px', fontSize: '13px' }}
          >
            Video
          </button>
        </div>

        <button
          className="fullscreen-collapse-btn"
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: currentTrack.title,
                text: `Listening to ${currentTrack.title} by ${currentTrack.artist}`,
                url: window.location.href,
              }).catch(() => {});
            }
          }}
          title="Share song"
        >
          <Share2 size={20} />
        </button>
      </div>

      {/* Body Grid */}
      <div className="fullscreen-body" style={{ position: 'relative', zIndex: 10 }}>
        {/* Left Side: Art / Video + Main Controls */}
        <div className="nowplaying-left">
          {mode === 'song' ? (
            <div className="nowplaying-art-wrapper">
              <img
                src={currentTrack.thumbnail}
                alt={currentTrack.title}
                className="nowplaying-art"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://i.ytimg.com/vi/${currentTrack.id}/hqdefault.jpg`;
                }}
              />
            </div>
          ) : (
            <div className="video-player-frame-box">
              {/* Video mode: wrapper will reposition the iframe here */}
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-secondary)',
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <Music size={40} style={{ marginBottom: 12 }} />
                  <p>Streaming Official Music Video in DayMusic</p>
                </div>
              </div>
            </div>
          )}

          {/* Title & Artist & Like Button */}
          <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ overflow: 'hidden' }}>
              <h1 style={{ fontSize: '26px', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentTrack.title}
              </h1>
              <p style={{ fontSize: '16px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {currentTrack.artist}
              </p>
            </div>
            <button
              onClick={() => toggleFavorite(currentTrack)}
              className={`player-fav-btn ${isFav ? 'active' : ''}`}
              style={{ padding: '10px' }}
              title={isFav ? 'Liked' : 'Like'}
            >
              <Heart size={24} fill={isFav ? 'var(--accent-red)' : 'none'} />
            </button>
          </div>

          {/* Fullscreen Scrubber Bar */}
          <div style={{ width: '100%' }}>
            <div
              className="player-progress-container"
              style={{ position: 'relative', height: '14px', top: 0, padding: '4px 0' }}
              onClick={handleProgressClick}
            >
              <div className="player-progress-bg" style={{ height: '4px' }}>
                <div className="player-progress-fill" style={{ width: `${progressPercent}%` }}>
                  <div className="player-progress-handle" style={{ transform: 'translateY(-50%) scale(1)' }} />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              <span>{formatDuration(currentTime)}</span>
              <span>{formatDuration(duration)}</span>
            </div>
          </div>

          {/* Big Controls Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '28px', width: '100%' }}>
            <button
              className={`player-btn ${isShuffle ? 'active' : ''}`}
              onClick={toggleShuffle}
              title="Shuffle"
            >
              <Shuffle size={22} />
            </button>

            <button
              className="player-btn"
              onClick={previousTrack}
              title="Previous"
            >
              <SkipBack size={26} />
            </button>

            <button
              className="player-play-btn"
              style={{ width: '64px', height: '64px' }}
              onClick={togglePlay}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause size={30} fill="currentColor" />
              ) : (
                <Play size={30} fill="currentColor" style={{ marginLeft: '4px' }} />
              )}
            </button>

            <button
              className="player-btn"
              onClick={nextTrack}
              title="Next"
            >
              <SkipForward size={26} />
            </button>

            <button
              className={`player-btn ${repeatMode !== 'off' ? 'active' : ''}`}
              onClick={toggleRepeat}
              title={`Repeat: ${repeatMode}`}
            >
              {repeatMode === 'one' ? <Repeat1 size={22} /> : <Repeat size={22} />}
            </button>
          </div>
        </div>

        {/* Right Side: Tabbed Panel (Up Next / Lyrics / Related) */}
        <div className="nowplaying-right">
          <div className="nowplaying-tab-headers">
            <button
              className={`nowplaying-tab-btn ${activeTab === 'queue' ? 'active' : ''}`}
              onClick={() => setActiveTab('queue')}
            >
              UP NEXT ({queue.length})
            </button>
            <button
              className={`nowplaying-tab-btn ${activeTab === 'lyrics' ? 'active' : ''}`}
              onClick={() => setActiveTab('lyrics')}
            >
              LYRICS
            </button>
            <button
              className={`nowplaying-tab-btn ${activeTab === 'related' ? 'active' : ''}`}
              onClick={() => setActiveTab('related')}
            >
              RELATED
            </button>
          </div>

          <div className="nowplaying-tab-content">
            {/* UP NEXT QUEUE */}
            {activeTab === 'queue' && (
              <div className="queue-list">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      Autoplay genre
                    </span>
                    <button
                      onClick={toggleAutoplay}
                      style={{
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 700,
                        background: isAutoplay ? 'rgba(56, 189, 248, 0.2)' : 'var(--bg-highlight)',
                        color: isAutoplay ? '#38bdf8' : 'var(--text-muted)',
                        border: isAutoplay ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      title="Toggle endless genre autoplay"
                    >
                      {isAutoplay ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  {queue.length > 1 && (
                    <button
                      onClick={clearQueue}
                      style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <Trash2 size={13} /> Clear queue
                    </button>
                  )}
                </div>

                {queue.map((track, idx) => {
                  const isCur = idx === queueIndex;
                  const isFirstAutoplay = track.isAutoplayTrack && (idx === 0 || !queue[idx - 1]?.isAutoplayTrack);
                  return (
                    <React.Fragment key={`${track.id}-${idx}`}>
                      {isFirstAutoplay && (
                        <div style={{ padding: '12px 4px 6px 4px', display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontSize: '12px', fontWeight: 600 }}>
                          <Sparkles size={14} />
                          <span>Autoplay • Similar music in this genre</span>
                        </div>
                      )}
                      <div
                        className={`queue-item ${isCur ? 'active' : ''}`}
                        onClick={() => playTrack(track, queue, idx)}
                      >
                        <div className="queue-item-left">
                          <img src={track.thumbnail} alt={track.title} className="queue-thumb" />
                          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <span
                                style={{
                                  fontSize: '14px',
                                  fontWeight: isCur ? 700 : 500,
                                  color: isCur ? 'var(--accent-red)' : 'var(--text-primary)',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {track.title}
                              </span>
                              {track.isAutoplayTrack && (
                                <span style={{ fontSize: '10px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '1px 5px', borderRadius: '4px', marginLeft: '6px', flexShrink: 0 }}>
                                  Radio
                                </span>
                              )}
                            </div>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                              {track.artist}
                            </span>
                          </div>
                        </div>

                      {queue.length > 1 && !isCur && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromQueue(idx);
                          }}
                          className="player-btn"
                          style={{ padding: '6px' }}
                          title="Remove from queue"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </React.Fragment>
                );
              })}
              </div>
            )}

            {/* LYRICS TAB */}
            {activeTab === 'lyrics' && (
              <div className="lyrics-container">
                {isLoadingLyrics ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '240px', gap: 10 }}>
                    <Sparkles size={20} color="var(--accent-red)" className="spin-animation" />
                    <span>Loading lyrics...</span>
                  </div>
                ) : lyricsData?.synced && lyricsData.synced.length > 0 ? (
                  <>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                      Time-synced lyrics • Tap any line to jump
                    </div>
                    {lyricsData.synced.map((line, idx) => {
                      const isActive = idx === activeLyricIndex;
                      return (
                        <div
                          key={idx}
                          ref={isActive ? activeLyricRef : null}
                          className={`lyric-line ${isActive ? 'active' : ''}`}
                          onClick={() => seekTo(line.time)}
                        >
                          {line.text}
                        </div>
                      );
                    })}
                  </>
                ) : lyricsData?.plain ? (
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: '2', fontSize: '18px', color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>
                    {lyricsData.plain}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                    <p style={{ fontSize: '16px', marginBottom: '8px' }}>No lyrics available for this song</p>
                    <p style={{ fontSize: '12px' }}>Lyrics are sourced from YouTube Music and LRCLIB</p>
                  </div>
                )}
              </div>
            )}

            {/* RELATED TAB */}
            {activeTab === 'related' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>About {currentTrack.artist}</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    Listen to more tracks and related releases from this artist directly on YouTube Music.
                  </p>
                </div>
                <div className="queue-list">
                  {queue.slice(0, 8).map((track, i) => (
                    <div
                      key={`rel-${track.id}-${i}`}
                      className="queue-item"
                      onClick={() => playTrack(track, queue)}
                    >
                      <div className="queue-item-left">
                        <img src={track.thumbnail} alt={track.title} className="queue-thumb" />
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600 }}>{track.title}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{track.artist}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
