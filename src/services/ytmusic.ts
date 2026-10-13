import { Track, Shelf, LyricsData } from '../types/ytmusic';
import { fetchLrclibLyrics } from './lyrics';

const INNERTUBE_CONTEXT = {
  client: {
    clientName: 'WEB_REMIX',
    clientVersion: '1.20240101.01.00',
    hl: 'en',
    gl: 'US',
  },
};

/**
 * Call YouTube Music API via Cloudflare Pages Function edge proxy or Vite proxy
 */
async function callInnerTube(endpoint: string, body: Record<string, any> = {}): Promise<any> {
  const response = await fetch(`/api/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      context: INNERTUBE_CONTEXT,
      ...body,
    }),
  });

  if (!response.ok) {
    throw new Error(`InnerTube API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Extracts highest quality thumbnail URL or upgrades size parameters
 */
function upgradeThumbnail(url?: string, videoId?: string): string {
  if (!url) {
    return videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : 'https://placehold.co/400x400/181818/ffffff?text=YT+Music';
  }
  // Upgrades Google User Content thumbnail dimensions to high-res 544x544
  return url.replace(/=w\d+-h\d+[^"]*/, '=w544-h544-l90-rj');
}

/**
 * Parses track metadata from musicResponsiveListItemRenderer
 */
function parseResponsiveTrack(renderer: any): Track | null {
  if (!renderer) return null;

  try {
    const flexColumns = renderer.flexColumns || [];
    if (!flexColumns.length) return null;

    // Column 0: Title & VideoId
    const col0Text = flexColumns[0]?.musicResponsiveListItemFlexColumnRenderer?.text;
    const title = col0Text?.runs?.map((r: any) => r.text).join('') || '';

    const watchEndpoint =
      col0Text?.runs?.[0]?.navigationEndpoint?.watchEndpoint ||
      renderer.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer?.playNavigationEndpoint?.watchEndpoint ||
      renderer.playlistItemData;

    const id = watchEndpoint?.videoId || renderer.playlistItemData?.videoId;
    if (!id || !title) return null;

    // Column 1: Artist, Album, Year, Plays
    const col1Text = flexColumns[1]?.musicResponsiveListItemFlexColumnRenderer?.text;
    const artistRuns = col1Text?.runs || [];
    let artist = '';
    let albumName = '';

    for (let i = 0; i < artistRuns.length; i++) {
      const run = artistRuns[i];
      const pageType = run.navigationEndpoint?.browseEndpoint?.browseEndpointContextSupportedConfigs?.browseEndpointContextMusicConfig?.pageType;
      if (pageType === 'MUSIC_PAGE_TYPE_ARTIST' || !artist) {
        if (!artist && run.text !== ' • ') {
          artist = run.text;
        }
      } else if (pageType === 'MUSIC_PAGE_TYPE_ALBUM') {
        albumName = run.text;
      }
    }
    if (!artist) {
      artist = artistRuns.map((r: any) => r.text).join('').split('•')[0].trim() || 'YouTube Music';
    }

    // Thumbnails
    const rawThumbnails =
      renderer.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails ||
      renderer.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail?.thumbnails ||
      [];
    const lastThumb = rawThumbnails[rawThumbnails.length - 1]?.url;
    const thumbnail = upgradeThumbnail(lastThumb, id);

    return {
      id,
      title,
      artist,
      album: albumName ? { name: albumName } : undefined,
      thumbnail,
      thumbnails: rawThumbnails,
    };
  } catch (err) {
    return null;
  }
}

/**
 * Parses track from musicTwoRowItemRenderer (used in carousels & grids)
 */
function parseTwoRowTrack(renderer: any): Track | null {
  if (!renderer) return null;

  try {
    const title = renderer.title?.runs?.map((r: any) => r.text).join('') || '';
    const watchEndpoint =
      renderer.navigationEndpoint?.watchEndpoint ||
      renderer.thumbnailOverlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer?.playNavigationEndpoint?.watchEndpoint;

    const id = watchEndpoint?.videoId;
    if (!id || !title) return null;

    const artist = renderer.subtitle?.runs?.map((r: any) => r.text).join('') || 'YouTube Music';
    const rawThumbs = renderer.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];
    const lastThumb = rawThumbs[rawThumbs.length - 1]?.url;
    const thumbnail = upgradeThumbnail(lastThumb, id);

    return {
      id,
      title,
      artist,
      thumbnail,
      thumbnails: rawThumbs,
    };
  } catch {
    return null;
  }
}

/**
 * Fetch Home page shelves
 */
export async function getHomeFeed(): Promise<Shelf[]> {
  try {
    const data = await callInnerTube('browse', { browseId: 'FEmusic_home' });
    const sections =
      data?.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];

    const shelves: Shelf[] = [];

    for (const section of sections) {
      const carousel = section.musicCarouselShelfRenderer;
      if (!carousel) continue;

      const title =
        carousel.header?.musicCarouselShelfBasicHeaderRenderer?.title?.runs?.map((r: any) => r.text).join('') ||
        carousel.header?.musicCarouselShelfBasicHeaderRenderer?.strapline?.runs?.map((r: any) => r.text).join('') ||
        'Featured';

      const items: Track[] = [];
      const contents = carousel.contents || [];

      for (const item of contents) {
        let track = parseResponsiveTrack(item.musicResponsiveListItemRenderer);
        if (!track) {
          track = parseTwoRowTrack(item.musicTwoRowItemRenderer);
        }
        if (track) {
          items.push(track);
        }
      }

      if (items.length > 0) {
        shelves.push({ title, items });
      }
    }

    if (shelves.length > 0) return shelves;
  } catch (err) {
    console.warn('Failed to load live Home feed:', err);
  }

  // Curated fallback tracks if initial load experiences offline or latency
  return getCuratedDefaultFeed();
}

/**
 * Fetch Explore page (New releases, trending)
 */
export async function getExploreFeed(): Promise<Shelf[]> {
  try {
    const data = await callInnerTube('browse', { browseId: 'FEmusic_explore' });
    const sections =
      data?.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];

    const shelves: Shelf[] = [];
    for (const section of sections) {
      const carousel = section.musicCarouselShelfRenderer;
      if (!carousel) continue;

      const title = carousel.header?.musicCarouselShelfBasicHeaderRenderer?.title?.runs?.map((r: any) => r.text).join('') || 'Explore';
      const items: Track[] = [];

      for (const item of carousel.contents || []) {
        const track = parseResponsiveTrack(item.musicResponsiveListItemRenderer) || parseTwoRowTrack(item.musicTwoRowItemRenderer);
        if (track) items.push(track);
      }

      if (items.length > 0) {
        shelves.push({ title, items });
      }
    }

    if (shelves.length > 0) return shelves;
  } catch (err) {
    console.warn('Failed to load explore feed:', err);
  }

  return [
    {
      title: 'Top Hits & Trending',
      items: getCuratedDefaultFeed()[0].items,
    },
  ];
}

/**
 * Fetch Charts
 */
export async function getChartsFeed(): Promise<Shelf[]> {
  try {
    const data = await callInnerTube('browse', { browseId: 'FEmusic_charts' });
    const sections =
      data?.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];

    const shelves: Shelf[] = [];
    for (const section of sections) {
      const carousel = section.musicCarouselShelfRenderer;
      if (!carousel) continue;

      const title = carousel.header?.musicCarouselShelfBasicHeaderRenderer?.title?.runs?.map((r: any) => r.text).join('') || 'Charts';
      const items: Track[] = [];

      for (const item of carousel.contents || []) {
        const track = parseResponsiveTrack(item.musicResponsiveListItemRenderer) || parseTwoRowTrack(item.musicTwoRowItemRenderer);
        if (track) items.push(track);
      }

      if (items.length > 0) {
        shelves.push({ title, items });
      }
    }

    if (shelves.length > 0) return shelves;
  } catch (err) {
    console.warn('Failed to load charts feed:', err);
  }

  return [];
}

/**
 * Search YouTube Music for tracks, artists, and albums
 */
export async function searchMusic(query: string): Promise<{ topResult?: Track; songs: Track[] }> {
  try {
    const data = await callInnerTube('search', { query });
    const sections =
      data?.contents?.tabbedSearchResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];

    let topResult: Track | undefined;
    const songs: Track[] = [];

    for (const sec of sections) {
      // Check for Top Result Card
      if (sec.musicCardShelfRenderer) {
        const card = sec.musicCardShelfRenderer;
        const title = card.title?.runs?.map((r: any) => r.text).join('') || '';
        const id = card.onTap?.watchEndpoint?.videoId;
        const artist = card.subtitle?.runs?.map((r: any) => r.text).join('') || '';
        const thumb = card.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails?.slice(-1)[0]?.url;

        if (id && title) {
          topResult = {
            id,
            title,
            artist,
            thumbnail: upgradeThumbnail(thumb, id),
          };
        }
      }

      // Check itemSectionRenderer or musicShelfRenderer
      const contents =
        sec.musicShelfRenderer?.contents ||
        sec.itemSectionRenderer?.contents ||
        [];

      for (const item of contents) {
        const track = parseResponsiveTrack(item.musicResponsiveListItemRenderer) || parseTwoRowTrack(item.musicTwoRowItemRenderer);
        if (track && !songs.some((s) => s.id === track.id)) {
          songs.push(track);
        }
      }
    }

    return { topResult, songs };
  } catch (err) {
    console.error('Search failed:', err);
    return { songs: [] };
  }
}

/**
 * Fetch search autocomplete suggestions
 */
export async function getSearchSuggestions(query: string): Promise<string[]> {
  if (!query || query.trim().length === 0) return [];

  try {
    const data = await callInnerTube('music/get_search_suggestions', { input: query });
    const contents = data?.contents?.[0]?.searchSuggestionsSectionRenderer?.contents || [];
    const suggestions: string[] = [];

    for (const item of contents) {
      const runs = item?.searchSuggestionRenderer?.suggestion?.runs || [];
      const text = runs.map((r: any) => r.text).join('');
      if (text) suggestions.push(text);
    }

    return suggestions;
  } catch {
    return [];
  }
}

/**
/**
 * Fetch next tracks (Queue and Lyrics browse ID) for a video.
 * Uses YouTube Music's RDAMVM radio mix for genre-accurate continuous stream.
 */
export async function getWatchNext(
  videoId: string,
  playlistId?: string
): Promise<{ queue: Track[]; lyricsBrowseId?: string; relatedBrowseId?: string }> {
  try {
    const payload: Record<string, any> = { videoId };
    if (playlistId) {
      payload.playlistId = playlistId;
    } else {
      payload.playlistId = `RDAMVM${videoId}`;
    }

    const data = await callInnerTube('next', payload);
    const tabs =
      data?.contents?.singleColumnMusicWatchNextResultsRenderer?.tabbedRenderer?.watchNextTabbedResultsRenderer?.tabs || [];

    let lyricsBrowseId: string | undefined;
    let relatedBrowseId: string | undefined;
    const queue: Track[] = [];

    for (const tab of tabs) {
      const title = tab?.tabRenderer?.title?.toLowerCase() || '';
      if (title.includes('lyrics')) {
        lyricsBrowseId = tab?.tabRenderer?.endpoint?.browseEndpoint?.browseId;
      } else if (title.includes('related')) {
        relatedBrowseId = tab?.tabRenderer?.endpoint?.browseEndpoint?.browseId;
      } else if (title.includes('up next') || title.includes('queue')) {
        const queueContents =
          tab?.tabRenderer?.content?.musicQueueRenderer?.content?.playlistPanelRenderer?.contents || [];

        for (const item of queueContents) {
          const renderer = item?.playlistPanelVideoRenderer;
          if (!renderer) continue;

          const title = renderer.title?.runs?.map((r: any) => r.text).join('') || '';
          const id = renderer.videoId;
          const artist = renderer.longBylineText?.runs?.map((r: any) => r.text).join('') || '';
          const thumbs = renderer.thumbnail?.thumbnails || [];
          const thumb = thumbs[thumbs.length - 1]?.url;

          if (id && title) {
            queue.push({
              id,
              title,
              artist,
              thumbnail: upgradeThumbnail(thumb, id),
            });
          }
        }
      }
    }

    return { queue, lyricsBrowseId, relatedBrowseId };
  } catch (err) {
    console.warn('Failed to fetch WatchNext:', err);
    return { queue: [] };
  }
}

/**
 * Generates an endless genre-based radio playlist based on a track's genre & mood
 */
export async function getGenreRadio(track: Track, excludeIds: string[] = []): Promise<Track[]> {
  try {
    const result = await getWatchNext(track.id, `RDAMVM${track.id}`);
    const filtered = (result.queue || [])
      .filter((t) => t.id !== track.id && !excludeIds.includes(t.id))
      .map((t) => ({ ...t, isAutoplayTrack: true }));
    return filtered;
  } catch (err) {
    console.warn('Failed to generate genre radio:', err);
    return [];
  }
}

/**
 * Fetch lyrics with InnerTube and LRCLIB fallback for synced timing
 */
export async function getLyrics(
  lyricsBrowseId?: string,
  trackTitle?: string,
  artistName?: string,
  duration?: number
): Promise<LyricsData> {
  // Try InnerTube lyrics first if ID is available
  if (lyricsBrowseId) {
    try {
      const data = await callInnerTube('browse', { browseId: lyricsBrowseId });
      const runs = data?.contents?.sectionListRenderer?.contents?.[0]?.musicDescriptionShelfRenderer?.description?.runs;
      if (runs && runs.length > 0) {
        const plain = runs.map((r: any) => r.text).join('');
        if (plain && !plain.toLowerCase().includes('lyrics not available')) {
          // InnerTube lyrics are plain text, try checking LRCLIB for synced timing if possible
          if (trackTitle && artistName) {
            const syncedLib = await fetchLrclibLyrics(trackTitle, artistName, duration);
            if (syncedLib && syncedLib.synced && syncedLib.synced.length > 0) {
              return syncedLib;
            }
          }

          return {
            plain,
            synced: null,
            source: 'InnerTube',
          };
        }
      }
    } catch (err) {
      console.warn('InnerTube lyrics fetch failed:', err);
    }
  }

  // Fallback to LRCLIB
  if (trackTitle && artistName) {
    const lrcLibResult = await fetchLrclibLyrics(trackTitle, artistName, duration);
    if (lrcLibResult) {
      return lrcLibResult;
    }
  }

  return {
    plain: 'Lyrics not available for this song.',
    synced: null,
    source: 'Offline',
  };
}

/**
 * Curated fallback feed to guarantee zero blank screens
 */
function getCuratedDefaultFeed(): Shelf[] {
  return [
    {
      title: 'Quick Picks & Trending Now',
      items: [
        {
          id: 'JGwWNGJdvx8',
          title: 'Shape of You',
          artist: 'Ed Sheeran',
          thumbnail: 'https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg',
        },
        {
          id: 'YQHsXMglC9A',
          title: 'Hello',
          artist: 'Adele',
          thumbnail: 'https://i.ytimg.com/vi/YQHsXMglC9A/hqdefault.jpg',
        },
        {
          id: 'kffacxfA7G4',
          title: 'Baby',
          artist: 'Justin Bieber ft. Ludacris',
          thumbnail: 'https://i.ytimg.com/vi/kffacxfA7G4/hqdefault.jpg',
        },
        {
          id: 'fJ9rUzIMcZQ',
          title: 'Bohemian Rhapsody',
          artist: 'Queen',
          thumbnail: 'https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg',
        },
        {
          id: 'hT_nvWreIhg',
          title: 'Counting Stars',
          artist: 'OneRepublic',
          thumbnail: 'https://i.ytimg.com/vi/hT_nvWreIhg/hqdefault.jpg',
        },
        {
          id: '09R8_2nJtjg',
          title: 'Sugar',
          artist: 'Maroon 5',
          thumbnail: 'https://i.ytimg.com/vi/09R8_2nJtjg/hqdefault.jpg',
        },
      ],
    },
    {
      title: 'Global Hits & Anthems',
      items: [
        {
          id: 'OPf0YbXqDm0',
          title: 'Uptown Funk',
          artist: 'Mark Ronson ft. Bruno Mars',
          thumbnail: 'https://i.ytimg.com/vi/OPf0YbXqDm0/hqdefault.jpg',
        },
        {
          id: '2Vv-BfVoq4g',
          title: 'Perfect',
          artist: 'Ed Sheeran',
          thumbnail: 'https://i.ytimg.com/vi/2Vv-BfVoq4g/hqdefault.jpg',
        },
        {
          id: 'DyDfgMOUjCI',
          title: 'Billie Jean',
          artist: 'Michael Jackson',
          thumbnail: 'https://i.ytimg.com/vi/DyDfgMOUjCI/hqdefault.jpg',
        },
        {
          id: 'kJQP7kiw5Fk',
          title: 'Despacito',
          artist: 'Luis Fonsi ft. Daddy Yankee',
          thumbnail: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg',
        },
      ],
    },
  ];
}
