import React from 'react';
import { Home, Compass, Library } from 'lucide-react';

interface BottomNavProps {
  currentTab: 'home' | 'explore' | 'library';
  onSelectTab: (tab: 'home' | 'explore' | 'library') => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab }) => {
  return (
    <nav className="mobile-bottom-nav">
      <button
        className={`mobile-nav-btn ${currentTab === 'home' ? 'active' : ''}`}
        onClick={() => onSelectTab('home')}
      >
        <Home size={22} />
        <span>Home</span>
      </button>

      <button
        className={`mobile-nav-btn ${currentTab === 'explore' ? 'active' : ''}`}
        onClick={() => onSelectTab('explore')}
      >
        <Compass size={22} />
        <span>Explore</span>
      </button>

      <button
        className={`mobile-nav-btn ${currentTab === 'library' ? 'active' : ''}`}
        onClick={() => onSelectTab('library')}
      >
        <Library size={22} />
        <span>Library</span>
      </button>
    </nav>
  );
};
