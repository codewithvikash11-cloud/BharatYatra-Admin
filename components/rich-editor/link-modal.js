'use client';

import { useState, useEffect } from 'react';
import { Search, ExternalLink, Link2, X, Check } from 'lucide-react';

export default function LinkModal({ isOpen, onClose, onApply, initialUrl = '', initialText = '' }) {
  const [activeTab, setActiveTab] = useState('custom'); // 'custom' | 'internal'
  const [url, setUrl] = useState(initialUrl);
  const [text, setText] = useState(initialText);
  const [openInNewTab, setOpenInNewTab] = useState(false);

  // Internal search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    setUrl(initialUrl);
    setText(initialText);
    setOpenInNewTab(initialUrl.startsWith('http'));
  }, [initialUrl, initialText, isOpen]);

  useEffect(() => {
    if (activeTab !== 'internal' || !searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const [destRes, artRes] = await Promise.all([
          fetch(`/api/admin/destinations?limit=10&q=${encodeURIComponent(searchQuery)}`, { cache: 'no-store' }),
          fetch(`/api/admin/articles?limit=10&q=${encodeURIComponent(searchQuery)}`, { cache: 'no-store' }),
        ]);

        const items = [];
        if (destRes.ok) {
          const dData = await destRes.json();
          (dData.data || []).forEach((d) => {
            items.push({
              type: 'Destination',
              title: d.name_en,
              slug: d.slug,
              url: `/destinations/${d.slug}`,
              state: d.state_name,
            });
          });
        }

        if (artRes.ok) {
          const aData = await artRes.json();
          (aData.data || []).forEach((a) => {
            items.push({
              type: 'Article',
              title: a.title_en,
              slug: a.slug,
              url: `/articles/${a.slug}`,
              category: a.category,
            });
          });
        }

        setSearchResults(items);
      } catch (err) {
        console.error('Internal search error:', err);
      } finally {
        setSearchLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [activeTab, searchQuery]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!url.trim()) return;
    onApply({
      url: url.trim(),
      text: text.trim() || url.trim(),
      openInNewTab,
    });
    onClose();
  };

  const selectInternalItem = (item) => {
    setUrl(item.url);
    if (!text.trim()) {
      setText(item.title);
    }
    setOpenInNewTab(false);
    setActiveTab('custom');
  };

  return (
    <div className="link-modal-overlay">
      <div className="link-modal-card">
        <div className="link-modal-header">
          <div className="link-modal-title">
            <Link2 size={18} />
            <span>Insert / Edit Link</span>
          </div>
          <button type="button" className="link-modal-close" onClick={onClose} aria-label="Close modal">
            <X size={16} />
          </button>
        </div>

        <div className="link-modal-tabs">
          <button
            type="button"
            className={`link-tab-btn ${activeTab === 'custom' ? 'active' : ''}`}
            onClick={() => setActiveTab('custom')}
          >
            Custom Web Link
          </button>
          <button
            type="button"
            className={`link-tab-btn ${activeTab === 'internal' ? 'active' : ''}`}
            onClick={() => setActiveTab('internal')}
          >
            🔍 Search BharatYatra Content
          </button>
        </div>

        {activeTab === 'custom' ? (
          <form onSubmit={handleSubmit} className="link-modal-form">
            <label className="link-form-label">
              <span>Link URL</span>
              <input
                type="text"
                className="link-form-input"
                placeholder="https://example.com or /destinations/jaipur"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                autoFocus
              />
            </label>

            <label className="link-form-label">
              <span>Display Text (optional)</span>
              <input
                type="text"
                className="link-form-input"
                placeholder="Clickable anchor text"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </label>

            <label className="link-checkbox-label">
              <input
                type="checkbox"
                checked={openInNewTab}
                onChange={(e) => setOpenInNewTab(e.target.checked)}
              />
              <span>Open link in a new tab (<code>target="_blank"</code>)</span>
            </label>

            <div className="link-modal-actions">
              <button type="button" className="button subtle" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="button primary" disabled={!url.trim()}>
                <Check size={14} style={{ marginRight: '6px' }} />
                Apply Link
              </button>
            </div>
          </form>
        ) : (
          <div className="link-internal-picker">
            <div className="link-search-bar">
              <Search size={16} className="search-icon" />
              <input
                type="search"
                className="link-search-input"
                placeholder="Type destination, attraction, or article title (e.g. Nawalgarh)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>

            <div className="link-results-list">
              {searchLoading && <p className="link-loading-text">Searching editorial index...</p>}
              {!searchLoading && searchQuery.trim() && searchResults.length === 0 && (
                <p className="link-empty-text">No destinations or articles found for &ldquo;{searchQuery}&rdquo;.</p>
              )}
              {!searchLoading && !searchQuery.trim() && (
                <p className="link-hint-text">Type above to quickly link to an existing destination guide or story.</p>
              )}
              {searchResults.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="link-result-item"
                  onClick={() => selectInternalItem(item)}
                >
                  <span className={`link-type-tag ${item.type.toLowerCase()}`}>{item.type}</span>
                  <div className="link-result-meta">
                    <strong>{item.title}</strong>
                    <small>{item.url} {item.state ? `· ${item.state}` : ''}</small>
                  </div>
                  <ExternalLink size={14} className="link-select-icon" />
                </button>
              ))}
            </div>

            <div className="link-modal-actions">
              <button type="button" className="button subtle" onClick={onClose}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
