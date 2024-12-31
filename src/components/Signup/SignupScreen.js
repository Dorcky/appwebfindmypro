import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { loadGoogleMapsScript } from '../utils/googleMaps'; // Importer la fonction
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
  const navigate = useNavigate();
  const autocompleteRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    // Charger le script de Google Maps via la fonction importée
    loadGoogleMapsScript(initAutocomplete);
  }, []);

  const initAutocomplete = () => {
    console.log('Google Maps Loaded:', window.google);
    if (window.google && window.google.maps && window.google.maps.places && inputRef.current) {
      console.log('Initializing autocomplete');
      autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'FR' }
      });

      autocompleteRef.current.addListener('place_changed', handlePlaceSelect);
      console.log('Autocomplete listener added');
    } else {
      console.error('Google Places API not fully loaded or input ref not available');
    }
  };

  const handlePlaceSelect = () => {
    const place = autocompleteRef.current.getPlace();
    console.log('Selected Place:', place);
    if (place && place.formatted_address) {
      setAddress(place.formatted_address);
    } else {
      console.warn('No formatted_address in selected place:', place);
    }
    if (place && place.geometry && place.geometry.location) {
      setGpsLocation({
        latitude: place.geometry.location.lat(),
        longitude: place.geometry.location.lng(),
      });
      console.log('GPS Location set:', gpsLocation);
    } else {
      console.warn('No GPS data for selected place');
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

      const commonData = {
        fullName,
        email,
        emailVerified: false,
        role: isServiceProvider ? 'provider' : 'user',
        createdAt: new Date(),
        address,
        phoneNumber,
        gpsLocation,
      };

      const userRef = doc(db, 'normal_users', user.uid);
      await setDoc(userRef, commonData);

      if (isServiceProvider) {
        const providerData = {
          ...commonData,
          description,
          hourlyRate,
          isAvailable,
          website,
          serviceType: '',
          reviews: [],
          profileImageURL: '',
        };

        const providerRef = doc(db, 'service_providers', user.uid);
        await setDoc(providerRef, providerData);
      }

      await sendEmailVerification(user);
      alert('Compte créé avec succès ! Veuillez vérifier votre email.');
      navigate('/login');
    } catch (error) {
      setErrorMessage(error.message || 'Une erreur inconnue est survenue.');
    }
  };

  if (isServiceProvider === null) {
    return (
      <div className="container">
        <h2 className="title">Quel type de compte souhaitez-vous créer ?</h2>
        <div className="account-type-container">
          <button onClick={() => handleAccountTypeSelection(false)} className="button">Utilisateur à la recherche de service</button>
          <button onClick={() => handleAccountTypeSelection(true)} className="button">Prestataire de service</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <form className="signup-form" onSubmit={handleSignup}>
        <h2 className="title">Créer un compte</h2>
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
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="input"
          required
          ref={inputRef}
        />
        {isServiceProvider && (
          <>
            <input
              type="text"
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input"
              required
            />
            <input
              type="text"
              placeholder="Tarif horaire"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              className="input"
              required
            />
            <input
              type="text"
              placeholder="Site web"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="input"
              required
            />
          </>
        )}
        <input
          type="text"
          placeholder="Numéro de téléphone"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="input"
          required
        />
        {errorMessage && <p className="error-message">{errorMessage}</p>}
        <button type="submit" className="button">S'inscrire</button>
        <div className="already-account">
          <span>Déjà un compte ? </span>
          <a href="/login" className="login-link">Se connecter</a>
        </div>
      </form>
    </div>
  );
};

export default SignupScreen;
