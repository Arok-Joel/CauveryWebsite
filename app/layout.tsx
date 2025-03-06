// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/lib/auth-context';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from "@vercel/analytics/react"

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Royal Cauvery Farms',
  description: 'Royal Cauvery Farms - Your trusted partner in real estate',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full`}>
        <AuthProvider>
          <TooltipProvider>
            <Navbar />
            {children}
            <Toaster />
            <SpeedInsights />
            <Analytics/>
          </TooltipProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
