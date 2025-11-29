import { NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    
    const rateLimit = await checkRateLimit(ip);
    
    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: "Demasiados intentos. Por favor espera un minuto." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { clientName, clientPhone, serviceName, date, time } = body;

    const BOT_URL = process.env.WHATSAPP_BOT_URL || 'http://localhost:3001';

    const message = `Entonces mi rey ${clientName}, tu cita para *${serviceName}* en Ronald Barber está confirmada para el *${date}* a las *${time}*. ¡Te esperamos! 💈`;

    const response = await fetch(`${BOT_URL}/enviar-mensaje`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: clientPhone.replace(/\D/g, ''), 
        message: message
      })
    });

    if (!response.ok) {
      throw new Error('Error al comunicarse con el servidor del bot');
    }


    return NextResponse.json({ success: true, message: "Mensaje enviado" });
  } catch {
    return NextResponse.json({ success: false, error: "Error al enviar mensaje" }, { status: 200 });
  }
}
