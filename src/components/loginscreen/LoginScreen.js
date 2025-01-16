import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/images/logo.png";
import "./LoginScreen.css";
import PropTypes from "prop-types";
import { useTranslation } from 'react-i18next';

const LoginScreen = ({ onClose, onSignupClick }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  const { t } = useTranslation();

  const login = async (e) => {
    e.preventDefault();
    if (email === "" || password === "") {
      setErrorMessage(t('login.errors.emptyFields')); // Traduction du message d'erreur
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userRef = doc(db, "users", user.uid);
      const userSnapshot = await getDoc(userRef);

      if (userSnapshot.exists()) {
        const userData = userSnapshot.data();
        const role = userData.role;

        if (role === "user") {
          navigate("/user-profile"); // Redirection sans fermer le modal
        } else if (role === "provider") {
          navigate(`/my-provider-profile/${user.uid}`); // Redirection sans fermer le modal
        } else {
          setErrorMessage(t('login.errors.unknownRole')); // Traduction du message d'erreur
        }
      } else {
        setErrorMessage(t('login.errors.userNotFound')); // Traduction du message d'erreur
      }
    } catch (error) {
      setErrorMessage(t('login.errors.unknownError')); // Traduction du message d'erreur
    }
  };

  return (
    <div className="container">
      <div className="flex flex-col items-center align-center">
        <img src={logo} alt="Icon" className="icon" />
        <h1 className="title">{t('login.title')}</h1>

        <form onSubmit={login}>
          <input
            type="email"
            className="input"
            placeholder={t('login.email')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            className="input"
            placeholder={t('login.password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {errorMessage && <p className="error-text">{errorMessage}</p>}

          <button type="submit" className="py-3.5 px-5 bg-btn_primary text-white mb-2 button">
            {t('login.login')}
          </button>
        </form>

        <button onClick={onSignupClick} className="sign-up-text py-3.5 px-5">
          {t('login.noAccount')} <span className="underline">{t('login.signup')}</span>
        </button>
      </div>
    </div>
  );
};

LoginScreen.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSignupClick: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
};

export default LoginScreen;