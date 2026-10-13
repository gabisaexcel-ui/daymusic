import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Settings, Download, Music2, ArrowLeft } from 'lucide-react';
import { getSearchSuggestions } from '../services/ytmusic';

interface NavbarProps {
  onSearch: (query: string) => void;
  onOpenSettings: () => void;
  onHomeClick: () => void;
  activeChip?: string;
  onSelectChip?: (chip: string) => void;
}

const CATEGORY_CHIPS = ['Energize', 'Workout', 'Relax', 'Focus', 'Commute', 'Pop', 'Indonesian Hits', 'Rock', 'R&B'];

export const Navbar: React.FC<NavbarProps> = ({
  onSearch,
  onOpenSettings,
  onHomeClick,
  activeChip,
  onSelectChip,
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Capture PWA install prompt
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) {
      alert('To install this app on your phone or PC, tap your browser menu (3 dots) and select "Add to Home Screen" or "Install App".');
      return;
    }
    installPrompt.prompt();
    const result = await installPrompt.userChoice;
    if (result.outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  // Debounced search suggestions
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      const results = await getSearchSuggestions(query);
      setSuggestions(results.slice(0, 7));
      setShowDropdown(true);
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (query.trim()) {
      setShowDropdown(false);
      setIsMobileSearchOpen(false);
      onSearch(query.trim());
    }
  };

  const handleSelectSuggestion = (text: string) => {
    setQuery(text);
    setShowDropdown(false);
    setIsMobileSearchOpen(false);
    onSearch(text);
  };

  return (
    <header className="navbar-wrapper">
      {/* FULL-WIDTH MOBILE SEARCH VIEW (WHEN ACTIVE ON MOBILE) */}
      {isMobileSearchOpen ? (
        <div className="navbar navbar-mobile-search-active">
          <button
            type="button"
            className="mobile-search-back-btn"
            onClick={() => {
              setIsMobileSearchOpen(false);
              setQuery('');
              setSuggestions([]);
            }}
            title="Close search"
          >
            <ArrowLeft size={20} />
          </button>

          <form onSubmit={handleSubmit} className="nav-search-bar mobile-active-search-bar">
            <Search size={18} color="var(--text-muted)" />
            <input
              type="text"
              autoFocus
              className="nav-search-input"
              placeholder="Search songs, albums, artists..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                if (suggestions.length > 0) setShowDropdown(true);
              }}
            />
            {query && (
              <button
                type="button"
                className="nav-search-clear"
                onClick={() => {
                  setQuery('');
                  setSuggestions([]);
                }}
              >
                <X size={16} />
              </button>
            )}
          </form>

          {/* Autocomplete Dropdown for Mobile Search */}
          {showDropdown && suggestions.length > 0 && (
            <div className="search-suggestions-dropdown mobile-search-dropdown">
              {suggestions.map((item, idx) => (
                <div
                  key={idx}
                  className="suggestion-item"
                  onClick={() => handleSelectSuggestion(item)}
                >
                  <Search size={16} color="var(--text-muted)" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* STANDARD NAVBAR VIEW */
        <div className="navbar">
          {/* Brand */}
          <div className="nav-brand" onClick={onHomeClick}>
            <img
              src="/logo.png"
              alt="DaySheet Logo"
              className="nav-brand-img"
            />
            <div className="nav-brand-title-wrap">
              <div className="nav-brand-row">
                <span className="nav-brand-text">
                  <span style={{ color: '#38bdf8' }}>Day</span>
                  <span style={{ color: '#2dd4bf' }}>Music</span>
                </span>
                <span className="nav-brand-badge hide-on-mobile">Personal</span>
              </div>
              <span className="nav-brand-sub">
                by DaySheet Group
              </span>
            </div>
          </div>

          {/* Desktop Search Bar */}
          <div className="nav-search-container" ref={dropdownRef}>
            <form onSubmit={handleSubmit} className="nav-search-bar">
              <Search size={18} color="var(--text-muted)" />
              <input
                type="text"
                className="nav-search-input"
                placeholder="Search songs, albums, artists, podcasts"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => {
                  if (suggestions.length > 0) setShowDropdown(true);
                }}
              />
              {query && (
                <button
                  type="button"
                  className="nav-search-clear"
                  onClick={() => {
                    setQuery('');
                    setSuggestions([]);
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </form>

            {/* Autocomplete Dropdown */}
            {showDropdown && suggestions.length > 0 && (
              <div className="search-suggestions-dropdown">
                {suggestions.map((item, idx) => (
                  <div
                    key={idx}
                    className="suggestion-item"
                    onClick={() => handleSelectSuggestion(item)}
                  >
                    <Search size={16} color="var(--text-muted)" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Actions: Mobile Search Trigger, Install App & Settings */}
          <div className="nav-right-actions">
            {/* Mobile Search Button */}
            <button
              type="button"
              className="nav-action-icon-btn nav-mobile-search-btn"
              onClick={() => setIsMobileSearchOpen(true)}
              title="Search"
            >
              <Search size={18} />
            </button>

            {/* Install App Button */}
            <button
              onClick={handleInstallClick}
              className="nav-install-btn"
              title="Install DayMusic Web APK / PWA"
            >
              <Download size={15} />
              <span className="nav-install-text">Install App</span>
            </button>

            {/* Settings Button */}
            <button
              onClick={onOpenSettings}
              className="nav-action-icon-btn"
              title="Settings & Cloudflare info"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Category Chips Bar */}
      <div className="category-chips-bar">
        {CATEGORY_CHIPS.map((chip) => (
          <button
            key={chip}
            className={`category-chip ${activeChip === chip ? 'active' : ''}`}
            onClick={() => {
              if (onSelectChip) onSelectChip(chip);
            }}
          >
            {chip}
          </button>
        ))}
      </div>
    </header>
  );
};
