import { AuthProvider } from '@/context/AuthContext';
import { PresenceProvider } from '@/context/PresenceContext'; // New Import
import { Toaster } from 'sonner';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning> 
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
            if (localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
          `
        }} />
      </head>
      <body className="antialiased transition-colors duration-300">
        <AuthProvider>
          <PresenceProvider> {/* Integrated Presence Tracking */}
            {children}
            <Toaster position="top-center" richColors closeButton />
          </PresenceProvider>
        </AuthProvider>
      </body>
    </html>
  );
}