"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const navigation = [
    {
      name: "Dashboard",
      href: "/admin",
    },
    {
      name: "Teams",
      href: "/admin/teams",
    },
    {
      name: "Employees",
      href: "/admin/employees",
    },
    {
      name: "Announcements",
      href: "/admin/announcements",
    },
  ]

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white">
        <div className="p-4">
          <h1 className="text-2xl font-bold">Admin Panel</h1>
        </div>
        <nav className="mt-8">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`block px-4 py-2 mx-4 rounded-lg ${
                pathname === item.href
                  ? "bg-gray-800 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 bg-gray-100">
        <header className="bg-white shadow">
          <div className="px-4 py-6">
            <h2 className="text-xl font-semibold text-gray-800">
              {navigation.find((item) => item.href === pathname)?.name || "Admin"}
            </h2>
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}