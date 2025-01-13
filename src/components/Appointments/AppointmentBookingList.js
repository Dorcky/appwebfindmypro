import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types'; // Import PropTypes pour la validation des props
import { db, auth } from '../firebaseConfig';
import { collection, query, where, getDocs, updateDoc, deleteDoc, doc, getDoc } from 'firebase/firestore';
import './AppointmentBookingList.css';

const AppointmentBookingList = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const user = auth.currentUser;

  useEffect(() => {
    const fetchAppointments = async () => {
      if (user) {
        try {
          setLoading(true);
          setErrorMessage(null);

          // Récupérer le rôle de l'utilisateur connecté
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (!userDoc.exists()) {
            throw new Error('Rôle utilisateur non trouvé');
          }

          const userData = userDoc.data();
          const role = userData.role;
          console.log("Rôle de l'utilisateur:", role);

          // Récupérer les rendez-vous en fonction du rôle
          const appointmentsRef = collection(db, 'appointments');
          const filteredQuery =
            role === 'provider'
              ? query(appointmentsRef, where('provider_id', '==', user.uid))
              : query(appointmentsRef, where('user_id', '==', user.uid));

          const querySnapshot = await getDocs(filteredQuery);

          // Récupérer les informations supplémentaires pour chaque rendez-vous
          const appointmentsList = await Promise.all(
            querySnapshot.docs.map(async (document) => {
              const data = document.data();

              // Déterminer la collection et l'ID de l'autre utilisateur
              const collectionPath = role === 'provider' ? 'normal_users' : 'service_providers';
              const otherUserId = role === 'provider' ? data.user_id : data.provider_id;

              // Récupérer les informations de l'autre utilisateur
              const otherUserDoc = await getDoc(doc(db, collectionPath, otherUserId));
              const otherUserData = otherUserDoc.data();

              // Créer l'objet rendez-vous
              return {
                id: document.id,
                userId: data.user_id,
                providerId: data.provider_id,
                providerName: otherUserData?.name || otherUserData?.fullName || 'Inconnu',
                service: role === 'provider' ? '' : otherUserData?.serviceType || '',
                status: data.status,
                date: data.date.toDate(), // Convertir Timestamp en Date
                profileImageURL: otherUserData?.profileImageURL || '',
                userFullName: data.user_full_name || 'Utilisateur Inconnu',
              };
            })
          );

          // Trier les rendez-vous par date (du plus récent au plus ancien)
          const sortedAppointments = appointmentsList.sort((a, b) => b.date - a.date);
          setAppointments(sortedAppointments);
        } catch (error) {
          console.error('Erreur lors de la récupération des rendez-vous:', error);
          setErrorMessage(error.message);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchAppointments();
  }, [user]);

  // Fonction pour annuler un rendez-vous
  const cancelAppointment = async (appointmentId, serviceProviderId, appointmentDate) => {
    try {
      // Mise à jour du statut du rendez-vous
      const appointmentRef = doc(db, 'appointments', appointmentId);
      await updateDoc(appointmentRef, {
        status: 'Annulé',
      });

      // Mise à jour de la disponibilité du prestataire (service_provider_availabilities)
      const availabilitiesRef = collection(db, 'service_provider_availabilities');
      const q = query(availabilitiesRef, where('service_provider_id', '==', serviceProviderId));
      const querySnapshot = await getDocs(q);

      // Utilisation de `docs` pour itérer sur les documents retournés
      for (const docSnapshot of querySnapshot.docs) {
        const availabilityRef = doc(db, 'service_provider_availabilities', docSnapshot.id);
        const availabilityData = docSnapshot.data();

        // Vérifier si la date réservée existe dans booked_dates
        const bookedDates = availabilityData.booked_dates || [];
        const updatedBookedDates = bookedDates.map(bookedDate => {
          if (bookedDate.date === appointmentDate && bookedDate.isBooked) {
            return { ...bookedDate, isBooked: false }; // Libérer la disponibilité
          }
          return bookedDate;
        });

        await updateDoc(availabilityRef, {
          booked_dates: updatedBookedDates,
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
  const deleteAppointment = async (appointmentId, serviceProviderId, appointmentDate) => {
    try {
      // Suppression du rendez-vous
      const appointmentRef = doc(db, 'appointments', appointmentId);
      await deleteDoc(appointmentRef);

      // Mise à jour de la disponibilité du prestataire
      const availabilitiesRef = collection(db, 'service_provider_availabilities');
      const q = query(availabilitiesRef, where('service_provider_id', '==', serviceProviderId));
      const querySnapshot = await getDocs(q);

      // Utilisation de `docs` pour itérer sur les documents retournés
      for (const docSnapshot of querySnapshot.docs) {
        const availabilityRef = doc(db, 'service_provider_availabilities', docSnapshot.id);
        const availabilityData = docSnapshot.data();

        // Vérifier si la date réservée existe dans booked_dates
        const bookedDates = availabilityData.booked_dates || [];
        const updatedBookedDates = bookedDates.filter(bookedDate => bookedDate.date !== appointmentDate);

        await updateDoc(availabilityRef, {
          booked_dates: updatedBookedDates,
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

  const AppointmentCard = ({ appointment }) => {
    const formatDateTime = (date) => {
      return date.toLocaleString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    return (
      <div className="appointment-card">
        <div className="card-header">
          <div className="appointment-profile-image">
            {appointment.profileImageURL ? (
              <img src={appointment.profileImageURL} alt="Profile" className="profile-img" />
            ) : (
              <div className="default-profile">
                <span>👤</span>
              </div>
            )}
          </div>
          <div className="user-info">
            <h3>{appointment.providerName}</h3>
            <p>{appointment.service}</p>
          </div>
          <div className="status-badge">
            <span className={`status ${appointment.status.toLowerCase()}`}>
              {appointment.status}
            </span>
          </div>
        </div>
        <div className="divider"></div>
        <div className="card-footer">
          <span>📅 {formatDateTime(appointment.date)}</span>
        </div>
      </div>
    );
  };

  // Validation des props pour AppointmentCard
  AppointmentCard.propTypes = {
    appointment: PropTypes.shape({
      providerName: PropTypes.string.isRequired,
      service: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
      date: PropTypes.object.isRequired,
      profileImageURL: PropTypes.string,
    }).isRequired,
  };

  if (loading) {
    return <div>Chargement des rendez-vous...</div>;
  }

  if (errorMessage) {
    return <div>Erreur: {errorMessage}</div>;
  }

  return (
    <div className="appointments-container">
      <h1>Mes rendez-vous</h1>
      {appointments.length === 0 ? (
        <p>Aucun rendez-vous trouvé.</p>
      ) : (
        <ul className="appointments-list">
          {appointments.map((appointment) => {
            const appointmentDate = new Date(appointment.date).toISOString().split('T')[0];
            return (
              <li key={appointment.id} className="appointment-item">
                <AppointmentCard appointment={appointment} />
                <div className="appointment-actions">
                  {appointment.status !== 'Annulé' && (
                    <button className="cancel-btn" onClick={() => cancelAppointment(appointment.id, appointment.providerId, appointmentDate)}>
                      Annuler
                    </button>
                  )}
                  <button className="delete-btn" onClick={() => deleteAppointment(appointment.id, appointment.providerId, appointmentDate)}>
                    Supprimer
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default AppointmentBookingList;