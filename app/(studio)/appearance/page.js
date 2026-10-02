import { PrismaClient } from '@prisma/client';
import AppearanceManager from './appearance-manager.js';

export const dynamic = 'force-dynamic';
const prisma = new PrismaClient();

export default async function AppearancePage() {
  const assets = await prisma.media_assets.findMany({
    where: { storage_path: { startsWith: 'site/home/' } }
  });

  const media = assets.reduce((acc, asset) => {
    acc[asset.storage_path.replace('site/home/', '')] = asset;
    return acc;
  }, {});

  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <p className="lead eyebrow">Settings</p>
          <h1>Website Appearance</h1>
        </div>
      </div>
      <div className="lead">
        Update homepage hero illustration, promotional imagery, and featured destination cover images.
      </div>

      <AppearanceManager initialMedia={media} />
    </div>
  );
}
