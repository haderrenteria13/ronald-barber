"use client";
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Clock, Loader2, Trash2, Coffee, X, CheckCircle, AlertCircle } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import "react-day-picker/dist/style.css";

interface BusinessHour {
  id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  break_start: string | null;
  break_end: string | null;
  is_active: boolean;
}

interface BlockedDate {
  id: number;
  date: string;
  reason: string | null;
}

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export default function AdminSettings() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"schedule" | "blocked">("schedule");
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [selectedBlockDate, setSelectedBlockDate] = useState<Date | undefined>(undefined);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'confirm';
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  const checkAuth = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) router.push("/admin");
  }, [router]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: hoursData, error: hoursError } = await supabase
        .from("business_hours")
        .select("*")
        .order("day_of_week");

      if (hoursError) throw hoursError;

      const allDays = Array.from({ length: 7 }, (_, i) => {
        const existing = hoursData?.find((h) => h.day_of_week === i);
        return existing || {
          id: 0,
          day_of_week: i,
          start_time: "09:00",
          end_time: "19:00",
          break_start: null,
          break_end: null,
          is_active: false,
        };
      });
      setBusinessHours(allDays);

      const { data: blockedData, error: blockedError } = await supabase
        .from("blocked_dates")
        .select("*")
        .order("date");
      
      if (blockedError) throw blockedError;
      setBlockedDates(blockedData || []);

    } catch {
      // Error silencioso
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
    fetchData();
  }, [checkAuth, fetchData]);

  const handleToggleDay = (dayIndex: number) => {
    setBusinessHours((prev) =>
      prev.map((h) =>
        h.day_of_week === dayIndex ? { ...h, is_active: !h.is_active } : h
      )
    );
  };

  const handleTimeChange = (dayIndex: number, field: keyof BusinessHour, value: string | null) => {
    setBusinessHours((prev) =>
      prev.map((h) =>
        h.day_of_week === dayIndex ? { ...h, [field]: value } : h
      )
    );
  };

  const handleSaveHours = async () => {
    setSaving(true);
    try {
      const hoursToUpsert = businessHours.map((h) => ({
        day_of_week: h.day_of_week,
        start_time: h.start_time,
        end_time: h.end_time,
        break_start: h.break_start || null,
        break_end: h.break_end || null,
        is_active: h.is_active,
      }));

      const { error } = await supabase
        .from("business_hours")
        .upsert(hoursToUpsert, { onConflict: 'day_of_week' });

      if (error) {
        throw error;
      }

      setModalConfig({
        isOpen: true,
        type: 'success',
        title: '¡Guardado!',
        message: 'Los horarios se han actualizado correctamente.'
      });
      fetchData();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      setModalConfig({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: `No se pudieron guardar los cambios: ${errorMessage}`
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddBlockedDate = async () => {
    if (!selectedBlockDate) return;
    
    const dateStr = format(selectedBlockDate, "yyyy-MM-dd");
    
    if (blockedDates.some(d => d.date === dateStr)) {
      setModalConfig({
        isOpen: true,
        type: 'error',
        title: 'Fecha no disponible',
        message: 'Esta fecha ya está bloqueada en tu calendario.'
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("blocked_dates")
        .insert([{ date: dateStr, reason: "Día libre" }]);

      if (error) throw error;
      
      setSelectedBlockDate(undefined);
      setModalConfig({
        isOpen: true,
        type: 'success',
        title: 'Día Bloqueado',
        message: 'La fecha se ha bloqueado correctamente.'
      });
      fetchData();
    } catch {
      setModalConfig({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'No se pudo bloquear la fecha. Intenta de nuevo.'
      });
    }
  };

  const handleDeleteBlockedDate = (id: number) => {
    setModalConfig({
      isOpen: true,
      type: 'confirm',
      title: '¿Desbloquear fecha?',
      message: 'Esta fecha volverá a estar disponible para reservas.',
      onConfirm: async () => {
        try {
          const { error } = await supabase.from("blocked_dates").delete().eq("id", id);
          if (error) throw error;
          fetchData();
          setModalConfig(prev => ({ ...prev, isOpen: false }));
        } catch {
          // Error silencioso
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {modalConfig.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                modalConfig.type === 'success' ? 'bg-green-100' : 
                modalConfig.type === 'error' ? 'bg-red-100' : 'bg-blue-100'
              }`}>
                {modalConfig.type === 'success' && <CheckCircle className="w-8 h-8 text-green-600" />}
                {modalConfig.type === 'error' && <X className="w-8 h-8 text-red-600" />}
                {modalConfig.type === 'confirm' && <AlertCircle className="w-8 h-8 text-blue-600" />}
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">{modalConfig.title}</h3>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                {modalConfig.message}
              </p>
              
              <div className="flex gap-3">
                {modalConfig.type === 'confirm' ? (
                  <>
                    <button
                      onClick={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                      className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={modalConfig.onConfirm}
                      className="flex-1 py-3 px-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                    >
                      Confirmar
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                    className={`flex-1 py-3 px-4 text-white font-bold rounded-xl transition-colors shadow-lg ${
                      modalConfig.type === 'error' 
                        ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20' 
                        : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
                    }`}
                  >
                    Entendido
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/admin/dashboard")}
              className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-xl transition-all text-gray-600"
              title="Ir a el Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg">
               <Image src="/og-image.png" alt="Logo" width={40} height={40} />
            </div>
            <div>
              <h1 className="text-lg font-black text-gray-900 tracking-tight leading-none">Configuración</h1>
              <p className="text-xs text-gray-500 font-medium mt-0.5">Gestiona tu horario</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        <div className="bg-gray-200/50 p-1 rounded-2xl flex gap-1 mb-6">
          <button
            onClick={() => setActiveTab("schedule")}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
              activeTab === "schedule"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Horario Semanal
          </button>
          <button
            onClick={() => setActiveTab("blocked")}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
              activeTab === "blocked"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Días Bloqueados
          </button>
        </div>

        {activeTab === "schedule" ? (
          <div className="space-y-3 pb-24">
            {businessHours.map((hour) => (
              <div
                key={hour.day_of_week}
                className={`rounded-2xl border-2 transition-all overflow-hidden ${
                  hour.is_active 
                    ? "border-blue-200 bg-blue-50/50 shadow-sm" 
                    : "border-gray-200 bg-gray-50 opacity-60"
                }`}
              >
                <div className="p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hour.is_active}
                        onChange={() => handleToggleDay(hour.day_of_week)}
                        className="sr-only peer"
                        placeholder="Activar/desactivar fecha"
                      />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 peer-focus:ring-offset-2 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 shadow-inner"></div>
                    </label>
                    <span className={`font-bold text-base ${hour.is_active ? "text-gray-900" : "text-gray-500"}`}>
                      {DAYS[hour.day_of_week]}
                    </span>
                  </div>
                </div>

                {hour.is_active && (
                  <div className="px-4 pb-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
                    <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Clock className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="text-sm font-bold text-gray-900">Horario de Trabajo</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-gray-500 font-medium mb-1 block">Inicio</label>
                          <input
                            type="time"
                            value={hour.start_time}
                            onChange={(e) => handleTimeChange(hour.day_of_week, "start_time", e.target.value)}
                            className="w-full px-2 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all min-w-0 appearance-none text-center"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 font-medium mb-1 block">Fin</label>
                          <input
                            type="time"
                            value={hour.end_time}
                            onChange={(e) => handleTimeChange(hour.day_of_week, "end_time", e.target.value)}
                            className="w-full px-2 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all min-w-0 appearance-none text-center"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-orange-50 rounded-2xl p-4 border border-orange-200 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                          <Coffee className="w-4 h-4 text-orange-600" />
                        </div>
                        <span className="text-sm font-bold text-gray-900">Descanso </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-gray-500 font-medium mb-1 block">Inicio</label>
                          <input
                            type="time"
                            value={hour.break_start || ""}
                            onChange={(e) => handleTimeChange(hour.day_of_week, "break_start", e.target.value)}
                            className="w-full px-2 py-2.5 border border-orange-200 rounded-xl text-sm font-semibold text-gray-900 bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all min-w-0 appearance-none text-center"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 font-medium mb-1 block">Fin</label>
                          <input
                            type="time"
                            value={hour.break_end || ""}
                            onChange={(e) => handleTimeChange(hour.day_of_week, "break_end", e.target.value)}
                            className="w-full px-2 py-2.5 border border-orange-200 rounded-xl text-sm font-semibold text-gray-900 bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all min-w-0 appearance-none text-center"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-200 p-4 z-20 shadow-lg">
              <div className="max-w-md mx-auto">
                <button
                  onClick={handleSaveHours}
                  disabled={saving}
                  className="w-full py-3.5 px-6 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 active:scale-[0.97]"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      Guardar Cambios
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <div className="mb-6">
                <h2 className="text-xl font-black text-gray-900 tracking-tight">Selecciona una fecha</h2>
                <p className="text-sm text-gray-500 font-medium">Toca un día para bloquearlo</p>
              </div>

              <div className="flex justify-center mb-8 bg-gray-50/50 rounded-2xl p-2">
                <DayPicker
                  mode="single"
                  selected={selectedBlockDate}
                  onSelect={setSelectedBlockDate}
                  locale={es}
                  disabled={blockedDates.map(d => new Date(d.date))}
                />
              </div>

              <button
                onClick={handleAddBlockedDate}
                disabled={!selectedBlockDate}
                className="w-full py-4 bg-blue-600 shadow-lg shadow-blue-600/20 text-white font-bold rounded-2xl hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                Bloquear Día Seleccionado
              </button>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-gray-900 text-lg px-2 flex items-center gap-2">
                Días Bloqueados 
                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full font-bold">
                  {blockedDates.length}
                </span>
              </h3>
              
              {blockedDates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 text-3xl">
                    📅
                  </div>
                  <p className="text-gray-900 font-bold text-lg">No hay dias bloqueados</p>
                  <p className="text-gray-500 text-sm mt-1">No tienes días bloqueados en tu agenda</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {blockedDates.map((block) => (
                    <div key={block.id} className="group flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm active:scale-[0.99] transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-red-50 rounded-2xl flex flex-col items-center justify-center shrink-0 border border-red-100">
                          <span className="text-red-600 font-black text-xl leading-none">
                            {format(new Date(block.date), "d")}
                          </span>
                          <span className="text-red-400 text-[10px] font-bold uppercase mt-0.5">
                            {format(new Date(block.date), "MMM", { locale: es })}
                          </span>
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 capitalize text-lg leading-tight mb-0.5">
                            {format(new Date(block.date), "EEEE", { locale: es })}
                          </p>
                          <p className="text-xs text-gray-500 font-medium">
                            {format(new Date(block.date), "yyyy")} • Día libre
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteBlockedDate(block.id)}
                        className="w-10 h-10 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title="Desbloquear"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
