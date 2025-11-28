import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { clientName, clientPhone, serviceName, date, time } = body;

    // URL de tu servidor del bot (en local es http://localhost:3001)
    // En producción será la URL de Google Cloud Run
    const BOT_URL = process.env.WHATSAPP_BOT_URL || 'http://localhost:3001';

    const message = `Hola ${clientName}, tu cita para *${serviceName}* en Ronald Barber está confirmada para el *${date}* a las *${time}*. ¡Te esperamos! 💈`;

    // Llamar al servidor del Bot
    const response = await fetch(`${BOT_URL}/enviar-mensaje`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: clientPhone.replace(/\D/g, ''), // Solo números
        message: message
      })
    });

    if (!response.ok) {
      throw new Error('Error al comunicarse con el servidor del bot');
    }

    console.log("📨 Mensaje enviado vía Bot a:", clientPhone);

    return NextResponse.json({ success: true, message: "Mensaje enviado" });
  } catch (error) {
    console.error("Error enviando mensaje:", error);
    // No fallamos la petición completa, solo logueamos el error
    return NextResponse.json({ success: false, error: "Error al enviar mensaje" }, { status: 200 });
  }
}
