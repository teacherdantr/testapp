
'use client';

import { useEffect, useState } from 'react';
import type { RedirectLink } from '@prisma/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  getAllRedirectLinks,
  createRedirectLink,
  updateRedirectLink,
  deleteRedirectLink,
} from '@/lib/actions/redirectActions';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Link as LinkIcon, Edit, Trash2, Copy, PlusCircle, AlertTriangle, Link2 } from 'lucide-react';
import { format } from 'date-fns';

const linkSchema = z.object({
  slug: z.string().min(3, 'Slug must be at least 3 characters').regex(/^[a-zA-Z0-9_-]+$/, 'Slug can only contain letters, numbers, hyphens, and underscores.'),
  url: z.string().url('Please enter a valid URL (e.g., https://example.com)'),
});

type LinkFormValues = z.infer<typeof linkSchema>;

export default function RedirectLinksPage() {
  const { toast } = useToast();
  const [links, setLinks] = useState<RedirectLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingLink, setEditingLink] = useState<RedirectLink | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState<RedirectLink | null>(null);

  const form = useForm<LinkFormValues>({
    resolver: zodResolver(linkSchema),
    defaultValues: { slug: '', url: '' },
  });

  const fetchLinks = async () => {
    setIsLoading(true);
    const result = await getAllRedirectLinks();
    if (result.success && result.links) {
      setLinks(result.links);
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const handleFormSubmit = async (values: LinkFormValues) => {
    setIsSubmitting(true);
    const action = editingLink ? updateRedirectLink : createRedirectLink;
    const result = await action(editingLink?.id, values);

    if (result.success) {
      toast({ title: 'Success', description: `Link ${editingLink ? 'updated' : 'created'}.` });
      fetchLinks(); // Refresh list
      setIsFormOpen(false); // Close dialog
      setEditingLink(null);
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
    setIsSubmitting(false);
  };

  const openCreateForm = () => {
    setEditingLink(null);
    form.reset({ slug: '', url: '' });
    setIsFormOpen(true);
  };

  const openEditForm = (link: RedirectLink) => {
    setEditingLink(link);
    form.reset({ slug: link.slug, url: link.url });
    setIsFormOpen(true);
  };

  const openDeleteDialog = (link: RedirectLink) => {
    setLinkToDelete(link);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!linkToDelete) return;
    const result = await deleteRedirectLink(linkToDelete.id);
    if (result.success) {
      toast({ title: 'Success', description: 'Link deleted.' });
      fetchLinks();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
    setIsDeleteDialogOpen(false);
    setLinkToDelete(null);
  };

  const handleCopyLink = (slug: string) => {
    const fullUrl = `${window.location.origin}/r/${slug}`;
    navigator.clipboard.writeText(fullUrl);
    toast({ title: 'Copied!', description: 'Redirect link copied to clipboard.' });
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-3xl font-bold text-primary flex items-center"><LinkIcon className="mr-3 h-8 w-8" /> Redirect Links</CardTitle>
            <CardDescription>Create and manage short URLs that redirect to other websites.</CardDescription>
          </div>
          <Button onClick={openCreateForm}><PlusCircle className="mr-2 h-4 w-4" /> Create Link</Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : links.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Short Link</TableHead>
                  <TableHead>Destination URL</TableHead>
                  <TableHead className="text-center">Clicks</TableHead>
                  <TableHead className="text-right">Created</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {links.map((link) => (
                  <TableRow key={link.id}>
                    <TableCell className="font-medium">
                      <a href={`/r/${link.slug}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center">
                        <Link2 className="mr-2 h-4 w-4" /> /r/{link.slug}
                      </a>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      <a href={link.url} target="_blank" rel="noopener noreferrer" title={link.url}>{link.url}</a>
                    </TableCell>
                    <TableCell className="text-center font-mono">{link.clicks}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{format(new Date(link.createdAt), 'PP')}</TableCell>
                    <TableCell className="text-center space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => handleCopyLink(link.slug)}><Copy className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => openEditForm(link)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(link)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">No redirect links found. Create your first one!</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLink ? 'Edit' : 'Create'} Redirect Link</DialogTitle>
            <DialogDescription>
              {editingLink ? 'Update the details for this redirect link.' : 'Enter a short slug and a destination URL.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="slug">Slug</Label>
              <div className="flex items-center">
                <span className="text-muted-foreground px-3 py-2 bg-muted border border-r-0 rounded-l-md">/r/</span>
                <Input id="slug" {...form.register('slug')} placeholder="your-short-link" className="rounded-l-none" />
              </div>
              {form.formState.errors.slug && <p className="text-sm text-destructive mt-1">{form.formState.errors.slug.message}</p>}
            </div>
            <div>
              <Label htmlFor="url">Destination URL</Label>
              <Input id="url" {...form.register('url')} placeholder="https://example.com/long/url/to/shorten" />
              {form.formState.errors.url && <p className="text-sm text-destructive mt-1">{form.formState.errors.url.message}</p>}
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Link'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center"><AlertTriangle className="mr-2 h-6 w-6 text-destructive"/>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the link /r/{linkToDelete?.slug}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
