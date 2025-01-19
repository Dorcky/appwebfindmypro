import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs, query, where, addDoc, deleteDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';  // Ajout de Timestamp
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { useTranslation } from 'react-i18next';
import './ServiceProviderAvailabilityPlanning.css';

const ServiceProviderAvailabilityPlanning = () => {
  const { t } = useTranslation();
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [dayOfWeek, setDayOfWeek] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [availabilities, setAvailabilities] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null); // Ajoutez un état pour l'utilisateur
  const auth = getAuth();


  const userId = getAuth().currentUser?.uid;

  useEffect(() => {
    // Écoutez les changements d'état d'authentification
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("Utilisateur authentifié :", user);
        setUser(user); // Mettez à jour l'état de l'utilisateur
        fetchAvailabilities(user.uid); // Récupérez les disponibilités de l'utilisateur
      } else {
        console.log('Aucun utilisateur authentifié');
        setUser(null); // Réinitialisez l'état de l'utilisateur
        setError("Utilisateur non authentifié");
        setIsLoading(false);
      }
    });

    // Nettoyez l'écouteur lors du démontage du composant
    return () => unsubscribe();
  }, [auth]);

  const fetchAvailabilities = async (userId) => {
    try {
      const availabilityQuery = query(
        collection(db, 'service_provider_availabilities'),
        where('service_provider_id', '==', userId)
      );
      const snapshot = await getDocs(availabilityQuery);
      const availabilityData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAvailabilities(availabilityData);
    } catch (err) {
      setError('Erreur lors de la récupération des disponibilités');
    } finally {
      setIsLoading(false);
    }
  };


  // Fonction pour annuler une disponibilité
  const cancelAvailability = async (availabilityId) => {
    try {
      // Mise à jour du statut de la disponibilité
      const availabilityRef = doc(db, 'service_provider_availabilities', availabilityId);
      await updateDoc(availabilityRef, {
        is_booked: false,  // L'annulation libère la disponibilité
      });

      // Mise à jour immédiate de l'état local des disponibilités
      setAvailabilities((prevAvailabilities) =>
        prevAvailabilities.map((availability) =>
          availability.id === availabilityId
            ? { ...availability, is_booked: false }
            : availability
        )
      );

      alert('Disponibilité annulée');
    } catch (error) {
      console.error('Erreur lors de l\'annulation de la disponibilité:', error);
    }
  };

  // Fonction pour supprimer une disponibilité
  const deleteAvailability = async (availabilityId) => {
    try {
      // Suppression de la disponibilité
      const availabilityRef = doc(db, 'service_provider_availabilities', availabilityId);
      await deleteDoc(availabilityRef);

      // Mise à jour immédiate de l'état local des disponibilités
      setAvailabilities((prevAvailabilities) =>
        prevAvailabilities.filter((availability) => availability.id !== availabilityId)
      );

      alert('Disponibilité supprimée');
    } catch (error) {
      console.error('Erreur lors de la suppression de la disponibilité:', error);
    }
  };

  // Fonction pour enregistrer une nouvelle disponibilité
  const handleSaveAvailability = async () => {
    if (!startDate || !endDate || !dayOfWeek) {
      alert("Veuillez remplir tous les champs");
      return;
    }

    if (endDate <= startDate) {
      alert("L'heure de fin doit être après l'heure de début.");
      return;
    }

    setIsBooking(true);

    try {
      const availabilityData = {
        start_time: startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }), // Sans secondes
        end_time: endDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }), // Sans secondes
        day_of_week: dayOfWeek,
        service_provider_id: userId,
        is_booked: false,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now(),
        user_id: userId
      };

      await addDoc(collection(db, 'service_provider_availabilities'), availabilityData);

      setAvailabilities(prev => [...prev, availabilityData]);
      setStartDate(null);
      setEndDate(null);
      setDayOfWeek('');
      alert("Disponibilité enregistrée avec succès!");
    } catch (err) {
      alert("Erreur lors de l'enregistrement");
    } finally {
      setIsBooking(false);
    }
  };

  const formatDayOfWeek = (day) => {
    const days = {
      MONDAY: 'Lundi',
      TUESDAY: 'Mardi',
      WEDNESDAY: 'Mercredi',
      THURSDAY: 'Jeudi',
      FRIDAY: 'Vendredi',
      SATURDAY: 'Samedi',
      SUNDAY: 'Dimanche'
    };
    return days[day] || day;
  };

  if (isLoading) return <div className="p-4">{t('ServiceProviderAvailabilityPlanning.Chargement...')}</div>;
  if (error) return <div className="p-4 text-red-500">Erreur: {error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6 mt-20">{t('ServiceProviderAvailabilityPlanning.Planifier une disponibilité')}</h2>

      <div className="mb-8 p-4 bg-white rounded shadow">
        <div className="grid gap-4 mb-4">
          <div>
            <label className="block mb-2">{t('ServiceProviderAvailabilityPlanning.Jour de la semaine')}</label>
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">{t('ServiceProviderAvailabilityPlanning.Sélectionner un jour')}</option>
              <option value="MONDAY">{t('ServiceProviderAvailabilityPlanning.Lundi')}</option>
              <option value="TUESDAY">{t('ServiceProviderAvailabilityPlanning.Mardi')}</option>
              <option value="WEDNESDAY">{t('ServiceProviderAvailabilityPlanning.Mercredi')}</option>
              <option value="THURSDAY">{t('ServiceProviderAvailabilityPlanning.Jeudi')}</option>
              <option value="FRIDAY">{t('ServiceProviderAvailabilityPlanning.Vendredi')}</option>
              <option value="SATURDAY">{t('ServiceProviderAvailabilityPlanning.Samedi')}</option>
              <option value="SUNDAY">{t('ServiceProviderAvailabilityPlanning.Dimanche')}</option>
            </select>
          </div>

          <div>
            <label className="block mb-2">Heure de début :</label>
            <DatePicker
              selected={startDate}
              onChange={setStartDate}
              showTimeSelect
              showTimeSelectOnly
              timeIntervals={15}
              dateFormat="HH:mm"
              timeFormat="HH:mm"
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block mb-2"><span>Heure de fin :</span></label>
            <DatePicker
              selected={endDate}
              onChange={setEndDate}
              showTimeSelect
              showTimeSelectOnly
              timeIntervals={15}
              dateFormat="HH:mm"
              timeFormat="HH:mm"
              className="w-full p-2 border rounded"
              minTime={startDate || new Date()}
              maxTime={new Date().setHours(23, 59)}
            />
          </div>

          <button
            onClick={handleSaveAvailability}
            disabled={isBooking}
            className="bg-btn_primary text-white p-3 rounded-xl hover:bg-dark-blue disabled:bg-blue-300"
          >
            {isBooking ? t('ServiceProviderAvailabilityPlanning.Enregistrement...') : t('ServiceProviderAvailabilityPlanning.Enregistrer la disponibilité')}
          </button>
        </div>
      </div>

      <div className="bg-white rounded shadow">
        <h3 className="text-xl font-semibold p-4 border-b">{t('ServiceProviderAvailabilityPlanning.Disponibilités existantes')}</h3>
        <div className="divide-y">
          {availabilities.length === 0 ? (
            <p className="p-4 text-gray-500">{t('ServiceProviderAvailabilityPlanning.Aucune disponibilité enregistrée')}</p>
          ) : (
            availabilities.map((availability, index) => (
              <div key={index} className="p-4 flex flex-col sm:flex-row justify-between items-center">
                <div className="mb-2 sm:mb-0">
                  <p className="font-medium">{formatDayOfWeek(availability.day_of_week)}</p>
                  <p className="text-gray-600">
                    {availability.start_time} - {availability.end_time}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded ${availability.is_booked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'} mb-2 sm:mb-0`}>
                  {availability.is_booked ? t('ServiceProviderAvailabilityPlanning.Réservé') : t('ServiceProviderAvailabilityPlanning.Disponible')}
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => cancelAvailability(availability.id)}
                    className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
                    disabled={availability.is_booked === false}
                  >
                    {t('ServiceProviderAvailabilityPlanning.Annuler')}
                  </button>
                  <button
                    onClick={() => deleteAvailability(availability.id)}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                  >
                    {t('ServiceProviderAvailabilityPlanning.Supprimer')}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceProviderAvailabilityPlanning;
