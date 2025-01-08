import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import './LoginScreen.css';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');


  const navigate = useNavigate();

  const login = async (e) => {
    e.preventDefault();
    if (email === '' || password === '') {
      setErrorMessage('Veuillez remplir tous les champs.');
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userRef = doc(db, 'users', user.uid);
      const userSnapshot = await getDoc(userRef);

      if (userSnapshot.exists()) {
        const userData = userSnapshot.data();
        const role = userData.role;

        if (role === 'user') {
          navigate('/user-profile');
        } else if (role === 'provider') {
          navigate('/my-provider-profile/' + user.uid);
        } else {
          setErrorMessage('Rôle non reconnu.');
        }
      } else {
        setErrorMessage('Utilisateur non trouvé.');
      }
    } catch (error) {
      setErrorMessage(error.message || 'Une erreur inconnue est survenue.');
    }
  };

  const navigateToSignup = () => {
    navigate('/signup');
  };

  return (
    <div className="container">
      <div className='flex flex-col items-center align-center bg-bg_primary p-10 rounded-lg shadow-lg'>
        <img src="/path/to/icon.png" alt="Icon" className="icon" />
        <h1 className="title">Se connecter</h1>

        <form onSubmit={login} className='align-center p-4'>
          <input
            type="email"
            className="input"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            className="input"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {errorMessage && <p className="error-text">{errorMessage}</p>}

          <button type="submit" className="button">
            Se connecter
          </button>
        </form>

        <button onClick={navigateToSignup} className="sign-up-text">
          Pas de compte ? S&lsquo;inscrire
        </button>
      </div>
    </div>
  );
};

export default LoginScreen;
