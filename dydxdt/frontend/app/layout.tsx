'use client';

import '@/styles/globals.css';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const initAuth = useAuthStore((s) => s.initAuth);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <html lang="en" className="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Dy_Dx_Dt — Mathematical Solutions Platform</title>
        <meta
          name="description"
          content="Premium mathematical platform for textbook solutions, formulas, and step-by-step explanations."
        />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-obsidian-950 text-white antialiased">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: '#0f0f14',
              color: '#f8f6f0',
              border: '1px solid rgba(200,169,110,0.2)',
              borderRadius: '8px',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif'
            },
            success: {
              iconTheme: { primary: '#c8a96e', secondary: '#050507' }
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#050507' }
            }
          }}
        />
      </body>
    </html>
  );
}
