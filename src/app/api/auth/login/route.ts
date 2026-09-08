import { NextResponse } from 'next/server';

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'carolinaserey2019@icloud.com').trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Martina123';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body || {};

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Por favor ingresa correo y contraseña.' },
        { status: 400 }
      );
    }

    const inputEmail = String(email).trim().toLowerCase();
    const inputPass = String(password).trim();

    if (inputEmail === ADMIN_EMAIL && inputPass === ADMIN_PASSWORD) {
      const token = Buffer.from(`${inputEmail}:${Date.now()}`).toString('base64');
      return NextResponse.json({
        success: true,
        user: { email: inputEmail, role: 'admin' },
        token,
      });
    }

    return NextResponse.json(
      { error: 'Credenciales inválidas. Correo o contraseña incorrectos.' },
      { status: 401 }
    );
  } catch (e: any) {
    console.error('Error en /api/auth/login:', e);
    return NextResponse.json({ error: e?.message || 'Error interno del servidor' }, { status: 500 });
  }
}
