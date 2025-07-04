
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

export default async function RedirectPage({ params }: { params: { slug: string } }) {
  const { slug } = params;

  if (!slug) {
    notFound();
  }

  try {
    const link = await prisma.redirectLink.findUnique({
      where: { slug },
    });

    if (!link) {
      notFound();
    }

    // Atomically increment the click count. This is fire-and-forget.
    prisma.redirectLink.update({
      where: { id: link.id },
      data: { clicks: { increment: 1 } },
    }).catch(console.error); // Log errors but don't block the redirect

    // Perform the redirect to the destination URL
    redirect(link.url);

  } catch (error) {
    console.error(`Redirect error for slug [${slug}]:`, error);
    // You could redirect to a generic error page instead of notFound
    notFound();
  }
}
