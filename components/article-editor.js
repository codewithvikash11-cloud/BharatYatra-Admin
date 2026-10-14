'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const CONTENT_TYPES = [
  'Destination Guide',
  'Tourist Attraction Guide',
  'History & Heritage',
  'Travel Planning',
  'Food & Culture',
  'Itinerary',
  'Nearby Places',
  'Travel Updates',
  'Events & Festivals',
];

const CONTENT_TYPE_GUIDES = {
  'Destination Guide': 'Recommended sections: Overview, History, Top Attractions, Best Time to Visit, How to Reach, Local Transport, Food & Accommodation, Suggested Itinerary, Travel Tips, FAQs.',
  'Tourist Attraction Guide': 'Recommended sections: History & Significance, Location & Directions, Verified Visiting Hours, Entry Fees, Photography Rules, Visitor Tips, Nearby Sights.',
  'History & Heritage': 'Recommended sections: Historical Context, Architecture & Dynasty, Conservation Status, Cultural Significance, Heritage Etiquette, Archival Sources.',
  'Travel Planning': 'Recommended sections: Best Seasonal Window, Route & Connectivity, Permits & Entry Formalities, Currency & UPI Tips, Packing Checklist, Emergency Info.',
  'Food & Culture': 'Recommended sections: Iconic Regional Dishes, Famous Heritage Eateries, Culinary Etiquette, Vegetarian/Vegan Options, Street Food Hygiene Tips.',
  'Itinerary': 'Recommended sections: Overview & Route Map, Day-by-Day Detailed Stops, Transit Times, Hotel Recommendations, Pacing & Alternatives.',
  'Nearby Places': 'Recommended sections: Recommended Day Trips, Distance & Driving Time, Key Highlights, Local Auto/Taxi Fares, Recommended Circuit Order.',
  'Travel Updates': 'Recommended sections: Current Transit Conditions, Road Closures/Permits, Weather Alerts, Seasonal Opening Dates, Official Contact Numbers.',
  'Events & Festivals': 'Recommended sections: Festival Significance, Dates & Auspicious Timings, Key Celebration Locations, Photography Guidelines, Ritual Etiquette.',
};

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

// Clean text paste handler (strips MS Word/HTML junk, normalizes paragraphs)
function sanitizePastedText(clipboardData) {
  let text = clipboardData.getData('text/plain');
  if (!text) return '';
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

export default function ArticleEditor({ article, onBack, onSaved, role = 'admin' }) {
  const [form, setForm] = useState(() => ({
    id: article?.id || null,
    title_en: article?.title_en || '',
    slug: article?.slug || '',
    category: article?.category || 'Destination Guide',
    tags: article?.tags || '',
    author_name: article?.author_name || 'BharatYatra Editorial',
    state_id: article?.state_id || '',
    destination_id: article?.destination_id || '',
    district_id: article?.district_id || '',
    tehsil_id: article?.tehsil_id || '',
    locality_name: article?.locality_name || '',
    cover_image_url: article?.cover_image_url || '',
    cover_image_alt: article?.cover_image_alt || '',
    excerpt_en: article?.excerpt_en || '',
    body_en: article?.body_en || '',
    seo_title_en: article?.seo_title_en || '',
    seo_description_en: article?.seo_description_en || '',
    canonical_url: article?.canonical_url || '',
    focus_keyword: '',
    structured_data_type: 'Article',
    robots_index: 'index, follow',
    status: article?.status || 'DRAFT',
    attraction_id: article?.attraction_id || '',
    image_credits: article?.image_credits || '',
    og_image_url: article?.og_image_url || '',
    sources: '',
    editorial_notes: '',
    is_location_independent: false,
  }));

  const [activeTab, setActiveTab] = useState('publish');
  const [previewMode, setPreviewMode] = useState('edit'); // 'edit', 'desktop', 'mobile'
  const [slugLocked, setSlugLocked] = useState(Boolean(article?.id));
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle', 'saving', 'saved', 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [noticeMessage, setNoticeMessage] = useState('');
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState('cover'); // 'cover' or 'body'
  const [tagInput, setTagInput] = useState('');

  // Dropdown relations
  const [statesList, setStatesList] = useState([]);
  const [districtsList, setDistrictsList] = useState([]);
  const [tehsilsList, setTehsilsList] = useState([]);
  const [destinationsList, setDestinationsList] = useState([]);
  const [attractionsList, setAttractionsList] = useState([]);

  // Media Library in-modal state
  const [mediaAssets, setMediaAssets] = useState([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaSearch, setMediaSearch] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const textareaRef = useRef(null);
  const autoSaveTimerRef = useRef(null);

  // Load cascading location data
  useEffect(() => {
    async function loadLocations() {
      try {
        const [sRes, dRes, distRes, tehRes, aRes] = await Promise.all([
          fetch('/api/admin/states?limit=100', { cache: 'no-store' }),
          fetch('/api/admin/destinations?limit=100', { cache: 'no-store' }),
          fetch('/api/admin/districts?limit=100', { cache: 'no-store' }),
          fetch('/api/admin/tehsils?limit=100', { cache: 'no-store' }),
          fetch('/api/admin/attractions?limit=100', { cache: 'no-store' }),
        ]);
        if (sRes.ok) setStatesList((await sRes.json()).data || []);
        if (dRes.ok) setDestinationsList((await dRes.json()).data || []);
        if (distRes.ok) setDistrictsList((await distRes.json()).data || []);
        if (tehRes.ok) setTehsilsList((await tehRes.json()).data || []);
        if (aRes.ok) setAttractionsList((await aRes.json()).data || []);
      } catch {}
    }
    void loadLocations();
  }, []);

  // Unsaved changes warning
  useEffect(() => {
    function handleBeforeUnload(e) {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Autosave periodically (every 25 seconds) if dirty
  useEffect(() => {
    if (!isDirty || !form.title_en || !form.slug) return;
    autoSaveTimerRef.current = setTimeout(() => {
      void handleSaveDraft(true);
    }, 25000);
    return () => clearTimeout(autoSaveTimerRef.current);
  }, [isDirty, form]);

  const handleFieldChange = (name, value) => {
    setIsDirty(true);
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'title_en' && !slugLocked && !article?.id) {
        next.slug = slugify(value);
      }
      if (name === 'state_id') {
        next.district_id = '';
        next.tehsil_id = '';
      }
      if (name === 'district_id') {
        next.tehsil_id = '';
      }
      return next;
    });
  };

  // Word count & reading time calculation
  const words = (form.body_en || '').trim().split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.ceil(words / 200));

  // Tag chip handlers
  const tagsArray = (form.tags || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  const addTag = (newTag) => {
    const clean = newTag.trim().toLowerCase();
    if (clean && !tagsArray.includes(clean)) {
      const updated = [...tagsArray, clean].join(', ');
      handleFieldChange('tags', updated);
    }
    setTagInput('');
  };

  const removeTag = (tagToRemove) => {
    const updated = tagsArray.filter((t) => t !== tagToRemove).join(', ');
    handleFieldChange('tags', updated);
  };

  // Content block insertion helpers
  const insertFormatting = (prefix, suffix = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = form.body_en || '';
    const selectedText = text.substring(start, end) || 'Sample text';
    const replacement = `${prefix}${selectedText}${suffix}`;
    const nextBody = text.substring(0, start) + replacement + text.substring(end);
    handleFieldChange('body_en', nextBody);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 50);
  };

  const insertBlock = (blockType) => {
    const current = form.body_en || '';
    let blockMarkdown = '';
    switch (blockType) {
      case 'h2':
        blockMarkdown = '\n\n## Section Heading\n\n';
        break;
      case 'h3':
        blockMarkdown = '\n\n### Sub-heading\n\n';
        break;
      case 'h4':
        blockMarkdown = '\n\n#### Key Detail\n\n';
        break;
      case 'quote':
        blockMarkdown = '\n\n> "A magnificent journey through India\'s heritage and royal architecture."\n\n';
        break;
      case 'bullet':
        blockMarkdown = '\n\n- Key attraction or highlight\n- Seasonal weather note\n- Travel tip\n\n';
        break;
      case 'numbered':
        blockMarkdown = '\n\n1. First stop or morning activity\n2. Afternoon monument visit\n3. Evening cultural bazaar\n\n';
        break;
      case 'table':
        blockMarkdown = '\n\n| Attraction / Spot | Timings | Entry Fee |\n| :--- | :--- | :--- |\n| Amer Fort | 9:00 AM – 5:30 PM | ₹100 / ₹550 Foreigner |\n| Hawa Mahal | 9:00 AM – 5:00 PM | ₹50 / ₹200 Foreigner |\n\n';
        break;
      case 'divider':
        blockMarkdown = '\n\n---\n\n';
        break;
      case 'callout':
        blockMarkdown = '\n\n> **Traveler Tip:** Always carry cash in rural tehsils as mobile connectivity can fluctuate in heritage havelis.\n\n';
        break;
      default:
        break;
    }
    handleFieldChange('body_en', current + blockMarkdown);
  };

  // Media Library loader
  const openMediaPicker = async (target) => {
    setMediaPickerTarget(target);
    setMediaPickerOpen(true);
    setMediaLoading(true);
    try {
      const res = await fetch('/api/admin/media?limit=50', { cache: 'no-store' });
      const payload = await res.json();
      if (res.ok) setMediaAssets(payload.data || []);
    } catch {}
    setMediaLoading(false);
  };

  // Direct image upload to Supabase Storage
  const handleMediaUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image must be under 5 MB');
      return;
    }
    setUploadingImage(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/admin/media/upload', {
        method: 'POST',
        headers: { 'content-type': 'application/octet-stream' },
        body: file,
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Upload failed');
      const uploadedUrl = payload.data?.public_url;
      if (uploadedUrl) {
        if (mediaPickerTarget === 'cover') {
          handleFieldChange('cover_image_url', uploadedUrl);
          handleFieldChange('cover_image_alt', form.cover_image_alt || form.title_en);
        } else {
          insertFormatting(`\n![${form.title_en}](${uploadedUrl})\n`);
        }
        setNoticeMessage('Image uploaded and applied successfully.');
        setMediaPickerOpen(false);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Image upload failed');
    } finally {
      setUploadingImage(false);
      event.target.value = '';
    }
  };

  // Save Draft (or update)
  const handleSaveDraft = async (isAutosave = false) => {
    if (!form.title_en.trim()) {
      if (!isAutosave) setErrorMessage('Please enter an article title.');
      return null;
    }
    if (!form.slug.trim()) {
      if (!isAutosave) setErrorMessage('Please enter a URL slug.');
      return null;
    }

    setSaveStatus('saving');
    if (!isAutosave) {
      setErrorMessage('');
      setNoticeMessage('');
    }

    try {
      const payload = {
        title_en: form.title_en.trim(),
        slug: form.slug.trim(),
        category: form.category || 'Destination Guide',
        tags: form.tags || null,
        author_name: form.author_name || 'BharatYatra Editorial',
        state_id: form.state_id || null,
        destination_id: form.destination_id || null,
        cover_image_url: form.cover_image_url || null,
        cover_image_alt: form.cover_image_alt || null,
        excerpt_en: form.excerpt_en || null,
        body_en: form.body_en || null,
        seo_title_en: form.seo_title_en || null,
        seo_description_en: form.seo_description_en || null,
        canonical_url: form.canonical_url || null,
      };

      const isUpdate = Boolean(form.id);
      const url = isUpdate ? `/api/admin/articles/${form.id}` : '/api/admin/articles';
      const method = isUpdate ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Save failed');

      setForm((prev) => ({
        ...prev,
        id: result.data.id,
        status: result.data.status,
      }));
      setIsDirty(false);
      setSaveStatus('saved');
      if (!isAutosave) {
        setNoticeMessage(isUpdate ? 'Changes saved to database.' : 'Draft article created successfully.');
        if (onSaved) onSaved(result.data);
      }
      return result.data;
    } catch (err) {
      setSaveStatus('error');
      if (!isAutosave) setErrorMessage(err.message || 'Could not save article');
      return null;
    }
  };

  // Publish / Status transition
  const handlePublishToggle = async (targetStatus) => {
    // If not saved yet, save first
    let currentId = form.id;
    if (!currentId || isDirty) {
      const saved = await handleSaveDraft();
      if (!saved) return;
      currentId = saved.id;
    }

    // Validation checks before publishing
    if (targetStatus === 'PUBLISHED') {
      if (!form.excerpt_en?.trim()) {
        setErrorMessage('Article Excerpt is required before publishing.');
        setActiveTab('template');
        return;
      }
      if (!form.body_en?.trim()) {
        setErrorMessage('Article Body content is required before publishing.');
        return;
      }
      if (!window.confirm('Are you ready to publish this article live to BharatYatra?')) {
        return;
      }
    }

    setSaveStatus('saving');
    setErrorMessage('');
    setNoticeMessage('');

    try {
      const res = await fetch(`/api/admin/articles/${currentId}/status`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: targetStatus }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Workflow transition failed');

      setForm((prev) => ({ ...prev, status: result.data.status }));
      setSaveStatus('saved');
      setNoticeMessage(
        targetStatus === 'PUBLISHED'
          ? 'Article is now LIVE on BharatYatra!'
          : `Article status changed to ${targetStatus.toLowerCase()}.`
      );
      if (onSaved) onSaved(result.data);
    } catch (err) {
      setSaveStatus('error');
      setErrorMessage(err.message || 'Status transition failed');
    }
  };

  // Private HMAC preview
  const handleOpenPreview = async () => {
    if (!form.slug) {
      setErrorMessage('Please provide a URL slug first.');
      return;
    }
    // Save draft first to ensure preview renders current content
    if (isDirty) {
      await handleSaveDraft();
    }
    try {
      const res = await fetch(`/api/admin/preview-token?type=articles&slug=${encodeURIComponent(form.slug)}`);
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Failed to generate preview token');
      if (payload.previewUrl) {
        window.open(payload.previewUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Could not open private draft preview');
    }
  };

  // Move to Trash (archive) or Restore
  const handleTrashToggle = async () => {
    if (!form.id) return;
    const isTrashed = form.status === 'ARCHIVED';
    if (!isTrashed) {
      if (!window.confirm(`Move "${form.title_en}" to Trash? It will be removed from all public listings.`)) return;
      try {
        const res = await fetch(`/api/admin/articles/${form.id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Trash action failed');
        setForm((prev) => ({ ...prev, status: 'ARCHIVED' }));
        setNoticeMessage('Article moved to Trash.');
        if (onSaved) onSaved({ ...form, status: 'ARCHIVED' });
      } catch (err) {
        setErrorMessage(err.message || 'Could not move article to trash');
      }
    } else {
      // Restore to DRAFT
      await handlePublishToggle('DRAFT');
    }
  };

  // Permanent Delete
  const handlePermanentDelete = async () => {
    if (!form.id) return;
    if (!window.confirm(`Permanently delete "${form.title_en}"? This action cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/articles/${form.id}?permanent=true`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Permanent deletion failed');
      alert('Article permanently deleted.');
      if (onBack) onBack();
    } catch (err) {
      setErrorMessage(err.message || 'Could not permanently delete article');
    }
  };

  // Duplicate Article
  const handleDuplicate = async () => {
    if (!form.id) {
      setErrorMessage('Save article first before duplicating.');
      return;
    }
    try {
      const res = await fetch(`/api/admin/articles/${form.id}/duplicate`, { method: 'POST' });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Duplicate failed');
      alert('Article duplicated successfully as a new draft!');
      if (onSaved) onSaved(payload.data);
      setForm((prev) => ({
        ...prev,
        id: payload.data.id,
        title_en: payload.data.title_en,
        slug: payload.data.slug,
        status: 'DRAFT',
      }));
    } catch (err) {
      setErrorMessage(err.message || 'Failed to duplicate article');
    }
  };

  // SEO Analysis calculations
  const focusKw = (form.focus_keyword || '').toLowerCase().trim();
  const titleHasKw = focusKw && (form.title_en || '').toLowerCase().includes(focusKw);
  const descHasKw = focusKw && (form.seo_description_en || form.excerpt_en || '').toLowerCase().includes(focusKw);
  const bodyHasKw = focusKw && (form.body_en || '').toLowerCase().includes(focusKw);
  const titleLength = (form.seo_title_en || form.title_en || '').length;
  const descLength = (form.seo_description_en || form.excerpt_en || '').length;
  const hasAltText = Boolean(form.cover_image_alt?.trim());
  const hasHeadings = /##\s+/m.test(form.body_en || '');

  // Filtered districts for cascading selector
  const availableDistricts = districtsList.filter(
    (d) => !form.state_id || d.state_id === form.state_id
  );
  // Filtered tehsils for cascading selector
  const availableTehsils = tehsilsList.filter(
    (t) => !form.district_id || t.district_id === form.district_id
  );
  // Filtered destinations
  const availableAttractions = attractionsList.filter((a) => !form.destination_id || a.destination_id === form.destination_id);
  const availableDestinations = destinationsList.filter(
    (dest) => !form.state_id || dest.state_id === form.state_id
  );

  return (
    <div className="article-studio-root">
      {/* ====================================================
          1. TOP STATUS & PUBLISHING BAR
          ==================================================== */}
      <header className="studio-top-bar">
        <div className="top-bar-left">
          <button type="button" className="button subtle back-btn" onClick={onBack}>
            ← Articles
          </button>
          <div className="doc-meta">
            <span className={`status status-${form.status?.toLowerCase()}`}>
              {form.status === 'ARCHIVED' ? 'TRASH' : form.status}
            </span>
            <span className="autosave-tag">
              {saveStatus === 'saving' && '⏳ Saving...'}
              {saveStatus === 'saved' && '✓ Saved'}
              {saveStatus === 'error' && '⚠️ Save error'}
              {saveStatus === 'idle' && (isDirty ? '● Unsaved changes' : 'All changes saved')}
            </span>
          </div>
        </div>

        <div className="top-bar-center">
          <div className="view-mode-toggle">
            <button
              type="button"
              className={`mode-btn ${previewMode === 'edit' ? 'active' : ''}`}
              onClick={() => setPreviewMode('edit')}
              title="Editor Canvas"
            >
              ✍️ Studio
            </button>
            <button
              type="button"
              className={`mode-btn ${previewMode === 'desktop' ? 'active' : ''}`}
              onClick={() => setPreviewMode('desktop')}
              title="Desktop Preview"
            >
              🖥 Desktop
            </button>
            <button
              type="button"
              className={`mode-btn ${previewMode === 'mobile' ? 'active' : ''}`}
              onClick={() => setPreviewMode('mobile')}
              title="Mobile Preview"
            >
              📱 Mobile
            </button>
          </div>
        </div>

        <div className="top-bar-right">
          <button
            type="button"
            className="button subtle"
            onClick={handleOpenPreview}
            title="Open secure private draft preview"
          >
            👁 Preview ↗
          </button>

          <button
            type="button"
            className="button"
            disabled={saveStatus === 'saving'}
            onClick={() => handleSaveDraft(false)}
          >
            {saveStatus === 'saving' ? 'Saving…' : 'Save Draft'}
          </button>

          {role === 'admin' && form.status !== 'PUBLISHED' && (
            <button
              type="button"
              className="button primary publish-btn"
              disabled={saveStatus === 'saving'}
              onClick={() => handlePublishToggle('PUBLISHED')}
            >
              🚀 Publish Live
            </button>
          )}

          {role === 'admin' && form.status === 'PUBLISHED' && (
            <button
              type="button"
              className="button"
              style={{ background: '#fef3e9', color: '#926319', borderColor: '#f1d6b0' }}
              disabled={saveStatus === 'saving'}
              onClick={() => handlePublishToggle('DRAFT')}
            >
              ↩ Unpublish
            </button>
          )}

          {form.id && (
            <button
              type="button"
              className="button subtle"
              onClick={handleDuplicate}
              title="Duplicate as new draft"
            >
              📋 Duplicate
            </button>
          )}
        </div>
      </header>

      {/* Notifications Bar */}
      {errorMessage && (
        <div className="error" role="alert" style={{ margin: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{errorMessage}</span>
          <button type="button" onClick={() => setErrorMessage('')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>✕</button>
        </div>
      )}
      {noticeMessage && (
        <div className="success" role="status" style={{ margin: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{noticeMessage}</span>
          <button type="button" onClick={() => setNoticeMessage('')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>✕</button>
        </div>
      )}

      {/* ====================================================
          2. WORKSPACE GRID (CANVAS + SIDEBAR)
          ==================================================== */}
      <div className={`studio-workspace preview-${previewMode}`}>
        {/* MAIN WRITING CANVAS */}
        <main className="studio-canvas">
          <div className="canvas-inner">
            {/* Title & Slug Bar */}
            <div className="title-section">
              <input
                type="text"
                className="article-title-input"
                placeholder="Article Title..."
                value={form.title_en}
                onChange={(e) => handleFieldChange('title_en', e.target.value)}
              />

              <div className="slug-bar">
                <span className="slug-prefix">https://bharatyatra.in/articles/</span>
                {slugLocked ? (
                  <span className="slug-display">{form.slug || 'untitled-slug'}</span>
                ) : (
                  <input
                    type="text"
                    className="slug-input"
                    value={form.slug}
                    placeholder="custom-slug"
                    onChange={(e) => handleFieldChange('slug', slugify(e.target.value))}
                  />
                )}
                <button
                  type="button"
                  className="slug-toggle-btn"
                  onClick={() => setSlugLocked(!slugLocked)}
                >
                  {slugLocked ? '✏ Edit Slug' : '✓ Done'}
                </button>
              </div>
            </div>

            {/* Visual Editor Toolbar */}
            <div className="editor-toolbar">
              <div className="toolbar-group">
                <button type="button" onClick={() => insertBlock('h2')} title="Heading 2">H2</button>
                <button type="button" onClick={() => insertBlock('h3')} title="Heading 3">H3</button>
                <button type="button" onClick={() => insertBlock('h4')} title="Heading 4">H4</button>
              </div>
              <div className="toolbar-sep" />
              <div className="toolbar-group">
                <button type="button" onClick={() => insertFormatting('**', '**')} title="Bold"><b>B</b></button>
                <button type="button" onClick={() => insertFormatting('*', '*')} title="Italic"><i>I</i></button>
                <button type="button" onClick={() => insertFormatting('[', '](https://...)')} title="Link">🔗</button>
              </div>
              <div className="toolbar-sep" />
              <div className="toolbar-group">
                <button type="button" onClick={() => insertBlock('quote')} title="Blockquote">”</button>
                <button type="button" onClick={() => insertBlock('bullet')} title="Bullet list">• List</button>
                <button type="button" onClick={() => insertBlock('numbered')} title="Numbered list">1. List</button>
                <button type="button" onClick={() => insertBlock('table')} title="Insert Table">📊 Table</button>
                <button type="button" onClick={() => insertBlock('callout')} title="Traveler Tip Callout">💡 Tip</button>
                <button type="button" onClick={() => insertBlock('divider')} title="Divider">—</button>
              </div>
              <div className="toolbar-sep" />
              <div className="toolbar-group">
                <button
                  type="button"
                  className="toolbar-media-btn"
                  onClick={() => openMediaPicker('body')}
                >
                  🖼 Insert Image
                </button>
              </div>
            </div>

            {/* Rich Text Writing Area */}
            <div className="body-editor-wrap">
              <textarea
                ref={textareaRef}
                className="article-body-textarea"
                placeholder="Write your travel story, historical insights, practical route advice, and cultural wonders here... (Markdown supported)"
                value={form.body_en}
                onChange={(e) => handleFieldChange('body_en', e.target.value)}
                onPaste={(e) => {
                  const sanitized = sanitizePastedText(e.clipboardData);
                  if (sanitized) {
                    e.preventDefault();
                    document.execCommand('insertText', false, sanitized);
                  }
                }}
              />
            </div>

            {/* Canvas Footer Metrics */}
            <div className="canvas-footer">
              <span>📊 {words} words</span>
              <span>⏱ ~{readingTime} min read</span>
              <span>🏷 {tagsArray.length} tags</span>
              <span style={{ marginLeft: 'auto', color: 'var(--muted)' }}>
                {form.category} · {form.status}
              </span>
            </div>
          </div>
        </main>

        {/* ====================================================
            3. WORDPRESS-STYLE SIDEBAR CONTROLS
            ==================================================== */}
        <aside className="studio-sidebar">
          {/* Sidebar Navigation Tabs */}
          <nav className="sidebar-tabs" aria-label="Editor panels">
            <button
              type="button"
              className={activeTab === 'publish' ? 'active' : ''}
              onClick={() => setActiveTab('publish')}
            >
              Publish
            </button>
            <button
              type="button"
              className={activeTab === 'media' ? 'active' : ''}
              onClick={() => setActiveTab('media')}
            >
              Media
            </button>
            <button
              type="button"
              className={activeTab === 'location' ? 'active' : ''}
              onClick={() => setActiveTab('location')}
            >
              Location
            </button>
            <button
              type="button"
              className={activeTab === 'seo' ? 'active' : ''}
              onClick={() => setActiveTab('seo')}
            >
              SEO Studio
            </button>
            <button
              type="button"
              className={activeTab === 'template' ? 'active' : ''}
              onClick={() => setActiveTab('template')}
            >
              Format
            </button>
          </nav>

          <div className="sidebar-panel-content">
            {/* TAB 1: STATUS & PUBLISHING */}
            {activeTab === 'publish' && (
              <div className="panel-section">
                <h3>Document Status & Lifecycle</h3>

                <label className="sidebar-field">
                  <span>Workflow Status</span>
                  <select
                    value={form.status}
                    onChange={(e) => handleFieldChange('status', e.target.value)}
                    disabled={role !== 'admin'}
                  >
                    <option value="DRAFT">DRAFT (Work in progress)</option>
                    <option value="REVIEW">IN REVIEW (Editorial review)</option>
                    <option value="PUBLISHED">PUBLISHED (Live on site)</option>
                    <option value="ARCHIVED">TRASH (Archived / Unpublished)</option>
                  </select>
                </label>

                <label className="sidebar-field">
                  <span>Author / Byline</span>
                  <input
                    type="text"
                    value={form.author_name}
                    onChange={(e) => handleFieldChange('author_name', e.target.value)}
                    placeholder="Author name"
                  />
                </label>

                <div className="lifecycle-actions">
                  <h4>Content Actions</h4>
                  <div style={{ display: 'grid', gap: '8px', marginTop: '8px' }}>
                    {form.status !== 'ARCHIVED' ? (
                      <button
                        type="button"
                        className="button danger subtle"
                        onClick={handleTrashToggle}
                      >
                        🗑 Move to Trash
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="button subtle"
                        style={{ background: '#e1f1e4', color: '#276738' }}
                        onClick={handleTrashToggle}
                      >
                        ♻ Restore from Trash
                      </button>
                    )}

                    {role === 'admin' && form.id && (
                      <button
                        type="button"
                        className="button danger subtle"
                        style={{ borderStyle: 'dashed' }}
                        onClick={handlePermanentDelete}
                      >
                        ❌ Delete Permanently
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: FEATURED IMAGE & MEDIA */}
            {activeTab === 'media' && (
              <div className="panel-section">
                <h3>Featured Image & Media</h3>

                {form.cover_image_url ? (
                  <div className="featured-image-box">
                    <img src={form.cover_image_url} alt={form.cover_image_alt || 'Cover'} />
                    <button
                      type="button"
                      className="image-remove-btn"
                      onClick={() => handleFieldChange('cover_image_url', '')}
                    >
                      ✕ Remove
                    </button>
                  </div>
                ) : (
                  <div className="featured-image-placeholder">
                    <span>🖼</span>
                    <p>No featured image set</p>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px', margin: '12px 0' }}>
                  <button
                    type="button"
                    className="button subtle"
                    style={{ flex: 1 }}
                    onClick={() => openMediaPicker('cover')}
                  >
                    Select from Library
                  </button>
                  <label className="button subtle" style={{ flex: 1, cursor: 'pointer', textAlign: 'center', margin: 0 }}>
                    {uploadingImage ? 'Uploading…' : '📁 Upload New'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      onChange={handleMediaUpload}
                      style={{ display: 'none' }}
                      disabled={uploadingImage}
                    />
                  </label>
                </div>

                <label className="sidebar-field">
                  <span>Image URL (or manual override)</span>
                  <input
                    type="url"
                    value={form.cover_image_url}
                    onChange={(e) => handleFieldChange('cover_image_url', e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                  />
                </label>

                <label className="sidebar-field">
                  <span>Image Alt Text (Accessibility & SEO)</span>
                  <input
                    type="text"
                    value={form.cover_image_alt}
                    onChange={(e) => handleFieldChange('cover_image_alt', e.target.value)}
                    placeholder="Descriptive alt text for search engines and screen readers"
                  />
                </label>

                <label className="sidebar-field">
                  <span>Image Credits & Source</span>
                  <input
                    type="text"
                    value={form.image_credits}
                    onChange={(e) => handleFieldChange('image_credits', e.target.value)}
                    placeholder="e.g. Photo by Rahul / Unsplash (CC-BY-4.0)"
                  />
                </label>
              </div>
            )}

            {/* TAB 3: LOCATION HIERARCHY */}
            {activeTab === 'location' && (
              <div className="panel-section">
                <h3>Location Hierarchy</h3>
                <p className="sidebar-note">
                  Cascading dependent locations: India → State/UT → District → Tehsil → Locality / Destination.
                </p>

                <label className="sidebar-field" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.is_location_independent}
                    onChange={(e) => handleFieldChange('is_location_independent', e.target.checked)}
                    style={{ width: 'auto' }}
                  />
                  <span>Location-Independent Article (e.g. Packing Guide)</span>
                </label>

                {!form.is_location_independent && (
                  <>
                    <label className="sidebar-field">
                      <span>1. State / Union Territory</span>
                      <select
                        value={form.state_id}
                        onChange={(e) => handleFieldChange('state_id', e.target.value)}
                      >
                        <option value="">— Select State / UT —</option>
                        {statesList.map((st) => (
                          <option key={st.id} value={st.id}>
                            {st.name_en} ({st.type})
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="sidebar-field">
                      <span>2. District</span>
                      <select
                        value={form.district_id}
                        onChange={(e) => handleFieldChange('district_id', e.target.value)}
                        disabled={!form.state_id}
                      >
                        <option value="">— Select District —</option>
                        {availableDistricts.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name_en}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="sidebar-field">
                      <span>3. Tehsil / Sub-district</span>
                      <select
                        value={form.tehsil_id}
                        onChange={(e) => handleFieldChange('tehsil_id', e.target.value)}
                        disabled={!form.district_id}
                      >
                        <option value="">— Select Tehsil —</option>
                        {availableTehsils.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name_en} {t.local_label ? `(${t.local_label})` : ''}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="sidebar-field">
                      <span>4. Village / Locality Name</span>
                      <input
                        type="text"
                        value={form.locality_name}
                        onChange={(e) => handleFieldChange('locality_name', e.target.value)}
                        placeholder="e.g. Nawalgarh Locality / Dundlod"
                      />
                    </label>

                    <label className="sidebar-field">
                      <span>Primary Subject Destination</span>
                      <select
                        value={form.destination_id}
                        onChange={(e) => handleFieldChange('destination_id', e.target.value)}
                      >
                        <option value="">— Link Related Destination —</option>
                        {availableDestinations.map((dest) => (
                          <option key={dest.id} value={dest.id}>
                            {dest.name_en} ({dest.state_name || 'India'})
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="sidebar-field">
                      <span>Primary Subject Attraction / Monument</span>
                      <select
                        value={form.attraction_id}
                        onChange={(e) => {
                          const val = e.target.value;
                          handleFieldChange('attraction_id', val);
                          if (val) {
                            const found = attractionsList.find((a) => a.id === val);
                            if (found?.destination_id && !form.destination_id) {
                              handleFieldChange('destination_id', found.destination_id);
                            }
                          }
                        }}
                      >
                        <option value="">— Link Related Attraction / Monument —</option>
                        {availableAttractions.map((attr) => (
                          <option key={attr.id} value={attr.id}>
                            {attr.name_en} ({attr.category || 'Monument'})
                          </option>
                        ))}
                      </select>
                    </label>
                  </>
                )}
              </div>
            )}

            {/* TAB 4: COMPLETE SEO STUDIO */}
            {activeTab === 'seo' && (
              <div className="panel-section">
                <h3>SEO Studio & Validation</h3>

                <label className="sidebar-field">
                  <span>Focus Keyword</span>
                  <input
                    type="text"
                    value={form.focus_keyword}
                    onChange={(e) => handleFieldChange('focus_keyword', e.target.value)}
                    placeholder="e.g. nawalgarh havelis"
                  />
                  <small style={{ color: 'var(--muted)' }}>Used for real-time editorial quality checks.</small>
                </label>

                <label className="sidebar-field">
                  <span>
                    SEO Title ({titleLength}/60 chars){' '}
                    <b style={{ color: titleLength > 60 ? '#c53929' : '#276738' }}>
                      {titleLength > 60 ? 'Truncated' : 'Optimal'}
                    </b>
                  </span>
                  <input
                    type="text"
                    value={form.seo_title_en}
                    maxLength={80}
                    placeholder={form.title_en || 'Meta Title...'}
                    onChange={(e) => handleFieldChange('seo_title_en', e.target.value)}
                  />
                </label>

                <label className="sidebar-field">
                  <span>
                    Meta Description ({descLength}/160 chars){' '}
                    <b style={{ color: descLength > 160 ? '#c53929' : descLength < 50 ? '#926319' : '#276738' }}>
                      {descLength > 160 ? 'Too long' : descLength < 50 ? 'Short' : 'Optimal'}
                    </b>
                  </span>
                  <textarea
                    rows={3}
                    value={form.seo_description_en}
                    maxLength={200}
                    placeholder={form.excerpt_en || 'Compelling search description...'}
                    onChange={(e) => handleFieldChange('seo_description_en', e.target.value)}
                  />
                </label>

                <label className="sidebar-field">
                  <span>Canonical URL Override</span>
                  <input
                    type="url"
                    value={form.canonical_url}
                    onChange={(e) => handleFieldChange('canonical_url', e.target.value)}
                    placeholder="https://bharatyatra.in/articles/..."
                  />
                </label>

                <label className="sidebar-field">
                  <span>Social Sharing Image (OG Image)</span>
                  <input
                    type="url"
                    value={form.og_image_url}
                    onChange={(e) => handleFieldChange('og_image_url', e.target.value)}
                    placeholder={form.cover_image_url || 'https://... (defaults to Featured Image)'}
                  />
                </label>

                <label className="sidebar-field">
                  <span>Structured Data Type</span>
                  <select
                    value={form.structured_data_type}
                    onChange={(e) => handleFieldChange('structured_data_type', e.target.value)}
                  >
                    <option value="Article">Article (Standard)</option>
                    <option value="TouristDestination">TouristDestination</option>
                    <option value="TouristAttraction">TouristAttraction</option>
                    <option value="TravelGuide">TravelGuide</option>
                    <option value="Event">Event</option>
                  </select>
                </label>

                {/* Google SERP Snippet Preview */}
                <div className="serp-preview-box">
                  <span className="serp-label">🔍 Google Search Snippet</span>
                  <div className="serp-card">
                    <div className="serp-url-row">
                      <span className="serp-fav">B</span>
                      <span className="serp-domain">BharatYatra</span>
                      <span className="serp-breadcrumb">› articles › {form.slug || 'slug'}</span>
                    </div>
                    <div className="serp-title">
                      {form.seo_title_en || form.title_en || 'Article Title · BharatYatra'}
                    </div>
                    <div className="serp-desc">
                      {(form.seo_description_en || form.excerpt_en || 'Comprehensive travel guide and cultural discovery on BharatYatra.').slice(0, 160)}
                    </div>
                  </div>
                </div>

                {/* Social Card Preview */}
                <div className="social-preview-box">
                  <span className="serp-label">📱 Social Sharing Card (WhatsApp / X / FB)</span>
                  <div className="social-card">
                    {form.cover_image_url && (
                      <div className="social-img">
                        <img src={form.og_image_url || form.cover_image_url} alt="Card preview" />
                      </div>
                    )}
                    <div className="social-content">
                      <span className="social-domain">BHARATYATRA.IN</span>
                      <strong className="social-title">{form.seo_title_en || form.title_en || 'Article Title'}</strong>
                      <p className="social-snippet">{(form.seo_description_en || form.excerpt_en || '').slice(0, 100)}</p>
                    </div>
                  </div>
                </div>

                {/* Automated SEO Checklist */}
                <div className="seo-audit-box">
                  <h4>Editorial SEO Audit</h4>
                  <ul className="audit-checklist">
                    <li className={form.title_en ? 'pass' : 'fail'}>
                      {form.title_en ? '✓' : '✗'} Article title entered
                    </li>
                    <li className={form.slug ? 'pass' : 'fail'}>
                      {form.slug ? '✓' : '✗'} Clean unique URL slug generated
                    </li>
                    <li className={form.excerpt_en ? 'pass' : 'fail'}>
                      {form.excerpt_en ? '✓' : '✗'} Excerpt / summary provided
                    </li>
                    <li className={hasAltText ? 'pass' : 'warn'}>
                      {hasAltText ? '✓' : '⚠️'} Featured image alt text present
                    </li>
                    <li className={hasHeadings ? 'pass' : 'warn'}>
                      {hasHeadings ? '✓' : '⚠️'} Subheadings (H2/H3) used in content
                    </li>
                    {focusKw && (
                      <>
                        <li className={titleHasKw ? 'pass' : 'fail'}>
                          {titleHasKw ? '✓' : '✗'} Focus keyword in title
                        </li>
                        <li className={descHasKw ? 'pass' : 'fail'}>
                          {descHasKw ? '✓' : '✗'} Focus keyword in meta description
                        </li>
                        <li className={bodyHasKw ? 'pass' : 'warn'}>
                          {bodyHasKw ? '✓' : '⚠️'} Focus keyword in content body
                        </li>
                      </>
                    )}
                    <li className={words >= 250 ? 'pass' : 'warn'}>
                      {words >= 250 ? '✓' : '⚠️'} Word count: {words} words {words < 250 ? '(Short)' : '(Good)'}
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* TAB 5: FORMAT, TEMPLATE & TAXONOMY */}
            {activeTab === 'template' && (
              <div className="panel-section">
                <h3>Content Type & Taxonomy</h3>

                <label className="sidebar-field">
                  <span>Content Type & Public Template</span>
                  <select
                    value={form.category}
                    onChange={(e) => handleFieldChange('category', e.target.value)}
                  >
                    {CONTENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>

                {CONTENT_TYPE_GUIDES[form.category] && (
                  <div className="type-guidance-card">
                    <strong>💡 Template Guidelines:</strong>
                    <p>{CONTENT_TYPE_GUIDES[form.category]}</p>
                  </div>
                )}

                <label className="sidebar-field">
                  <span>Summary / Excerpt (Lead Paragraph)</span>
                  <textarea
                    rows={4}
                    value={form.excerpt_en}
                    onChange={(e) => handleFieldChange('excerpt_en', e.target.value)}
                    placeholder="Enter a compelling 1–2 sentence summary that hooks the reader."
                  />
                </label>

                {/* Interactive Tags Manager */}
                <div className="tags-manager">
                  <span>Tags</span>
                  <div className="tag-chips-wrap">
                    {tagsArray.map((tag) => (
                      <span key={tag} className="tag-chip">
                        #{tag}
                        <button type="button" onClick={() => removeTag(tag)}>✕</button>
                      </span>
                    ))}
                  </div>
                  <div className="tag-input-row">
                    <input
                      type="text"
                      placeholder="Add tag and press Enter..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag(tagInput);
                        }
                      }}
                    />
                    <button type="button" className="button subtle" onClick={() => addTag(tagInput)}>
                      + Add
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* ====================================================
          4. SUPABASE MEDIA LIBRARY MODAL
          ==================================================== */}
      {mediaPickerOpen && (
        <div className="media-modal-backdrop" onClick={() => setMediaPickerOpen(false)}>
          <div className="media-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="media-modal-header">
              <h3>Supabase Media Library</h3>
              <button type="button" className="close-btn" onClick={() => setMediaPickerOpen(false)}>✕</button>
            </div>

            <div className="media-modal-toolbar">
              <input
                type="text"
                placeholder="Search media assets..."
                value={mediaSearch}
                onChange={(e) => setMediaSearch(e.target.value)}
              />
              <label className="button primary subtle" style={{ cursor: 'pointer', margin: 0 }}>
                {uploadingImage ? 'Uploading…' : '📁 Upload New Asset'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={handleMediaUpload}
                  style={{ display: 'none' }}
                  disabled={uploadingImage}
                />
              </label>
            </div>

            <div className="media-modal-grid">
              {mediaLoading ? (
                <p style={{ padding: '20px', color: 'var(--muted)' }}>Loading storage assets…</p>
              ) : mediaAssets.length === 0 ? (
                <p style={{ padding: '20px', color: 'var(--muted)' }}>No media assets found in library.</p>
              ) : (
                mediaAssets
                  .filter((item) =>
                    !mediaSearch ||
                    (item.storage_path || '').toLowerCase().includes(mediaSearch.toLowerCase()) ||
                    (item.alt_en || '').toLowerCase().includes(mediaSearch.toLowerCase())
                  )
                  .map((item) => (
                    <div
                      key={item.id}
                      className="media-item-card"
                      onClick={() => {
                        const url = item.public_url;
                        if (mediaPickerTarget === 'cover') {
                          handleFieldChange('cover_image_url', url);
                          if (item.alt_en) handleFieldChange('cover_image_alt', item.alt_en);
                        } else {
                          insertFormatting(`\n![${item.alt_en || form.title_en}](${url})\n`);
                        }
                        setMediaPickerOpen(false);
                      }}
                    >
                      <img src={item.public_url} alt={item.alt_en || 'Thumbnail'} />
                      <span className="media-item-path">{item.storage_path}</span>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Scoped CSS styling for WordPress Content Studio */}
      <style jsx>{`
        .article-studio-root {
          min-height: 100vh;
          background: #fbfbf9;
          display: flex;
          flex-direction: column;
          color: var(--ink);
        }
        .studio-top-bar {
          position: sticky;
          top: 0;
          z-index: 100;
          height: 64px;
          background: #ffffff;
          border-bottom: 1px solid #e2e6de;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
        }
        .top-bar-left, .top-bar-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .doc-meta {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .autosave-tag {
          font-size: 0.72rem;
          color: #73817a;
          font-weight: 500;
        }
        .view-mode-toggle {
          display: flex;
          background: #f1f4ed;
          padding: 3px;
          border-radius: 8px;
          gap: 4px;
        }
        .mode-btn {
          background: none;
          border: none;
          padding: 5px 12px;
          font-size: 0.75rem;
          font-weight: 600;
          color: #495d52;
          border-radius: 6px;
          cursor: pointer;
        }
        .mode-btn.active {
          background: #ffffff;
          color: var(--ink);
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
        }
        .studio-workspace {
          display: grid;
          grid-template-columns: 1fr 360px;
          flex: 1;
          align-items: start;
        }
        .studio-workspace.preview-desktop .canvas-inner {
          max-width: 900px;
        }
        .studio-workspace.preview-mobile .canvas-inner {
          max-width: 420px;
          border: 1px solid #dce4dc;
          border-radius: 24px;
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.06);
          margin-top: 20px;
          margin-bottom: 20px;
        }
        .studio-canvas {
          padding: 32px 48px;
          display: flex;
          justify-content: center;
        }
        .canvas-inner {
          width: 100%;
          max-width: 820px;
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid #e6e9e2;
          padding: 36px 44px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
        }
        .article-title-input {
          width: 100%;
          border: none;
          outline: none;
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(1.8rem, 3.2vw, 2.6rem);
          font-weight: 600;
          color: var(--ink);
          margin-bottom: 8px;
        }
        .slug-bar {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.78rem;
          color: #73817a;
          margin-bottom: 24px;
          background: #f7f9f6;
          padding: 6px 12px;
          border-radius: 6px;
        }
        .slug-input {
          border: 1px solid #cbd5cc;
          border-radius: 4px;
          padding: 2px 6px;
          font-size: 0.78rem;
          outline: none;
          color: var(--ink);
        }
        .slug-toggle-btn {
          margin-left: auto;
          background: none;
          border: none;
          font-size: 0.72rem;
          font-weight: 600;
          color: #247a72;
          cursor: pointer;
        }
        .editor-toolbar {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: #f9faf7;
          border: 1px solid #e1e5dd;
          border-radius: 8px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .toolbar-group {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .toolbar-group button {
          background: #ffffff;
          border: 1px solid #d9dfd7;
          border-radius: 4px;
          padding: 4px 8px;
          font-size: 0.75rem;
          font-weight: 600;
          color: #3b5046;
          cursor: pointer;
        }
        .toolbar-group button:hover {
          background: #edf2eb;
          color: var(--ink);
        }
        .toolbar-sep {
          width: 1px;
          height: 18px;
          background: #d9dfd7;
          margin: 0 4px;
        }
        .article-body-textarea {
          width: 100%;
          min-height: 520px;
          border: none;
          outline: none;
          resize: vertical;
          font-size: 1.05rem;
          line-height: 1.85;
          color: #243b35;
          font-family: inherit;
        }
        .canvas-footer {
          display: flex;
          align-items: center;
          gap: 16px;
          padding-top: 18px;
          border-top: 1px solid #edf0ea;
          font-size: 0.75rem;
          color: #7a8880;
        }
        .studio-sidebar {
          background: #ffffff;
          border-left: 1px solid #e2e6de;
          min-height: calc(100vh - 64px);
          position: sticky;
          top: 64px;
          overflow-y: auto;
        }
        .sidebar-tabs {
          display: flex;
          border-bottom: 1px solid #e2e6de;
          background: #f7f9f6;
        }
        .sidebar-tabs button {
          flex: 1;
          padding: 12px 6px;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          font-size: 0.74rem;
          font-weight: 600;
          color: #65756c;
          cursor: pointer;
          white-space: nowrap;
        }
        .sidebar-tabs button.active {
          color: var(--ink);
          border-bottom-color: var(--ink);
          background: #ffffff;
        }
        .sidebar-panel-content {
          padding: 20px;
        }
        .panel-section h3 {
          margin: 0 0 16px 0;
          font-size: 1.05rem;
          color: var(--ink);
        }
        .sidebar-field {
          display: grid;
          gap: 6px;
          margin-bottom: 16px;
          font-size: 0.74rem;
          font-weight: 600;
          color: #495d52;
        }
        .sidebar-field input, .sidebar-field select, .sidebar-field textarea {
          width: 100%;
          padding: 8px 10px;
          border: 1px solid #d5dbd3;
          border-radius: 6px;
          font-size: 0.8rem;
          color: var(--ink);
          outline: none;
        }
        .sidebar-field input:focus, .sidebar-field select:focus, .sidebar-field textarea:focus {
          border-color: #247a72;
          box-shadow: 0 0 0 2px rgba(36, 122, 114, 0.12);
        }
        .featured-image-box {
          position: relative;
          width: 100%;
          height: 160px;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid #e1e5de;
        }
        .featured-image-box img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .image-remove-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          background: rgba(0, 0, 0, 0.65);
          color: #fff;
          border: none;
          border-radius: 4px;
          padding: 3px 8px;
          font-size: 0.7rem;
          cursor: pointer;
        }
        .featured-image-placeholder {
          height: 140px;
          border: 2px dashed #d5dbd3;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #7b8a82;
          font-size: 0.8rem;
        }
        .featured-image-placeholder span {
          font-size: 1.8rem;
          margin-bottom: 4px;
        }
        .sidebar-note {
          font-size: 0.74rem;
          color: #73817a;
          line-height: 1.5;
          margin-bottom: 14px;
        }
        .serp-preview-box, .social-preview-box {
          margin: 18px 0;
          background: #f8faf7;
          border: 1px solid #e1e6de;
          border-radius: 8px;
          padding: 12px;
        }
        .serp-label {
          font-size: 0.68rem;
          font-weight: 700;
          color: #5c6c64;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: block;
          margin-bottom: 8px;
        }
        .serp-card {
          background: #ffffff;
          border: 1px solid #e6e9e4;
          border-radius: 6px;
          padding: 10px 12px;
        }
        .serp-url-row {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.72rem;
          color: #202124;
          margin-bottom: 3px;
        }
        .serp-fav {
          width: 14px;
          height: 14px;
          background: #247a72;
          color: #fff;
          border-radius: 50%;
          display: grid;
          place-items: center;
          font-size: 8px;
          font-weight: 700;
        }
        .serp-title {
          font-size: 0.95rem;
          color: #1a0dab;
          font-family: arial, sans-serif;
          font-weight: 500;
          line-height: 1.3;
          margin-bottom: 4px;
        }
        .serp-desc {
          font-size: 0.78rem;
          color: #4d5156;
          line-height: 1.4;
        }
        .social-card {
          background: #ffffff;
          border: 1px solid #e6e9e4;
          border-radius: 6px;
          overflow: hidden;
        }
        .social-img {
          height: 110px;
          overflow: hidden;
        }
        .social-img img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .social-content {
          padding: 8px 10px;
        }
        .social-domain {
          font-size: 0.65rem;
          color: #7b8a82;
          display: block;
        }
        .social-title {
          font-size: 0.82rem;
          color: var(--ink);
          display: block;
          margin: 2px 0;
        }
        .social-snippet {
          font-size: 0.72rem;
          color: #65756c;
          margin: 0;
        }
        .seo-audit-box {
          background: #ffffff;
          border: 1px solid #e2e6de;
          border-radius: 8px;
          padding: 12px;
          margin-top: 16px;
        }
        .seo-audit-box h4 {
          margin: 0 0 8px 0;
          font-size: 0.8rem;
        }
        .audit-checklist {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 6px;
          font-size: 0.72rem;
        }
        .audit-checklist li.pass {
          color: #276738;
        }
        .audit-checklist li.fail {
          color: #c53929;
        }
        .audit-checklist li.warn {
          color: #926319;
        }
        .type-guidance-card {
          background: #fbf9f2;
          border-left: 3px solid #c58b32;
          border-radius: 6px;
          padding: 10px 12px;
          margin-bottom: 16px;
          font-size: 0.75rem;
          color: #5e4f35;
        }
        .type-guidance-card p {
          margin: 4px 0 0 0;
          line-height: 1.45;
        }
        .tags-manager {
          margin-top: 12px;
          display: grid;
          gap: 8px;
        }
        .tags-manager > span {
          font-size: 0.74rem;
          font-weight: 600;
          color: #495d52;
        }
        .tag-chips-wrap {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .tag-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #eef2eb;
          color: var(--ink);
          font-size: 0.72rem;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 4px;
        }
        .tag-chip button {
          background: none;
          border: none;
          color: #7b8a82;
          font-size: 0.7rem;
          cursor: pointer;
        }
        .tag-input-row {
          display: flex;
          gap: 6px;
        }
        .tag-input-row input {
          flex: 1;
          padding: 6px 8px;
          border: 1px solid #d5dbd3;
          border-radius: 6px;
          font-size: 0.78rem;
        }
        .media-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(4px);
          z-index: 1000;
          display: grid;
          place-items: center;
          padding: 20px;
        }
        .media-modal-card {
          background: #ffffff;
          width: min(900px, 95vw);
          max-height: 85vh;
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .media-modal-header {
          padding: 16px 20px;
          border-bottom: 1px solid #e6eae2;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .media-modal-header h3 {
          margin: 0;
          font-size: 1.15rem;
        }
        .close-btn {
          background: none;
          border: none;
          font-size: 1.1rem;
          color: #73817a;
          cursor: pointer;
        }
        .media-modal-toolbar {
          padding: 12px 20px;
          background: #f7f9f6;
          border-bottom: 1px solid #e6eae2;
          display: flex;
          gap: 12px;
        }
        .media-modal-toolbar input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #d5dbd3;
          border-radius: 6px;
          font-size: 0.8rem;
        }
        .media-modal-grid {
          padding: 20px;
          overflow-y: auto;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 16px;
        }
        .media-item-card {
          border: 1px solid #e2e6de;
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          background: #ffffff;
          transition: 0.15s;
        }
        .media-item-card:hover {
          border-color: #247a72;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
        .media-item-card img {
          width: 100%;
          height: 120px;
          object-fit: cover;
        }
        .media-item-path {
          display: block;
          padding: 6px 8px;
          font-size: 0.65rem;
          color: #73817a;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        @media (max-width: 950px) {
          .studio-workspace {
            grid-template-columns: 1fr;
          }
          .studio-sidebar {
            border-left: none;
            border-top: 1px solid #e2e6de;
            position: static;
          }
        }
      `}</style>
    </div>
  );
}
