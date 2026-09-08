'use client';

import React from 'react';
import Link from 'next/link';
import { Cake, Wine, Heart, Clock, ShieldCheck, Phone, MapPin, Send } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export const Footer: React.FC = () => {
  const { whatsappNumber, footerSettings } = useCart();
  const phone = (whatsappNumber || '56987654321').replace(/[^0-9]/g, '');

  const description =
    footerSettings?.description ||
    'La primera plataforma que une la coctelería y licores fríos con la repostería artesanal más exquisita. Tu previa o celebración en minutos.';
  const scheduleLines =
    footerSettings?.scheduleLines && footerSettings.scheduleLines.length > 0
      ? footerSettings.scheduleLines
      : [
          'Lunes a Miércoles: 18:00 - 02:00 hrs',
          'Jueves a Sábado: 17:00 - 05:00 hrs',
          'Domingos: 15:00 - 01:00 hrs',
          'Despacho express en Chile',
        ];
  const paymentInfo =
    footerSettings?.paymentInfo ||
    'Aceptamos Transferencia Electrónica y Efectivo al recibir tu pedido. Todas las compras se coordinan de forma segura por WhatsApp.';

  return (
    <footer className="w-full bg-zinc-950 border-t border-zinc-900 mt-16 text-zinc-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Columna 1: Brand & Misión */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-pink to-brand-neon flex items-center justify-center text-white shadow-neon-pink">
                <Cake className="w-4 h-4" />
              </div>
              <span className="font-black text-white text-base tracking-tight">
                COPETE & <span className="text-brand-pink">DULZURA</span>
              </span>
            </div>
            <p className="text-zinc-500 leading-relaxed text-xs">
              {description}
            </p>
          </div>

          {/* Columna 2: Despacho & Horarios */}
          <div className="space-y-2.5">
            <h4 className="font-extrabold text-white text-xs uppercase tracking-wider flex items-center gap-1.5 text-brand-pink-light">
              <Clock className="w-4 h-4 text-brand-pink" />
              <span>Horarios de Atención</span>
            </h4>
            <ul className="space-y-1.5 text-zinc-500">
              {scheduleLines.map((line, idx) => (
                <li key={idx} className={idx === 1 ? 'text-white font-semibold' : ''}>
                  {line}
                </li>
              ))}
            </ul>
          </div>

          {/* Columna 3: Métodos de Pago & Seguridad */}
          <div className="space-y-2.5">
            <h4 className="font-extrabold text-white text-xs uppercase tracking-wider flex items-center gap-1.5 text-brand-pink-light">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Medios de Pago</span>
            </h4>
            <p className="text-zinc-500 leading-relaxed">
              {paymentInfo}
            </p>
          </div>

          {/* Columna 4: Contacto Express */}
          <div className="space-y-2.5">
            <h4 className="font-extrabold text-white text-xs uppercase tracking-wider flex items-center gap-1.5 text-brand-pink-light">
              <Phone className="w-4 h-4 text-brand-pink" />
              <span>Contacto Directo</span>
            </h4>
            <p className="text-zinc-500">¿Dudas o pedidos especiales para eventos?</p>
            <a
              href={`https://wa.me/${phone}?text=${encodeURIComponent('Hola Copete & Dulzura, tengo una consulta sobre sus productos.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-brand-pink/30 text-xs font-bold text-white transition-all shadow-sm"
            >
              <Send className="w-3.5 h-3.5 text-brand-pink" />
              <span>Chatear por WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Barra inferior de derechos y acceso admin */}
        <div className="mt-10 pt-6 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-600">
          <p>© {new Date().getFullYear()} Copete & Dulzura SpA. Todos los derechos reservados.</p>
          <div className="flex items-center gap-4">
            <span className="text-zinc-500 font-medium">Hecho con estilo moderno y femenino por Mauricio Lara</span>
            <Link href="/admin" className="text-zinc-500 hover:text-brand-pink-light transition-colors underline">
              Acceso Super Administrador
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
