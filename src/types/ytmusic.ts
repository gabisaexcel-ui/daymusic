export interface Track {
  id: string; // YouTube Video ID
  title: string;
  artist: string;
  artists?: { name: string; id?: string }[];
  album?: { name: string; id?: string };
  duration?: number; // seconds
  durationText?: string;
  thumbnail: string;
  thumbnails?: { url: string; width?: number; height?: number }[];
  isExplicit?: boolean;
  isAutoplayTrack?: boolean;
}

export interface PlaylistItem {
  id: string;
  title: string;
  subtitle?: string;
  thumbnail: string;
  trackCount?: string;
}

export interface AlbumItem {
  id: string;
  title: string;
  artist: string;
  year?: string;
  thumbnail: string;
}

export interface ArtistItem {
  id: string;
  name: string;
  subscribers?: string;
  thumbnail: string;
}

export interface Shelf {
  title: string;
  subtitle?: string;
  items: Track[];
}

export interface LyricsLine {
  time: number; // in seconds
  text: string;
}

export interface LyricsData {
  plain: string;
  synced: LyricsLine[] | null;
  source: 'InnerTube' | 'LRCLIB' | 'Offline';
}

export interface UserPlaylist {
  id: string;
  name: string;
  description?: string;
  tracks: Track[];
  createdAt: number;
}
