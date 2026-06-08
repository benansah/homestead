import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { CompareProvider } from '../context/CompareContext';
import CompareBar from '../components/CompareBar';
import { Toaster } from 'react-hot-toast';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Homestead — Find Student Hostels in Ghana',
  description: 'Verified student hostels near every university in Ghana. Book a viewing for just GHS 50.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#006AFF',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <CompareProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                style: { borderRadius: 12, fontSize: 14, fontWeight: 500 },
                success: { iconTheme: { primary: '#006AFF', secondary: '#fff' } },
              }}
            />
            {children}
            <CompareBar />
          </CompareProvider>
        </AuthProvider>
      </body>
    </html>
  );
}