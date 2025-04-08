import React, { Suspense } from 'react';
import { Metadata } from 'next';
import PlotPageLoading from './loading';

export const metadata: Metadata = {
  title: 'Royal Cauvery Farms - Plots',
  description: 'Browse available plots at Royal Cauvery Farms',
}

export default function PlotsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<PlotPageLoading />}>
      {children}
    </Suspense>
  );
} 