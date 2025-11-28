"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Image from "next/image";

type Service = {
  id: number;
  name: string;
  price: number;
  duration: number;
};

interface ServiceSelectorProps {
  onSelect: (id: number, name: string, price: number, duration: number) => void;
}

const getServiceImage = (name: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("barba")) return "/cortes/barba.jpg";
  if (lowerName.includes("pintura")) return "/cortes/cortePintura.jpg";
  return "/cortes/corte.jpg";
};

export default function ServiceSelector({ onSelect }: ServiceSelectorProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('price', { ascending: true });

      if (error) console.error('Error:', error);
      else setServices(data || []);
      setLoading(false);
    };
    fetchServices();
  }, []);

  const handleSelect = (id: number) => {
    if (selectedId === id) {
      setSelectedId(null); 
    } else {
      setSelectedId(id); 
    }
  };

  const selectedService = services.find(s => s.id === selectedId);

  if (loading) {
    return (
      <div className="max-w-md mx-auto p-4 animate-in fade-in duration-500">
        <div className="flex flex-col items-center mb-8 space-y-2">
          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div> 
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div> 
        </div>

        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex justify-between items-center p-4 border border-gray-100 rounded-xl bg-white">
              <div className="space-y-2">
                <div className="h-5 w-40 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-16 bg-gray-100 rounded animate-pulse"></div>
              </div>
              <div className="h-7 w-16 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="mb-8">
        <p className="text-gray-500 text-sm font-medium mb-1">Manín</p>
        <h2 className="text-2xl font-bold text-gray-900">
            ¿Qué te vas a hacer hoy?
        </h2>
      </div>
      
      <div className="space-y-3">
        {services.map((service) => {
          const isActive = selectedId === service.id;
          
          return (
            <div
              key={service.id}
              onClick={() => handleSelect(service.id)}
              className={`p-4 border rounded-2xl cursor-pointer transition-all flex justify-between items-center select-none
                ${isActive 
                  ? "border-black bg-black text-white shadow-lg scale-105"
                  : "border-gray-100 hover:border-gray-300 bg-white text-gray-900 shadow-sm"
                }`}
            >
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-gray-50">
                  <Image 
                    src={getServiceImage(service.name)} 
                    alt={service.name}
                    fill
                    className="object-cover"
                  />
                </div>

                <div>
                  <h3 className="font-bold text-lg leading-tight">{service.name}</h3>
                  <p className={`text-sm mt-1 ${isActive ? "text-gray-300" : "text-gray-500"}`}>
                    {service.duration} min
                  </p>
                </div>
              </div>
              <span className="font-bold text-lg">
                ${service.price.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>

      {selectedService && (
        <div className="fixed bottom-6 left-0 right-0 px-4 animate-bounce-in z-50">
          <button 
            onClick={() => onSelect(selectedService.id, selectedService.name, selectedService.price, selectedService.duration)}
            className="w-full max-w-md mx-auto flex justify-between items-center bg-blue-600 text-white font-bold py-4 px-6 rounded-2xl shadow-xl hover:bg-blue-700 transition-transform transform active:scale-95"
          >
            <span className="text-lg">Continuar</span>
            <div className="text-right">
              <span className="block font-bold text-lg">${selectedService.price.toLocaleString()}</span>
              <span className="text-xs font-normal opacity-90">{selectedService.duration} min</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}