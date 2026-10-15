'use client';

import { useState } from 'react';
import { updateAppearanceMedia } from './actions.js';

export default function AppearanceManager({ initialMedia = {}, statesList = [] }) {
  const [activeTab, setActiveTab] = useState('brand');
  const [mediaMap, setMediaMap] = useState(initialMedia);
  const [savingKey, setSavingKey] = useState(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [stateSearch, setStateSearch] = useState('');

  // Save a specific storage path slot
  const handleSaveSlot = async (storagePath, file, urlInput) => {
    let finalUrl = urlInput;

    setSavingKey(storagePath);
    setError('');
    setNotice('');

    try {
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          throw new Error('Image must be 5 MB or smaller.');
        }
        const res = await fetch('/api/admin/media/upload', {
          method: 'POST',
          headers: { 'content-type': 'application/octet-stream' },
          body: file,
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Upload failed');
        finalUrl = body.data?.public_url;
      }

      if (!finalUrl) {
        throw new Error('Please select an image file or provide an image URL.');
      }

      const formData = new FormData();
      formData.append('storage_path', storagePath);
      formData.append('public_url', finalUrl);
      await updateAppearanceMedia(formData);

      setMediaMap((prev) => ({ ...prev, [storagePath]: finalUrl }));
      setNotice(`Updated ${storagePath.split('/').pop()} successfully!`);
    } catch (err) {
      setError(err.message || 'Failed to update appearance media');
    } finally {
      setSavingKey(null);
    }
  };

  const filteredStates = statesList.filter(
    (s) =>
      s.name_en.toLowerCase().includes(stateSearch.toLowerCase()) ||
      (s.name_hi && s.name_hi.includes(stateSearch)) ||
      s.slug.toLowerCase().includes(stateSearch.toLowerCase())
  );

  return (
    <div className="appearance-studio-root">
      {/* Tab Navigation */}
      <div className="studio-tabs-bar">
        <button
          type="button"
          className={`studio-tab-btn ${activeTab === 'brand' ? 'active' : ''}`}
          onClick={() => setActiveTab('brand')}
        >
          <span className="tab-icon">✨</span>
          <span>Brand & Logos</span>
        </button>
        <button
          type="button"
          className={`studio-tab-btn ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => setActiveTab('home')}
        >
          <span className="tab-icon">🏛</span>
          <span>Homepage Scenics</span>
        </button>
        <button
          type="button"
          className={`studio-tab-btn ${activeTab === 'regions' ? 'active' : ''}`}
          onClick={() => setActiveTab('regions')}
        >
          <span className="tab-icon">🗺</span>
          <span>Regions of India</span>
        </button>
        <button
          type="button"
          className={`studio-tab-btn ${activeTab === 'states' ? 'active' : ''}`}
          onClick={() => setActiveTab('states')}
        >
          <span className="tab-icon">📍</span>
          <span>36 States & UTs ({statesList.length})</span>
        </button>
      </div>

      {notice && (
        <div className="status-toast success" role="status">
          ✓ {notice}
        </div>
      )}
      {error && (
        <div className="status-toast error" role="alert">
          ⚠ {error}
        </div>
      )}

      {/* =========================================================
          TAB 1: BRAND & LOGOS
          ========================================================= */}
      {activeTab === 'brand' && (
        <div className="appearance-grid">
          <AppearanceCard
            title="Main Site Logo"
            desc="Primary logo displayed on the public header and branding modules. Supports SVG, PNG, WebP."
            storagePath="site/brand/logo"
            currentUrl={mediaMap['site/brand/logo'] || '/icon.svg'}
            aspectRatio="1/1"
            isSaving={savingKey === 'site/brand/logo'}
            onSave={(file, url) => handleSaveSlot('site/brand/logo', file, url)}
          />

          <AppearanceCard
            title="Navbar Compact Logo"
            desc="Compact mark used in sticky mobile navigation and header drawer."
            storagePath="site/brand/navbar_logo"
            currentUrl={mediaMap['site/brand/navbar_logo'] || '/icon.svg'}
            aspectRatio="1/1"
            isSaving={savingKey === 'site/brand/navbar_logo'}
            onSave={(file, url) => handleSaveSlot('site/brand/navbar_logo', file, url)}
          />

          <AppearanceCard
            title="Browser Favicon"
            desc="Icon displayed in browser tabs and mobile bookmarks. Square format recommended."
            storagePath="site/brand/favicon"
            currentUrl={mediaMap['site/brand/favicon'] || '/icon.svg'}
            aspectRatio="1/1"
            isSaving={savingKey === 'site/brand/favicon'}
            onSave={(file, url) => handleSaveSlot('site/brand/favicon', file, url)}
          />
        </div>
      )}

      {/* =========================================================
          TAB 2: HOMEPAGE SCENICS
          ========================================================= */}
      {activeTab === 'home' && (
        <div className="appearance-grid wide">
          <AppearanceCard
            title="Homepage Hero Background"
            desc="High-resolution panoramic photo for the main 'Explore India' hero section. Recommended: 1920x800px or larger."
            storagePath="site/home/hero"
            currentUrl={mediaMap['site/home/hero'] || 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1920&q=85'}
            aspectRatio="16/9"
            isSaving={savingKey === 'site/home/hero'}
            onSave={(file, url) => handleSaveSlot('site/home/hero', file, url)}
          />

          <AppearanceCard
            title="Bottom Journey CTA Background"
            desc="Scenic background photo for the 'Start Planning Your Journey' bottom CTA strip. Recommended: 1920x600px."
            storagePath="site/home/cta-bg"
            currentUrl={mediaMap['site/home/cta-bg'] || 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1920&q=85'}
            aspectRatio="21/9"
            isSaving={savingKey === 'site/home/cta-bg'}
            onSave={(file, url) => handleSaveSlot('site/home/cta-bg', file, url)}
          />

          <AppearanceCard
            title="Exploration Promo Banner"
            desc="Visual banner used across curated discover highlights."
            storagePath="site/home/explore-promo"
            currentUrl={mediaMap['site/home/explore-promo'] || 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=900&q=80'}
            aspectRatio="16/9"
            isSaving={savingKey === 'site/home/explore-promo'}
            onSave={(file, url) => handleSaveSlot('site/home/explore-promo', file, url)}
          />
        </div>
      )}

      {/* =========================================================
          TAB 3: REGIONS OF INDIA
          ========================================================= */}
      {activeTab === 'regions' && (
        <div className="appearance-grid">
          {[
            { id: 'north', name: 'North India', sub: 'Himalayas, Heritage, Spirituality', default: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80' },
            { id: 'south', name: 'South India', sub: 'Backwaters, Temples, Coasts', default: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80' },
            { id: 'east', name: 'East India', sub: 'Art, Heritage, Sacred Sites', default: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80' },
            { id: 'west', name: 'West India', sub: 'Deserts, Forts, Vibrant Havelis', default: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80' },
            { id: 'central', name: 'Central India', sub: 'Tiger Reserves & Ancient Sculptures', default: 'https://images.unsplash.com/photo-1571536802807-30451e3955d8?auto=format&fit=crop&w=800&q=80' },
            { id: 'northeast', name: 'North East India', sub: 'Living Root Bridges & Valleys', default: 'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?auto=format&fit=crop&w=800&q=80' },
          ].map((reg) => {
            const path = `site/regions/${reg.id}`;
            return (
              <AppearanceCard
                key={reg.id}
                title={reg.name}
                desc={reg.sub}
                storagePath={path}
                currentUrl={mediaMap[path] || reg.default}
                aspectRatio="16/10"
                isSaving={savingKey === path}
                onSave={(file, url) => handleSaveSlot(path, file, url)}
              />
            );
          })}
        </div>
      )}

      {/* =========================================================
          TAB 4: 36 INDIAN STATES & UNION TERRITORIES
          ========================================================= */}
      {activeTab === 'states' && (
        <div className="states-branding-section">
          <div className="states-filter-bar">
            <input
              type="text"
              placeholder="Search Indian State or UT by name..."
              value={stateSearch}
              onChange={(e) => setStateSearch(e.target.value)}
              className="state-search-input"
            />
            <span className="state-count-badge">
              Showing {filteredStates.length} of {statesList.length} States & UTs
            </span>
          </div>

          <div className="states-cards-grid">
            {filteredStates.map((st) => {
              const path = `site/states/${st.slug}`;
              const currentUrl = mediaMap[path] || `https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80`;
              return (
                <div key={st.slug} className="state-image-card">
                  <div className="state-card-preview">
                    <img src={currentUrl} alt={st.name_en} />
                    <span className="state-badge-type">{st.type}</span>
                  </div>
                  <div className="state-card-info">
                    <h4>{st.name_en} {st.name_hi ? <span className="hindi-sub">({st.name_hi})</span> : null}</h4>
                    <span className="slug-tag">/{st.slug}</span>
                    <StateImageUploader
                      isSaving={savingKey === path}
                      onSave={(file, url) => handleSaveSlot(path, file, url)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Scoped CSS for Appearance Studio */}
      <style jsx>{`
        .appearance-studio-root {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
        }
        .studio-tabs-bar {
          display: flex;
          gap: 10px;
          border-bottom: 2px solid #f1f5f9;
          padding-bottom: 14px;
          margin-bottom: 24px;
          overflow-x: auto;
        }
        .studio-tab-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: 8px;
          border: 1px solid transparent;
          background: #f8fafc;
          color: #475569;
          font-weight: 600;
          font-size: 0.88rem;
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
        }
        .studio-tab-btn:hover {
          background: #e2e8f0;
          color: #0f172a;
        }
        .studio-tab-btn.active {
          background: #153e3a;
          color: #ffffff;
        }
        .status-toast {
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 0.88rem;
          font-weight: 600;
          margin-bottom: 20px;
        }
        .status-toast.success {
          background: #ecfdf5;
          color: #065f46;
          border: 1px solid #a7f3d0;
        }
        .status-toast.error {
          background: #fef2f2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }
        .appearance-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
        }
        .appearance-grid.wide {
          grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
        }
        .states-filter-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .state-search-input {
          flex: 1;
          min-width: 260px;
          padding: 10px 14px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 0.9rem;
        }
        .state-count-badge {
          font-size: 0.82rem;
          font-weight: 600;
          color: #64748b;
          background: #f1f5f9;
          padding: 6px 12px;
          border-radius: 6px;
        }
        .states-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }
        .state-image-card {
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          overflow: hidden;
          background: #ffffff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
          display: flex;
          flex-direction: column;
        }
        .state-card-preview {
          position: relative;
          height: 140px;
          background: #0f172a;
        }
        .state-card-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .state-badge-type {
          position: absolute;
          top: 8px;
          right: 8px;
          background: rgba(15, 23, 42, 0.75);
          color: #ffffff;
          font-size: 0.65rem;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          backdrop-filter: blur(4px);
        }
        .state-card-info {
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 1;
        }
        .state-card-info h4 {
          margin: 0;
          font-size: 0.95rem;
          color: #153e3a;
        }
        .hindi-sub {
          font-size: 0.8rem;
          color: #64748b;
          font-weight: normal;
        }
        .slug-tag {
          font-size: 0.72rem;
          color: #94a3b8;
          font-family: monospace;
        }
      `}</style>
    </div>
  );
}

function AppearanceCard({ title, desc, storagePath, currentUrl, aspectRatio, isSaving, onSave }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [urlInput, setUrlInput] = useState('');
  const [preview, setPreview] = useState(currentUrl);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleUrlBlur = (e) => {
    const val = e.target.value.trim();
    setUrlInput(val);
    if (val) setPreview(val);
  };

  return (
    <div className="card-box">
      <div className="card-media-preview" style={{ aspectRatio }}>
        <img src={preview} alt={title} />
        <span className="slot-badge">{storagePath}</span>
      </div>
      <div className="card-body">
        <h3>{title}</h3>
        <p>{desc}</p>

        <div className="card-actions">
          <label className="file-upload-btn">
            Choose Image File
            <input type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" onChange={handleFile} style={{ display: 'none' }} />
          </label>
          <input
            type="url"
            placeholder="Or paste public image URL..."
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onBlur={handleUrlBlur}
            className="url-field"
          />
          <button
            type="button"
            className="save-slot-btn"
            disabled={isSaving || (!selectedFile && !urlInput)}
            onClick={() => onSave(selectedFile, urlInput)}
          >
            {isSaving ? 'Saving...' : 'Save & Publish Live'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .card-box {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
          background: #ffffff;
          display: flex;
          flex-direction: column;
        }
        .card-media-preview {
          position: relative;
          width: 100%;
          background: #0f172a;
          overflow: hidden;
        }
        .card-media-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .slot-badge {
          position: absolute;
          bottom: 8px;
          left: 8px;
          background: rgba(15, 23, 42, 0.8);
          color: #cbd5e1;
          font-size: 0.68rem;
          font-family: monospace;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .card-body {
          padding: 16px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .card-body h3 {
          margin: 0 0 6px;
          font-size: 1.05rem;
          color: #153e3a;
        }
        .card-body p {
          margin: 0 0 14px;
          font-size: 0.82rem;
          color: #64748b;
          line-height: 1.4;
        }
        .card-actions {
          margin-top: auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .file-upload-btn {
          display: block;
          text-align: center;
          padding: 8px 12px;
          border: 1px dashed #cbd5e1;
          border-radius: 6px;
          font-size: 0.82rem;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
          background: #f8fafc;
        }
        .file-upload-btn:hover {
          background: #f1f5f9;
          border-color: #94a3b8;
        }
        .url-field {
          padding: 8px 10px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          font-size: 0.8rem;
        }
        .save-slot-btn {
          padding: 9px 14px;
          background: #153e3a;
          color: #ffffff;
          border: none;
          border-radius: 6px;
          font-size: 0.84rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .save-slot-btn:hover:not(:disabled) {
          background: #247a72;
        }
        .save-slot-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

function StateImageUploader({ isSaving, onSave }) {
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState('');

  return (
    <div className="state-uploader-row">
      <label className="file-tiny-btn">
        Upload
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              setFile(f);
              onSave(f, null);
            }
          }}
        />
      </label>
      <input
        type="url"
        placeholder="Or paste URL..."
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="state-url-input"
      />
      <button
        type="button"
        disabled={isSaving || (!file && !url)}
        onClick={() => onSave(file, url)}
        className="state-save-btn"
      >
        {isSaving ? '...' : 'Save'}
      </button>

      <style jsx>{`
        .state-uploader-row {
          margin-top: 6px;
          display: flex;
          gap: 6px;
          align-items: center;
        }
        .file-tiny-btn {
          padding: 5px 8px;
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          border-radius: 4px;
          font-size: 0.72rem;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
          white-space: nowrap;
        }
        .state-url-input {
          flex: 1;
          min-width: 0;
          padding: 4px 6px;
          border: 1px solid #cbd5e1;
          border-radius: 4px;
          font-size: 0.72rem;
        }
        .state-save-btn {
          padding: 5px 8px;
          background: #153e3a;
          color: #ffffff;
          border: none;
          border-radius: 4px;
          font-size: 0.72rem;
          font-weight: 600;
          cursor: pointer;
        }
        .state-save-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
