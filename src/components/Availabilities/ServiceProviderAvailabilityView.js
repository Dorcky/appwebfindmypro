import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { collection, query, where, getDocs, updateDoc, doc, Timestamp, setDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebaseConfig.js';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { getAuth } from 'firebase/auth';
import { useTranslation } from 'react-i18next'; // Importez useTranslation
import './ServiceProviderAvailabilityView.css';

const ServiceProviderAvailabilityView = () => {
  const { t } = useTranslation(); // Utilisez useTranslation pour accéder aux traductions
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

  const isDateAvailableForProvider = (date, currentAvailabilities = availabilities) => {
    // Convert the input date to the same timezone and format we're using elsewhere
    const localDate = new Date(date);
    localDate.setHours(0, 0, 0, 0);
    
    const dayOfWeek = localDate.toLocaleString('en-US', { weekday: 'long' }).toUpperCase();
    const dateStr = localDate.toISOString().split('T')[0];

    // Check if there are any availabilities for this day of the week
    const slotsForDay = currentAvailabilities.filter(
      availability => availability.day_of_week === dayOfWeek
    );

    if (slotsForDay.length === 0) {
      return false;
    }

    // Check if the date is not fully booked
    return slotsForDay.some(slot => {
      // If there are no booked_dates, the slot is available
      if (!slot.booked_dates || slot.booked_dates.length === 0) {
        return true;
      }

      // Check if this specific date is not marked as booked
      return !slot.booked_dates.some(
        bookedDate => bookedDate.date === dateStr && bookedDate.isBooked
      );
    });
  };

  const getAuthenticatedUserId = () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      return user.uid;
    } else {
      setError(t('AvailabilityView.Utilisateur non authentifié')); // Utilisez la traduction
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
        setError(t('AvailabilityView.No provider ID provided')); // Utilisez la traduction
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
        provider_name: providerDetails?.name || t('AvailabilityView.Provider Name Not Found'), // Utilisez la traduction
        service: providerDetails?.service || t('AvailabilityView.Service Not Found'), // Utilisez la traduction
        is_booked: slot.booked_dates?.some(bookedDate => 
          bookedDate.date === date.toISOString().split('T')[0] && bookedDate.isBooked
        ) || false
      }));

    return availableSlots;
  };

  const handleDateClick = (arg) => {
    const date = new Date(arg.date);
    if (!isDateAvailable(date)) return;
    setSelectedDate(date);
    const slots = getAvailableSlotsForDate(date);
    setTimeSlots(slots);
    setShowSlots(slots.length > 0);
    setSelectedSlot(null);
    setConfirmedSlot('');
  };

  const formatDateToFrench = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'Europe/Paris'
    });
  };

  const isDateAvailable = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);

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
      alert(t('AvailabilityView.Please select a valid slot before confirming the booking.')); // Utilisez la traduction
      return;
    }

    const currentDate = new Date();
    if (selectedDate < currentDate) {
      alert(t('AvailabilityView.You cannot book an appointment in the past.')); // Utilisez la traduction
      return;
    }

    const userId = getAuthenticatedUserId();
    if (!userId) {
      alert(t('AvailabilityView.Vous devez être connecté pour réserver un rendez-vous.')); // Utilisez la traduction
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
        status: 'Réservé', // Utilisez la traduction
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

      await fetchAvailabilities();
      
      setTimeSlots(prevSlots => 
        prevSlots.map(slot => 
          slot.id === selectedSlot.id 
            ? { ...slot, is_booked: true }
            : slot
        )
      );

      alert(t('AvailabilityView.Appointment booked successfully!')); // Utilisez la traduction
      setSelectedSlot(null);
      setConfirmedSlot('');
    } catch (err) {
      alert(t('AvailabilityView.Error booking the appointment: ') + err.message); // Utilisez la traduction
    }
  };

  if (isLoading) return <div className="loading">{t('AvailabilityView.Loading...')}</div>; // Utilisez la traduction
  if (error) return <div className="error">{t('AvailabilityView.Error: ')}{error}</div>; // Utilisez la traduction

  return (
    <div className="min-h-screen bg-[#D9E7F5] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mt-20">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#669BC2] to-[#5A8DA0] p-6 ">
            <h2 className="text-2xl font-semibold text-white">
              {t('AvailabilityView.Prendre un Rendez-vous')} {/* Utilisez la traduction */}
            </h2>
            <p className="text-blue-100 mt-2">
              {t('AvailabilityView.Sélectionnez une date et un horaire qui vous convient')} {/* Utilisez la traduction */}
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
                      left: 'prev',
                      center: 'title',
                      right: 'next'
                    }}
                    dateClick={handleDateClick}
                    height={400}
                    titleFormat={{ year: 'numeric', month: 'long' }}
                    dayHeaderFormat={{ weekday: 'narrow' }}
                    views={{
                      dayGridMonth: {
                        titleFormat: { year: 'numeric', month: 'long' },
                        dayHeaderFormat: { weekday: 'narrow' },
                        fixedWeekCount: false
                      }
                    }}
                    contentHeight={350}
                    aspectRatio={1}
                    dayCellClassNames={(arg) => {
                    const cellDate = new Date(arg.date);
                    cellDate.setHours(0, 0, 0, 0);
                    
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    
                    const classes = [];
                    
                    if (cellDate < today) {
                      classes.push('disabled-day');
                    } else if (isDateAvailableForProvider(cellDate)) {
                      classes.push('available-day');
                    }
                    
                    if (selectedDate && 
                        cellDate.getTime() === selectedDate.getTime()) {
                      classes.push('selected-day');
                    }
                    
                    return classes;
                  }}
                />
              </div>
            </div>

            {/* Time Slots Section */}
            <div className={`lg:w-2/5 ${showSlots ? '' : 'hidden'}`}>
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-xl font-medium mb-4" style={{ color: '#334C66' }}>
                {t('AvailabilityView.Créneaux disponibles pour le ')}{formatDateToFrench(selectedDate)} {/* Utilisez la traduction */}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                      {t('AvailabilityView.Confirmer le rendez-vous')} {/* Utilisez la traduction */}
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
            opacity: 0.5;
          }

          .selected-day {
            background-color: #669BC2 !important;
            color: white !important;
          }

          .available-day {
            background-color: #E3F2FD !important;
            position: relative;
            cursor: pointer;
          }

          .available-day:hover {
            background-color: #BBDEFB !important;
          }

          .available-day::after {
            content: '';
            position: absolute;
            bottom: 4px;
            left: 50%;
            transform: translateX(-50%);
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background-color: #669BC2;
          }
        `}
      </style>
    </div>
  );
};

export default ServiceProviderAvailabilityView;