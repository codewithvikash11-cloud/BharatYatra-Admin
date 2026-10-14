import { notFound, redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import { getAdminSession } from '../../../../lib/admin-session.js';
import EditArticleClient from './edit-article-client.js';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { id } = await params;
  try {
    const article = await prisma.articles.findUnique({ where: { id } });
    if (article) return { title: `Edit: ${article.title_en} · BharatYatra Studio` };
  } catch {}
  return { title: 'Edit Article · BharatYatra Studio' };
}

export default async function EditArticlePage({ params }) {
  const session = await getAdminSession();
  if (!session) redirect('/');

  const { id } = await params;
  let article = null;
  try {
    article = await prisma.articles.findUnique({
      where: { id },
      include: {
        destinations: true,
        states: true,
      },
    });
  } catch (err) {
    console.error('Failed to load article:', err);
  }

  if (!article) notFound();

  // Convert Date objects to ISO strings for safe serialization
  const serialized = JSON.parse(JSON.stringify(article));

  return (
    <section className="page-content" style={{ padding: 0 }}>
      <EditArticleClient article={serialized} role={session.role} />
    </section>
  );
}
