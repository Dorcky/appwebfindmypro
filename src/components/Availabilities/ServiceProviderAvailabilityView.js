import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { collection, query, where, getDocs, updateDoc, doc, Timestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig.js';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { fromZonedTime } from 'date-fns-tz';
import { getAuth } from 'firebase/auth';  // Importation de Firebase Auth
import './ServiceProviderAvailabilityView.css';

const ServiceProviderAvailabilityView = () => {
  const { serviceProviderId } = useParams();
  const [availabilities, setAvailabilities] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [providerDetails, setProviderDetails] = useState(null);

  // Fonction pour récupérer l'utilisateur authentifié
  const getAuthenticatedUserId = () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      return user.uid;  // Retourner l'ID de l'utilisateur authentifié
    } else {
      setError('Utilisateur non authentifié');
      return null;
    }
  };

  // Fetch provider details and availabilities
  useEffect(() => {
    const fetchData = async () => {
      if (!serviceProviderId) {
        setError('No provider ID provided');
        setIsLoading(false);
        return;
      }

      try {
        // First fetch provider details
        const providerDoc = await getDocs(
          query(collection(db, 'service_providers'), 
          where('user_id', '==', serviceProviderId))
        );
        
        if (!providerDoc.empty) {
          const providerData = providerDoc.docs[0].data();
          setProviderDetails(providerData);
        }

        // Then fetch availabilities
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

        console.log("✅ Availabilities fetched:", availabilitiesData);
        setAvailabilities(availabilitiesData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [serviceProviderId]);

  const getAvailableSlotsForDate = (date) => {
    const selectedDayOfWeek = date.toLocaleString('en-us', { weekday: 'long' }).toUpperCase();
    console.log("🗓️ Selected Day of Week:", selectedDayOfWeek);

    const availableSlots = availabilities
      .filter((availability) => availability.day_of_week === selectedDayOfWeek)
      .map(slot => ({
        ...slot,
        provider_name: providerDetails?.name || 'Provider Name Not Found',
        service: providerDetails?.service || 'Service Not Found'
      }));

    console.log("📅 Available slots for selected day:", availableSlots);
    return availableSlots;
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    console.log("📅 Selected Date:", date);
  };

  const handleSlotSelect = (slot) => {
    if (slot.is_booked) {
      console.log('❌ Slot already booked:', slot);
      return;
    }
    console.log('✅ Slot selected:', slot);
    setSelectedSlot(slot);
  };

  const handleConfirmBooking = async () => {
    if (!selectedSlot || !serviceProviderId) {
      console.error("⛔️ Cannot confirm booking: Missing selected slot or provider ID.");
      alert("Please select a valid slot before confirming the booking.");
      return;
    }

    // Récupérer l'ID de l'utilisateur authentifié
    const userId = getAuthenticatedUserId();
    if (!userId) {
      alert("Vous devez être connecté pour réserver un rendez-vous.");
      return;
    }

    try {
      const slotDateTimeString = `${selectedDate.toISOString().split('T')[0]}T${selectedSlot.start_time}`;
      console.log("📅 Slot DateTime String:", slotDateTimeString);

      const timeZone = 'America/New_York';
      const utcDate = fromZonedTime(slotDateTimeString, timeZone);
      console.log("⏱️ UTC Date:", utcDate);

      if (isNaN(utcDate.getTime())) {
        throw new Error(`Invalid date format: ${slotDateTimeString}`);
      }

      // Créer l'appointment avec tous les champs requis
      const appointmentRef = doc(collection(db, 'appointments'));
      const appointmentData = {
        date: Timestamp.fromDate(utcDate),
        provider_id: serviceProviderId,
        provider_name: selectedSlot.provider_name,
        service: selectedSlot.service,
        status: 'Reservé',
        user_id: userId, // Ajouter l'ID utilisateur ici
        created_at: Timestamp.now(),        
      };

      console.log("📄 Appointment Data:", appointmentData);
      await setDoc(appointmentRef, appointmentData);

      // Mettre à jour la disponibilité
      const availabilityRef = doc(db, 'service_provider_availabilities', selectedSlot.id);
      await updateDoc(availabilityRef, {
        is_booked: true,
        booked_at: Timestamp.now(),
        user_id: userId // Ajouter l'ID utilisateur dans la disponibilité
      });

      console.log('✅ Appointment booked successfully!');
      alert('Appointment booked successfully!');
    } catch (err) {
      console.error('❌ Error confirming booking:', err);
      alert('Error booking the appointment: ' + err.message);
    }
  };

  if (isLoading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  const availableSlotsForSelectedDate = selectedDate ? getAvailableSlotsForDate(selectedDate) : [];

  return (
    <div className="availabilityContainer">
      <h2>Available Time Slots</h2>

      <DatePicker
        selected={selectedDate}
        onChange={handleDateChange}
        inline
        dateFormat="yyyy-MM-dd"
        minDate={new Date()}
      />

      {selectedDate && availableSlotsForSelectedDate.length > 0 && (
        <div className="slots">
          <h3>Available Slots for {selectedDate.toLocaleDateString()}</h3>
          <ul>
            {availableSlotsForSelectedDate.map((slot) => (
              <li
                key={slot.id}
                className={`slot ${selectedSlot && selectedSlot.id === slot.id ? 'selected' : ''} ${slot.is_booked ? 'disabled' : ''}`}
                onClick={() => handleSlotSelect(slot)}
              >
                {slot.start_time} - {slot.end_time}
              </li>
            ))}
          </ul>
        </div>
      )}

      {selectedSlot && (
        <div className="confirmBooking">
          <button onClick={handleConfirmBooking} disabled={selectedSlot.is_booked}>
            Confirm Booking
          </button>
        </div>
      )}
    </div>
  );
};

export default ServiceProviderAvailabilityView;
