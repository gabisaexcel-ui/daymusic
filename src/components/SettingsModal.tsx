import React, { useRef, useState } from 'react';
import { X, Cloud, Download, Upload, ShieldCheck, Smartphone, CheckCircle, Terminal } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { exportBackup, importBackup, favorites, playlists, history } = useLibrary();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importBackup(content);
      if (success) {
        setImportStatus('Backup restored successfully!');
      } else {
        setImportStatus('Failed to parse backup JSON file.');
      }
      setTimeout(() => setImportStatus(null), 3500);
    };
    reader.readAsText(file);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>DayMusic Settings & Cloudflare Setup</span>
          </h2>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Cloudflare Pages Section */}
        <div style={{ padding: '16px', background: 'var(--bg-surface)', borderRadius: 10, border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#F38020', fontWeight: 600, fontSize: '14px' }}>
            <Cloud size={18} />
            <span>Cloudflare Pages Personal Deployment</span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Web app ini dibuat khusus dengan arsitektur <strong>Cloudflare Pages Functions</strong> di <code>/functions/api/</code> sehingga otomatis menangani proxy YouTube Music InnerTube tanpa perlu server Python terpisah.
          </p>
          <div style={{ background: '#080808', padding: '10px 14px', borderRadius: 6, fontSize: '12px', fontFamily: 'monospace', color: '#4ade80', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Terminal size={14} />
            <span>npx wrangler pages deploy dist</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            ✓ CORS bypass otomatis di Cloudflare Workers Edge Network<br />
            ✓ Kuota Cloudflare Pages: 100,000 request/hari gratis
          </div>
        </div>

        {/* Web APK / PWA Section */}
        <div style={{ padding: '16px', background: 'var(--bg-surface)', borderRadius: 10, border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#38bdf8', fontWeight: 600, fontSize: '14px' }}>
            <Smartphone size={18} />
            <span>Install Sebagai Web APK (PWA)</span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Bisa di-install di HP Android / iOS / Laptop seperti aplikasi DayMusic bawaan:
          </p>
          <ul style={{ paddingLeft: '20px', fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <li><strong>Android (Chrome):</strong> Tekan titik tiga di pojok atas &gt; "Install app" / "Tambahkan ke Layar Utama".</li>
            <li><strong>iPhone (Safari):</strong> Tekan tombol Share (kotak panah ke atas) &gt; "Add to Home Screen".</li>
            <li><strong>Desktop:</strong> Klik ikon install di address bar Chrome / Edge.</li>
          </ul>
        </div>

        {/* Library Backup & Restore */}
        <div style={{ padding: '16px', background: 'var(--bg-surface)', borderRadius: 10, border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '14px', fontWeight: 600 }}>Data Musik Pribadi</div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {favorites.length} disukai • {playlists.length} playlist
            </span>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={exportBackup}
              className="sidebar-nav-item"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-medium)',
                justifyContent: 'center',
                padding: '8px 12px',
                fontSize: '13px',
              }}
            >
              <Download size={15} style={{ marginRight: 6 }} />
              Export Backup (JSON)
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="sidebar-nav-item"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-medium)',
                justifyContent: 'center',
                padding: '8px 12px',
                fontSize: '13px',
              }}
            >
              <Upload size={15} style={{ marginRight: 6 }} />
              Import Backup
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json"
              style={{ display: 'none' }}
            />
          </div>

          {importStatus && (
            <div style={{ fontSize: '12px', color: '#4ade80', display: 'flex', alignItems: 'center', gap: 4 }}>
              <CheckCircle size={14} />
              <span>{importStatus}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
