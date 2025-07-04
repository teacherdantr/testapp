
'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import type { RedirectLink } from '@prisma/client';

const linkSchema = z.object({
  slug: z.string().min(3, 'Slug must be at least 3 characters').regex(/^[a-zA-Z0-9_-]+$/, 'Slug can only contain letters, numbers, hyphens, and underscores.'),
  url: z.string().url('Please enter a valid URL'),
});

// GET ALL
export async function getAllRedirectLinks(): Promise<{ success: boolean; links?: RedirectLink[]; error?: string }> {
  try {
    const links = await prisma.redirectLink.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, links };
  } catch (e: any) {
    console.error("Prisma getAllRedirectLinks error:", e);
    return { success: false, error: 'Failed to fetch links.' };
  }
}

// CREATE
export async function createRedirectLink(id: string | null, data: z.infer<typeof linkSchema>): Promise<{ success: boolean; link?: RedirectLink; error?: string }> {
  const validatedFields = linkSchema.safeParse(data);
  if (!validatedFields.success) {
    return { success: false, error: validatedFields.error.flatten().fieldErrors._errors.join(', ') };
  }
  const { slug, url } = validatedFields.data;

  try {
    const newLink = await prisma.redirectLink.create({
      data: { slug, url },
    });
    return { success: true, link: newLink };
  } catch (e: any) {
    if (e.code === 'P2002') { // Unique constraint failed
      return { success: false, error: `The slug '/r/${slug}' is already taken.` };
    }
    console.error("Prisma createRedirectLink error:", e);
    return { success: false, error: 'Failed to create link.' };
  }
}

// UPDATE
export async function updateRedirectLink(id: string | null, data: z.infer<typeof linkSchema>): Promise<{ success: boolean; link?: RedirectLink; error?: string }> {
  if (!id) {
    return { success: false, error: 'Link ID is missing for update.' };
  }
  const validatedFields = linkSchema.safeParse(data);
  if (!validatedFields.success) {
    return { success: false, error: validatedFields.error.flatten().fieldErrors._errors.join(', ') };
  }
  const { slug, url } = validatedFields.data;

  try {
    const updatedLink = await prisma.redirectLink.update({
      where: { id },
      data: { slug, url },
    });
    return { success: true, link: updatedLink };
  } catch (e: any) {
    if (e.code === 'P2002') { // Unique constraint failed
      return { success: false, error: `The slug '/r/${slug}' is already taken.` };
    }
     if (e.code === 'P2025') {
      return { success: false, error: 'The link you are trying to update does not exist.' };
    }
    console.error("Prisma updateRedirectLink error:", e);
    return { success: false, error: 'Failed to update link.' };
  }
}


// DELETE
export async function deleteRedirectLink(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.redirectLink.delete({
      where: { id },
    });
    return { success: true };
  } catch (e: any) {
    if (e.code === 'P2025') {
       return { success: false, error: 'The link you are trying to delete does not exist.' };
    }
    console.error("Prisma deleteRedirectLink error:", e);
    return { success: false, error: 'Failed to delete link.' };
  }
}
