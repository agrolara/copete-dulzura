import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { CartDrawer } from '@/components/shop/CartDrawer';

export const metadata: Metadata = {
  title: 'Copete & Dulzura | Delivery Nocturno & Pastelería Fina',
  description:
    'El match perfecto: coctelería premium, piscos, espumantes rosé y la mejor repostería fina entregada en minutos a tu puerta.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-brand-pink selection:text-white">
        <CartProvider>
          {children}
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
