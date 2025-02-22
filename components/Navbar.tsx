"use client";

import Link from "next/link"
import { Button } from "./ui/button"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Menu, User, LogOut } from "lucide-react"

export function Navbar() {
  const router = useRouter();
  const { user, setUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to logout");
      }

      setUser(null);
      toast.success("Logged out successfully");
      router.push("/auth/login");
    } catch (error) {
      toast.error("Failed to logout");
    } finally {
      setIsLoading(false);
    }
  };

  const navigation = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <nav className="bg-[#3C5A3E] text-white py-4">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            Royal Cauvery Farms
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navigation.map((item) => (
              <Link key={item.name} href={item.href} className="hover:text-white/80">
                {item.name}
              </Link>
            ))}

            {user ? (
              <div className="flex items-center gap-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="bg-white/10 text-white hover:bg-white/20">
                      <User className="mr-2 h-4 w-4" />
                      {user.role === "ADMIN" ? "Admin" : user.name}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {user.role === "ADMIN" && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin">Admin Dashboard</Link>
                      </DropdownMenuItem>
                    )}
                    {user.role === "EMPLOYEE" && (
                      <DropdownMenuItem asChild>
                        <Link href="/employee/dashboard">Employee Dashboard</Link>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button 
                  onClick={handleLogout}
                  disabled={isLoading}
                  variant="outline"
                  className="bg-white/10 text-white hover:bg-white/20"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {isLoading ? "Logging out..." : "Logout"}
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Button asChild variant="outline" className="bg-white/10 text-white hover:bg-white/20">
                  <Link href="/auth/login">Login</Link>
                </Button>
                <Button asChild variant="outline" className="bg-white/10 text-white hover:bg-white/20">
                  <Link href="/auth/employee/register">Employee Register</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Navigation */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden bg-white/10 text-white hover:bg-white/20">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col gap-4">
                {navigation.map((item) => (
                  <Link key={item.name} href={item.href} className="text-lg">
                    {item.name}
                  </Link>
                ))}
                {user ? (
                  <>
                    {user.role === "ADMIN" && (
                      <Link href="/admin" className="text-lg">
                        Admin Dashboard
                      </Link>
                    )}
                    {user.role === "EMPLOYEE" && (
                      <Link href="/employee/dashboard" className="text-lg">
                        Employee Dashboard
                      </Link>
                    )}
                    <Button 
                      onClick={handleLogout}
                      disabled={isLoading}
                      variant="outline"
                      className="w-full"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      {isLoading ? "Logging out..." : "Logout"}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/auth/login">Login</Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/auth/employee/register">Employee Register</Link>
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}