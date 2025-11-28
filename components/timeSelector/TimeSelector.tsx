
"use client";
import { useState, useEffect } from "react";
import { 
  addDays, format, setHours, setMinutes, addMinutes, isBefore, isEqual, startOfDay, endOfDay, isToday, isSameDay, parseISO 
} from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/lib/supabase";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from "lucide-react";
import Image from "next/image";

type Appointment = {
  start_time: string;
  end_time: string;
};

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


export default function TimeSelector({ 
  selectedServiceDuration, 
  selectedServiceName, 
  selectedServicePrice, 
  onSelectTime 
}: TimeSelectorProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [busySlots, setBusySlots] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);

  const WORK_START = 10;
  const WORK_END = 20;
  const AFTERNOON_START = 12;

  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      const start = startOfDay(selectedDate).toISOString();
      const end = endOfDay(selectedDate).toISOString();

      const { data, error } = await supabase
        .from('appointments')
        .select('start_time, end_time')
        .gte('start_time', start)
        .lte('start_time', end);

      if (error) console.error(error);
      setBusySlots(data || []);
      setLoading(false);
    };

    fetchAppointments();
    setSelectedTime(null);
  }, [selectedDate]);

  const generateTimeSlots = () => {
    const slots = [];
    let currentTime = setMinutes(setHours(selectedDate, WORK_START), 0);
    const endTime = setMinutes(setHours(selectedDate, WORK_END), 0);
    const now = new Date();

    while (isBefore(currentTime, endTime)) {
      const slotEnd = addMinutes(currentTime, selectedServiceDuration);

      if (isBefore(currentTime, now)) {
        currentTime = addMinutes(currentTime, 30);
        continue;
      }

      const isBusy = busySlots.some((appt) => {
        const apptStart = new Date(appt.start_time);
        const apptEnd = new Date(appt.end_time);
        return isBefore(currentTime, apptEnd) && isBefore(apptStart, slotEnd);
      });

      if (!isBusy && (isBefore(slotEnd, endTime) || isEqual(slotEnd, endTime))) {
        slots.push(new Date(currentTime));
      }

      currentTime = addMinutes(currentTime, 30);
    }
    return slots;
  };

  const availableSlots = generateTimeSlots();

  const morningSlots = availableSlots.filter(slot => slot.getHours() < AFTERNOON_START);
  const afternoonSlots = availableSlots.filter(slot => slot.getHours() >= AFTERNOON_START);

  const handleConfirm = () => {
    if (selectedTime) {
      onSelectTime(selectedTime);
    }
  };

  const TimeSlotSection = ({ title, slots }: { title: string; slots: Date[] }) => {
    if (slots.length === 0) return null;
    
    return (
      <div className="max-w-md mx-auto px-4 mb-6">
        <h4 className="text-sm font-medium text-gray-500 mb-3">{title}</h4>
        <div className="grid grid-cols-4 gap-3">
          {slots.map((time, i) => {
            const isSelected = selectedTime?.toISOString() === time.toISOString();
            return (
              <button
                key={i}
                onClick={() => setSelectedTime(time)}
                className={`min-w-[80px] py-3 px-3 rounded-xl text-sm font-semibold transition-all text-center
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
            onClick={() => setSelectedDate(addDays(selectedDate, -1))}
            disabled={isBefore(addDays(selectedDate, -1), startOfDay(new Date()))}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            aria-label="Día anterior"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={() => setSelectedDate(addDays(selectedDate, 1))}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            aria-label="Día siguiente"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto py-4 scrollbar-hide relative -mx-4 px-4">
        {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
          const date = addDays(new Date(), offset);
          const isSelected = startOfDay(date).toISOString() === startOfDay(selectedDate).toISOString();
          const isCurrentDay = isToday(date);
          
          let opacity = 1;
          if (!isSelected) {
            const selectedOffset = Math.floor((selectedDate.getTime() - startOfDay(new Date()).getTime()) / (1000 * 60 * 60 * 24));
            const distance = Math.abs(offset - selectedOffset);
            opacity = Math.max(0.3, 1 - (distance * 0.15));
          }
          
          return (
            <button
              key={offset}
              onClick={() => setSelectedDate(date)}
              style={{ opacity }}
              className={`min-w-[64px] px-2 py-3 rounded-2xl flex flex-col items-center transition-all shrink-0
                ${isSelected 
                  ? "bg-black text-white shadow-md scale-105" 
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-transparent"
                }`}
            >
              <span className="text-xs font-medium mb-1 opacity-80">
                {isCurrentDay ? 'Hoy' : format(date, 'EEE', { locale: es })}
              </span>
              <span className="text-xl font-bold">{format(date, 'd')}</span>
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
            <div>
              <div className="h-4 w-20 bg-gray-100 rounded mb-3"></div>
              <div className="grid grid-cols-4 gap-3">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-50 rounded-xl border border-gray-100"></div>
                ))}
              </div>
            </div>
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
            <TimeSlotSection title="Mañana" slots={morningSlots} />
            <TimeSlotSection title="Tarde" slots={afternoonSlots} />
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