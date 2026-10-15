'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Eye,
  Send,
  SlidersHorizontal,
  FileText,
  Search,
  ListTree,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  Copy,
  ExternalLink,
  Trash2,
  RotateCcw,
  Image as ImageIcon,
  Upload,
  X,
  Plus,
  ChevronDown,
  ChevronRight,
  Globe,
  Share2,
} from 'lucide-react';

import TiptapEditor from './rich-editor/tiptap-editor.js';
import { extractTableOfContents } from './rich-editor/toc-extractor.js';
import './rich-editor/editor.css';

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
    cover_image_credit: article?.cover_image_credit || '',
    cover_image_license: article?.cover_image_license || 'CC BY-SA 4.0 / Editorial',
    excerpt_en: article?.excerpt_en || '',
    body_en: article?.body_en || '',
    seo_title_en: article?.seo_title_en || '',
    seo_description_en: article?.seo_description_en || '',
    canonical_url: article?.canonical_url || '',
    focus_keyword: article?.focus_keyword || '',
    secondary_keywords: article?.secondary_keywords || '',
    structured_data_type: article?.structured_data_type || 'Article',
    robots_index: article?.robots_index || 'index, follow',
    status: article?.status || 'DRAFT',
    published_at: article?.published_at || null,
  }));

  const [activeTab, setActiveTab] = useState('settings'); // 'settings' | 'seo' | 'outline'
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [noticeMessage, setNoticeMessage] = useState('');
  const [slugEditing, setSlugEditing] = useState(false);
  const [customSlug, setCustomSlug] = useState(form.slug);
  const [serpDevice, setSerpDevice] = useState('desktop'); // 'desktop' | 'mobile'

  // Tag chip input state
  const [tagInput, setTagInput] = useState('');

  // Dropdown relations state
  const [statesList, setStatesList] = useState([]);
  const [districtsList, setDistrictsList] = useState([]);
  const [tehsilsList, setTehsilsList] = useState([]);
  const [destinationsList, setDestinationsList] = useState([]);
  const [attractionsList, setAttractionsList] = useState([]);

  // Media Picker state
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState('cover'); // 'cover' or 'body'
  const [mediaAssets, setMediaAssets] = useState([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Accordion open/close states
  const [accordionState, setAccordionState] = useState({
    status: true,
    category: true,
    media: true,
    location: true,
    seo: true,
    danger: false,
  });

  const autoSaveTimerRef = useRef(null);

  // Load cascading relations
  useEffect(() => {
    async function loadRelations() {
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
      } catch (err) {
        console.error('Failed to load relations:', err);
      }
    }
    void loadRelations();
  }, []);

  // Filtered districts by state
  const filteredDistricts = form.state_id
    ? districtsList.filter((d) => d.state_id === form.state_id)
    : districtsList;

  // Filtered tehsils by district
  const filteredTehsils = form.district_id
    ? tehsilsList.filter((t) => t.district_id === form.district_id)
    : tehsilsList;

  // Filtered destinations by state
  const filteredDestinations = form.state_id
    ? destinationsList.filter((dest) => !dest.state_id || dest.state_id === form.state_id)
    : destinationsList;

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

  // Periodic autosave (every 25 seconds) if dirty
  useEffect(() => {
    if (!isDirty || !form.title_en || !form.slug) return;
    autoSaveTimerRef.current = setTimeout(() => {
      void handleSave(true);
    }, 25000);
    return () => clearTimeout(autoSaveTimerRef.current);
  }, [isDirty, form]);

  const handleFieldChange = (name, value) => {
    setIsDirty(true);
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'title_en' && !article?.id && !slugEditing) {
        next.slug = slugify(value);
        setCustomSlug(next.slug);
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

  const toggleAccordion = (section) => {
    setAccordionState((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Word count & reading time
  const strippedText = (form.body_en || '').replace(/<[^>]+>/g, ' ');
  const words = strippedText.trim().split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.ceil(words / 200));

  // Extracted Table of Contents
  const tableOfContents = extractTableOfContents(form.body_en);

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

  // Save (Draft or Update)
  const handleSave = async (isAutosave = false) => {
    if (!form.title_en.trim()) {
      if (!isAutosave) setErrorMessage('Please enter an article title.');
      return null;
    }
    if (!form.slug.trim()) {
      if (!isAutosave) setErrorMessage('Please enter a URL slug.');
      return null;
    }

    // Validate location hierarchy
    if (form.destination_id && form.state_id) {
      const dest = destinationsList.find((d) => d.id === form.destination_id);
      if (dest && dest.state_id && dest.state_id !== form.state_id) {
        setErrorMessage('The selected Destination does not belong to the selected State.');
        return null;
      }
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
        setNoticeMessage(isUpdate ? 'Article changes saved successfully.' : 'New draft article created.');
        if (onSaved) onSaved(result.data);
      }
      return result.data;
    } catch (err) {
      setSaveStatus('error');
      if (!isAutosave) setErrorMessage(err.message || 'Could not save article');
      return null;
    }
  };

  // Publish / Unpublish / Workflow Transition
  const handleStatusChange = async (targetStatus) => {
    let currentId = form.id;
    if (!currentId || isDirty) {
      const saved = await handleSave();
      if (!saved) return;
      currentId = saved.id;
    }

    if (targetStatus === 'PUBLISHED') {
      if (!form.excerpt_en?.trim()) {
        setErrorMessage('Article Excerpt is required before publishing.');
        setActiveTab('settings');
        setAccordionState((prev) => ({ ...prev, category: true }));
        return;
      }
      if (!form.body_en?.trim() || form.body_en === '<p></p>') {
        setErrorMessage('Article Body content is required before publishing.');
        return;
      }
      if (!window.confirm('Are you ready to publish this article live to BharatYatra.in?')) {
        return;
      }
    } else if (targetStatus === 'DRAFT' && form.status === 'PUBLISHED') {
      if (!window.confirm('Unpublish this article? It will no longer be visible on the public website.')) {
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

      setForm((prev) => ({
        ...prev,
        status: result.data.status,
        published_at: result.data.published_at,
      }));
      setSaveStatus('saved');
      setNoticeMessage(
        targetStatus === 'PUBLISHED'
          ? '🎉 Article published live to BharatYatra!'
          : `Article status changed to ${targetStatus}.`
      );
    } catch (err) {
      setSaveStatus('error');
      setErrorMessage(err.message || 'Status transition failed');
    }
  };

  // Preview Action
  const handlePreview = async () => {
    let currentSlug = form.slug;
    if (isDirty || !form.id) {
      const saved = await handleSave();
      if (!saved) return;
      currentSlug = saved.slug;
    }

    try {
      const res = await fetch(`/api/admin/preview-token?type=articles&slug=${encodeURIComponent(currentSlug)}`);
      const data = await res.json();
      if (res.ok && data.previewUrl) {
        window.open(data.previewUrl, '_blank', 'noopener,noreferrer');
      } else {
        // Fallback preview route
        window.open(`/preview/articles/${encodeURIComponent(currentSlug)}`, '_blank');
      }
    } catch {
      window.open(`/preview/articles/${encodeURIComponent(currentSlug)}`, '_blank');
    }
  };

  // Duplicate Action
  const handleDuplicate = async () => {
    if (!form.id) return;
    if (!window.confirm('Duplicate this article as a new draft?')) return;
    setSaveStatus('saving');
    try {
      const res = await fetch(`/api/admin/articles/${form.id}/duplicate`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Duplicate failed');
      setNoticeMessage(`Duplicated as new draft: "${data.data.title_en}"`);
      if (onSaved) onSaved(data.data);
    } catch (err) {
      setErrorMessage(err.message || 'Duplicate failed');
    } finally {
      setSaveStatus('idle');
    }
  };

  // Trash / Permanent Delete
  const handleDelete = async (permanent = false) => {
    if (!form.id) return;
    const msg = permanent
      ? 'Permanently delete this article from the database? This action CANNOT be undone.'
      : 'Move this article to Trash (Archive)? It will be unpublished immediately.';
    if (!window.confirm(msg)) return;

    setSaveStatus('saving');
    try {
      const url = permanent
        ? `/api/admin/articles/${form.id}?permanent=true`
        : `/api/admin/articles/${form.id}`;
      const res = await fetch(url, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');

      if (permanent) {
        if (onBack) onBack();
      } else {
        setForm((prev) => ({ ...prev, status: 'ARCHIVED' }));
        setNoticeMessage('Article moved to Trash (Archived).');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Delete failed');
    } finally {
      setSaveStatus('idle');
    }
  };

  // Open Media Picker
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

  // Direct Image Upload
  const handleMediaUpload = async (e) => {
    const file = e.target.files?.[0];
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
          if (!form.cover_image_alt) handleFieldChange('cover_image_alt', form.title_en);
        }
        setNoticeMessage('Image uploaded successfully.');
        setMediaPickerOpen(false);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Image upload failed');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  // SEO Score & Quality Checklist calculations
  const seoTitle = form.seo_title_en || form.title_en;
  const seoDesc = form.seo_description_en || form.excerpt_en || '';
  const focusKw = (form.focus_keyword || '').toLowerCase().trim();

  const titleLengthOk = seoTitle.length >= 40 && seoTitle.length <= 65;
  const descLengthOk = seoDesc.length >= 120 && seoDesc.length <= 165;
  const kwInTitle = focusKw ? seoTitle.toLowerCase().includes(focusKw) : false;
  const kwInDesc = focusKw ? seoDesc.toLowerCase().includes(focusKw) : false;
  const kwInExcerpt = focusKw ? (form.excerpt_en || '').toLowerCase().includes(focusKw) : false;
  const hasHeadings = tableOfContents.length >= 2;
  const hasCover = Boolean(form.cover_image_url);
  const hasCoverAlt = Boolean(form.cover_image_alt);
  const wordCountOk = words >= 300;
  const hasInternalLinks = (form.body_en || '').includes('href="/') || (form.body_en || '').includes('bharat-yatra');

  const seoChecklistItems = [
    { label: 'Title length (40–65 chars)', passed: titleLengthOk, val: `${seoTitle.length} chars` },
    { label: 'Meta description length (120–165 chars)', passed: descLengthOk, val: `${seoDesc.length} chars` },
    { label: 'Focus keyword specified', passed: Boolean(focusKw), val: focusKw || 'None' },
    { label: 'Focus keyword in Title', passed: kwInTitle, hidden: !focusKw },
    { label: 'Focus keyword in Meta Description', passed: kwInDesc, hidden: !focusKw },
    { label: 'Section headings used (H2/H3)', passed: hasHeadings, val: `${tableOfContents.length} headings` },
    { label: 'Cover image with Alt text', passed: hasCover && hasCoverAlt },
    { label: 'Content depth (300+ words)', passed: wordCountOk, val: `${words} words` },
    { label: 'Internal links included', passed: hasInternalLinks },
  ].filter((item) => !item.hidden);

  const passedChecksCount = seoChecklistItems.filter((i) => i.passed).length;
  const seoScore = Math.round((passedChecksCount / seoChecklistItems.length) * 100);

  return (
    <div className="wp-editor-root">
      {/* ====================================================
          TOP STICKY ACTION HEADER
          ==================================================== */}
      <header className="wp-editor-header">
        <div className="wp-header-left">
          <button type="button" className="wp-back-btn" onClick={onBack || (() => window.history.back())}>
            <ArrowLeft size={14} />
            <span>Articles</span>
          </button>
          <span className="wp-title-breadcrumb">
            {form.title_en || 'Untitled Article'}
          </span>
          <span className={`wp-header-status-badge ${form.status.toLowerCase()}`}>
            {form.status}
          </span>
          <span className="wp-save-indicator">
            {saveStatus === 'saving' && <><Clock size={12} className="spin" /> Saving...</>}
            {saveStatus === 'saved' && <><CheckCircle2 size={12} style={{ color: '#16a34a' }} /> Saved</>}
            {isDirty && saveStatus !== 'saving' && <span style={{ color: '#d97706' }}>● Unsaved</span>}
          </span>
        </div>

        <div className="wp-header-right">
          <button
            type="button"
            className="button subtle"
            onClick={() => handleSave(false)}
            disabled={saveStatus === 'saving'}
            title="Save as Draft"
          >
            <Save size={14} style={{ marginRight: '5px' }} />
            Save Draft
          </button>

          <button
            type="button"
            className="button subtle"
            onClick={handlePreview}
            title="Preview Live Page"
          >
            <Eye size={14} style={{ marginRight: '5px' }} />
            Preview
          </button>

          {form.status === 'PUBLISHED' ? (
            <button
              type="button"
              className="button primary"
              onClick={() => handleSave(false)}
              disabled={saveStatus === 'saving'}
              title="Update Published Article"
            >
              <Send size={14} style={{ marginRight: '5px' }} />
              Update
            </button>
          ) : (
            <button
              type="button"
              className="button primary"
              onClick={() => handleStatusChange('PUBLISHED')}
              disabled={saveStatus === 'saving'}
              style={{ backgroundColor: '#15803d', borderColor: '#15803d' }}
              title="Publish Article Live"
            >
              <Send size={14} style={{ marginRight: '5px' }} />
              Publish
            </button>
          )}

          <button
            type="button"
            className={`button subtle ${isSidebarOpen ? 'active' : ''}`}
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            title="Toggle Settings Panel"
            aria-label="Toggle Settings Panel"
          >
            <SlidersHorizontal size={14} />
          </button>
        </div>
      </header>

      {/* Global Error & Notice Alerts */}
      {errorMessage && (
        <div style={{ margin: '12px 24px 0', padding: '10px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
          <button type="button" onClick={() => setErrorMessage('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b91c1c' }}><X size={14} /></button>
        </div>
      )}

      {noticeMessage && (
        <div style={{ margin: '12px 24px 0', padding: '10px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#15803d', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} />
            <span>{noticeMessage}</span>
          </div>
          <button type="button" onClick={() => setNoticeMessage('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#15803d' }}><X size={14} /></button>
        </div>
      )}

      {/* ====================================================
          MAIN TWO-COLUMN WORKSPACE
          ==================================================== */}
      <div className="wp-editor-workspace">
        {/* LEFT WRITING CANVAS */}
        <main className="wp-writing-canvas">
          {/* Article Title */}
          <input
            type="text"
            className="wp-title-input"
            placeholder="Add title..."
            value={form.title_en}
            onChange={(e) => handleFieldChange('title_en', e.target.value)}
            autoFocus
          />

          {/* Permalink / Slug Bar */}
          <div className="wp-permalink-bar">
            <span className="wp-permalink-prefix">https://bharat-yatra-in.vercel.app/articles/</span>
            {slugEditing ? (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <input
                  type="text"
                  className="wp-permalink-input"
                  value={customSlug}
                  onChange={(e) => setCustomSlug(slugify(e.target.value))}
                />
                <button
                  type="button"
                  className="wp-permalink-btn"
                  onClick={() => {
                    handleFieldChange('slug', customSlug);
                    setSlugEditing(false);
                  }}
                >
                  OK
                </button>
                <button
                  type="button"
                  className="wp-permalink-btn"
                  onClick={() => {
                    setCustomSlug(form.slug);
                    setSlugEditing(false);
                  }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <span className="wp-permalink-slug">{form.slug || 'untitled-article'}</span>
                <button
                  type="button"
                  className="wp-permalink-btn"
                  onClick={() => {
                    setCustomSlug(form.slug);
                    setSlugEditing(true);
                  }}
                >
                  Edit
                </button>
              </>
            )}

            <button
              type="button"
              className="wp-permalink-btn"
              onClick={() => {
                const url = `https://bharat-yatra-in.vercel.app/articles/${form.slug}`;
                navigator.clipboard.writeText(url);
                setNoticeMessage('Permalink copied to clipboard.');
              }}
              title="Copy URL"
            >
              <Copy size={11} style={{ verticalAlign: 'middle', marginRight: '2px' }} /> Copy
            </button>

            {form.status === 'PUBLISHED' && (
              <a
                href={`https://bharat-yatra-in.vercel.app/articles/${form.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="wp-permalink-btn"
                style={{ color: '#059669' }}
              >
                <ExternalLink size={11} style={{ verticalAlign: 'middle', marginRight: '2px' }} /> View Live
              </a>
            )}
          </div>

          {/* Rich Tiptap Editor Canvas */}
          <TiptapEditor
            content={form.body_en}
            onChange={(html) => handleFieldChange('body_en', html)}
            onOpenMediaPicker={() => openMediaPicker('body')}
          />
        </main>

        {/* RIGHT COLLAPSIBLE SETTINGS SIDEBAR */}
        {isSidebarOpen && (
          <aside className="wp-editor-sidebar">
            <div className="wp-sidebar-tabs">
              <button
                type="button"
                className={`wp-sidebar-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveTab('settings')}
              >
                <FileText size={14} />
                <span>Settings</span>
              </button>
              <button
                type="button"
                className={`wp-sidebar-tab-btn ${activeTab === 'seo' ? 'active' : ''}`}
                onClick={() => setActiveTab('seo')}
              >
                <Search size={14} />
                <span>SEO & Social</span>
              </button>
              <button
                type="button"
                className={`wp-sidebar-tab-btn ${activeTab === 'outline' ? 'active' : ''}`}
                onClick={() => setActiveTab('outline')}
              >
                <ListTree size={14} />
                <span>Outline ({tableOfContents.length})</span>
              </button>
            </div>

            <div className="wp-sidebar-content">
              {/* TAB 1: ARTICLE SETTINGS */}
              {activeTab === 'settings' && (
                <>
                  {/* Status & Schedule Accordion */}
                  <div className="wp-accordion-section">
                    <button type="button" className="wp-accordion-header" onClick={() => toggleAccordion('status')}>
                      <span>Status & Visibility</span>
                      {accordionState.status ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                    {accordionState.status && (
                      <div className="wp-accordion-body">
                        <label className="form-label">
                          <span>Workflow Status</span>
                          <select
                            value={form.status}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            className="form-select"
                          >
                            <option value="DRAFT">Draft</option>
                            <option value="REVIEW">In Review</option>
                            <option value="PUBLISHED">Published</option>
                            <option value="ARCHIVED">Archived / Trash</option>
                          </select>
                        </label>

                        <label className="form-label">
                          <span>Author</span>
                          <input
                            type="text"
                            value={form.author_name}
                            onChange={(e) => handleFieldChange('author_name', e.target.value)}
                            placeholder="e.g. BharatYatra Editorial"
                          />
                        </label>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--muted)' }}>
                          <span>⏱ Reading Time:</span>
                          <strong>~{readingTime} min read ({words} words)</strong>
                        </div>

                        {form.status === 'PUBLISHED' && (
                          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
                            <button
                              type="button"
                              className="button subtle danger"
                              style={{ width: '100%' }}
                              onClick={() => handleStatusChange('DRAFT')}
                            >
                              <RotateCcw size={13} style={{ marginRight: '5px' }} />
                              Unpublish Article
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Excerpt Accordion */}
                  <div className="wp-accordion-section">
                    <button type="button" className="wp-accordion-header" onClick={() => toggleAccordion('category')}>
                      <span>Excerpt & Category</span>
                      {accordionState.category ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                    {accordionState.category && (
                      <div className="wp-accordion-body">
                        <label className="form-label">
                          <span>Article Excerpt (Required for Publishing)</span>
                          <textarea
                            rows={3}
                            value={form.excerpt_en}
                            onChange={(e) => handleFieldChange('excerpt_en', e.target.value)}
                            placeholder="A compelling 1-2 sentence overview shown in search results and social cards..."
                          />
                          <small style={{ color: form.excerpt_en.length > 200 ? '#e11d48' : '#64748b' }}>
                            {form.excerpt_en.length} / 200 characters recommended
                          </small>
                        </label>

                        <label className="form-label">
                          <span>Category / Editorial Template</span>
                          <select
                            value={form.category}
                            onChange={(e) => handleFieldChange('category', e.target.value)}
                          >
                            {CONTENT_TYPES.map((type) => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        </label>

                        {CONTENT_TYPE_GUIDES[form.category] && (
                          <div style={{ padding: '8px 10px', background: '#f8fafc', borderLeft: '3px solid #3b82f6', borderRadius: '4px', fontSize: '0.72rem', color: '#334155', lineHeight: 1.4 }}>
                            <strong>💡 Editorial Guide:</strong> {CONTENT_TYPE_GUIDES[form.category]}
                          </div>
                        )}

                        <label className="form-label">
                          <span>Tags</span>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <input
                              type="text"
                              placeholder="Type tag & press enter..."
                              value={tagInput}
                              onChange={(e) => setTagInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ',') {
                                  e.preventDefault();
                                  addTag(tagInput);
                                }
                              }}
                            />
                            <button type="button" className="button subtle" onClick={() => addTag(tagInput)}>
                              Add
                            </button>
                          </div>
                        </label>

                        <div className="tag-chips-container">
                          {tagsArray.map((tag) => (
                            <span key={tag} className="tag-chip">
                              #{tag}
                              <button type="button" onClick={() => removeTag(tag)}>
                                <X size={12} />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Featured Cover Image Accordion */}
                  <div className="wp-accordion-section">
                    <button type="button" className="wp-accordion-header" onClick={() => toggleAccordion('media')}>
                      <span>Featured Image</span>
                      {accordionState.media ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                    {accordionState.media && (
                      <div className="wp-accordion-body">
                        {form.cover_image_url ? (
                          <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0', aspectRatio: '16/9' }}>
                            <img
                              src={form.cover_image_url}
                              alt={form.cover_image_alt || 'Cover preview'}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            <button
                              type="button"
                              onClick={() => handleFieldChange('cover_image_url', '')}
                              style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
                              title="Remove image"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => openMediaPicker('cover')}
                            style={{ border: '2px dashed #cbd5e1', borderRadius: '8px', padding: '24px', textAlign: 'center', cursor: 'pointer', background: '#f8fafc' }}
                          >
                            <ImageIcon size={28} style={{ color: '#94a3b8', margin: '0 auto 8px' }} />
                            <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
                              Set Featured Image
                            </p>
                            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                              Upload or choose from Media Library
                            </span>
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                          <button
                            type="button"
                            className="button subtle"
                            style={{ flex: 1 }}
                            onClick={() => openMediaPicker('cover')}
                          >
                            <ImageIcon size={14} style={{ marginRight: '5px' }} />
                            Media Library
                          </button>
                        </div>

                        {form.cover_image_url && (
                          <>
                            <label className="form-label">
                              <span>Image Alt Text (Accessibility & SEO)</span>
                              <input
                                type="text"
                                value={form.cover_image_alt}
                                onChange={(e) => handleFieldChange('cover_image_alt', e.target.value)}
                                placeholder="Describe the image content..."
                              />
                            </label>

                            <label className="form-label">
                              <span>Image Credit & Source</span>
                              <input
                                type="text"
                                value={form.cover_image_credit}
                                onChange={(e) => handleFieldChange('cover_image_credit', e.target.value)}
                                placeholder="e.g. Photo by Rajasthan Tourism / BharatYatra"
                              />
                            </label>

                            <label className="form-label">
                              <span>License</span>
                              <input
                                type="text"
                                value={form.cover_image_license}
                                onChange={(e) => handleFieldChange('cover_image_license', e.target.value)}
                                placeholder="e.g. Editorial Use / CC BY-SA 4.0"
                              />
                            </label>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Geographic Location Accordion */}
                  <div className="wp-accordion-section">
                    <button type="button" className="wp-accordion-header" onClick={() => toggleAccordion('location')}>
                      <span>Geographic Location</span>
                      {accordionState.location ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                    {accordionState.location && (
                      <div className="wp-accordion-body">
                        <label className="form-label">
                          <span>State / Union Territory</span>
                          <select
                            value={form.state_id}
                            onChange={(e) => handleFieldChange('state_id', e.target.value)}
                          >
                            <option value="">— Select State —</option>
                            {statesList.map((s) => (
                              <option key={s.id} value={s.id}>{s.name_en}</option>
                            ))}
                          </select>
                        </label>

                        <label className="form-label">
                          <span>District (Filtered by State)</span>
                          <select
                            value={form.district_id}
                            onChange={(e) => handleFieldChange('district_id', e.target.value)}
                            disabled={!form.state_id}
                          >
                            <option value="">— Select District —</option>
                            {filteredDistricts.map((d) => (
                              <option key={d.id} value={d.id}>{d.name_en}</option>
                            ))}
                          </select>
                        </label>

                        <label className="form-label">
                          <span>Tehsil / Sub-district (Filtered by District)</span>
                          <select
                            value={form.tehsil_id}
                            onChange={(e) => handleFieldChange('tehsil_id', e.target.value)}
                            disabled={!form.district_id}
                          >
                            <option value="">— Select Tehsil —</option>
                            {filteredTehsils.map((t) => (
                              <option key={t.id} value={t.id}>{t.name_en}</option>
                            ))}
                          </select>
                        </label>

                        <label className="form-label">
                          <span>Locality / Village</span>
                          <input
                            type="text"
                            value={form.locality_name}
                            onChange={(e) => handleFieldChange('locality_name', e.target.value)}
                            placeholder="e.g. Heritage Town, Poddar Ward"
                          />
                          <small style={{ color: '#64748b' }}>
                            Village/locality model gap documented; saved in locality metadata until schema migration.
                          </small>
                        </label>

                        <label className="form-label">
                          <span>Related Destination</span>
                          <select
                            value={form.destination_id}
                            onChange={(e) => handleFieldChange('destination_id', e.target.value)}
                          >
                            <option value="">— Select Destination —</option>
                            {filteredDestinations.map((dest) => (
                              <option key={dest.id} value={dest.id}>{dest.name_en} ({dest.state_name || 'India'})</option>
                            ))}
                          </select>
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Danger Zone Accordion */}
                  <div className="wp-accordion-section">
                    <button type="button" className="wp-accordion-header" onClick={() => toggleAccordion('danger')}>
                      <span style={{ color: '#dc2626' }}>Actions & Trash</span>
                      {accordionState.danger ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                    {accordionState.danger && (
                      <div className="wp-accordion-body">
                        {form.id && (
                          <>
                            <button
                              type="button"
                              className="button subtle"
                              style={{ width: '100%' }}
                              onClick={handleDuplicate}
                            >
                              <Copy size={13} style={{ marginRight: '5px' }} />
                              Duplicate Article
                            </button>

                            <button
                              type="button"
                              className="button subtle danger"
                              style={{ width: '100%' }}
                              onClick={() => handleDelete(false)}
                            >
                              <Trash2 size={13} style={{ marginRight: '5px' }} />
                              Move to Trash (Archive)
                            </button>

                            <button
                              type="button"
                              className="button subtle danger"
                              style={{ width: '100%', borderColor: '#ef4444', color: '#b91c1c' }}
                              onClick={() => handleDelete(true)}
                            >
                              <Trash2 size={13} style={{ marginRight: '5px' }} />
                              Permanently Delete
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* TAB 2: SEO & SOCIAL CONTROLS */}
              {activeTab === 'seo' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {/* SEO Score Overview */}
                  <div style={{ padding: '14px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b' }}>
                        SEO Content Quality
                      </span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: seoScore >= 80 ? '#16a34a' : (seoScore >= 50 ? '#d97706' : '#dc2626') }}>
                        {seoScore} / 100
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '99px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${seoScore}%`,
                          height: '100%',
                          background: seoScore >= 80 ? '#16a34a' : (seoScore >= 50 ? '#d97706' : '#dc2626'),
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                  </div>

                  {/* Google SERP Snippet Preview */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>
                        Google Search Preview
                      </span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          type="button"
                          className={`button subtle ${serpDevice === 'desktop' ? 'active' : ''}`}
                          style={{ padding: '2px 6px', fontSize: '0.68rem', minHeight: '24px' }}
                          onClick={() => setSerpDevice('desktop')}
                        >
                          Desktop
                        </button>
                        <button
                          type="button"
                          className={`button subtle ${serpDevice === 'mobile' ? 'active' : ''}`}
                          style={{ padding: '2px 6px', fontSize: '0.68rem', minHeight: '24px' }}
                          onClick={() => setSerpDevice('mobile')}
                        >
                          Mobile
                        </button>
                      </div>
                    </div>

                    <div className="google-serp-preview">
                      <div className="serp-url">
                        <span>🌐 BharatYatra.in</span>
                        <span>› articles › {form.slug || 'untitled'}</span>
                      </div>
                      <div className="serp-title">
                        {seoTitle || 'Article Title | BharatYatra'}
                      </div>
                      <div className="serp-desc">
                        {seoDesc || 'Add a compelling meta description to guide travelers from search engines.'}
                      </div>
                    </div>
                  </div>

                  {/* SEO Title Input */}
                  <label className="form-label">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>SEO Meta Title</span>
                      <span style={{ color: titleLengthOk ? '#16a34a' : '#d97706' }}>
                        {seoTitle.length} / 60
                      </span>
                    </div>
                    <input
                      type="text"
                      value={form.seo_title_en}
                      onChange={(e) => handleFieldChange('seo_title_en', e.target.value)}
                      placeholder={form.title_en || 'Custom SEO Title...'}
                    />
                  </label>

                  {/* Meta Description Input */}
                  <label className="form-label">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>SEO Meta Description</span>
                      <span style={{ color: descLengthOk ? '#16a34a' : '#d97706' }}>
                        {seoDesc.length} / 160
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      value={form.seo_description_en}
                      onChange={(e) => handleFieldChange('seo_description_en', e.target.value)}
                      placeholder="Concise summary for search engine results..."
                    />
                  </label>

                  {/* Focus Keyword & Secondary Keywords */}
                  <label className="form-label">
                    <span>Focus Keyword</span>
                    <input
                      type="text"
                      value={form.focus_keyword}
                      onChange={(e) => handleFieldChange('focus_keyword', e.target.value)}
                      placeholder="e.g. Nawalgarh travel guide"
                    />
                  </label>

                  <label className="form-label">
                    <span>Secondary Keywords</span>
                    <input
                      type="text"
                      value={form.secondary_keywords}
                      onChange={(e) => handleFieldChange('secondary_keywords', e.target.value)}
                      placeholder="e.g. Shekhawati havelis, Poddar museum timings"
                    />
                  </label>

                  {/* Canonical URL */}
                  <label className="form-label">
                    <span>Canonical URL (Override)</span>
                    <input
                      type="url"
                      value={form.canonical_url}
                      onChange={(e) => handleFieldChange('canonical_url', e.target.value)}
                      placeholder={`https://bharat-yatra-in.vercel.app/articles/${form.slug}`}
                    />
                  </label>

                  {/* Robots & Schema Type */}
                  <label className="form-label">
                    <span>Robots Meta Directives</span>
                    <select
                      value={form.robots_index}
                      onChange={(e) => handleFieldChange('robots_index', e.target.value)}
                    >
                      <option value="index, follow">Index, Follow (Recommended)</option>
                      <option value="noindex, follow">Noindex, Follow</option>
                      <option value="noindex, nofollow">Noindex, Nofollow</option>
                    </select>
                  </label>

                  <label className="form-label">
                    <span>Structured Data Schema Type</span>
                    <select
                      value={form.structured_data_type}
                      onChange={(e) => handleFieldChange('structured_data_type', e.target.value)}
                    >
                      <option value="Article">Article (Standard)</option>
                      <option value="NewsArticle">NewsArticle</option>
                      <option value="BlogPosting">BlogPosting</option>
                      <option value="TravelGuide">TravelGuide</option>
                    </select>
                  </label>

                  {/* SEO Quality Checklist */}
                  <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '8px' }}>
                      Editorial SEO Checklist
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {seoChecklistItems.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.74rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {item.passed ? (
                              <CheckCircle2 size={13} style={{ color: '#16a34a' }} />
                            ) : (
                              <AlertCircle size={13} style={{ color: '#e11d48' }} />
                            )}
                            <span style={{ color: item.passed ? '#1e293b' : '#64748b' }}>{item.label}</span>
                          </div>
                          {item.val && <strong style={{ color: '#64748b' }}>{item.val}</strong>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: OUTLINE & STATS */}
              {activeTab === 'outline' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                      Document Statistics
                    </span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.75rem' }}>
                      <div>Words: <strong>{words}</strong></div>
                      <div>Characters: <strong>{strippedText.length}</strong></div>
                      <div>Headings: <strong>{tableOfContents.length}</strong></div>
                      <div>Read Time: <strong>~{readingTime} min</strong></div>
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '8px' }}>
                      Table of Contents Outline
                    </span>
                    {tableOfContents.length === 0 ? (
                      <p style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic' }}>
                        No H2 or H3 section headings detected in article body yet. Add headings using the block selector in the toolbar.
                      </p>
                    ) : (
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {tableOfContents.map((h, idx) => (
                          <li
                            key={idx}
                            style={{
                              paddingLeft: h.level === 3 ? '16px' : '0',
                              fontSize: '0.78rem',
                              color: h.level === 2 ? '#1e293b' : '#64748b',
                              fontWeight: h.level === 2 ? 600 : 400,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <span style={{ fontSize: '0.65rem', padding: '1px 4px', borderRadius: '3px', background: h.level === 2 ? '#e0f2fe' : '#f1f5f9', color: h.level === 2 ? '#0369a1' : '#64748b' }}>
                              H{h.level}
                            </span>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {h.text}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* ====================================================
          MEDIA LIBRARY MODAL
          ==================================================== */}
      {mediaPickerOpen && (
        <div className="link-modal-overlay">
          <div className="link-modal-card" style={{ maxWidth: '750px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div className="link-modal-header">
              <div className="link-modal-title">
                <ImageIcon size={18} />
                <span>Media Assets Library</span>
              </div>
              <button type="button" className="link-modal-close" onClick={() => setMediaPickerOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <label className="button primary" style={{ cursor: 'pointer', margin: 0 }}>
                <Upload size={14} style={{ marginRight: '6px' }} />
                {uploadingImage ? 'Uploading...' : 'Upload New Image'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={handleMediaUpload}
                  style={{ display: 'none' }}
                  disabled={uploadingImage}
                />
              </label>
              <small style={{ color: '#64748b' }}>Max size 5 MB (JPEG, PNG, WebP)</small>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
              {mediaLoading && <p style={{ gridColumn: '1/-1', textAlign: 'center', color: '#64748b' }}>Loading media items...</p>}
              {!mediaLoading && mediaAssets.length === 0 && (
                <p style={{ gridColumn: '1/-1', textAlign: 'center', color: '#64748b' }}>No images uploaded yet. Click &ldquo;Upload New Image&rdquo; above.</p>
              )}
              {mediaAssets.map((asset) => (
                <div
                  key={asset.id}
                  onClick={() => {
                    if (mediaPickerTarget === 'cover') {
                      handleFieldChange('cover_image_url', asset.public_url);
                      if (!form.cover_image_alt) handleFieldChange('cover_image_alt', asset.alt_en || form.title_en);
                    }
                    setMediaPickerOpen(false);
                  }}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    aspectRatio: '1',
                    background: '#f8fafc',
                    position: 'relative',
                  }}
                >
                  <img
                    src={asset.public_url}
                    alt={asset.alt_en || 'Media thumbnail'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              ))}
            </div>

            <div className="link-modal-actions" style={{ padding: '12px 18px', borderTop: '1px solid #e2e8f0' }}>
              <button type="button" className="button subtle" onClick={() => setMediaPickerOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
