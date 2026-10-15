'use client';

import { useState } from 'react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Indent,
  Outdent,
  Quote,
  Table as TableIcon,
  Image as ImageIcon,
  Video,
  Link2,
  Unlink,
  Undo2,
  Redo2,
  RemoveFormatting,
  Minus,
  Sparkles,
  Info,
  AlertTriangle,
  Lightbulb,
  Landmark,
  Palette,
  Highlighter,
  ChevronDown,
} from 'lucide-react';

const TEXT_COLORS = [
  { label: 'Default Ink', color: '#193b36' },
  { label: 'Forest Green', color: '#235b4b' },
  { label: 'Heritage Terracotta', color: '#bd5c37' },
  { label: 'Rajasthani Gold', color: '#c58b32' },
  { label: 'Royal Navy', color: '#1e3a8a' },
  { label: 'Deep Crimson', color: '#991b1b' },
  { label: 'Muted Slate', color: '#64748b' },
];

const HIGHLIGHT_COLORS = [
  { label: 'None', color: '' },
  { label: 'Sun Gold', color: '#fef08a' },
  { label: 'Mint Green', color: '#bbf7d0' },
  { label: 'Sky Blue', color: '#bfdbfe' },
  { label: 'Rose Pink', color: '#fbcfe8' },
  { label: 'Warm Peach', color: '#fed7aa' },
];

export default function EditorToolbar({
  editor,
  onOpenLinkModal,
  onOpenMediaPicker,
  onInsertVideo,
}) {
  const [showColorDropdown, setShowColorDropdown] = useState(false);
  const [showHighlightDropdown, setShowHighlightDropdown] = useState(false);
  const [showCalloutDropdown, setShowCalloutDropdown] = useState(false);

  if (!editor) return null;

  // Active heading level or paragraph
  const getHeadingValue = () => {
    for (let level = 1; level <= 6; level++) {
      if (editor.isActive('heading', { level })) return `h${level}`;
    }
    return 'p';
  };

  const handleHeadingChange = (e) => {
    const val = e.target.value;
    if (val === 'p') {
      editor.chain().focus().setParagraph().run();
    } else {
      const level = parseInt(val.replace('h', ''), 10);
      editor.chain().focus().toggleHeading({ level }).run();
    }
  };

  const insertCallout = (type) => {
    editor
      .chain()
      .focus()
      .insertContent({
        type: 'callout',
        attrs: { type },
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text:
                  type === 'tip'
                    ? 'Traveler Tip: Enter practical travel recommendations, best times to visit, or seasonal guidance.'
                    : type === 'warning'
                    ? 'Important Notice: Take note of road closures, ticket permit regulations, or safety guidelines.'
                    : type === 'heritage'
                    ? 'Cultural Etiquette: Respect local photography customs, attire requirements, and sacred premises.'
                    : 'Information: Verified transit details, contact numbers, or ticket counters.',
              },
            ],
          },
        ],
      })
      .run();
    setShowCalloutDropdown(false);
  };

  return (
    <div className="editor-top-toolbar" role="toolbar" aria-label="Article rich text formatting">
      {/* 1. Undo / Redo */}
      <div className="toolbar-section">
        <button
          type="button"
          className="toolbar-btn"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo (Ctrl+Z)"
          aria-label="Undo"
        >
          <Undo2 size={15} />
        </button>
        <button
          type="button"
          className="toolbar-btn"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo (Ctrl+Y)"
          aria-label="Redo"
        >
          <Redo2 size={15} />
        </button>
      </div>

      <div className="toolbar-separator" />

      {/* 2. Block Selector (Paragraph / H1 - H6) */}
      <div className="toolbar-section block-selector-wrapper">
        <select
          className="toolbar-select"
          value={getHeadingValue()}
          onChange={handleHeadingChange}
          aria-label="Block style format"
          title="Heading and paragraph format"
        >
          <option value="p">Paragraph</option>
          <option value="h1">Heading 1 (Main Title)</option>
          <option value="h2">Heading 2 (Major Section)</option>
          <option value="h3">Heading 3 (Sub-section)</option>
          <option value="h4">Heading 4 (Minor Section)</option>
          <option value="h5">Heading 5</option>
          <option value="h6">Heading 6</option>
        </select>
      </div>

      <div className="toolbar-separator" />

      {/* 3. Inline Formatting: Bold, Italic, Underline, Strike */}
      <div className="toolbar-section">
        <button
          type="button"
          className={`toolbar-btn ${editor.isActive('bold') ? 'is-active' : ''}`}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold (Ctrl+B)"
          aria-label="Bold"
        >
          <Bold size={15} />
        </button>
        <button
          type="button"
          className={`toolbar-btn ${editor.isActive('italic') ? 'is-active' : ''}`}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic (Ctrl+I)"
          aria-label="Italic"
        >
          <Italic size={15} />
        </button>
        <button
          type="button"
          className={`toolbar-btn ${editor.isActive('underline') ? 'is-active' : ''}`}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Underline (Ctrl+U)"
          aria-label="Underline"
        >
          <UnderlineIcon size={15} />
        </button>
        <button
          type="button"
          className={`toolbar-btn ${editor.isActive('strike') ? 'is-active' : ''}`}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Strikethrough"
          aria-label="Strikethrough"
        >
          <Strikethrough size={15} />
        </button>
        <button
          type="button"
          className={`toolbar-btn ${editor.isActive('subscript') ? 'is-active' : ''}`}
          onClick={() => editor.chain().focus().toggleSubscript().run()}
          title="Subscript"
          aria-label="Subscript"
        >
          <SubscriptIcon size={15} />
        </button>
        <button
          type="button"
          className={`toolbar-btn ${editor.isActive('superscript') ? 'is-active' : ''}`}
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
          title="Superscript"
          aria-label="Superscript"
        >
          <SuperscriptIcon size={15} />
        </button>
      </div>

      <div className="toolbar-separator" />

      {/* 4. Text Color & Highlight Pickers */}
      <div className="toolbar-section color-pickers">
        {/* Text Color */}
        <div className="color-dropdown-container">
          <button
            type="button"
            className="toolbar-btn color-trigger"
            onClick={() => {
              setShowColorDropdown(!showColorDropdown);
              setShowHighlightDropdown(false);
              setShowCalloutDropdown(false);
            }}
            title="Text Color"
          >
            <Palette size={15} />
            <span className="color-indicator" style={{ backgroundColor: editor.getAttributes('textStyle').color || '#193b36' }} />
          </button>
          {showColorDropdown && (
            <div className="color-palette-popover">
              <span className="palette-title">Text Color</span>
              <div className="palette-grid">
                {TEXT_COLORS.map((c) => (
                  <button
                    key={c.color}
                    type="button"
                    className="palette-color-swatch"
                    style={{ backgroundColor: c.color }}
                    title={c.label}
                    onClick={() => {
                      editor.chain().focus().setColor(c.color).run();
                      setShowColorDropdown(false);
                    }}
                  />
                ))}
              </div>
              <button
                type="button"
                className="palette-reset-btn"
                onClick={() => {
                  editor.chain().focus().unsetColor().run();
                  setShowColorDropdown(false);
                }}
              >
                Reset color
              </button>
            </div>
          )}
        </div>

        {/* Highlight Color */}
        <div className="color-dropdown-container">
          <button
            type="button"
            className={`toolbar-btn ${editor.isActive('highlight') ? 'is-active' : ''}`}
            onClick={() => {
              setShowHighlightDropdown(!showHighlightDropdown);
              setShowColorDropdown(false);
              setShowCalloutDropdown(false);
            }}
            title="Highlight Text"
          >
            <Highlighter size={15} />
          </button>
          {showHighlightDropdown && (
            <div className="color-palette-popover">
              <span className="palette-title">Highlight Color</span>
              <div className="palette-grid">
                {HIGHLIGHT_COLORS.map((c) => (
                  <button
                    key={c.label}
                    type="button"
                    className="palette-color-swatch"
                    style={{ backgroundColor: c.color || '#e5e7eb', border: c.color ? 'none' : '1px dashed #9ca3af' }}
                    title={c.label}
                    onClick={() => {
                      if (!c.color) {
                        editor.chain().focus().unsetHighlight().run();
                      } else {
                        editor.chain().focus().toggleHighlight({ color: c.color }).run();
                      }
                      setShowHighlightDropdown(false);
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="toolbar-separator" />

      {/* 5. Paragraph Alignment */}
      <div className="toolbar-section">
        <button
          type="button"
          className={`toolbar-btn ${editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''}`}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          title="Align Left"
          aria-label="Align Left"
        >
          <AlignLeft size={15} />
        </button>
        <button
          type="button"
          className={`toolbar-btn ${editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''}`}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          title="Align Center"
          aria-label="Align Center"
        >
          <AlignCenter size={15} />
        </button>
        <button
          type="button"
          className={`toolbar-btn ${editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''}`}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          title="Align Right"
          aria-label="Align Right"
        >
          <AlignRight size={15} />
        </button>
        <button
          type="button"
          className={`toolbar-btn ${editor.isActive({ textAlign: 'justify' }) ? 'is-active' : ''}`}
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          title="Justify Text"
          aria-label="Justify Text"
        >
          <AlignJustify size={15} />
        </button>
      </div>

      <div className="toolbar-separator" />

      {/* 6. Lists and Indentation */}
      <div className="toolbar-section">
        <button
          type="button"
          className={`toolbar-btn ${editor.isActive('bulletList') ? 'is-active' : ''}`}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bulleted List"
          aria-label="Bulleted List"
        >
          <List size={15} />
        </button>
        <button
          type="button"
          className={`toolbar-btn ${editor.isActive('orderedList') ? 'is-active' : ''}`}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numbered List"
          aria-label="Numbered List"
        >
          <ListOrdered size={15} />
        </button>
        <button
          type="button"
          className="toolbar-btn"
          onClick={() => editor.chain().focus().sinkListItem('listItem').run()}
          disabled={!editor.can().sinkListItem('listItem')}
          title="Indent List Item"
          aria-label="Indent List Item"
        >
          <Indent size={15} />
        </button>
        <button
          type="button"
          className="toolbar-btn"
          onClick={() => editor.chain().focus().liftListItem('listItem').run()}
          disabled={!editor.can().liftListItem('listItem')}
          title="Outdent List Item"
          aria-label="Outdent List Item"
        >
          <Outdent size={15} />
        </button>
      </div>

      <div className="toolbar-separator" />

      {/* 7. Quotes & Callout Boxes */}
      <div className="toolbar-section">
        <button
          type="button"
          className={`toolbar-btn ${editor.isActive('blockquote') ? 'is-active' : ''}`}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Blockquote"
          aria-label="Blockquote"
        >
          <Quote size={15} />
        </button>

        {/* Reusable Callout Boxes Dropdown */}
        <div className="color-dropdown-container">
          <button
            type="button"
            className={`toolbar-btn callout-dropdown-btn ${editor.isActive('callout') ? 'is-active' : ''}`}
            onClick={() => {
              setShowCalloutDropdown(!showCalloutDropdown);
              setShowColorDropdown(false);
              setShowHighlightDropdown(false);
            }}
            title="Insert Callout Box (Tips, Notices, Etiquette)"
          >
            <Sparkles size={14} />
            <span>Callout</span>
            <ChevronDown size={12} />
          </button>

          {showCalloutDropdown && (
            <div className="callout-menu-popover">
              <button type="button" className="callout-menu-item tip" onClick={() => insertCallout('tip')}>
                <Lightbulb size={16} />
                <div>
                  <strong>💡 Traveler Tip</strong>
                  <small>Practical recommendations and secrets</small>
                </div>
              </button>
              <button type="button" className="callout-menu-item warning" onClick={() => insertCallout('warning')}>
                <AlertTriangle size={16} />
                <div>
                  <strong>⚠️ Warning / Notice</strong>
                  <small>Permits, timing alerts & safety advice</small>
                </div>
              </button>
              <button type="button" className="callout-menu-item info" onClick={() => insertCallout('info')}>
                <Info size={16} />
                <div>
                  <strong>ℹ️ Travel Information</strong>
                  <small>Transit, tickets & opening hours</small>
                </div>
              </button>
              <button type="button" className="callout-menu-item heritage" onClick={() => insertCallout('heritage')}>
                <Landmark size={16} />
                <div>
                  <strong>🏛️ Cultural Etiquette</strong>
                  <small>Sacred traditions and local etiquette</small>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="toolbar-separator" />

      {/* 8. Tables & Horizontal Rule */}
      <div className="toolbar-section">
        <button
          type="button"
          className="toolbar-btn"
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }
          title="Insert Table (3x3 with headers)"
          aria-label="Insert Table"
        >
          <TableIcon size={15} />
        </button>
        <button
          type="button"
          className="toolbar-btn"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal Divider"
          aria-label="Horizontal Divider"
        >
          <Minus size={15} />
        </button>
      </div>

      <div className="toolbar-separator" />

      {/* 9. Media: Image upload/library & YouTube embed */}
      <div className="toolbar-section">
        <button
          type="button"
          className="toolbar-btn"
          onClick={onOpenMediaPicker}
          title="Upload or Insert Image with caption & alt text"
          aria-label="Insert Image"
        >
          <ImageIcon size={15} />
        </button>
        <button
          type="button"
          className="toolbar-btn"
          onClick={onInsertVideo}
          title="Insert YouTube Travel Video"
          aria-label="Insert Video"
        >
          <Video size={15} />
        </button>
      </div>

      <div className="toolbar-separator" />

      {/* 10. Links */}
      <div className="toolbar-section">
        <button
          type="button"
          className={`toolbar-btn ${editor.isActive('link') ? 'is-active' : ''}`}
          onClick={onOpenLinkModal}
          title="Add / Edit Link (Search internal destinations & articles)"
          aria-label="Add or edit link"
        >
          <Link2 size={15} />
        </button>
        {editor.isActive('link') && (
          <button
            type="button"
            className="toolbar-btn"
            onClick={() => editor.chain().focus().unsetLink().run()}
            title="Remove Link"
            aria-label="Remove link"
          >
            <Unlink size={15} />
          </button>
        )}
      </div>

      <div className="toolbar-separator" />

      {/* 11. Clear formatting */}
      <div className="toolbar-section">
        <button
          type="button"
          className="toolbar-btn"
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          title="Clear Formatting"
          aria-label="Clear formatting"
        >
          <RemoveFormatting size={15} />
        </button>
      </div>
    </div>
  );
}
