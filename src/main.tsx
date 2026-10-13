import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { LibraryProvider, useLibrary } from './context/LibraryContext';
import { PlayerProvider } from './context/PlayerContext';
import './index.css';

const RootApp: React.FC = () => {
  const { addToHistory } = useLibrary();

  return (
    <PlayerProvider onTrackPlayed={addToHistory}>
      <App />
    </PlayerProvider>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LibraryProvider>
      <RootApp />
    </LibraryProvider>
  </React.StrictMode>
);
