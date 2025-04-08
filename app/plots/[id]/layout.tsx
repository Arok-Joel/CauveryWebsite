import React, { Suspense } from 'react';
import PlotDetailLoading from './loading';

export default function PlotDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<PlotDetailLoading />}>
      {children}
    </Suspense>
  );
} 