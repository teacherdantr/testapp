
'use server';

import { z } from 'zod';

const passwordSchema = z.string().min(1, 'Password cannot be empty');

/**
 * Verifies the provided admin password against the one set in environment variables.
 * IMPORTANT: Ensure ADMIN_PASSWORD is set in your .env file.
 */
export async function verifyAdminPassword(password: string): Promise<{ success: boolean; error?: string }> {
  const parsedPassword = passwordSchema.safeParse(password);
  if (!parsedPassword.success) {
    return { success: false, error: 'Password cannot be empty.' };
  }

  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    console.error('ADMIN_PASSWORD environment variable is not set.');
    return { success: false, error: 'Admin authentication is not configured on the server.' };
  }

  if (parsedPassword.data === adminPassword) {
    return { success: true };
  } else {
    return { success: false, error: 'Incorrect admin password.' };
  }
}
