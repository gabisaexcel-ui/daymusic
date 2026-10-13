import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Track, LyricsData } from '../types/ytmusic';
import { getWatchNext, getLyrics, getGenreRadio } from '../services/ytmusic';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface PlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  repeatMode: 'off' | 'all' | 'one';
  isShuffle: boolean;
  isAutoplay: boolean;
  mode: 'song' | 'video';
  isExpanded: boolean;
  queue: Track[];
  queueIndex: number;
  lyricsData: LyricsData | null;
  isLoadingLyrics: boolean;
  isBuffering: boolean;
  playTrack: (track: Track, newQueue?: Track[], targetIndex?: number) => void;
  togglePlay: () => void;
  seekTo: (seconds: number) => void;
  nextTrack: () => void;
  previousTrack: () => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  toggleAutoplay: () => void;
  setMode: (mode: 'song' | 'video') => void;
  setIsExpanded: (expanded: boolean) => void;
  addToQueue: (track: Track) => void;
  playNextInQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  reorderQueue: (startIndex: number, endIndex: number) => void;
  ytPlayerRef: React.RefObject<HTMLDivElement | null>;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode; onTrackPlayed?: (track: Track) => void }> = ({
  children,
  onTrackPlayed,
}) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [isAutoplay, setIsAutoplay] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('daymusic_autoplay');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });
  const [mode, setMode] = useState<'song' | 'video'>('song');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem('daymusic_autoplay', JSON.stringify(isAutoplay));
    } catch {}
  }, [isAutoplay]);

  const toggleAutoplay = useCallback(() => {
    setIsAutoplay((prev) => !prev);
  }, []);

  const [queue, setQueue] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState<number>(0);

  const [lyricsData, setLyricsData] = useState<LyricsData | null>(null);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState<boolean>(false);

  // Synchronized Refs to guarantee ZERO stale closures in YouTube player callbacks
  const queueRef = useRef<Track[]>([]);
  const queueIndexRef = useRef<number>(0);
  const currentTrackRef = useRef<Track | null>(null);
  const isAutoplayRef = useRef<boolean>(true);
  const repeatModeRef = useRef<'off' | 'all' | 'one'>('off');
  const isShuffleRef = useRef<boolean>(false);
  const isAdvancingRef = useRef<boolean>(false);
  const advanceTimeoutRef = useRef<any>(null);

  useEffect(() => { queueRef.current = queue; }, [queue]);
  useEffect(() => { queueIndexRef.current = queueIndex; }, [queueIndex]);
  useEffect(() => { currentTrackRef.current = currentTrack; }, [currentTrack]);
  useEffect(() => { isAutoplayRef.current = isAutoplay; }, [isAutoplay]);
  useEffect(() => { repeatModeRef.current = repeatMode; }, [repeatMode]);
  useEffect(() => { isShuffleRef.current = isShuffle; }, [isShuffle]);

  const ytPlayerRef = useRef<HTMLDivElement | null>(null);
  const playerInstanceRef = useRef<any>(null);
  const progressIntervalRef = useRef<any>(null);
  const isApiReadyRef = useRef<boolean>(false);

  // Dynamic Refs for callbacks
  const handleTrackEndedRef = useRef<() => void>(() => {});
  const nextTrackRef = useRef<() => void>(() => {});

  // Initialize YouTube Iframe API
  useEffect(() => {
    const initPlayer = () => {
      if (!window.YT || !window.YT.Player || playerInstanceRef.current) return;

      const container = document.getElementById('yt-player-iframe-node');
      if (!container) return;

      playerInstanceRef.current = new window.YT.Player('yt-player-iframe-node', {
        height: '100%',
        width: '100%',
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          rel: 0,
          modestbranding: 1,
          iv_load_policy: 3,
          playsinline: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (event: any) => {
            isApiReadyRef.current = true;
            event.target.setVolume(volume);
          },
          onStateChange: (event: any) => {
            // 1: PLAYING, 2: PAUSED, 0: ENDED, 3: BUFFERING
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              setIsBuffering(false);
              isAdvancingRef.current = false;
              const dur = playerInstanceRef.current?.getDuration() || 0;
              if (dur > 0) setDuration(dur);
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false);
              setIsBuffering(false);
              // Fallback: If YouTube paused near the end of track (within 8s or 95%), auto-advance:
              if (!isAdvancingRef.current) {
                const cur = playerInstanceRef.current?.getCurrentTime() || 0;
                const dur = playerInstanceRef.current?.getDuration() || 0;
                if ((dur > 30 && (cur >= dur - 8 || cur / dur >= 0.95)) || (dur <= 30 && cur >= dur - 2)) {
                  handleTrackEndedRef.current();
                }
              }
            } else if (event.data === window.YT.PlayerState.BUFFERING) {
              setIsBuffering(true);
            } else if (event.data === window.YT.PlayerState.ENDED) {
              if (!isAdvancingRef.current) {
                handleTrackEndedRef.current();
              }
            }
          },
          onError: (e: any) => {
            console.warn('YouTube Player error code:', e.data);
            setIsBuffering(false);
            isAdvancingRef.current = false;
            setTimeout(() => {
              nextTrackRef.current();
            }, 1000);
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  // Time tracker loop with automatic end-of-track watchdog
  useEffect(() => {
    if (currentTrack) {
      progressIntervalRef.current = setInterval(() => {
        if (playerInstanceRef.current && typeof playerInstanceRef.current.getCurrentTime === 'function') {
          const cur = playerInstanceRef.current.getCurrentTime() || 0;
          const dur = playerInstanceRef.current.getDuration() || 0;
          if (cur > 0) {
            setCurrentTime(cur);
          }
          if (dur > 0 && dur !== duration) {
            setDuration(dur);
          }
          // Watchdog: If playback reached within 1.0s of the end or cur >= dur:
          // OR if player paused/stalled near the end (within 8s or 95%):
          if (!isAdvancingRef.current && dur > 5) {
            const isNearEnd = cur >= dur - 1.0;
            const isPausedNearEnd = !isPlaying && ((dur > 30 && (cur >= dur - 8 || cur / dur >= 0.95)) || (dur <= 30 && cur >= dur - 2));
            if (isNearEnd || isPausedNearEnd) {
              handleTrackEndedRef.current();
            }
          }
        }
      }, 300);
    } else {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    }

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [currentTrack, isPlaying, duration]);

  // Update MediaSession API for OS and Lockscreen Controls
  useEffect(() => {
    if ('mediaSession' in navigator && currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        artwork: [
          { src: currentTrack.thumbnail, sizes: '512x512', type: 'image/jpeg' },
          { src: currentTrack.thumbnail, sizes: '192x192', type: 'image/jpeg' },
        ],
      });

      navigator.mediaSession.setActionHandler('play', () => togglePlay());
      navigator.mediaSession.setActionHandler('pause', () => togglePlay());
      navigator.mediaSession.setActionHandler('previoustrack', () => previousTrack());
      navigator.mediaSession.setActionHandler('nexttrack', () => nextTrack());
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined) seekTo(details.seekTime);
      });
    }
  }, [currentTrack]);

  // Play a Track
  const playTrack = useCallback(
    async (track: Track, newQueue?: Track[], targetIndex?: number) => {
      isAdvancingRef.current = true;
      if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = setTimeout(() => {
        isAdvancingRef.current = false;
      }, 7000);

      setCurrentTrack(track);
      currentTrackRef.current = track;
      setCurrentTime(0);
      setIsBuffering(true);
      if (onTrackPlayed) onTrackPlayed(track);

      // Setup Queue
      if (newQueue && newQueue.length > 0) {
        setQueue(newQueue);
        queueRef.current = newQueue;
        const resolvedIdx =
          targetIndex !== undefined
            ? targetIndex
            : Math.max(0, newQueue.findIndex((t) => t.id === track.id));
        setQueueIndex(resolvedIdx);
        queueIndexRef.current = resolvedIdx;
      } else {
        // Single track played - create queue
        const singleQ = [track];
        setQueue(singleQ);
        queueRef.current = singleQ;
        setQueueIndex(0);
        queueIndexRef.current = 0;
      }

      // Load YouTube Video in Player
      const loadVideo = () => {
        if (playerInstanceRef.current && typeof playerInstanceRef.current.loadVideoById === 'function') {
          playerInstanceRef.current.loadVideoById(track.id);
        } else {
          setTimeout(loadVideo, 200);
        }
      };
      loadVideo();

      // Fetch WatchNext recommendations (Genre Radio Queue) & Lyrics in background
      setIsLoadingLyrics(true);
      try {
        const nextData = await getWatchNext(track.id);

        // If no explicit queue was provided (single track play), append YouTube Music's Radio genre queue:
        if (!newQueue || newQueue.length <= 1) {
          if (nextData.queue.length > 0) {
            const radioTracks = nextData.queue
              .filter((t) => t.id !== track.id)
              .map((t) => ({ ...t, isAutoplayTrack: true }));
            const fullQ = [track, ...radioTracks];
            setQueue(fullQ);
            queueRef.current = fullQ;
            setQueueIndex(0);
            queueIndexRef.current = 0;
          }
        } else if (isAutoplayRef.current) {
          // If playing from an explicit playlist/album, pre-append similar genre radio tracks
          // to the end of the playlist so that when the playlist completes, it continues seamlessly!
          const currentIdx = queueIndexRef.current;
          if (currentIdx >= newQueue.length - 2) {
            const excludeIds = newQueue.map((t) => t.id);
            const radioTracks = (nextData.queue || [])
              .filter((t) => !excludeIds.includes(t.id))
              .map((t) => ({ ...t, isAutoplayTrack: true }));
            if (radioTracks.length > 0) {
              const mergedQ = [...newQueue, ...radioTracks];
              setQueue(mergedQ);
              queueRef.current = mergedQ;
            }
          }
        }

        // Fetch lyrics
        const lyrics = await getLyrics(nextData.lyricsBrowseId, track.title, track.artist);
        setLyricsData(lyrics);
      } catch (err) {
        console.warn('Failed to load auto-queue or lyrics:', err);
      } finally {
        setIsLoadingLyrics(false);
      }
    },
    [onTrackPlayed]
  );

  const togglePlay = useCallback(() => {
    if (!playerInstanceRef.current || typeof playerInstanceRef.current.getPlayerState !== 'function') return;

    if (isPlaying) {
      playerInstanceRef.current.pauseVideo();
      setIsPlaying(false);
    } else {
      playerInstanceRef.current.playVideo();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const seekTo = useCallback(
    (seconds: number) => {
      if (!playerInstanceRef.current || typeof playerInstanceRef.current.seekTo !== 'function') return;
      playerInstanceRef.current.seekTo(seconds, true);
      setCurrentTime(seconds);
      const dur = playerInstanceRef.current.getDuration() || duration;
      if (dur > 3 && seconds >= dur - 0.5) {
        handleTrackEndedRef.current();
      }
    },
    [duration]
  );

  const nextTrack = useCallback(async () => {
    const curQ = queueRef.current;
    const curIdx = queueIndexRef.current;
    if (curQ.length === 0) return;

    if (isAdvancingRef.current) return;
    isAdvancingRef.current = true;

    let nextIdx = curIdx + 1;
    if (isShuffleRef.current) {
      nextIdx = Math.floor(Math.random() * curQ.length);
      const nextSong = curQ[nextIdx];
      if (nextSong) {
        setQueueIndex(nextIdx);
        queueIndexRef.current = nextIdx;
        playTrack(nextSong, curQ, nextIdx);
      }
      return;
    }

    if (nextIdx < curQ.length) {
      const nextSong = curQ[nextIdx];
      setQueueIndex(nextIdx);
      queueIndexRef.current = nextIdx;
      playTrack(nextSong, curQ, nextIdx);

      // Pre-fetch more genre radio tracks when approaching the end of queue (within 3 songs)
      if (isAutoplayRef.current && nextIdx >= curQ.length - 3) {
        try {
          const lastTrack = curQ[curQ.length - 1];
          const excludeIds = curQ.map((t) => t.id);
          const moreRadio = await getGenreRadio(lastTrack, excludeIds);
          if (moreRadio.length > 0) {
            setQueue((prev) => {
              const updated = [...prev, ...moreRadio];
              queueRef.current = updated;
              return updated;
            });
          }
        } catch (e) {
          console.warn('Pre-fetch more radio failed:', e);
        }
      }
    } else {
      // Reached the end of queue!
      if (isAutoplayRef.current && currentTrackRef.current) {
        // Endless Autoplay: Automatically fetch more songs in the exact same genre & mood!
        setIsBuffering(true);
        try {
          const excludeIds = curQ.map((t) => t.id);
          const newRadio = await getGenreRadio(currentTrackRef.current, excludeIds);
          if (newRadio.length > 0) {
            const nextSong = newRadio[0];
            const updatedQueue = [...curQ, ...newRadio];
            setQueue(updatedQueue);
            queueRef.current = updatedQueue;
            setQueueIndex(curQ.length);
            queueIndexRef.current = curQ.length;
            playTrack(nextSong, updatedQueue, curQ.length);
            return;
          }
        } catch (e) {
          console.warn('Autoplay generation failed:', e);
        }
      }

      if (repeatModeRef.current === 'all') {
        const firstSong = curQ[0];
        setQueueIndex(0);
        queueIndexRef.current = 0;
        playTrack(firstSong, curQ, 0);
      } else {
        isAdvancingRef.current = false;
      }
    }
  }, [playTrack]);

  // Keep callback refs always pointing to latest instances
  nextTrackRef.current = nextTrack;

  // Handle Track Completion
  const handleTrackEnded = useCallback(() => {
    if (repeatModeRef.current === 'one') {
      seekTo(0);
      playerInstanceRef.current?.playVideo();
      isAdvancingRef.current = false;
      return;
    }
    nextTrack();
  }, [nextTrack, seekTo]);

  handleTrackEndedRef.current = handleTrackEnded;

  const previousTrack = useCallback(() => {
    const curQ = queueRef.current;
    const curIdx = queueIndexRef.current;
    // If playing for more than 3 seconds, rewind to start
    if (currentTime > 3) {
      seekTo(0);
      return;
    }

    if (curQ.length === 0) return;
    const prevIdx = curIdx - 1;
    if (prevIdx >= 0) {
      setQueueIndex(prevIdx);
      queueIndexRef.current = prevIdx;
      playTrack(curQ[prevIdx], curQ, prevIdx);
    } else {
      seekTo(0);
    }
  }, [currentTime, playTrack, seekTo]);

  const setVolume = useCallback(
    (vol: number) => {
      setVolumeState(vol);
      if (playerInstanceRef.current && typeof playerInstanceRef.current.setVolume === 'function') {
        playerInstanceRef.current.setVolume(vol);
      }
      if (vol > 0 && isMuted) {
        setIsMuted(false);
        playerInstanceRef.current?.unMute();
      }
    },
    [isMuted]
  );

  const toggleMute = useCallback(() => {
    if (!playerInstanceRef.current) return;
    if (isMuted) {
      playerInstanceRef.current.unMute();
      playerInstanceRef.current.setVolume(volume || 80);
      setIsMuted(false);
    } else {
      playerInstanceRef.current.mute();
      setIsMuted(true);
    }
  }, [isMuted, volume]);

  const toggleShuffle = useCallback(() => {
    setIsShuffle((prev) => !prev);
  }, []);

  const toggleRepeat = useCallback(() => {
    setRepeatMode((prev) => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  }, []);

  const addToQueue = useCallback((track: Track) => {
    setQueue((prev) => [...prev, track]);
  }, []);

  const playNextInQueue = useCallback(
    (track: Track) => {
      setQueue((prev) => {
        const nextQ = [...prev];
        nextQ.splice(queueIndex + 1, 0, track);
        return nextQ;
      });
    },
    [queueIndex]
  );

  const removeFromQueue = useCallback(
    (index: number) => {
      setQueue((prev) => {
        const nextQ = [...prev];
        nextQ.splice(index, 1);
        return nextQ;
      });
      if (index < queueIndex) {
        setQueueIndex((prev) => prev - 1);
      }
    },
    [queueIndex]
  );

  const clearQueue = useCallback(() => {
    if (currentTrack) {
      setQueue([currentTrack]);
      setQueueIndex(0);
    } else {
      setQueue([]);
      setQueueIndex(0);
    }
  }, [currentTrack]);

  const reorderQueue = useCallback((startIndex: number, endIndex: number) => {
    setQueue((prev) => {
      const nextQ = [...prev];
      const [removed] = nextQ.splice(startIndex, 1);
      nextQ.splice(endIndex, 0, removed);
      return nextQ;
    });
  }, []);

  return (
    <PlayerContext.Provider
      value={{
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
        isBuffering,
        playTrack,
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
        addToQueue,
        playNextInQueue,
        removeFromQueue,
        clearQueue,
        reorderQueue,
        ytPlayerRef,
      }}
    >
      {children}
      {/* Hidden YouTube Iframe Mount Node (will be moved or projected based on Song vs Video mode) */}
      <div
        style={{
          position: mode === 'video' && isExpanded ? 'relative' : 'fixed',
          top: mode === 'video' && isExpanded ? 0 : -9999,
          left: mode === 'video' && isExpanded ? 0 : -9999,
          width: mode === 'video' && isExpanded ? '100%' : '1px',
          height: mode === 'video' && isExpanded ? '100%' : '1px',
          opacity: mode === 'video' && isExpanded ? 1 : 0.01,
          pointerEvents: mode === 'video' && isExpanded ? 'auto' : 'none',
          zIndex: mode === 'video' && isExpanded ? 10 : -1,
        }}
        id="yt-player-container-wrapper"
      >
        <div id="yt-player-iframe-node"></div>
      </div>
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer must be used within PlayerProvider');
  return context;
};
