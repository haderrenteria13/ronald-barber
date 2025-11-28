"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Clock, Calendar, Save, Loader2 } from "lucide-react";

interface BusinessHour {
  id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export default function AdminSettings() {
  const router = useRouter();
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchBusinessHours();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/admin");
    }
  };

  const fetchBusinessHours = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("business_hours")
        .select("*")
        .order("day_of_week");

      if (error) throw error;

      // Crear array completo de 7 días
      const allDays = Array.from({ length: 7 }, (_, i) => {
        const existing = data?.find((h) => h.day_of_week === i);
        return existing || {
          id: 0,
          day_of_week: i,
          start_time: "09:00",
          end_time: "19:00",
          is_active: false,
        };
      });

      setBusinessHours(allDays);
    } catch (error) {
      console.error("Error fetching business hours:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDay = (dayIndex: number) => {
    setBusinessHours((prev) =>
      prev.map((h) =>
        h.day_of_week === dayIndex ? { ...h, is_active: !h.is_active } : h
      )
    );
  };

  const handleTimeChange = (dayIndex: number, field: "start_time" | "end_time", value: string) => {
    setBusinessHours((prev) =>
      prev.map((h) =>
        h.day_of_week === dayIndex ? { ...h, [field]: value } : h
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Eliminar todos los registros existentes
      await supabase.from("business_hours").delete().neq("id", 0);

      // Insertar solo los días activos
      const activeHours = businessHours.filter((h) => h.is_active);
      if (activeHours.length > 0) {
        const { error } = await supabase.from("business_hours").insert(
          activeHours.map((h) => ({
            day_of_week: h.day_of_week,
            start_time: h.start_time,
            end_time: h.end_time,
            is_active: h.is_active,
          }))
        );

        if (error) throw error;
      }

      alert("Horarios guardados exitosamente");
      fetchBusinessHours();
    } catch (error) {
      console.error("Error saving business hours:", error);
      alert("Error al guardar los horarios");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/admin/dashboard")}
              className="p-2 hover:bg-gray-100 rounded-xl transition-all"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
              <p className="text-sm text-gray-500">Horarios de trabajo</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="py-3 px-6 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-blue-600/20 active:scale-[0.98]"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Guardar
              </>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Horario Semanal</h2>
              <p className="text-sm text-gray-500">Configura los días y horas que trabajas</p>
            </div>
          </div>

          <div className="space-y-4">
            {businessHours.map((hour) => (
              <div
                key={hour.day_of_week}
                className={`p-4 rounded-xl border-2 transition-all ${
                  hour.is_active
                    ? "border-blue-200 bg-blue-50"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hour.is_active}
                        onChange={() => handleToggleDay(hour.day_of_week)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                    <span className={`font-bold text-lg ${hour.is_active ? "text-gray-900" : "text-gray-400"}`}>
                      {DAYS[hour.day_of_week]}
                    </span>
                  </div>

                  {hour.is_active && (
                    <div className="flex items-center gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 font-medium mb-1">Desde</label>
                        <input
                          type="time"
                          value={hour.start_time}
                          onChange={(e) => handleTimeChange(hour.day_of_week, "start_time", e.target.value)}
                          className="px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-sm font-semibold"
                        />
                      </div>
                      <span className="text-gray-400 mt-5">—</span>
                      <div>
                        <label className="block text-xs text-gray-500 font-medium mb-1">Hasta</label>
                        <input
                          type="time"
                          value={hour.end_time}
                          onChange={(e) => handleTimeChange(hour.day_of_week, "end_time", e.target.value)}
                          className="px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-sm font-semibold"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
