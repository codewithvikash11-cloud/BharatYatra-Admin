'use client';

import { useRouter } from 'next/navigation';
import ArticleEditor from '../../../../components/article-editor.js';

export default function EditArticleClient({ article, role }) {
  const router = useRouter();

  return (
    <ArticleEditor
      article={article}
      role={role}
      onBack={() => router.push('/articles')}
      onSaved={() => router.refresh()}
    />
  );
}
