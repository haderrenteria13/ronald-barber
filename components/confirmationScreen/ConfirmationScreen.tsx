"use client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCircle, Calendar, Clock, DollarSign } from "lucide-react";

interface ConfirmationScreenProps {
  serviceName: string;
  servicePrice: number;
  serviceDuration: number;
  selectedDate: Date;
  clientName: string;
  onNewBooking: () => void;
}

export default function ConfirmationScreen({
  serviceName,
  servicePrice,
  serviceDuration,
  selectedDate,
  clientName,
  onNewBooking,
}: ConfirmationScreenProps) {
  return (
    <div className="max-w-md mx-auto text-center py-8 px-4">
      <div className="mb-3 animate-in zoom-in duration-300">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto drop-shadow-sm" />
      </div>

      <h2 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">
        ¡Eso es todo mi rey! 🎉
      </h2>
      <p className="text-gray-500 mb-8 text-lg">
        Gracias {clientName}, tu cita ha sido agendada exitosamente
      </p>

      <div className="bg-white rounded-2xl p-5 mb-6 border border-gray-100 shadow-sm">
        <h2 className="font-bold text-gray-900 mb-4 text-lg text-left">Detalles de tu cita</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl shrink-0">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-left">
              <p className="text-xs text-gray-500 font-medium">Fecha y hora</p>
              <p className="font-bold text-gray-900 capitalize">
                {format(selectedDate, "EEE d 'de' MMM", { locale: es })} • {format(selectedDate, "h:mm aa")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl shrink-0">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-left">
              <p className="text-xs text-gray-500 font-medium">Servicio</p>
              <p className="font-bold text-gray-900">{serviceName} • {serviceDuration} min</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl shrink-0">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-left">
              <p className="text-xs text-gray-500 font-medium">Precio</p>
              <p className="font-bold text-gray-900 text-lg">
                ${servicePrice.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 mb-8">
        <p className="text-sm text-gray-700 font-medium leading-relaxed text-center">
          💈 Te esperamos en Ronald Barber. Si necesitas cancelar o reprogramar, 
          por favor contáctanos con anticipación.
        </p>
      </div> */}

      <div className="grid grid-cols-1 gap-3 mb-6">
        <button
          onClick={() => {
            const PHONE_NUMBER = "573209396474"; 
            const message = `Hola, soy ${clientName}. Acabo de reservar una cita para *${serviceName}* el día *${format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}* a las *${format(selectedDate, "h:mm aa")}*.`;
            window.open(`https://wa.me/${PHONE_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
          }}
          className="w-full py-4 px-6 bg-green-500 text-white font-bold rounded-2xl hover:bg-green-600 transition-all shadow-lg shadow-green-500/20 flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
          Enviar confirmación por WhatsApp
        </button>

        <button
          onClick={() => {
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            
            if (isMobile) {
              const startTime = selectedDate.toISOString().replace(/-|:|\.\d{3}/g, "");
              const endTime = new Date(selectedDate.getTime() + serviceDuration * 60000).toISOString().replace(/-|:|\.\d{3}/g, "");
              
              const icsContent = [
                'BEGIN:VCALENDAR',
                'VERSION:2.0',
                'PRODID:-//Ronald Barber//Booking//ES',
                'BEGIN:VEVENT',
                `DTSTART:${startTime}`,
                `DTEND:${endTime}`,
                `SUMMARY:Cita en Ronald Barber - ${serviceName}`,
                `DESCRIPTION:Cita para ${serviceName}. Precio: $${servicePrice}. Duración: ${serviceDuration} min.`,
                'LOCATION:Barbería Ronald',
                'STATUS:CONFIRMED',
                'END:VEVENT',
                'END:VCALENDAR'
              ].join('\n');
              
              const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
              const link = document.createElement('a');
              link.href = URL.createObjectURL(blob);
              link.download = `cita-ronald-barber-${format(selectedDate, 'yyyy-MM-dd')}.ics`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(link.href);
            } else {
              const startTime = selectedDate.toISOString().replace(/-|:|\.\d\d\d/g, "");
              const endTime = new Date(selectedDate.getTime() + serviceDuration * 60000).toISOString().replace(/-|:|\.\d\d\d/g, "");
              const details = `Cita para ${serviceName} con Ronald Barber. Precio: $${servicePrice}`;
              const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Cita en Ronald Barber - ${serviceName}`)}&dates=${startTime}/${endTime}&details=${encodeURIComponent(details)}&location=Barbería Ronald`;
              window.open(url, '_blank');
            }
          }}
          className="w-full py-4 px-6 border border-gray-200 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          <Calendar className="w-6 h-6" />
          Agregar a Google Calendar
        </button>
      </div>

      <button
        onClick={onNewBooking}
        className="w-full py-4 px-6 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]"
      >
        Hacer otra reserva
      </button>
    </div>
  );
}
