'use server';
import { PrismaClient } from '@prisma/client';
import { getAdminSession } from '../../../lib/admin-session.js';

const prisma = new PrismaClient();

export async function getContentMedia(slot) {
  const asset = await prisma.media_assets.findUnique({
    where: { storage_path: slot }
  });
  return asset?.public_url || null;
}

export async function saveContentMedia(slot, public_url) {
  const session = await getAdminSession();
  if (!session) throw new Error('Unauthorized');

  await prisma.media_assets.upsert({
    where: { storage_path: slot },
    update: { public_url },
    create: { storage_path: slot, public_url },
  });
}
