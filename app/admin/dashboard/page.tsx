"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import { Calendar, LogOut, Settings, X, TrendingUp, Phone, Loader2, AlertCircle } from "lucide-react";
import { format, isToday, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface Appointment {
  id: number;
  service_id: number;
  client_name: string;
  client_phone: string;
  notes: string | null;
  start_time: string;
  end_time: string;
  status: string;
  created_at: string;
  services: {
    name: string;
    price: number;
    duration: number;
  };
}

export default function AdminDashboard() {
  const router = useRouter();
  const supabase = createClient();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"today" | "upcoming" | "past">("today");
  const [stats, setStats] = useState({ today: 0, pending: 0 });
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);
  const [errorModal, setErrorModal] = useState<{ isOpen: boolean; message: string }>({ isOpen: false, message: "" });

  const checkAuth = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) router.push("/admin");
  }, [router]);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select(`*, services (name, price, duration)`)
        .order("start_time", { ascending: true });

      if (error) throw error;
      
      const appts = data || [];
      setAppointments(appts);

      const todayCount = appts.filter(a => isToday(parseISO(a.start_time)) && a.status === 'confirmed').length;
      const pendingCount = appts.filter(a => new Date(a.start_time) >= new Date() && a.status === 'confirmed').length;
      setStats({ today: todayCount, pending: pendingCount });

    } catch {
      // Error silencioso
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
    fetchAppointments();
  }, [checkAuth, fetchAppointments]);

  const handleClickCancel = (apt: Appointment) => {
    setAppointmentToCancel(apt);
  };
  const confirmCancellation = async () => {
    if (!appointmentToCancel) return;

    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: "cancelled" })
        .eq("id", appointmentToCancel.id);

      if (error) throw error;
      
      fetchAppointments();
      setAppointmentToCancel(null);
    } catch {
      setErrorModal({ isOpen: true, message: "No se pudo cancelar la cita. Por favor intenta de nuevo." });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/admin");
  };

  const filteredAppointments = appointments.filter((apt) => {
    const now = new Date();
    const aptDate = new Date(apt.start_time);
    
    if (filter === "today") return isToday(aptDate) && apt.status === "confirmed";
    if (filter === "upcoming") return aptDate >= now && !isToday(aptDate) && apt.status === "confirmed";

    return aptDate < now || apt.status !== "confirmed";
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 relative">
      {errorModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Error</h3>
              <p className="text-sm text-gray-500 mb-6">
                {errorModal.message}
              </p>
              
              <button
                onClick={() => setErrorModal({ isOpen: false, message: "" })}
                className="w-full py-3 px-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {appointmentToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">¿Cancelar esta cita?</h3>
              <p className="text-sm text-gray-500 mb-6">
                Estás a punto de cancelar la cita de <span className="font-bold text-gray-800">{appointmentToCancel.client_name}</span> para el servicio de <span className="font-bold text-gray-800">{appointmentToCancel.services.name}</span>.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setAppointmentToCancel(null)}
                  className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Volver
                </button>
                <button
                  onClick={confirmCancellation}
                  className="flex-1 py-3 px-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
                >
                  Sí, Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg">
              <Image src="/og-image.png" alt="Logo" width={40} height={40} />
            </div>
            <div>
              <h1 className="text-lg font-black text-gray-900 tracking-tight leading-none">Bienvenido</h1>
              <p className="text-xs text-gray-500 font-medium mt-0.5 capitalize">
                {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/admin/settings")}
              className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={handleLogout}
              className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-all"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-6">
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-blue-50 rounded-lg">
                <Calendar className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-xs font-medium text-gray-500">Hoy</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.today}</p>
            <p className="text-xs text-gray-400">Citas agendadas</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-green-50 rounded-lg">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-xs font-medium text-gray-500">Pendientes</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            <p className="text-xs text-gray-400">Próximos días</p>
          </div>
        </div>

        <div className="bg-gray-200/50 p-1 rounded-2xl flex gap-1 mb-6">
          {[
            { id: "today", label: "Hoy" },
            { id: "upcoming", label: "Próximas" },
            { id: "past", label: "Pasadas" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as "today" | "upcoming" | "past")}
              className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
                filter === tab.id
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {filteredAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 text-3xl">
              😴
            </div>
            <p className="text-gray-900 font-bold text-lg">Sin citas</p>
            <p className="text-gray-500 text-sm mt-1">No hay citas en esta categoría</p>
          </div>
          ) : (
            filteredAppointments.map((apt) => {
              const date = parseISO(apt.start_time);
              const isCancelled = apt.status === "cancelled";
              
              return (
                <div
                  key={apt.id}
                  className={`bg-white rounded-2xl p-4 border shadow-sm transition-all relative overflow-hidden ${
                    isCancelled ? "border-red-100 bg-red-50/30 opacity-75" : "border-gray-100"
                  }`}
                >
                  {isCancelled && (
                    <div className="absolute top-0 right-0 bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 rounded-bl-xl">
                      CANCELADA
                    </div>
                  )}
                  
                  <div className="flex gap-4">
                    <div className={`flex flex-col items-center justify-center w-20 h-20 rounded-2xl shrink-0 border ${
                      isCancelled 
                        ? "bg-red-50 border-red-100 text-red-400" 
                        : "bg-blue-50 border-blue-100 text-blue-600"
                    }`}>
                      <span className="text-2xl font-black tracking-tight leading-none">
                        {format(date, "h:mm")}
                      </span>
                      <span className="text-xs font-bold uppercase mt-1 opacity-80">
                        {format(date, "aa")}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className={`font-bold text-gray-900 truncate ${isCancelled && "line-through text-gray-500"}`}>
                          {apt.client_name}
                        </h3>
                        {!isCancelled && (
                          <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md whitespace-nowrap ml-2">
                            {format(date, "d MMM", { locale: es })}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-500 mb-2 truncate">{apt.services.name}</p>
                      
                      <div className="flex items-center gap-3">
                        <a href={`tel:${apt.client_phone}`} className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-blue-600 transition-colors bg-gray-50 px-2 py-1 rounded-lg">
                          <Phone className="w-3 h-3" />
                          {apt.client_phone}
                        </a>
                        <span className="text-xs font-bold text-gray-900 bg-gray-50 px-2 py-1 rounded-lg">
                          ${apt.services.price.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {!isCancelled && (
                      <div className="flex flex-col justify-center pl-2 border-l border-gray-100">
                        <button
                          onClick={() => handleClickCancel(apt)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          title="Cancelar"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Notes display removed */}
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
