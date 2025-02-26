import { unstable_cache } from 'next/cache';
import { db } from '@/lib/db';
import type { Announcement, User } from '@prisma/client';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import Link from 'next/link';

type AnnouncementWithAdmin = Announcement & {
  admin: User;
};

async function getAnnouncements() {
  return unstable_cache(
    async () => {
      const announcements = await db.announcement.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { admin: true },
      });
      return announcements as AnnouncementWithAdmin[];
    },
    ['announcements-list'],
    { revalidate: 60 }
  )();
}

export default async function AnnouncementsPage() {
  const announcements = await getAnnouncements();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Announcements</h2>
        <Button asChild>
          <Link href="/admin/announcements/new">Create Announcement</Link>
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {announcements.map((announcement: AnnouncementWithAdmin) => (
              <TableRow key={announcement.id}>
                <TableCell>{announcement.title}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      announcement.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {announcement.isActive ? 'Active' : 'Inactive'}
                  </span>
                </TableCell>
                <TableCell>{announcement.admin.name}</TableCell>
                <TableCell>{format(announcement.createdAt, 'PPP')}</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/announcements/${announcement.id}`}>View</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {announcements.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  No announcements found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
