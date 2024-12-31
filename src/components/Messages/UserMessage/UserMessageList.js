import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  limit
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../../firebaseConfig';
import './UserMessageList.css';

// Composant pour afficher chaque message
const MessageItem = ({ message, isOwnMessage }) => (
  <div className={`message-item ${isOwnMessage ? 'own-message' : 'other-message'}`}>
    <div className="message-header">
      <img
        src={isOwnMessage ? message.user_profile_picture : message.service_provider_profile_picture}
        alt="Profile"
        className="message-avatar"
        onError={(e) => { e.target.src = '/images/default_profile.png'; }}
      />
      <span className="message-sender">
        {isOwnMessage ? message.user_name : message.service_provider_name}
      </span>
    </div>
    <div className="message-content">
      {message.message}
    </div>
    <div className="message-timestamp">
      {message.sent_at?.toDate().toLocaleString()}
    </div>
  </div>
);

const UserMessageList = () => {
  const { userId } = useParams();  // Récupère l'ID de l'utilisateur depuis l'URL
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [serviceProvider, setServiceProvider] = useState(null);
  const [userProfileImage, setUserProfileImage] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Fonction d'initialisation du chat
    const initializeChat = async () => {
      if (!currentUser?.uid || !userId) return; // Assurez-vous que l'utilisateur est connecté et que l'ID du chat est présent

      try {
        console.log("Initializing chat for user ID:", userId);

        // Récupérer le chat où l'utilisateur est un participant
        const chatsQuery = query(
          collection(db, 'chats'),
          where('participants', 'array-contains', userId),
          orderBy('last_message_at', 'desc')
        );
        
        const unsubscribe = onSnapshot(chatsQuery, (snapshot) => {
          const messagesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          console.log("Messages fetched for user:", messagesList);
          setMessages(messagesList);
        });

        return () => unsubscribe(); // Cleanup on component unmount
      } catch (err) {
        console.error("Error initializing chat:", err);
        setError('Failed to load messages');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      initializeChat();
    }
  }, [userId, currentUser]);

  useEffect(() => {
    // Faire défiler vers le bas des messages à chaque nouvelle réception de message
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !currentUser?.uid || !serviceProvider) {
      return;
    }

    try {
      console.log("Sending message:", messageText.trim());

      // Ajouter un nouveau message dans Firestore
      const messageData = {
        message: messageText.trim(),
        message_type: 'text',
        sent_at: serverTimestamp(),
        service_provider_id: serviceProvider.id,
        service_provider_name: serviceProvider.name || 'Service Provider',
        service_provider_profile_picture: serviceProvider.profileImageURL || '',
        user_id: currentUser.uid,
        user_name: currentUser.displayName || 'User',
        user_profile_picture: userProfileImage || currentUser.photoURL || '',
        status: 'sent',
        read_at: null,
        file: null
      };

      const chatMessagesRef = collection(db, 'chats', userId, 'messages');
      await addDoc(chatMessagesRef, messageData);
      await updateDoc(doc(db, 'chats', userId), {
        last_message: messageText.trim(),
        last_message_at: serverTimestamp()
      });

      setMessageText('');
      console.log("Message sent and chat updated.");
    } catch (err) {
      setError('Failed to send message');
      console.error("Error sending message:", err);
    }
  };

  // Si l'utilisateur n'est pas connecté, on l'informe
  if (!currentUser) return <div className="error">Please login to send messages</div>;

  // Si les données sont en cours de chargement
  if (loading) return <div className="loading">Loading...</div>;

  // Affichage des erreurs
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="page-container">
      <div className="message-list-container">
        <div className="message-header-container">
          {serviceProvider && (
            <div className="provider-info">
              <img
                src={serviceProvider.profileImageURL || '/images/default-profile.png'}
                alt={serviceProvider.name}
                className="provider-avatar"
                onError={(e) => { e.target.src = '/images/default-profile.png'; }}
              />
              <span className="provider-name">{serviceProvider.name}</span>
            </div>
          )}
        </div>
        <div className="messages-container">
          {messages.map((message) => (
            <MessageItem key={message.id} message={message} isOwnMessage={message.user_id === currentUser?.uid} />
          ))}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSendMessage} className="message-input-container">
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type your message..."
            className="message-input"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
          />
          <button type="submit" className="send-button" disabled={!messageText.trim()}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default UserMessageList;
