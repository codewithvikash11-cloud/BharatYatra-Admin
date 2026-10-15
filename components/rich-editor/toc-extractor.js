export function slugifyHeading(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'section';
}

export function extractTableOfContents(htmlOrMarkdown = '') {
  if (!htmlOrMarkdown) return [];

  const headings = [];
  const seenSlugs = new Map();

  // If HTML format
  if (/<(h[23])[^>]*>/i.test(htmlOrMarkdown)) {
    const headingRegex = /<(h[23])[^>]*>(.*?)<\/\1>/gi;
    let match;
    while ((match = headingRegex.exec(htmlOrMarkdown)) !== null) {
      const tag = match[1].toLowerCase();
      const level = tag === 'h2' ? 2 : 3;
      // Strip any inner HTML tags
      const text = match[2].replace(/<[^>]+>/g, '').trim();
      if (!text) continue;

      let slug = slugifyHeading(text);
      if (seenSlugs.has(slug)) {
        const count = seenSlugs.get(slug) + 1;
        seenSlugs.set(slug, count);
        slug = `${slug}-${count}`;
      } else {
        seenSlugs.set(slug, 1);
      }

      headings.push({ id: slug, text, level });
    }
    return headings;
  }

  // If Markdown format
  const lines = htmlOrMarkdown.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('## ') && !trimmed.startsWith('### ')) {
      const text = trimmed.slice(3).trim();
      if (!text) continue;
      let slug = slugifyHeading(text);
      if (seenSlugs.has(slug)) {
        const count = seenSlugs.get(slug) + 1;
        seenSlugs.set(slug, count);
        slug = `${slug}-${count}`;
      } else {
        seenSlugs.set(slug, 1);
      }
      headings.push({ id: slug, text, level: 2 });
    } else if (trimmed.startsWith('### ')) {
      const text = trimmed.slice(4).trim();
      if (!text) continue;
      let slug = slugifyHeading(text);
      if (seenSlugs.has(slug)) {
        const count = seenSlugs.get(slug) + 1;
        seenSlugs.set(slug, count);
        slug = `${slug}-${count}`;
      } else {
        seenSlugs.set(slug, 1);
      }
      headings.push({ id: slug, text, level: 3 });
    }
  }

  return headings;
}
