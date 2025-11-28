"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Calendar, Clock, LogOut, Settings, User, X } from "lucide-react";
import { format } from "date-fns";
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
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("upcoming");

  useEffect(() => {
    checkAuth();
    fetchAppointments();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/admin");
    } else {
      setUser(user);
    }
  };

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          services (
            name,
            price,
            duration
          )
        `)
        .order("start_time", { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (id: number) => {
    if (!confirm("¿Estás seguro de cancelar esta cita?")) return;

    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: "cancelled" })
        .eq("id", id);

      if (error) throw error;
      fetchAppointments();
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      alert("Error al cancelar la cita");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/admin");
  };

  const filteredAppointments = appointments.filter((apt) => {
    const now = new Date();
    const aptDate = new Date(apt.start_time);

    if (filter === "upcoming") {
      return aptDate >= now && apt.status === "confirmed";
    } else if (filter === "past") {
      return aptDate < now || apt.status !== "confirmed";
    }
    return true;
  });

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
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
            <p className="text-sm text-gray-500">Ronald Barber</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/admin/settings")}
              className="p-3 border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all active:scale-[0.98]"
              title="Configuración"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={handleLogout}
              className="p-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-all active:scale-[0.98]"
              title="Cerrar sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter("upcoming")}
            className={`px-4 py-2 rounded-xl font-semibold transition-all ${
              filter === "upcoming"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            Próximas
          </button>
          <button
            onClick={() => setFilter("past")}
            className={`px-4 py-2 rounded-xl font-semibold transition-all ${
              filter === "past"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            Pasadas
          </button>
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-xl font-semibold transition-all ${
              filter === "all"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            Todas
          </button>
        </div>

        {/* Appointments List */}
        <div className="space-y-4">
          {filteredAppointments.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No hay citas para mostrar</p>
            </div>
          ) : (
            filteredAppointments.map((apt) => (
              <div
                key={apt.id}
                className={`bg-white rounded-2xl p-5 border shadow-sm transition-all ${
                  apt.status === "cancelled"
                    ? "border-red-200 bg-red-50"
                    : "border-gray-100 hover:shadow-md"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-blue-100 rounded-xl">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{apt.client_name}</h3>
                        <p className="text-sm text-gray-500">{apt.client_phone}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500 font-medium mb-1">Servicio</p>
                        <p className="font-bold text-gray-900">{apt.services.name}</p>
                        <p className="text-gray-600">${apt.services.price.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 font-medium mb-1">Fecha y hora</p>
                        <p className="font-bold text-gray-900 capitalize">
                          {format(new Date(apt.start_time), "EEE d 'de' MMM", { locale: es })}
                        </p>
                        <p className="text-gray-600">{format(new Date(apt.start_time), "h:mm aa")}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 font-medium mb-1">Estado</p>
                        <span
                          className={`inline-block px-3 py-1 rounded-lg text-xs font-bold ${
                            apt.status === "confirmed"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {apt.status === "confirmed" ? "Confirmada" : "Cancelada"}
                        </span>
                      </div>
                    </div>

                    {apt.notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-xl">
                        <p className="text-xs text-gray-500 font-medium mb-1">Notas</p>
                        <p className="text-sm text-gray-700">{apt.notes}</p>
                      </div>
                    )}
                  </div>

                  {apt.status === "confirmed" && (
                    <button
                      onClick={() => handleCancelAppointment(apt.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      title="Cancelar cita"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
