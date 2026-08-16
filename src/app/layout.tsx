import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FillQuestBee — AI Fill-in-the-Blank & Drag-and-Drop Exam Generator',
  description:
    'FillQuestBee is an interactive AI-powered fill-in-the-blank exam creation platform for teachers and school children.',
  metadataBase: new URL('https://fillquestbee.com'),
  openGraph: {
    title: 'FillQuestBee — AI Fill-in-the-Blank Exam Generator',
    description: 'Turn school lessons into interactive drag & drop exams with FillQuestBee.',
    url: 'https://fillquestbee.com',
    siteName: 'FillQuestBee',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased`}>
        <ToastProvider>
          <AuthProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
