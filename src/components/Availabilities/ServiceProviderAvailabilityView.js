import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { collection, query, where, getDocs, updateDoc, doc, Timestamp, setDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebaseConfig.js';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { getAuth } from 'firebase/auth';
import './ServiceProviderAvailabilityView.css';

const ServiceProviderAvailabilityView = () => {
  const { serviceProviderId } = useParams();
  const [availabilities, setAvailabilities] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [providerDetails, setProviderDetails] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [showSlots, setShowSlots] = useState(false);
  const [confirmedSlot, setConfirmedSlot] = useState('');

  const getAuthenticatedUserId = () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      return user.uid;
    } else {
      setError('Utilisateur non authentifié');
      return null;
    }
  };

  const fetchAvailabilities = async () => {
    try {
      const availabilitiesRef = collection(db, 'service_provider_availabilities');
      const availabilitiesQuery = query(
        availabilitiesRef,
        where('service_provider_id', '==', serviceProviderId)
      );

      const querySnapshot = await getDocs(availabilitiesQuery);
      const availabilitiesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setAvailabilities(availabilitiesData);

      // Si une date est sélectionnée, mettre à jour les créneaux
      if (selectedDate) {
        const updatedSlots = getAvailableSlotsForDate(selectedDate, availabilitiesData);
        setTimeSlots(updatedSlots);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!serviceProviderId) {
        setError('No provider ID provided');
        setIsLoading(false);
        return;
      }

      try {
        const providerDoc = await getDocs(
          query(collection(db, 'service_providers'), 
          where('user_id', '==', serviceProviderId))
        );
        
        if (!providerDoc.empty) {
          const providerData = providerDoc.docs[0].data();
          setProviderDetails(providerData);
        }

        await fetchAvailabilities();
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [serviceProviderId]);

  const getAvailableSlotsForDate = (date, currentAvailabilities = availabilities) => {
    const selectedDayOfWeek = date.toLocaleString('en-us', { weekday: 'long' }).toUpperCase();
    
    const availableSlots = currentAvailabilities
      .filter((availability) => availability.day_of_week === selectedDayOfWeek)
      .map(slot => ({
        ...slot,
        provider_name: providerDetails?.name || 'Provider Name Not Found',
        service: providerDetails?.service || 'Service Not Found',
        is_booked: slot.booked_dates?.some(bookedDate => 
          bookedDate.date === date.toISOString().split('T')[0] && bookedDate.isBooked
        ) || false
      }));

    return availableSlots;
  };

  const handleDateClick = (arg) => {
    const date = new Date(arg.dateStr);
    if (!isDateAvailable(date)) return;
    setSelectedDate(date);
    const slots = getAvailableSlotsForDate(date);
    setTimeSlots(slots);
    setShowSlots(slots.length > 0);
    // Réinitialiser la sélection
    setSelectedSlot(null);
    setConfirmedSlot('');
  };

  const isDateAvailable = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);

    // Désactive les dates passées
    return selectedDate >= today;
  };

  const handleSlotSelect = (slot) => {
    if (slot.is_booked) {
      return;
    }
    setSelectedSlot(slot);
    setConfirmedSlot(`${slot.start_time} - ${slot.end_time}`);
  };

  const handleConfirmBooking = async () => {
    if (!selectedSlot || !serviceProviderId) {
      alert("Please select a valid slot before confirming the booking.");
      return;
    }

    const currentDate = new Date();
    if (selectedDate < currentDate) {
      alert("You cannot book an appointment in the past.");
      return;
    }

    const userId = getAuthenticatedUserId();
    if (!userId) {
      alert("Vous devez être connecté pour réserver un rendez-vous.");
      return;
    }

    try {
      const slotDateTimeString = `${selectedDate.toISOString().split('T')[0]}T${selectedSlot.start_time}`;

      const appointmentRef = doc(collection(db, 'appointments'));
      const appointmentData = {
        date: Timestamp.fromDate(new Date(slotDateTimeString)),
        provider_id: serviceProviderId,
        provider_name: selectedSlot.provider_name,
        service: selectedSlot.service,
        status: 'Reservé',
        user_id: userId,
        created_at: Timestamp.now(),        
      };

      await setDoc(appointmentRef, appointmentData);

      const newBookedDate = {
        date: selectedDate.toISOString().split('T')[0],
        isBooked: true
      };

      const availabilityRef = doc(db, 'service_provider_availabilities', selectedSlot.id);
      await updateDoc(availabilityRef, {
        booked_dates: arrayUnion(newBookedDate)
      });

      // Rafraîchir les disponibilités et mettre à jour l'interface
      await fetchAvailabilities();
      
      // Mise à jour immédiate de l'état local
      setTimeSlots(prevSlots => 
        prevSlots.map(slot => 
          slot.id === selectedSlot.id 
            ? { ...slot, is_booked: true }
            : slot
        )
      );

      alert('Appointment booked successfully!');
      setSelectedSlot(null);
      setConfirmedSlot('');
    } catch (err) {
      alert('Error booking the appointment: ' + err.message);
    }
  };

  if (isLoading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-[#D9E7F5] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mt-20">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#669BC2] to-[#5A8DA0] p-6 ">
            <h2 className="text-2xl font-semibold text-white">
              Prendre un Rendez-vous
            </h2>
            <p className="text-blue-100 mt-2">
              Sélectionnez une date et un horaire qui vous convient
            </p>
          </div>

          {/* Content */}
          <div className="p-6 flex flex-col lg:flex-row gap-8">
            {/* Calendar Section */}
            <div className="lg:w-3/5">
              <div className="bg-white rounded-xl shadow-sm p-4">
                <FullCalendar
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                  }}
                  dateClick={handleDateClick}
                  height="auto"
                  dayCellClassNames={(arg) => {
                    const dateStr = arg.date.toISOString().split('T')[0];
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const cellDate = new Date(dateStr);
                    cellDate.setHours(0, 0, 0, 0);

                    // Désactive les cellules du passé
                    if (cellDate < today) {
                      return 'disabled-day'; // Classe CSS pour les jours passés
                    }
                    // Met en évidence la date sélectionnée
                    if (dateStr === selectedDate?.toISOString().split('T')[0]) {
                      return 'selected-day'; // Classe CSS pour la date sélectionnée
                    }
                    return '';
                  }}
                />
              </div>
            </div>

            {/* Time Slots Section */}
            <div className={`lg:w-2/5 ${showSlots ? '' : 'hidden'}`}>
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-xl font-medium mb-4" style={{ color: '#334C66' }}>
                  Créneaux disponibles pour le {selectedDate?.toLocaleDateString()}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot.id}
                      className={`
                        px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                        ${confirmedSlot === `${slot.start_time} - ${slot.end_time}`
                          ? 'bg-[#669BC2] text-white shadow-lg transform scale-105'
                          : 'bg-white text-gray-700 shadow-sm hover:shadow-md hover:scale-102'
                        }
                        ${slot.is_booked ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                      onClick={() => handleSlotSelect(slot)}
                      disabled={slot.is_booked}
                    >
                      {slot.start_time} - {slot.end_time}
                    </button>
                  ))}
                </div>

                {confirmedSlot && (
                  <div className="mt-6">
                    <button
                      className="w-full bg-[#669BC2] text-white py-3 px-6 rounded-lg font-medium
                        shadow-lg hover:bg-[#5A8DA0] transition-all duration-200 transform hover:scale-102"
                      onClick={handleConfirmBooking}
                    >
                      Confirmer le rendez-vous
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Styles CSS pour les cellules du calendrier */}
      <style>
        {`
          .disabled-day {
            background-color: #e9ecef !important;
            color: #6c757d !important;
            pointer-events: none;
          }
          .selected-day {
            background-color: #669BC2 !important;
            color: #ffffff !important;
          }
        `}
      </style>
    </div>
  );
};

export default ServiceProviderAvailabilityView;