'use server';

import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { getAdminSession } from '../../../lib/admin-session.js';

const prisma = new PrismaClient();

export async function updateAppearanceMedia(formData) {
  const session = await getAdminSession();
  if (!session) throw new Error('Unauthorized');

  const slot = formData.get('slot');
  const public_url = formData.get('public_url');

  if (!slot || !public_url) {
    throw new Error('Missing required fields');
  }

  const storage_path = `site/home/${slot}`;

  await prisma.media_assets.upsert({
    where: { storage_path },
    update: { public_url },
    create: { storage_path, public_url },
  });

  revalidatePath('/appearance');
  revalidatePath('/', 'layout'); // try to invalidate the public site homepage if it's running in same env, though they are separate apps. 
  // We can just rely on the public site revalidating naturally or being dynamic
}
