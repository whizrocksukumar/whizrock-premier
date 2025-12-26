import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Sidebar from './components/Sidebar';
import HelpMenu from '@/components/HelpMenu';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Premier Insulation | Quote & Job Management',
  description: 'Modern quote and job management system for Premier Insulation',
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex h-screen bg-gray-50`}>
        {/* Sidebar */}
        <Sidebar />

        {/* Main content area with header */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header Bar */}
          <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-end shadow-sm">
            <HelpMenu />
          </header>

          {/* Main content */}
          <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[90%] px-4 py-6">
            {children}
          </div>
        </main>

        </div>
      </body>
    </html>
  );
}