import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/images/logo.png";
import "./LoginScreen.css";
import PropTypes from "prop-types";

const LoginScreen = ({ onClose, onSignupClick }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const login = async (e) => {
    e.preventDefault();
    if (email === "" || password === "") {
      setErrorMessage("Veuillez remplir tous les champs.");
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
          setErrorMessage("Rôle non reconnu.");
        }
      } else {
        setErrorMessage("Utilisateur non trouvé.");
      }
    } catch (error) {
      setErrorMessage(error.message || "Une erreur inconnue est survenue.");
    }
  };

  return (
    <div className="container">
      <div className="flex flex-col items-center align-center">
        <img src={logo} alt="Icon" className="icon" />
        <h1 className="title">Se connecter</h1>

        <form onSubmit={login}>
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

          <button type="submit" className="py-3.5 px-5 bg-btn_primary text-white mb-2 button">
            Se connecter
          </button>
        </form>

        <button onClick={onSignupClick} className="sign-up-text py-3.5 px-5">
          Pas de compte ? S&lsquo;inscrire
        </button>
      </div>
    </div>
  );
};

LoginScreen.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSignupClick: PropTypes.func.isRequired,
};

export default LoginScreen;