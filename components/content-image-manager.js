'use client';
import { useState, useEffect } from 'react';
import { getContentMedia, saveContentMedia } from '../app/(studio)/content/image-actions.js';

export default function ContentImageManager({ type, slug, label = 'Cover Image' }) {
  const slot = `content/${type}/${slug}/cover`;
  const [currentUrl, setCurrentUrl] = useState(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    getContentMedia(slot).then(url => {
      if (active) {
        setCurrentUrl(url);
        setPreview(url);
        setFile(null);
      }
    });
    return () => { active = false; };
  }, [slot]);

  const handleChange = (e) => {
    const f = e.target.files[0];
    if (f) {
      if (f.size > 5 * 1024 * 1024) {
        setError('Image must be 5 MB or smaller.');
        return;
      }
      setFile(f);
      setPreview(URL.createObjectURL(f));
      setError('');
      setNotice('');
    }
  };

  const handleSave = async () => {
    if (!file) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const res = await fetch('/api/admin/media/upload', {
        method: 'POST',
        headers: { 'content-type': 'application/octet-stream' },
        body: file
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Upload failed');
      
      const newUrl = body.data.public_url;
      await saveContentMedia(slot, newUrl);
      setCurrentUrl(newUrl);
      setFile(null);
      setNotice('Cover image updated successfully.');
    } catch(err) {
      setError(err.message || 'Failed to update cover image.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--line)' }}>
      <h3>{label}</h3>
      {error && <p className="error" role="alert">{error}</p>}
      {notice && <p className="success" role="status">{notice}</p>}
      
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginTop: '1rem' }}>
        <div style={{ flex: '1' }}>
          {preview ? (
            <img src={preview} alt="Cover Preview" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--line)' }} />
          ) : (
            <div className="empty" style={{ minHeight: '100px', padding: '1rem' }}>
              <p>No cover image set.</p>
            </div>
          )}
        </div>
        <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>
            Upload New Image
            <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={handleChange} style={{ display: 'block', marginTop: '0.5rem' }} />
          </label>
          <button type="button" className="button primary" disabled={!file || busy} onClick={handleSave}>
            {busy ? 'Uploading...' : 'Update Image'}
          </button>
        </div>
      </div>
    </div>
  );
}
