import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'sonner'; // Import this
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
          {/* RichColors gives us the beautiful Green/Red/Blue styles */}
          <Toaster position="top-center" richColors closeButton />
        </AuthProvider>
      </body>
    </html>
  );
}