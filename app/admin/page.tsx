import { unstable_cache } from "next/cache"
import { db } from "@/lib/db"
import { Card } from "@/components/ui/card"

async function getCounts() {
  return unstable_cache(
    async () => {
      const [employeeCount, announcementCount, activeAnnouncementCount] = await Promise.all([
        db.employee.count(),
        db.announcement.count(),
        db.announcement.count({
          where: { isActive: true }
        })
      ])

      return {
        employeeCount,
        announcementCount,
        activeAnnouncementCount
      }
    },
    ["dashboard-counts"],
    { revalidate: 60 }
  )()
}

export default async function AdminDashboard() {
  const { employeeCount, announcementCount, activeAnnouncementCount } = await getCounts()

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card className="p-4">
        <h3 className="text-lg font-semibold">Total Employees</h3>
        <p className="text-3xl font-bold">{employeeCount}</p>
      </Card>
      <Card className="p-4">
        <h3 className="text-lg font-semibold">Total Announcements</h3>
        <p className="text-3xl font-bold">{announcementCount}</p>
      </Card>
      <Card className="p-4">
        <h3 className="text-lg font-semibold">Active Announcements</h3>
        <p className="text-3xl font-bold">{activeAnnouncementCount}</p>
      </Card>
    </div>
  )
} 