import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebaseConfig';
import { collection, query, where, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import './AppointmentBookingList.css';

const AppointmentBookingList = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    const fetchAppointments = async () => {
      if (user) {
        try {
          const appointmentsRef = collection(db, 'appointments');
          const q = query(appointmentsRef, where('user_id', '==', user.uid));
          const querySnapshot = await getDocs(q);

          const appointmentsList = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));

          setAppointments(appointmentsList);
        } catch (error) {
          console.error('Erreur lors de la récupération des rendez-vous:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchAppointments();
  }, [user]);

  // Fonction pour annuler un rendez-vous
  const cancelAppointment = async (appointmentId, serviceProviderId) => {
    try {
      // Mise à jour du statut du rendez-vous
      const appointmentRef = doc(db, 'appointments', appointmentId);
      await updateDoc(appointmentRef, {
        status: 'Annulé',
      });

      // Mise à jour de la disponibilité du prestataire (service_provider_availabilities)
      const availabilitiesRef = collection(db, 'service_provider_availabilities');
      const q = query(availabilitiesRef, where('service_provider_id', '==', serviceProviderId), where('user_id', '==', user.uid));
      const querySnapshot = await getDocs(q);

      // Utilisation de `docs` pour itérer sur les documents retournés
      for (const docSnapshot of querySnapshot.docs) {
        const availabilityRef = doc(db, 'service_provider_availabilities', docSnapshot.id);
        await updateDoc(availabilityRef, {
          is_booked: false,  // L'annulation de rendez-vous libère la disponibilité
        });
      }

      // Mise à jour immédiate de l'état local des rendez-vous pour refléter l'annulation
      setAppointments((prevAppointments) =>
        prevAppointments.map((appointment) =>
          appointment.id === appointmentId
            ? { ...appointment, status: 'Annulé' }
            : appointment
        )
      );

      alert('Rendez-vous annulé');
    } catch (error) {
      console.error('Erreur lors de l\'annulation du rendez-vous:', error);
    }
  };

  // Fonction pour supprimer un rendez-vous
  const deleteAppointment = async (appointmentId, serviceProviderId) => {
    try {
      // Suppression du rendez-vous
      const appointmentRef = doc(db, 'appointments', appointmentId);
      await deleteDoc(appointmentRef);

      // Mise à jour de la disponibilité du prestataire
      const availabilitiesRef = collection(db, 'service_provider_availabilities');
      const q = query(availabilitiesRef, where('service_provider_id', '==', serviceProviderId), where('user_id', '==', user.uid));
      const querySnapshot = await getDocs(q);

      // Utilisation de `docs` pour itérer sur les documents retournés
      for (const docSnapshot of querySnapshot.docs) {
        const availabilityRef = doc(db, 'service_provider_availabilities', docSnapshot.id);
        await updateDoc(availabilityRef, {
          is_booked: false,  // La suppression du rendez-vous libère la disponibilité
        });
      }

      // Mise à jour immédiate de l'état local pour refléter la suppression du rendez-vous
      setAppointments((prevAppointments) =>
        prevAppointments.filter((appointment) => appointment.id !== appointmentId)
      );

      alert('Rendez-vous supprimé');
    } catch (error) {
      console.error('Erreur lors de la suppression du rendez-vous:', error);
    }
  };

  if (loading) {
    return <div>Chargement des rendez-vous...</div>;
  }

  return (
    <div className="appointments-container">
      <h1>Mes rendez-vous</h1>
      {appointments.length === 0 ? (
        <p>Aucun rendez-vous trouvé.</p>
      ) : (
        <ul className="appointments-list">
          {appointments.map((appointment) => (
            <li key={appointment.id} className="appointment-item">
              <div className="appointment-details">
                <strong>{appointment.provider_name}</strong>
                <p>Service : {appointment.service}</p>
                <p>Date : {new Date(appointment.date.seconds * 1000).toLocaleString()}</p>
                <p>Statut : <span className={appointment.status === 'Annulé' ? 'cancelled' : 'reserved'}>{appointment.status}</span></p>
              </div>
              <div className="appointment-actions">
                {appointment.status !== 'Annulé' && (
                  <button className="cancel-btn" onClick={() => cancelAppointment(appointment.id, appointment.provider_id)}>
                    Annuler
                  </button>
                )}
                <button className="delete-btn" onClick={() => deleteAppointment(appointment.id, appointment.provider_id)}>
                  Supprimer
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AppointmentBookingList;
