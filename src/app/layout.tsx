import type { Metadata } from 'next';
import { Cairo } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { LanguageProvider } from '@/context/LanguageContext';
import AnalyticsInit from '@/components/AnalyticsInit';

const cairo = Cairo({ subsets: ['arabic', 'latin'], variable: '--font-cairo', display: 'swap' });

export const metadata: Metadata = {
  title: 'RoboFab Operations System',
  description: 'نظام إدارة عمليات RoboFab',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body className="font-cairo antialiased bg-[#F5F7FB] text-slate-900 min-h-screen">
        <LanguageProvider>
          <AuthProvider>
            <AnalyticsInit />
            {children}
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
