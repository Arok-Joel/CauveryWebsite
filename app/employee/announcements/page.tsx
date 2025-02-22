"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface Announcement {
  id: string
  title: string
  content: string
  createdAt: string
  admin: {
    name: string
  }
}

export default function EmployeeAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchAnnouncements() {
      try {
        const response = await fetch("/api/employee/announcements", {
          credentials: "include",
        })
        
        if (!response.ok) {
          throw new Error("Failed to fetch announcements")
        }

        const data = await response.json()
        setAnnouncements(data.announcements)
      } catch (error) {
        console.error("Error fetching announcements:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnnouncements()
  }, [])

  if (isLoading) {
    return <AnnouncementsSkeleton />
  }

  if (!announcements.length) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-semibold text-gray-600">No announcements yet</h2>
        <p className="text-gray-500 mt-2">Check back later for updates</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {announcements.map((announcement) => (
        <Card key={announcement.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle className="text-xl font-semibold text-[#3C5A3E]">
                {announcement.title}
              </CardTitle>
              <div className="text-sm text-gray-500">
                {new Date(announcement.createdAt).toLocaleDateString()}
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Posted by {announcement.admin.name}
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              {announcement.content}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function AnnouncementsSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <Skeleton className="h-6 w-[300px]" />
              <Skeleton className="h-4 w-[100px]" />
            </div>
            <Skeleton className="h-4 w-[150px] mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 