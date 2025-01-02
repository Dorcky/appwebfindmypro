// src/context/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../components/firebaseConfig';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Charger les informations de base de l'utilisateur depuis la collection `users`
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();

          // Si l'utilisateur est un provider, charger les informations supplémentaires depuis `service_providers`
          if (userData.role === 'provider') {
            const providerDoc = await getDoc(doc(db, 'service_providers', user.uid));
            if (providerDoc.exists()) {
              const providerData = providerDoc.data();
              setCurrentUser({
                ...userData,
                ...providerData,
                id: user.uid,
                type: 'provider',
              });
            } else {
              setCurrentUser({
                ...userData,
                id: user.uid,
                type: 'provider',
              });
            }
          } else if (userData.role === 'user') {
            // Si l'utilisateur est un normal_user, charger les informations supplémentaires depuis `normal_users`
            const normalUserDoc = await getDoc(doc(db, 'normal_users', user.uid));
            if (normalUserDoc.exists()) {
              const normalUserData = normalUserDoc.data();
              setCurrentUser({
                ...userData,
                ...normalUserData,
                id: user.uid,
                type: 'user',
              });
            } else {
              setCurrentUser({
                ...userData,
                id: user.uid,
                type: 'user',
              });
            }
          }
        } else {
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);