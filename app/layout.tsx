// app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'JACSICE - Faculty Information System',
  description: 'JACSICE Faculty Information Management System',
  icons: {
    icon: '/favicon.ico',
    // Or use PNG/SVG:
    // icon: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}