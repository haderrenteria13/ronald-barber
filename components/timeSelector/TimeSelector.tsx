
"use client";
import { useState, useEffect } from "react";
import { 
  addDays, format, setHours, setMinutes, addMinutes, isBefore, isEqual, startOfDay, endOfDay, isToday, getDay 
} from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/lib/supabase";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

type Appointment = {
  start_time: string;
  end_time: string;
};

interface BusinessHour {
  day_of_week: number;
  start_time: string;
  end_time: string;
  break_start: string | null;
  break_end: string | null;
  is_active: boolean;
}

const getServiceImage = (name: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("barba")) return "/cortes/barba.jpg";
  if (lowerName.includes("pintura")) return "/cortes/cortePintura.jpg";
  return "/cortes/corte.jpg";
};

interface TimeSelectorProps {
  selectedServiceDuration: number;
  selectedServiceName: string;
  selectedServicePrice: number;
  onSelectTime: (date: Date) => void;
}

const TimeSlotSection = ({ title, slots, selectedTime, onSelectTime }: { 
  title: string; 
  slots: Date[];
  selectedTime: Date | null;
  onSelectTime: (time: Date) => void;
}) => {
  if (slots.length === 0) return null;
  
  return (
    <div className="max-w-md mx-auto px-4 mb-6">
      <h4 className="text-sm font-medium text-gray-500 mb-3">{title}</h4>
      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
        {slots.map((time, i) => {
          const isSelected = selectedTime?.toISOString() === time.toISOString();
          return (
            <button
              key={i}
              onClick={() => onSelectTime(time)}
              className={`py-2.5 px-1 rounded-xl text-xs font-bold transition-all text-center truncate
                ${isSelected 
                  ? "bg-blue-600 text-white shadow-md scale-105" 
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-100"
                }`}
            >
              {format(time, 'h:mm aa')}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default function TimeSelector({ 
  selectedServiceDuration, 
  selectedServiceName, 
  selectedServicePrice, 
  onSelectTime 
}: TimeSelectorProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [busySlots, setBusySlots] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);

  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [dayConfig, setDayConfig] = useState<BusinessHour | null>(null);
  const [isDayBlocked, setIsDayBlocked] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data: hours } = await supabase.from("business_hours").select("*");
        if (hours) setBusinessHours(hours);

        const { data: blocked } = await supabase.from("blocked_dates").select("date");
        if (blocked) setBlockedDates(blocked.map(b => b.date));
      } catch {
        // Error silencioso
      }
    };
    fetchConfig();
  }, []);

  useEffect(() => {
    const updateDayConfig = async () => {
      setLoading(true);
      
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const isBlocked = blockedDates.includes(dateStr);
      setIsDayBlocked(isBlocked);

      const dayOfWeek = getDay(selectedDate);
      const config = businessHours.find(h => h.day_of_week === dayOfWeek);
      setDayConfig(config || null);
      if (!isBlocked && config?.is_active) {
        const start = startOfDay(selectedDate).toISOString();
        const end = endOfDay(selectedDate).toISOString();

        const { data } = await supabase
          .from('appointments')
          .select('start_time, end_time')
          .eq('status', 'confirmed')
          .gte('start_time', start)
          .lte('start_time', end);

        setBusySlots(data || []);
      } else {
        setBusySlots([]);
      }
      
      setLoading(false);
    };

    if (businessHours.length > 0) {
      updateDayConfig();
    }
  }, [selectedDate, businessHours, blockedDates]);



  const generateTimeSlots = () => {
    if (!dayConfig || !dayConfig.is_active || isDayBlocked) return [];

    const [startHour, startMinute] = dayConfig.start_time.split(':').map(Number);
    const [endHour, endMinute] = dayConfig.end_time.split(':').map(Number);

    const businessStart = setMinutes(setHours(selectedDate, startHour), startMinute);
    const businessEnd = setMinutes(setHours(selectedDate, endHour), endMinute);
    const now = new Date();

    let breakStart: Date | null = null;
    let breakEnd: Date | null = null;
    
    if (dayConfig.break_start && dayConfig.break_end) {
      const [bStartH, bStartM] = dayConfig.break_start.split(':').map(Number);
      const [bEndH, bEndM] = dayConfig.break_end.split(':').map(Number);
      breakStart = setMinutes(setHours(selectedDate, bStartH), bStartM);
      breakEnd = setMinutes(setHours(selectedDate, bEndH), bEndM);
    }

    // 1. Puntos de inicio potenciales: 
    // - Intervalos regulares cada 30 min (para llenar días vacíos)
    // - Fin de cada cita existente (para lógica Lego estricta)
    const potentialStartTimes = [];
    
    // Generar intervalos regulares cada 30 min
    let tempTime = new Date(businessStart);
    while (isBefore(tempTime, businessEnd)) {
      potentialStartTimes.push(new Date(tempTime));
      tempTime = addMinutes(tempTime, 30);
    }

    // Agregar fin de citas existentes (Lego)
    busySlots.forEach(appt => {
      const apptEnd = new Date(appt.end_time);
      if (isBefore(apptEnd, businessEnd) || isEqual(apptEnd, businessEnd)) {
        potentialStartTimes.push(apptEnd);
      }
    });

    // Ordenar cronológicamente y eliminar duplicados
    potentialStartTimes.sort((a, b) => a.getTime() - b.getTime());

    const validSlots: Date[] = [];
    const uniqueStartTimes = potentialStartTimes.filter((time, index, self) => 
      index === 0 || time.getTime() !== self[index - 1].getTime()
    );

    // 2. Validar cada punto de inicio
    uniqueStartTimes.forEach(startTime => {
      // Si ya pasó la hora actual (para el día de hoy), ignorar
      if (isBefore(startTime, now)) return;

      const slotEnd = addMinutes(startTime, selectedServiceDuration);

      // Verificar si termina después del cierre
      if (isBefore(businessEnd, slotEnd)) return;

      // Verificar colisión con el descanso (si existe)
      if (breakStart && breakEnd) {
        if (
          (startTime >= breakStart && startTime < breakEnd) ||
          (slotEnd > breakStart && slotEnd <= breakEnd) ||
          (startTime <= breakStart && slotEnd >= breakEnd)
        ) {
          return;
        }
      }

      // Verificar colisión con otras citas
      const isBusy = busySlots.some((appt) => {
        const apptStart = new Date(appt.start_time);
        const apptEnd = new Date(appt.end_time);
        
        // Verificación estricta de solapamiento
        return (
          (startTime >= apptStart && startTime < apptEnd) || 
          (slotEnd > apptStart && slotEnd <= apptEnd) || 
          (startTime <= apptStart && slotEnd >= apptEnd)
        );
      });

      if (!isBusy) {
        validSlots.push(startTime);
      }
    });

    return validSlots;
  };

  const availableSlots = generateTimeSlots();
  const morningSlots = availableSlots.filter(slot => slot.getHours() < 12);
  const afternoonSlots = availableSlots.filter(slot => slot.getHours() >= 12);

  const handleConfirm = () => {
    if (selectedTime) {
      onSelectTime(selectedTime);
    }
  };

  const MAX_DAYS_IN_ADVANCE = 60;

  const startOfView = addDays(selectedDate, -1);
  const effectiveStartOfView = isBefore(startOfView, startOfDay(new Date())) 
    ? startOfDay(new Date()) 
    : startOfView;

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white p-4 rounded-2xl mb-8 flex items-center justify-between border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-gray-50">
            <Image 
              src={getServiceImage(selectedServiceName)} 
              alt={selectedServiceName}
              fill
              className="object-cover"
            />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-0.5">Servicio</p>
            <h3 className="font-bold text-gray-900 leading-tight">{selectedServiceName}</h3>
            <p className="text-sm text-gray-500">{selectedServiceDuration} min</p>
          </div>
        </div>
        <div className="text-right">
          <span className="block font-bold text-lg text-gray-900">
            ${selectedServicePrice.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="border-b border-gray-100 mb-6"></div>

      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-gray-900 text-xl capitalize">
          {format(selectedDate, "EEEE, MMMM d", { locale: es })}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => { setSelectedDate(addDays(selectedDate, -1)); setSelectedTime(null); }}
            disabled={isBefore(addDays(selectedDate, -1), startOfDay(new Date()))}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            aria-label="Día anterior"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={() => { setSelectedDate(addDays(selectedDate, 1)); setSelectedTime(null); }}
            disabled={isBefore(addDays(startOfDay(new Date()), MAX_DAYS_IN_ADVANCE), addDays(selectedDate, 1))}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Día siguiente"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto py-4 scrollbar-hide relative -mx-4 px-4">
        {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
          const date = addDays(effectiveStartOfView, offset);
          const isSelected = startOfDay(date).toISOString() === startOfDay(selectedDate).toISOString();
          const isCurrentDay = isToday(date);
          
          const dateStr = format(date, "yyyy-MM-dd");
          const isBlocked = blockedDates.includes(dateStr);
          const dayConfig = businessHours.find(h => h.day_of_week === getDay(date));
          const isInactive = !dayConfig?.is_active;
          const isDisabled = isBlocked || isInactive;
          
          return (
            <button
              key={offset}
              onClick={() => { setSelectedDate(date); setSelectedTime(null); }}
              className={`min-w-[64px] px-2 py-3 rounded-2xl flex flex-col items-center transition-all shrink-0
                ${isSelected 
                  ? "bg-black text-white shadow-md scale-105" 
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-transparent"
                }
                ${isDisabled && !isSelected ? "grayscale opacity-50" : ""}
              `}
            >
              <span className={`text-xs font-medium mb-1 ${isSelected ? "opacity-80" : "opacity-50"}`}>
                {isCurrentDay ? 'Hoy' : format(date, 'EEE', { locale: es })}
              </span>
              <span className="text-xl font-bold">{format(date, 'd')}</span>
              {isDisabled && <span className="text-[10px] text-red-500 font-bold mt-1">NO</span>}
            </button>
          );
        })}
      </div>

      <div className="mt-8 mb-32">
        {loading ? (
          <div className="animate-pulse space-y-6">
            <div>
              <div className="h-4 w-20 bg-gray-100 rounded mb-3"></div>
              <div className="grid grid-cols-4 gap-3">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-50 rounded-xl border border-gray-100"></div>
                ))}
              </div>
            </div>
          </div>
        ) : isDayBlocked || !dayConfig?.is_active ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 text-3xl">
              😴
            </div>
            <p className="text-gray-900 font-bold text-lg">Ronald no trabaja este día</p>
            <p className="text-gray-500 text-sm mt-1">Por favor selecciona otra fecha</p>
          </div>
        ) : availableSlots.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 text-3xl">
              💈
            </div>
            <p className="text-gray-900 font-bold text-lg">Ronald está full este día</p>
            <p className="text-gray-500 text-sm mt-1">Intenta seleccionar otro día en el calendario</p>
          </div>
        ) : (
          <>
            <TimeSlotSection title="Mañana" slots={morningSlots} selectedTime={selectedTime} onSelectTime={setSelectedTime} />
            <TimeSlotSection title="Tarde" slots={afternoonSlots} selectedTime={selectedTime} onSelectTime={setSelectedTime} />
          </>
        )}
      </div>

      {selectedTime && (
        <div className="fixed bottom-6 left-0 right-0 px-4 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <button 
            onClick={handleConfirm}
            className="w-full max-w-md mx-auto flex justify-between items-center bg-blue-600 text-white font-bold py-4 px-6 rounded-2xl shadow-xl hover:bg-blue-700 transition-all transform active:scale-[0.98]"
          >
            <span className="text-lg">Confirmar Cita</span>
            <div className="text-right">
              <span className="block font-bold text-lg">
                {format(selectedTime, "d 'de' MMMM", { locale: es })}
              </span>
              <span className="text-sm font-normal opacity-90">
                {format(selectedTime, 'h:mm aa')} • {selectedServiceDuration} min
              </span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}