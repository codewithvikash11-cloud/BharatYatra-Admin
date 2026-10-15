'use server';

import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { getAdminSession } from '../../../lib/admin-session.js';

const prisma = new PrismaClient();

export async function updateAppearanceMedia(formData) {
  const session = await getAdminSession();
  if (!session) throw new Error('Unauthorized');

  const slot = formData.get('slot');
  const storage_path_param = formData.get('storage_path');
  const public_url = formData.get('public_url');

  if ((!slot && !storage_path_param) || !public_url) {
    throw new Error('Missing required fields');
  }

  const storage_path = storage_path_param || (slot.startsWith('site/') ? slot : `site/home/${slot}`);

  await prisma.media_assets.upsert({
    where: { storage_path },
    update: { public_url },
    create: { storage_path, public_url },
  });

  revalidatePath('/appearance');
  revalidatePath('/', 'layout');
}
