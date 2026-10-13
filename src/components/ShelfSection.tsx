import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Track } from '../types/ytmusic';
import { SongCard } from './SongCard';

interface ShelfSectionProps {
  title: string;
  subtitle?: string;
  items: Track[];
  onPlayTrack: (track: Track, allTracks: Track[]) => void;
  onOpenPlaylistModal?: (track: Track) => void;
}

export const ShelfSection: React.FC<ShelfSectionProps> = ({
  title,
  subtitle,
  items,
  onPlayTrack,
  onOpenPlaylistModal,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -420 : 420;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <section className="shelf-container">
      <div className="shelf-header">
        <div className="shelf-title-group">
          {subtitle && <span className="shelf-subtitle">{subtitle}</span>}
          <h2 className="shelf-title">{title}</h2>
        </div>
        <div className="shelf-nav-buttons">
          <button
            className="shelf-nav-btn"
            onClick={() => handleScroll('left')}
            title="Scroll left"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            className="shelf-nav-btn"
            onClick={() => handleScroll('right')}
            title="Scroll right"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="shelf-scroll" ref={scrollRef}>
        {items.map((track) => (
          <SongCard
            key={track.id}
            track={track}
            onPlay={() => onPlayTrack(track, items)}
            onOpenPlaylistModal={onOpenPlaylistModal}
          />
        ))}
      </div>
    </section>
  );
};
