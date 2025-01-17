import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { db, auth } from '../firebaseConfig';
import { collection, query, where, getDocs, updateDoc, deleteDoc, doc, getDoc } from 'firebase/firestore';
import './AppointmentBookingList.css';
import { useTranslation } from 'react-i18next';


const AppointmentBookingList = () => {
  const { t } = useTranslation();
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
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    const statusClass = appointment.status === "Réservé" ? "text-green-500" : "text-red-500";
    const defaultAvatar = "https://via.placeholder.com/100/0000FF/FFFFFF/?text=Avatar";

    return (
      <div className="bg-white rounded-2xl shadow-lg mb-5 transition-transform duration-300 hover:-translate-y-1">
        <div className="p-6 flex">
          <img
            src={appointment.profileImageURL || defaultAvatar}
            alt={`${appointment.providerName}'s profile`}
            className="w-24 h-24 rounded-full mr-4"
          />
          <div className="flex-grow">
            <h5 className="text-lg font-medium">{appointment.providerName}</h5>
            <h6 className="text-gray-500 text-sm mb-2">{appointment.service}</h6>
            <p className={`text-sm ${statusClass} mb-2`}>
             Statut: {appointment.status}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg"
                   className="inline-block w-4 h-4 mr-2"
                   fill="none"
                   viewBox="0 0 24 24"
                   stroke="currentColor">
                <path strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formatDateTime(appointment.date)}
            </p>
            <div className="flex justify-end">
              <button
                className="mr-2 px-3 py-1 text-sm text-white bg-[#DC3545] hover:bg-[#BF233D] rounded"
                onClick={() => deleteAppointment(appointment.id, appointment.providerId, new Date(appointment.date).toISOString().split('T')[0])}
              >
                {t('Appointment.Supprimer')}
              </button>
              {appointment.status === "Réservé" && (
                <button
                  className="px-3 py-1 text-sm text-[#DC3545] border border-[#DC3545] hover:bg-[#DC3545] hover:text-white rounded"
                  onClick={() => cancelAppointment(appointment.id, appointment.providerId, new Date(appointment.date).toISOString().split('T')[0])}
                >
                  {t('Appointment.Annuler')}
                </button>
              )}
            </div>
          </div>
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
    return <div className="loading-message">{t('Appointment.Chargement des rendez-vous...')}</div>;
  }

  if (errorMessage) {
    return <div className="error-message">{t('Appointment.Erreur')}: {errorMessage}</div>;
  }

  return (
    <div className="min-h-screen bg-[#D9EBF8] py-12">
      <div className="containerAppointment mx-auto px-4 mt-20">
        <h1 className="text-center text-[#334C66] text-3xl font-bold mb-12">
          {t('Appointment.Mes Rendez-vous')}
        </h1>

        <div className="max-w-2xl mx-auto">
          {appointments.length === 0 ? (
            <p>{t('Appointment.Aucun rendez-vous trouvé')}.</p>
          ) : (
            appointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentBookingList;
