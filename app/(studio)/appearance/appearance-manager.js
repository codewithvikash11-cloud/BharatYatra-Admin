'use client';
import { useState } from 'react';
import { updateAppearanceMedia } from './actions.js';

export default function AppearanceManager({ initialMedia }) {
  const [heroFile, setHeroFile] = useState(null);
  const [heroPreview, setHeroPreview] = useState(initialMedia['hero']?.public_url || null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const [promoFile, setPromoFile] = useState(null);
  const [promoPreview, setPromoPreview] = useState(initialMedia['explore-promo']?.public_url || null);

  const [navbarFile, setNavbarFile] = useState(null);
  const [navbarPreview, setNavbarPreview] = useState(initialMedia['navbar']?.public_url || null);

  const handleHeroChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be 5 MB or smaller.');
        return;
      }
      setHeroFile(file);
      setHeroPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleNavbarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be 5 MB or smaller.');
        return;
      }
      setNavbarFile(file);
      setNavbarPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handlePromoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be 5 MB or smaller.');
        return;
      }
      setPromoFile(file);
      setPromoPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const saveSlot = async (slot, file, currentUrl) => {
    if (!file && currentUrl) return; // nothing to update if no new file
    if (file) {
      // 1. Upload the file to media library
      const res = await fetch('/api/admin/media/upload', {
        method: 'POST',
        headers: { 'content-type': 'application/octet-stream' },
        body: file
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Upload failed');
      
      // 2. Save the association via Server Action
      const formData = new FormData();
      formData.append('slot', slot);
      formData.append('public_url', body.data.public_url);
      await updateAppearanceMedia(formData);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      if (heroFile) await saveSlot('hero', heroFile, heroPreview);
      if (promoFile) await saveSlot('explore-promo', promoFile, promoPreview);
      if (navbarFile) await saveSlot('navbar', navbarFile, navbarPreview);
      setNotice('Website appearance updated successfully.');
      setHeroFile(null);
      setPromoFile(null);
      setNavbarFile(null);
    } catch(err) {
      setError(err.message || 'Failed to update appearance.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="manager-grid" style={{ marginTop: '2rem' }}>
      {error && <p className="error" role="alert" style={{ gridColumn: '1/-1' }}>{error}</p>}
      {notice && <p className="success" role="status" style={{ gridColumn: '1/-1' }}>{notice}</p>}

      <div className="editor-panel" style={{ gridColumn: '1 / -1' }}>
        <div className="editor-heading">
          <h2>Navbar Background Image</h2>
        </div>
        <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid var(--line)', borderRadius: '12px' }}>
          {navbarPreview ? (
            <div style={{ marginBottom: '1rem' }}>
              <img src={navbarPreview} alt="Navbar Preview" style={{ width: '100%', maxHeight: '150px', objectFit: 'cover', borderRadius: '8px' }} />
            </div>
          ) : (
            <div className="empty" style={{ minHeight: '100px' }}>
              <p>No navbar image set. The site uses the default glassmorphic background.</p>
            </div>
          )}
          
          <div className="editor-form field-grid" style={{ marginTop: '1rem' }}>
            <label>
              Upload Navbar Image
              <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={handleNavbarChange} />
            </label>
          </div>
        </div>
      </div>

      <div className="editor-panel" style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
        <div className="editor-heading">
          <h2>Homepage Hero Image</h2>
        </div>
        <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid var(--line)', borderRadius: '12px' }}>
          {heroPreview ? (
            <div style={{ marginBottom: '1rem' }}>
              <img src={heroPreview} alt="Hero Preview" style={{ width: '100%', maxHeight: '350px', objectFit: 'cover', borderRadius: '8px' }} />
            </div>
          ) : (
            <div className="empty" style={{ minHeight: '150px' }}>
              <p>No custom hero image. The site currently uses the vector travel illustration.</p>
            </div>
          )}
          
          <div className="editor-form field-grid" style={{ marginTop: '1rem' }}>
            <label>
              Upload New Hero Image
              <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={handleHeroChange} />
            </label>
          </div>
        </div>
      </div>

      <div className="editor-panel" style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
        <div className="editor-heading">
          <h2>Explore India Promotional Imagery</h2>
        </div>
        <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid var(--line)', borderRadius: '12px' }}>
          <p className="hint" style={{ marginTop: 0, marginBottom: '1rem' }}>This section holds the promotional image for the States directory.</p>
          {promoPreview ? (
            <div style={{ marginBottom: '1rem' }}>
              <img src={promoPreview} alt="Promo Preview" style={{ width: '100%', maxHeight: '250px', objectFit: 'cover', borderRadius: '8px' }} />
            </div>
          ) : (
            <div className="empty" style={{ minHeight: '100px', padding: '1rem' }}>
              <p>No promotional image set.</p>
            </div>
          )}
          
          <div className="editor-form field-grid">
            <label>
              Upload Promotional Image
              <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={handlePromoChange} />
            </label>
          </div>
        </div>
      </div>

      <div style={{ gridColumn: '1/-1', marginTop: '1rem', display: 'flex', gap: '1rem' }}>
        <button type="submit" className="button primary" disabled={busy || (!heroFile && !promoFile && !navbarFile)} style={{ fontSize: '1rem', padding: '0.75rem 2rem' }}>
          {busy ? 'Saving...' : 'Save Appearance Changes'}
        </button>
        {(heroFile || promoFile || navbarFile) && (
          <button type="button" className="button" disabled={busy} onClick={() => {
            setHeroFile(null);
            setPromoFile(null);
            setNavbarFile(null);
            setHeroPreview(initialMedia['hero']?.public_url || null);
            setPromoPreview(initialMedia['explore-promo']?.public_url || null);
            setNavbarPreview(initialMedia['navbar']?.public_url || null);
            setError('');
          }}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
