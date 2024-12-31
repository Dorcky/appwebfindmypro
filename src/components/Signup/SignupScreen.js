import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import './SignupScreen.css';

const SignupScreen = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isServiceProvider, setIsServiceProvider] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

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
      };

      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, commonData);

      if (isServiceProvider) {
        const providerData = {
          ...commonData,
          profileImageURL: '',
          phoneNumber: '',
          address: '',
          description: '',
          website: '',
          hourlyRate: '',
          isAvailable: true,
          gpsLocation: null,
          serviceType: '',
          reviews: [],
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
        <div className="checkbox-container">
          <input
            type="checkbox"
            checked={isServiceProvider}
            onChange={(e) => setIsServiceProvider(e.target.checked)}
            className="checkbox"
            id="serviceProviderCheckbox"
          />
          <label htmlFor="serviceProviderCheckbox" className="checkbox-label">
            Je suis un prestataire
          </label>
        </div>
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
