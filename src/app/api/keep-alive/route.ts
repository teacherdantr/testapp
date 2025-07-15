import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * @swagger
 * /api/keep-alive:
 *   get:
 *     summary: Prevents the database from sleeping by running a simple query.
 *     description: This endpoint executes a minimal `SELECT 1` query against the database to ensure the connection remains active, preventing auto-suspension by some cloud providers. It's intended to be called periodically by an external uptime monitoring service.
 *     tags:
 *       - Health
 *     responses:
 *       '200':
 *         description: Database query was successful.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *       '500':
 *         description: The database query failed.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Database query failed"
 */
export async function GET() {
  try {
    // A simple, lightweight query to keep the database connection alive.
    // $queryRaw is used for raw SQL queries. SELECT 1 is a standard, fast, no-op query.
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error('Keep-alive database ping failed:', error);
    return NextResponse.json(
      { ok: false, error: 'Database query failed' },
      { status: 500 }
    );
  }
}
