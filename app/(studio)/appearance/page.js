import { PrismaClient } from '@prisma/client';
import AppearanceManager from './appearance-manager.js';
import { getAdminSession } from '../../../lib/admin-session.js';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Branding & Appearance · BharatYatra Studio' };

const prisma = new PrismaClient();

export default async function AppearancePage() {
  const session = await getAdminSession();
  if (!session) redirect('/');

  const [assets, states] = await Promise.all([
    prisma.media_assets.findMany({
      where: { storage_path: { startsWith: 'site/' } },
      select: { storage_path: true, public_url: true }
    }),
    prisma.states.findMany({
      select: { id: true, slug: true, name_en: true, name_hi: true, type: true },
      orderBy: { name_en: 'asc' }
    })
  ]);

  const media = assets.reduce((acc, asset) => {
    acc[asset.storage_path] = asset.public_url;
    return acc;
  }, {});

  return (
    <div className="page-content" style={{ maxWidth: '1180px', margin: '0 auto', paddingBottom: '4rem' }}>
      <div className="page-heading" style={{ marginBottom: '1.5rem' }}>
        <div>
          <p className="eyebrow" style={{ color: 'var(--teal-primary, #153E3A)', fontWeight: 700 }}>STUDIO BRANDING</p>
          <h1 style={{ fontSize: '2rem', margin: '0 0 0.4rem', color: 'var(--teal-deep, #102F2C)' }}>Website Appearance & Imagery</h1>
          <p className="lead" style={{ color: '#64748B', margin: 0, fontSize: '0.98rem' }}>
            Manage brand logos, hero banners, regional visuals, and cover photos for all 36 Indian States and UTs. Changes persist live on BharatYatra.in.
          </p>
        </div>
      </div>

      <AppearanceManager initialMedia={media} statesList={states} />
    </div>
  );
}
