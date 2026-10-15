'use client';

import {
  RowsIcon,
  ColumnsIcon,
  Trash2,
  Plus,
  Minus,
  Table as TableIcon,
} from 'lucide-react';

export default function TableControls({ editor }) {
  if (!editor || !editor.isActive('table')) return null;

  return (
    <div className="table-quick-toolbar" aria-label="Table management tools">
      <div className="table-toolbar-label">
        <TableIcon size={14} />
        <span>Table Tools:</span>
      </div>

      <div className="table-toolbar-group">
        <button
          type="button"
          className="table-tool-btn"
          onClick={() => editor.chain().focus().addRowBefore().run()}
          title="Add Row Above"
        >
          <Plus size={12} /> Row Above
        </button>
        <button
          type="button"
          className="table-tool-btn"
          onClick={() => editor.chain().focus().addRowAfter().run()}
          title="Add Row Below"
        >
          <Plus size={12} /> Row Below
        </button>
        <button
          type="button"
          className="table-tool-btn danger"
          onClick={() => editor.chain().focus().deleteRow().run()}
          title="Delete Current Row"
        >
          <Minus size={12} /> Del Row
        </button>
      </div>

      <div className="table-toolbar-divider" />

      <div className="table-toolbar-group">
        <button
          type="button"
          className="table-tool-btn"
          onClick={() => editor.chain().focus().addColumnBefore().run()}
          title="Add Column Left"
        >
          <Plus size={12} /> Col Left
        </button>
        <button
          type="button"
          className="table-tool-btn"
          onClick={() => editor.chain().focus().addColumnAfter().run()}
          title="Add Column Right"
        >
          <Plus size={12} /> Col Right
        </button>
        <button
          type="button"
          className="table-tool-btn danger"
          onClick={() => editor.chain().focus().deleteColumn().run()}
          title="Delete Current Column"
        >
          <Minus size={12} /> Del Col
        </button>
      </div>

      <div className="table-toolbar-divider" />

      <div className="table-toolbar-group">
        <button
          type="button"
          className="table-tool-btn"
          onClick={() => editor.chain().focus().toggleHeaderRow().run()}
          title="Toggle Header Row"
        >
          Header Row
        </button>
        <button
          type="button"
          className="table-tool-btn delete-table"
          onClick={() => {
            if (window.confirm('Delete this entire table?')) {
              editor.chain().focus().deleteTable().run();
            }
          }}
          title="Delete Table"
        >
          <Trash2 size={12} /> Delete Table
        </button>
      </div>
    </div>
  );
}
