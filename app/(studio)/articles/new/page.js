import { redirect } from 'next/navigation';
import { getAdminSession } from '../../../../lib/admin-session.js';
import NewArticleClient from './new-article-client.js';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'New Article · BharatYatra Studio' };

export default async function NewArticlePage() {
  const session = await getAdminSession();
  if (!session) redirect('/');

  return (
    <section className="page-content" style={{ padding: 0 }}>
      <NewArticleClient role={session.role} />
    </section>
  );
}
