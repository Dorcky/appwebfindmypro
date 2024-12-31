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
import './ServiceProviderMessageList.css';

const MessageItem = ({ message, isOwnMessage }) => (
  <div className={`message-item ${isOwnMessage ? 'own-message' : 'other-message'}`}>
    <div className="message-header">
      <img
        src={isOwnMessage ? message.user_profile_picture : message.service_provider_profile_picture}
        alt="Profile"
        className="message-avatar"
        onError={(e) => {
          e.target.src = '/images/default_profile.png';
        }}
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

const ServiceProviderMessageList = () => {
  const { serviceProviderId } = useParams();
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [chatId, setChatId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [serviceProvider, setServiceProvider] = useState(null);
  const [userProfileImage, setUserProfileImage] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const initializeChat = async () => {
      if (!currentUser?.uid || !serviceProviderId) return;

      try {
        // First check if service provider exists
        const providerDoc = await getDoc(doc(db, 'service_providers', serviceProviderId));
        
        if (!providerDoc.exists()) {
          const chatsQuery = query(
            collection(db, 'chats'),
            where('participants', 'array-contains', currentUser.uid)
          );
          const querySnapshot = await getDocs(chatsQuery);
          let existingChat = null;
          
          for (const chatDoc of querySnapshot.docs) {
            const chatData = chatDoc.data();
            if (chatData.participants.includes(serviceProviderId)) {
              existingChat = { id: chatDoc.id, ...chatData };
              const messagesQuery = query(
                collection(db, `chats/${chatDoc.id}/messages`),
                orderBy('sent_at', 'desc'),
                limit(1)
              );
              const messageSnapshot = await getDocs(messagesQuery);
              if (!messageSnapshot.empty) {
                const messageData = messageSnapshot.docs[0].data();
                setServiceProvider({
                  id: serviceProviderId,
                  name: messageData.service_provider_name,
                  profileImageURL: messageData.service_provider_profile_picture,
                });
              }
              break;
            }
          }
          
          if (existingChat) {
            setChatId(existingChat.id);
          } else {
            const newChatRef = await addDoc(collection(db, 'chats'), {
              participants: [currentUser.uid, serviceProviderId],
              created_at: serverTimestamp(),
              status: 'active'
            });
            setChatId(newChatRef.id);
          }
        } else {
          const providerData = providerDoc.data();
          setServiceProvider({
            id: serviceProviderId,
            ...providerData
          });
          
          const chatsQuery = query(
            collection(db, 'chats'),
            where('participants', 'array-contains', currentUser.uid)
          );
          const querySnapshot = await getDocs(chatsQuery);
          let existingChat = null;
          querySnapshot.forEach(doc => {
            const chatData = doc.data();
            if (chatData.participants.includes(serviceProviderId)) {
              existingChat = { id: doc.id, ...chatData };
            }
          });
          
          if (existingChat) {
            setChatId(existingChat.id);
          } else {
            const newChatRef = await addDoc(collection(db, 'chats'), {
              participants: [currentUser.uid, serviceProviderId],
              created_at: serverTimestamp(),
              status: 'active'
            });
            setChatId(newChatRef.id);
          }
        }

        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserProfileImage(userData.profileImageURL);
        }
        
      } catch (err) {
        setError('Failed to initialize chat');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      initializeChat();
    }
  }, [currentUser, serviceProviderId]);

  useEffect(() => {
    if (!chatId) return;

    const messagesQuery = query(
      collection(db, `chats/${chatId}/messages`),
      orderBy('sent_at', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(messagesList);
    });

    return () => unsubscribe();
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !currentUser?.uid || !serviceProvider) {
      return;
    }
  
    try {
      // Only create a new chat if chatId doesn't exist AND we haven't already found one
      if (!chatId) {
        // Check for existing chat one last time before creating
        const chatsQuery = query(
          collection(db, 'chats'),
          where('participants', 'array-contains', currentUser.uid)
        );
        const querySnapshot = await getDocs(chatsQuery);
        let existingChat = null;
        
        querySnapshot.forEach(doc => {
          const chatData = doc.data();
          if (chatData.participants.includes(serviceProviderId)) {
            existingChat = { id: doc.id, ...chatData };
          }
        });
        
        if (existingChat) {
          setChatId(existingChat.id);
        } else {
          const newChatRef = await addDoc(collection(db, 'chats'), {
            participants: [currentUser.uid, serviceProviderId],
            created_at: serverTimestamp(),
            last_message: messageText.trim(),
            last_message_at: serverTimestamp(),
            status: 'active'
          });
          setChatId(newChatRef.id);
        }
      }
  
      // Use the existing or newly created chatId
      const messageData = {
        message: messageText.trim(),
        message_type: 'text',
        sent_at: serverTimestamp(),
        service_provider_id: serviceProviderId,
        service_provider_name: serviceProvider?.name || 'Service Provider',
        service_provider_profile_picture: serviceProvider?.profileImageURL || '',
        user_id: currentUser.uid,
        user_name: currentUser.displayName || 'User',
        user_profile_picture: userProfileImage || currentUser.photoURL || '',
        status: 'sent',
        read_at: null,
        file: null
      };
  
      const chatMessagesRef = collection(db, `chats/${chatId}/messages`);
      await addDoc(chatMessagesRef, messageData);
  
      await updateDoc(doc(db, 'chats', chatId), {
        last_message: messageText.trim(),
        last_message_at: serverTimestamp()
      });
  
      setMessageText('');
    } catch (err) {
      setError('Failed to send message');
      console.error('Error sending message:', err);
    }
  };
  
  if (!currentUser) return <div className="error">Please login to send messages</div>;
  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="page-container">
      <div className="message-list-container">
        <div className="message-header-container">
          {serviceProvider && (
            <div className="provider-info">
              <img
                src={serviceProvider.profileImageURL}
                alt={serviceProvider.name}
                className="provider-avatar"
                onError={(e) => { e.target.src = '/images/default_profile.png'; }}
              />
              <span className="provider-name">{serviceProvider.name}</span>
            </div>
          )}
        </div>

        <div className="messages-container">
          {messages.map((message) => (
            <MessageItem 
              key={message.id} 
              message={message} 
              isOwnMessage={message.user_id === currentUser?.uid} 
            />
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

export default ServiceProviderMessageList;
