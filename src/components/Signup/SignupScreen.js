import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { loadGoogleMapsScript } from '../utils/googleMaps';
import './SignupScreen.css';

const SignupScreen = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isServiceProvider, setIsServiceProvider] = useState(null);
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [website, setWebsite] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [gpsLocation, setGpsLocation] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false); // Ajoutez cet état
  const navigate = useNavigate();
  const autocompleteRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    console.log("Chargement de l'API Google Maps...");
    loadGoogleMapsScript(() => {
      console.log("API Google Maps chargée avec succès.");
      setGoogleMapsLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (googleMapsLoaded && inputRef.current) {
      console.log("API Google Maps chargée et élément input prêt.");
      initAutocomplete();
    }
  }, [googleMapsLoaded, inputRef.current]);

  const initAutocomplete = () => {
    console.log("Initialisation de l'autocomplétion...");
    if (window.google && window.google.maps && window.google.maps.places && inputRef.current) {
      console.log("API Google Maps et élément input prêts.");
      autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'FR' }
      });

      autocompleteRef.current.addListener('place_changed', handlePlaceSelect);
    } else {
      console.error("API Google Maps ou élément input non disponible.");
    }
  };

  const handlePlaceSelect = () => {
    const place = autocompleteRef.current.getPlace();
    if (place && place.formatted_address) {
      console.log("Adresse sélectionnée :", place.formatted_address);
      setAddress(place.formatted_address);
    }
    if (place && place.geometry && place.geometry.location) {
      console.log("Coordonnées GPS :", place.geometry.location.lat(), place.geometry.location.lng());
      setGpsLocation({
        latitude: place.geometry.location.lat(),
        longitude: place.geometry.location.lng(),
      });
    }
  };

  const handleAccountTypeSelection = (type) => {
    setIsServiceProvider(type);
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setErrorMessage('Les mots de passe ne correspondent pas.');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const role = isServiceProvider ? 'provider' : 'user';

      const baseUserData = {
        uid: user.uid,
        fullName,
        email,
        emailVerified: false,
        role,
        createdAt: new Date(),
        address,
        phoneNumber,
        gpsLocation,
        lastUpdated: new Date(),
      };

      await setDoc(doc(db, 'users', user.uid), baseUserData);

      if (role === 'provider') {
        const providerData = {
          ...baseUserData,
          description,
          hourlyRate: parseFloat(hourlyRate) || 0,
          isAvailable,
          website,
          serviceType: '',
          reviews: [],
          rating: 0,
          totalReviews: 0,
          profileImageURL: '',
          services: [],
          availability: {},
          professionalExperience: '',
          certifications: [],
          languages: [],
        };
        await setDoc(doc(db, 'service_providers', user.uid), providerData);
      } else {
        const normalUserData = {
          ...baseUserData,
          favorites: [],
          bookings: [],
          preferences: {},
          notificationSettings: {
            email: true,
            push: true,
            sms: false,
          },
        };
        await setDoc(doc(db, 'normal_users', user.uid), normalUserData);
      }

      await sendEmailVerification(user);
      alert('Compte créé avec succès ! Veuillez vérifier votre email.');
      navigate('/login');
    } catch (error) {
      console.error('Signup error:', error);
      setErrorMessage(error.message || 'Une erreur est survenue lors de l\'inscription.');
    }
  };

  if (isServiceProvider === null) {
    return (
      <div className="container">
        <div className="p-10 bg-bg_primary rounded-lg shadow-lg">
          <h2 className="title">Quel type de compte souhaitez-vous créer ?</h2>
          <div className="account-type-container p-4 ">
          <button onClick={() => handleAccountTypeSelection(false)} className="button">
            Utilisateur à la recherche de service
          </button>
          <button onClick={() => handleAccountTypeSelection(true)} className="button">
            Prestataire de service
          </button>
        </div>
        </div>

      </div>
    );
  }

  return (
    <div className="container">
      <form className="signup-form" onSubmit={handleSignup}>
        <h2 className="title">Créer un compte {isServiceProvider ? 'Prestataire' : 'Utilisateur'}</h2>
        <input
          type="text"
          placeholder="Nom complet"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="input"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input"
          required
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input"
          required
        />
        <input
          type="password"
          placeholder="Confirmer le mot de passe"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="input"
          required
        />
        <input
          type="text"
          placeholder="Adresse"
          ref={inputRef}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="input"
          required
        />
        <input
          type="tel"
          placeholder="Numéro de téléphone"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="input"
          required
        />

        {isServiceProvider && (
          <>
            <textarea
              placeholder="Description de vos services"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input textarea"
              required
            />
            <input
              type="number"
              placeholder="Tarif horaire (€)"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              className="input"
              required
              min="0"
              step="0.01"
            />
            <input
              type="url"
              placeholder="Site web (optionnel)"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="input"
            />
          </>
        )}

        {errorMessage && <p className="error-message">{errorMessage}</p>}

        <button type="submit" className="button">
          S'inscrire
        </button>

        <div className="already-account">
          <span>Déjà un compte ? </span>
          <a href="/login" className="login-link">Se connecter</a>
        </div>
      </form>
    </div>
  );
};

export default SignupScreen;
