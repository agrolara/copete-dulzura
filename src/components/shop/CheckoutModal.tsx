'use client';

import React, { useState } from 'react';
import { useCart, PaymentMethod } from '@/context/CartContext';
import {
  X,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  MapPin,
  Phone,
  User,
  Loader2,
  Send,
  CreditCard,
  Banknote,
  Copy,
  Check,
} from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose }) => {
  const { cart, totalAmount, processCheckout, whatsappNumber, bankDetails } = useCart();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('transferencia');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [copiedBank, setCopiedBank] = useState(false);

  if (!isOpen) return null;

  const formattedTotal = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(totalAmount);

  const targetWhatsappNumber = (whatsappNumber || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '56987654321').replace(
    /[^0-9]/g,
    ''
  );

  const generateWhatsappMessage = () => {
    const itemsSummary = cart
      .map(
        (item) =>
          `• ${item.quantity}x ${item.name} - $${(item.price * item.quantity).toLocaleString('es-CL')}`
      )
      .join('\n');

    const paymentText =
      paymentMethod === 'transferencia'
        ? '💳 Transferencia Bancaria'
        : '💵 Efectivo al Recibir';

    const message =
      `🌸 *NUEVO PEDIDO - COPETE & DULZURA* 🍰🍷\n\n` +
      `👤 *Cliente:* ${customerName}\n` +
      `📱 *Teléfono:* ${customerPhone}\n` +
      `📍 *Dirección de Despacho:* ${deliveryAddress}\n` +
      `💰 *Método de Pago:* ${paymentText}\n\n` +
      `🛒 *DETALLE DEL PEDIDO:*\n${itemsSummary}\n\n` +
      `✨ *TOTAL A PAGAR:* ${formattedTotal}\n\n` +
      `💬 *Mensaje:* Hola Copete & Dulzura, acabo de realizar este pedido desde la página web. Por favor confirmarme la recepción y tiempo estimado de llegada.`;

    return `https://wa.me/${targetWhatsappNumber.replace('+', '').trim()}?text=${encodeURIComponent(
      message
    )}`;
  };

  const copyBankInfo = () => {
    const text = `Banco: ${bankDetails.banco}\nTipo: ${bankDetails.tipoCuenta}\nN° Cuenta: ${bankDetails.numeroCuenta}\nRUT: ${bankDetails.rut}\nNombre: ${bankDetails.nombre}\nEmail: ${bankDetails.email}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedBank(true);
      setTimeout(() => setCopiedBank(false), 2500);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !deliveryAddress) {
      setErrorMessage('Por favor completa tu nombre, teléfono y dirección de despacho.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const waUrl = generateWhatsappMessage();
      const result = await processCheckout(customerName, customerPhone, deliveryAddress, paymentMethod);

      if (result.success) {
        setIsSuccess(true);
        if (typeof window !== 'undefined') {
          window.open(waUrl, '_blank');
        }
      } else {
        setErrorMessage(result.message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al procesar la compra.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    setIsSuccess(false);
    setCustomerName('');
    setCustomerPhone('');
    setDeliveryAddress('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-zinc-950 border border-brand-pink/40 rounded-3xl max-w-lg w-full p-6 shadow-2xl overflow-hidden relative backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-pink/20 flex items-center justify-center text-brand-pink">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Finalizar Pedido Express</h3>
              <p className="text-[11px] text-zinc-400">Entrega rápida a domicilio de Copete & Dulzura</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSuccess ? (
          /* Estado de Éxito */
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-lg font-black text-white">¡Pedido Registrado con Éxito!</h4>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                Hemos preparado tu mensaje para WhatsApp. Si no se abrió automáticamente, presiona el botón inferior.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
              <span className="text-zinc-500 block text-[10px] uppercase font-bold">Total del Pedido</span>
              <span className="text-xl font-black text-brand-pink-light">{formattedTotal}</span>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  const waUrl = generateWhatsappMessage();
                  window.open(waUrl, '_blank');
                }}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg"
              >
                <Send className="w-4 h-4" />
                <span>Reabrir Chat en WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={handleFinish}
                className="w-full py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs"
              >
                Volver a la Tienda
              </button>
            </div>
          </div>
        ) : (
          /* Formulario de Checkout */
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {errorMessage && (
              <div className="p-3 rounded-2xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Resumen de Total */}
            <div className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400 block leading-none">
                  Total a Pagar
                </span>
                <span className="text-lg font-black text-white">{formattedTotal}</span>
              </div>
              <span className="text-xs text-brand-pink-light font-bold bg-brand-pink/10 px-3 py-1 rounded-full border border-brand-pink/30">
                {cart.length} ítems en tu canasta
              </span>
            </div>

            {/* Campos de Contacto */}
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                  Tu Nombre y Apellido
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Ej: Valentina González"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-pink transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                  Teléfono / WhatsApp de Contacto
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    placeholder="Ej: +56 9 8765 4321"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-pink transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                  Dirección de Entrega y Referencias
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Ej: Av. Las Condes 1234, Depto 402 (Timbre 4B)"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-pink transition-colors"
                  />
                </div>
              </div>

              {/* Selector de Método de Pago */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1.5">
                  Método de Pago
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('transferencia')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      paymentMethod === 'transferencia'
                        ? 'bg-brand-pink/20 border-brand-pink text-white shadow-neon-pink'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Transferencia</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('efectivo')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      paymentMethod === 'efectivo'
                        ? 'bg-brand-pink/20 border-brand-pink text-white shadow-neon-pink'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    <span>Efectivo al Recibir</span>
                  </button>
                </div>
              </div>

              {/* Datos Bancarios si se selecciona Transferencia */}
              {paymentMethod === 'transferencia' && (
                <div className="p-3 rounded-2xl bg-zinc-900/90 border border-brand-pink/20 text-[11px] space-y-1 relative">
                  <div className="flex items-center justify-between text-brand-pink-light font-bold">
                    <span>Datos de Transferencia:</span>
                    <button
                      type="button"
                      onClick={copyBankInfo}
                      className="inline-flex items-center gap-1 text-[10px] text-zinc-300 hover:text-white bg-zinc-800 px-2 py-0.5 rounded-lg"
                    >
                      {copiedBank ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedBank ? '¡Copiado!' : 'Copiar datos'}</span>
                    </button>
                  </div>
                  <p className="text-zinc-400 font-mono text-[10px]">
                    {bankDetails.banco} • {bankDetails.tipoCuenta} N° {bankDetails.numeroCuenta}
                    <br />
                    RUT: {bankDetails.rut} • {bankDetails.nombre}
                    <br />
                    Email: {bankDetails.email}
                  </p>
                </div>
              )}
            </div>

            {/* Botón de Enviar Pedido a WhatsApp */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-brand-pink via-brand-hot-pink to-brand-neon text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-neon-pink hover:opacity-95 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Registrando Pedido...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Confirmar y Enviar a WhatsApp</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
