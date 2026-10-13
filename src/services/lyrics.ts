import { LyricsData, LyricsLine } from '../types/ytmusic';

/**
 * Parses LRC format lyrics into array of time-coded lines
 * Example format: "[01:23.45] Some lyric text"
 */
export function parseLrc(lrcText: string): LyricsLine[] {
  const lines = lrcText.split('\n');
  const result: LyricsLine[] = [];
  const timeRegex = /\[(\d{2}):(\d{2})\.?(\d{2,3})?\]/g;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const matches = [...trimmed.matchAll(timeRegex)];
    const text = trimmed.replace(timeRegex, '').trim();

    if (matches.length > 0) {
      for (const match of matches) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const milliseconds = match[3] ? parseInt(match[3].padEnd(3, '0').slice(0, 3), 10) : 0;
        const totalSeconds = minutes * 60 + seconds + milliseconds / 1000;
        result.push({ time: totalSeconds, text });
      }
    }
  }

  // Sort by time ascending
  return result.sort((a, b) => a.time - b.time);
}

/**
 * Fetches synced lyrics from LRCLIB open database
 */
export async function fetchLrclibLyrics(trackName: string, artistName: string, duration?: number): Promise<LyricsData | null> {
  try {
    // Clean track title (strip "(Official Music Video)", "[Audio]", etc.)
    const cleanTrack = trackName
      .replace(/\(Official.*?\)/gi, '')
      .replace(/\[Official.*?\]/gi, '')
      .replace(/\(Audio\)/gi, '')
      .replace(/\[Audio\]/gi, '')
      .replace(/\(Lyric.*?\)/gi, '')
      .replace(/\[Lyric.*?\]/gi, '')
      .replace(/\(feat\..*?\)/gi, '')
      .replace(/\[feat\..*?\)/gi, '')
      .trim();

    const cleanArtist = artistName
      .replace(/ - Topic$/i, '')
      .replace(/VEVO$/i, '')
      .trim();

    const params = new URLSearchParams({
      track_name: cleanTrack,
      artist_name: cleanArtist,
    });
    if (duration) {
      params.set('duration', Math.round(duration).toString());
    }

    const response = await fetch(`https://lrclib.net/api/get?${params.toString()}`);
    if (!response.ok) {
      // Try search endpoint if exact get fails
      const searchRes = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(`${cleanArtist} ${cleanTrack}`)}`);
      if (searchRes.ok) {
        const list = await searchRes.json();
        if (Array.isArray(list) && list.length > 0) {
          const item = list[0];
          return {
            plain: item.plainLyrics || item.syncedLyrics || '',
            synced: item.syncedLyrics ? parseLrc(item.syncedLyrics) : null,
            source: 'LRCLIB',
          };
        }
      }
      return null;
    }

    const data = await response.json();
    return {
      plain: data.plainLyrics || data.syncedLyrics || '',
      synced: data.syncedLyrics ? parseLrc(data.syncedLyrics) : null,
      source: 'LRCLIB',
    };
  } catch (err) {
    console.warn('LRCLIB fetch failed:', err);
    return null;
  }
}
