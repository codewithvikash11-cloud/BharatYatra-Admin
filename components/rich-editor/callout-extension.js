import { Node, mergeAttributes } from '@tiptap/core';

export const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      type: {
        default: 'tip',
        parseHTML: (element) => element.getAttribute('data-callout-type') || 'tip',
        renderHTML: (attributes) => ({
          'data-callout-type': attributes.type,
          class: `editorial-callout callout-${attributes.type}`,
        }),
      },
    };
  },

  parseHTML() {
    return [
      { tag: 'div[data-callout-type]' },
      { tag: 'div.editorial-callout' },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes), 0];
  },
});

export default Callout;
