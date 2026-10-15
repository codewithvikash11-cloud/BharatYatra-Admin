'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { Image } from '@tiptap/extension-image';
import { Link } from '@tiptap/extension-link';
import { Youtube } from '@tiptap/extension-youtube';
import { useState, useEffect } from 'react';

import Callout from './callout-extension.js';
import EditorToolbar from './toolbar.js';
import TableControls from './table-controls.js';
import LinkModal from './link-modal.js';

// Convert legacy markdown strings to HTML for clean initial Tiptap loading
function markdownToInitialHtml(content = '') {
  if (!content) return '<p></p>';
  // If already HTML, return as-is
  if (/<(p|h[1-6]|ul|ol|table|div|blockquote)[^>]*>/i.test(content)) {
    return content;
  }

  // Convert basic markdown paragraphs, headings, blockquotes, lists, bold/italic, hr
  let html = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Headings
  html = html.replace(/^###### (.*$)/gim, '<h6>$1</h6>');
  html = html.replace(/^##### (.*$)/gim, '<h5>$1</h5>');
  html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Blockquotes
  html = html.replace(/^\> (.*$)/gim, '<blockquote><p>$1</p></blockquote>');

  // Images
  html = html.replace(/!\[(.*?)\]\((.*?)\)/gim, '<img src="$2" alt="$1" />');

  // Links
  html = html.replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2">$1</a>');

  // Bold & Italic
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');

  // Horizontal rules
  html = html.replace(/^(\*\*\*|---|___)$/gim, '<hr>');

  // Unordered lists
  html = html.replace(/^\- (.*$)/gim, '<ul><li>$1</li></ul>');
  html = html.replace(/<\/ul>\s*<ul>/gim, '');

  // Ordered lists
  html = html.replace(/^(\d+)\.\s+(.*$)/gim, '<ol><li>$2</li></ol>');
  html = html.replace(/<\/ol>\s*<ol>/gim, '');

  // Wrap remaining bare lines in paragraphs
  const lines = html.split('\n\n');
  const wrapped = lines
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      if (/^<(h[1-6]|blockquote|ul|ol|table|hr|img)/i.test(trimmed)) {
        return trimmed;
      }
      return `<p>${trimmed.replace(/\n/g, '<br />')}</p>`;
    })
    .join('');

  return wrapped || '<p></p>';
}

export default function TiptapEditor({
  content = '',
  onChange,
  onOpenMediaPicker,
  placeholder = 'Write your travel story or destination guide here...',
}) {
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkInitialUrl, setLinkInitialUrl] = useState('');
  const [linkInitialText, setLinkInitialText] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      Subscript,
      Superscript,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Image.configure({
        inline: false,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
        },
      }),
      Youtube.configure({
        inline: false,
        width: 640,
        height: 360,
      }),
      Callout,
    ],
    content: markdownToInitialHtml(content),
    editorProps: {
      attributes: {
        class: 'tiptap-prose-editor focus:outline-none',
        spellcheck: 'true',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (onChange) onChange(html);
    },
    immediatelyRender: false,
  });

  // Keep content synced if loaded asynchronously
  useEffect(() => {
    if (!editor) return;
    const currentHtml = editor.getHTML();
    const targetHtml = markdownToInitialHtml(content);
    // Only update if fundamentally different and editor isn't focused
    if (content && !editor.isFocused && currentHtml === '<p></p>' && targetHtml !== '<p></p>') {
      editor.commands.setContent(targetHtml, false);
    }
  }, [content, editor]);

  const handleOpenLinkModal = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href || '';
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, ' ');
    setLinkInitialUrl(previousUrl);
    setLinkInitialText(selectedText);
    setLinkModalOpen(true);
  };

  const handleApplyLink = ({ url, text, openInNewTab }) => {
    if (!editor) return;
    if (editor.state.selection.empty && text) {
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'text',
          text,
          marks: [
            {
              type: 'link',
              attrs: {
                href: url,
                target: openInNewTab ? '_blank' : null,
              },
            },
          ],
        })
        .run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({
          href: url,
          target: openInNewTab ? '_blank' : null,
        })
        .run();
    }
  };

  const handleInsertVideo = () => {
    const videoUrl = window.prompt(
      'Enter YouTube video URL (e.g. https://www.youtube.com/watch?v=... or https://youtu.be/...):'
    );
    if (videoUrl && editor) {
      editor.commands.setYoutubeVideo({
        src: videoUrl.trim(),
      });
    }
  };

  return (
    <div className="tiptap-editor-container">
      {/* 1. Main Sticky Toolbar */}
      <EditorToolbar
        editor={editor}
        onOpenLinkModal={handleOpenLinkModal}
        onOpenMediaPicker={onOpenMediaPicker}
        onInsertVideo={handleInsertVideo}
      />

      {/* 2. Floating / Table Context Bar */}
      <TableControls editor={editor} />

      {/* 3. Visual ContentEditable Canvas */}
      <div className="tiptap-content-wrapper">
        <EditorContent editor={editor} />
      </div>

      {/* 4. Link & Internal Picker Modal */}
      <LinkModal
        isOpen={linkModalOpen}
        onClose={() => setLinkModalOpen(false)}
        onApply={handleApplyLink}
        initialUrl={linkInitialUrl}
        initialText={linkInitialText}
      />
    </div>
  );
}
