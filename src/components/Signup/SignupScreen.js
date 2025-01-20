import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import { loadGoogleMapsScript } from "../utils/googleMaps";
import "./SignupScreen.css";
import logo from "../../assets/images/logo.png";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";

const SignupScreen = ({ onClose, onLoginClick }) => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isServiceProvider, setIsServiceProvider] = useState(null);
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [website, setWebsite] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [gpsLocation, setGpsLocation] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const navigate = useNavigate();
  const autocompleteRef = useRef(null);
  const inputRef = useRef(null);
  const { t } = useTranslation();

  useEffect(() => {
    loadGoogleMapsScript(() => {
      setGoogleMapsLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (googleMapsLoaded && inputRef.current) {
      initAutocomplete();
    }
  }, [googleMapsLoaded, inputRef.current]);

  const initAutocomplete = () => {
    if (window.google && window.google.maps && window.google.maps.places && inputRef.current) {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ["address"],
        componentRestrictions: { country: "FR" },
      });

      autocompleteRef.current.addListener("place_changed", handlePlaceSelect);
    }
  };

  const handlePlaceSelect = () => {
    const place = autocompleteRef.current.getPlace();
    if (place && place.formatted_address) {
      setAddress(place.formatted_address);
    }
    if (place && place.geometry && place.geometry.location) {
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
      setErrorMessage(t('signup_screen.error_messages.password_mismatch'));
      return;
    }
  
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const role = isServiceProvider ? "provider" : "user";
  
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
  
      await setDoc(doc(db, "users", user.uid), baseUserData);
  
      if (role === "provider") {
        const providerData = {
          ...baseUserData,
          description,
          hourlyRate: parseFloat(hourlyRate) || 0,
          isAvailable,
          website,
          serviceType: "",
          reviews: [],
          rating: 0,
          totalReviews: 0,
          profileImageURL: "",
          services: [],
          availability: {},
          professionalExperience: "",
          certifications: [],
          languages: [],
        };
        await setDoc(doc(db, "service_providers", user.uid), providerData);
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
        await setDoc(doc(db, "normal_users", user.uid), normalUserData);
      }
  
      await sendEmailVerification(user);
      alert(t('signup_screen.error_messages.email_verification'));
      onClose(); // Ferme le modal après l'inscription
      navigate('/login'); // Redirige l'utilisateur vers la page de connexion
    } catch (error) {
      console.error("Signup error:", error);
      setErrorMessage(t('signup_screen.error_messages.signup_error'));
    }
  };
  
  if (isServiceProvider === null) {
    return (
      <div className="container">
        <div>
          <img src={logo} alt="Icon" className="icon" />
          <h2 className="title">{t('signup_screen.account_type_selection.title')}</h2>
          <div className="account-type-container p-4 space-y-4">
            <button
              onClick={() => handleAccountTypeSelection(false)}
              className="py-3.5 px-5 bg-btn_primary text-white button"
            >
              {t('signup_screen.account_type_selection.user_button')}
            </button>
            <button
              onClick={() => handleAccountTypeSelection(true)}
              className="py-3.5 px-5 bg-btn_primary text-white button"
            >
              {t('signup_screen.account_type_selection.provider_button')}
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
      <div className="container">
      <form className="signup-form" onSubmit={handleSignup}>
        <h2 className="title">{t('signup_screen.title')}</h2>
        <input type="text" placeholder={t('signup_screen.form.full_name_placeholder')} value={fullName} onChange={(e) => setFullName(e.target.value)} className="input" required />
        <input type="email" placeholder={t('signup_screen.form.email_placeholder')} value={email} onChange={(e) => setEmail(e.target.value)} className="input" required />
        <input type="password" placeholder={t('signup_screen.form.password_placeholder')} value={password} onChange={(e) => setPassword(e.target.value)} className="input" required />
        <input type="password" placeholder={t('signup_screen.form.confirm_password_placeholder')} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input" required />
        <input type="text" placeholder={t('signup_screen.form.address_placeholder')} value={address} onChange={(e) => setAddress(e.target.value)} className="input" required />
        <input type="tel" placeholder={t('signup_screen.form.phone_number_placeholder')} value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="input" required />

        {isServiceProvider && (
          <>
            <textarea placeholder={t('signup_screen.form.service_description_placeholder')} value={description} onChange={(e) => setDescription(e.target.value)} className="input textarea" required />
            <input type="number" placeholder={t('signup_screen.form.hourly_rate_placeholder')} value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} className="input" required min="0" step="0.01" />
            <input type="url" placeholder={t('signup_screen.form.website_placeholder')} value={website} onChange={(e) => setWebsite(e.target.value)} className="input" />
          </>
        )}

        {errorMessage && <p className="error-message">{errorMessage}</p>}

        <button type="submit" className="py-3.5 px-5 bg-btn_primary text-white mb-4 button">
          {t('signup_screen.form.submit_button')}
        </button>

        <div className="already-account">
          <span>{t('signup_screen.form.already_account')} </span>
          <button type="button" className="login-link" onClick={onLoginClick}>
            {t('signup_screen.form.login_link')}
          </button>
        </div>
      </form>
    </div>
  );
};

SignupScreen.propTypes = {
  onClose: PropTypes.func.isRequired,
  onLoginClick: PropTypes.func.isRequired,
};

export default SignupScreen;