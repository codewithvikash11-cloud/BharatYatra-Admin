'use client';

import { useRouter } from 'next/navigation';
import ArticleEditor from '../../../../components/article-editor.js';

export default function NewArticleClient({ role }) {
  const router = useRouter();

  return (
    <ArticleEditor
      article={null}
      role={role}
      onBack={() => router.push('/articles')}
      onSaved={(saved) => {
        if (saved?.id) {
          router.push(`/articles/${saved.id}`);
        } else {
          router.push('/articles');
        }
      }}
    />
  );
}
