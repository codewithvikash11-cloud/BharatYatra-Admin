import { redirect } from 'next/navigation';
import ContentManager from '../../../components/content-manager.js';
import { getAdminSession } from '../../../lib/admin-session.js';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Articles · BharatYatra Studio' };

export default async function ArticlesListPage() {
  const session = await getAdminSession();
  if (!session) redirect('/');

  return (
    <section className="page-content">
      <div className="page-heading">
        <div>
          <p className="eyebrow">EDITORIAL CMS</p>
          <h1>Articles & Journal</h1>
          <p className="lead">Create, review, publish, and manage long-form travel journalism and region guides.</p>
        </div>
      </div>
      <ContentManager type="articles" role={session.role} />
    </section>
  );
}
