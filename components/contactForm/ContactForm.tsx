"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { User, Phone, Loader2 } from "lucide-react";
import Image from "next/image";

const getServiceImage = (name: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("barba")) return "/cortes/barba.jpg";
  if (lowerName.includes("pintura")) return "/cortes/cortePintura.jpg";
  return "/cortes/corte.jpg";
};

interface ContactFormProps {
  serviceId: number;
  serviceName: string;
  servicePrice: number;
  serviceDuration: number;
  selectedDate: Date;
  onSuccess: (clientName: string) => void;
  onBack: () => void;
}

export default function ContactForm({
  serviceId,
  serviceName,
  servicePrice,
  serviceDuration,
  selectedDate,
  onSuccess,
  onBack,
}: ContactFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim()) {
      setError("Por favor ingresa tu nombre");
      return;
    }
    
    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (!phoneDigits) {
      setError("Por favor ingresa tu teléfono");
      return;
    }
    if (phoneDigits.length !== 10) {
      setError("El teléfono debe tener exactamente 10 dígitos");
      return;
    }

    setLoading(true);

    try {
      const endTime = new Date(selectedDate.getTime() + serviceDuration * 60000);
      const { error: insertError } = await supabase
        .from("appointments")
        .insert([
          {
            service_id: serviceId,
            client_name: formData.name,
            client_phone: formData.phone,
            notes: null, // Removed notes field
            start_time: selectedDate.toISOString(),
            end_time: endTime.toISOString(),
          },
        ])
        .select();

      if (insertError) throw insertError;

      fetch('/api/send-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: formData.name,
          clientPhone: formData.phone,
          serviceName: serviceName,
          date: format(selectedDate, "EEEE d 'de' MMMM", { locale: es }),
          time: format(selectedDate, "h:mm aa"),
        }),
      }).catch(() => {
      });

      onSuccess(formData.name);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Error al crear la cita. Intenta de nuevo.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-2xl p-5 mb-6 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-gray-50">
            <Image 
              src={getServiceImage(serviceName)} 
              alt={serviceName}
              fill
              className="object-cover"
            />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Servicio</p>
            <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1">{serviceName}</h3>
            <p className="text-sm text-gray-500">{serviceDuration} min</p>
          </div>

          <div className="text-right shrink-0">
            <p className="font-bold text-gray-900 text-2xl leading-none">${servicePrice.toLocaleString()}</p>
          </div>
        </div>

        <div className="h-px bg-gray-200 mb-4"></div>

        <div className="flex justify-between items-center text-sm">
          <div>
            <p className="text-gray-500 font-medium mb-0.5">Fecha</p>
            <p className="font-semibold text-gray-900 capitalize">
              {format(selectedDate, "EEE d 'de' MMM", { locale: es })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-gray-500 font-medium mb-0.5">Hora</p>
            <p className="font-semibold text-gray-900">{format(selectedDate, "h:mm aa")}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <h3 className="font-bold text-gray-900 text-xl mb-6">Tus datos</h3>

        <div>
          <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
            Nombre completo <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full pl-4 pr-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all bg-white"
              placeholder="Aqui tu nombre"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
            Teléfono <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                let formatted = value;
                if (value.length > 6) {
                  formatted = `${value.slice(0, 3)} ${value.slice(3, 6)} ${value.slice(6)}`;
                } else if (value.length > 3) {
                  formatted = `${value.slice(0, 3)} ${value.slice(3)}`;
                }
                setFormData({ ...formData, phone: formatted });
              }}
              className="w-full pl-4 pr-12 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all bg-white"
              placeholder="Aqui tu numero"
              required
            />
          </div>
          {formData.phone && formData.phone.replace(/\D/g, '').length > 0 && formData.phone.replace(/\D/g, '').length < 10 && (
            <p className="text-xs text-red-500 mt-1">El teléfono debe tener 10 dígitos</p>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3 pt-6 pb-8">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 active:scale-[0.98]"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                      <span>Confirmando...</span>
                </div>
            ) : (
              "Confirmar Reserva"
            )}
          </button>
          <button
            type="button"
            onClick={onBack}
            disabled={loading}
            className="w-full py-4 px-6 border border-gray-200 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            Volver
          </button>
        </div>
      </form>
    </div>
  );
}
