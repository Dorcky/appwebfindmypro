import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs, query, orderBy, getDoc, doc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './ProviderChatList.css';

const ProviderChatList = () => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const chatsQuery = query(collection(db, 'chats'));
        const chatSnapshot = await getDocs(chatsQuery);

        const chatData = [];
        for (const chatDoc of chatSnapshot.docs) {
          const chat = chatDoc.data();
          const chatId = chatDoc.id;
          const participants = chat.participants || [];
          
          if (participants.length === 2) {
            const [participant1, participant2] = participants;
            
            // Récupérer les données des deux participants
            const participant1Doc = await getDoc(doc(db, 'users', participant1));
            const participant2Doc = await getDoc(doc(db, 'users', participant2));
            
            const participant1Data = participant1Doc.exists() ? participant1Doc.data() : null;
            const participant2Data = participant2Doc.exists() ? participant2Doc.data() : null;
            
            if (!participant1Data || !participant2Data) {
              continue; // Ignorer ce chat si un des participants n'existe pas
            }
            
            // Déterminer quel participant est l'utilisateur (role === 'user')
            let userId, userData;

            if (participant1Data?.role === 'user') {
              userId = participant1;
              userData = participant1Data;
            } else if (participant2Data?.role === 'user') {
              userId = participant2;
              userData = participant2Data;
            }

            if (userId) {
              // Récupérer les messages du chat
              const messagesQuery = query(
                collection(db, 'chats', chatId, 'messages'),
                orderBy('sent_at', 'desc')
              );
              const messageSnapshot = await getDocs(messagesQuery);
              const messages = messageSnapshot.docs.map(doc => doc.data());
              const lastMessage = messages.length > 0 ? messages[0] : null;

              const userName = userData?.fullName || userData?.name || 'Utilisateur inconnu';

              chatData.push({
                id: chatId,
                userId: userId,  // Ajoutez l'ID utilisateur
                userName: userName,
                userProfileImageURL: userData?.profileImageURL || '/default-profile.png',
                lastMessage: lastMessage ? lastMessage.message : 'Aucun message',
                lastMessageDate: lastMessage ? lastMessage.sent_at : null,
                status: chat.status || 'Inconnu',
              });
            }
          }
        }

        setChats(chatData);
        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
    };

    fetchChats();
  }, []);

  // Gestion du changement de filtre
  const handleFilterChange = (event) => {
    setFilter(event.target.value);
  };

  // Appliquer le filtre sur les chats
  const filteredChats = chats.filter(chat => {
    return chat.status.toLowerCase().includes(filter.toLowerCase());
  });

  // Gestion du clic sur un chat
  const handleChatClick = (chat) => {
    console.log("Chat clicked:", chat);  // Affiche les détails du chat sélectionné
    if (chat.userId) {
      console.log("Navigating to user messages with ID:", chat.userId);  // Affiche l'ID de l'utilisateur
      navigate(`/user-messages/${chat.userId}`);
    } else {
      console.log("No user ID found, navigation aborted.");
    }
  };

  return (
    <div className="provider-chat-list">
      <div className="filters">
        <input
          type="text"
          placeholder="Filtrer par statut"
          value={filter}
          onChange={handleFilterChange}
          className="filter-input"
        />
      </div>

      <div className="chat-list">
        {loading ? (
          <div className="loading">Chargement...</div>
        ) : filteredChats.length === 0 ? (
          <div className="no-chats">Aucun chat trouvé.</div>
        ) : (
          filteredChats.map(chat => {
            const formattedDate = chat.lastMessageDate
              ? new Date(chat.lastMessageDate.seconds * 1000).toLocaleString()
              : 'Date non disponible';

            return (
              <div
                key={chat.id}
                className="chat-card"
                onClick={() => handleChatClick(chat)} // Clic sur le chat
              >
                <div className="chat-header">
                  <div className="participants-images">
                    <img
                      className="profile-image user"
                      src={chat.userProfileImageURL}
                      alt={`Profil de ${chat.userName}`}
                      onError={(e) => { e.target.src = '/default-profile.png'; }}
                    />
                  </div>
                  <div className="chat-info">
                    <div className="participants-names">
                      <h4>{chat.userName}</h4>
                    </div>
                    <p>{chat.lastMessage}</p>
                    <small>{formattedDate}</small>
                    <span className={`status ${chat.status.toLowerCase()}`}>
                      {chat.status}
                    </span>
                  </div>
                  <div className="important-icon">
                    <button className="mark-important-btn">⭐</button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ProviderChatList;
