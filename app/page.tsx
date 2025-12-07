"use client";
import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import Navbar from "@/components/navBar/Navbar";
import ServiceSelector from "@/components/serviceSelector/ServiceSelector";
import TimeSelector from "@/components/timeSelector/TimeSelector";
import ContactForm from "@/components/contactForm/ContactForm";
import ConfirmationScreen from "@/components/confirmationScreen/ConfirmationScreen";

export default function Home() {
  const [step, setStep] = useState(1);
  const [bookingData, setBookingData] = useState({
    serviceId: null as number | null,
    serviceName: '',
    serviceDuration: 0,
    servicePrice: 0,
    date: null as Date | null,
    clientName: '',
  });

  const handleServiceSelect = (id: number, name: string, price: number, duration: number) => {
    setBookingData({ ...bookingData, serviceId: id, serviceName: name, servicePrice: price, serviceDuration: duration });
    setStep(2);
    window.scrollTo(0, 0);
  };

  const handleTimeSelect = (date: Date) => {
    setBookingData({ ...bookingData, date });
    setStep(3);
    window.scrollTo(0, 0);
  };

  const handleBookingSuccess = (clientName: string) => {
    setBookingData({ ...bookingData, clientName });
    setStep(4);
    window.scrollTo(0, 0);
  };

  const handleNewBooking = () => {
    setStep(1);
    setBookingData({
      serviceId: null,
      serviceName: '',
      serviceDuration: 0,
      servicePrice: 0,
      date: null,
      clientName: '',
    });
  };

  return (
    <main className="min-h-screen">
      {step !== 4 && <Navbar />}

      {step === 1 && (
        <ServiceSelector 
          onSelect={handleServiceSelect} 
        />
      )}

      {step === 2 && (
        <div className="p-4">
          <div className="max-w-md mx-auto">
            <button 
              onClick={() => setStep(1)} 
              className="flex items-center gap-1 text-sm text-gray-600 mb-6 hover:text-black transition-colors group"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Volver a servicios</span>
            </button>
          </div>
          
          <TimeSelector 
            selectedServiceDuration={bookingData.serviceDuration}
            selectedServiceName={bookingData.serviceName}
            selectedServicePrice={bookingData.servicePrice}
            onSelectTime={handleTimeSelect}
          />
        </div>
      )}

      {step === 3 && bookingData.serviceId && bookingData.date && (
        <div className="p-4">
          <div className="max-w-md mx-auto">
            <button 
              onClick={() => setStep(2)} 
              className="flex items-center gap-1 text-sm text-gray-600 mb-6 hover:text-black transition-colors group"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Volver al calendario</span>
            </button>
          </div>

          <ContactForm
            serviceId={bookingData.serviceId}
            serviceName={bookingData.serviceName}
            servicePrice={bookingData.servicePrice}
            serviceDuration={bookingData.serviceDuration}
            selectedDate={bookingData.date}
            onSuccess={handleBookingSuccess}
            onBack={() => setStep(2)}
          />
        </div>
      )}

      {step === 4 && bookingData.date && (
        <div className="p-4 animate-in fade-in zoom-in duration-500">
          <ConfirmationScreen
            serviceName={bookingData.serviceName}
            servicePrice={bookingData.servicePrice}
            serviceDuration={bookingData.serviceDuration}
            selectedDate={bookingData.date}
            clientName={bookingData.clientName}
            onNewBooking={handleNewBooking}
          />
        </div>
      )}
    </main>
  );
}
