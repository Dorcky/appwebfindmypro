import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs, query, orderBy, getDoc, doc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './UserChatListView.css';

const UserChatListView = () => {
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

          // Get service provider ID from participants array
          const serviceProviderId = chat.participants.find(id => id !== chat.user_id);

          // Fetch service provider details
          if (serviceProviderId) {
            const providerDoc = await getDoc(doc(db, 'service_providers', serviceProviderId));
            const providerData = providerDoc.exists() ? providerDoc.data() : null;

            // Fetch messages subcollection
            const messagesQuery = query(
              collection(db, 'chats', chatId, 'messages'),
              orderBy('sent_at', 'desc')
            );
            const messageSnapshot = await getDocs(messagesQuery);
            const messages = messageSnapshot.docs.map(doc => doc.data());

            const lastMessage = messages.length > 0 ? messages[0] : null;

            chatData.push({
              id: chatId,
              serviceProviderId,
              providerName: providerData?.name || lastMessage?.service_provider_name || 'Unknown',
              providerProfileImageURL: providerData?.profileImageURL || lastMessage?.service_provider_profile_picture || null,
              lastMessage: lastMessage ? lastMessage.message : 'No messages',
              lastMessageDate: lastMessage ? lastMessage.sent_at : null,
              status: chat.status || 'Unknown',
            });
          }
        }

        console.log('Fetched chat data:', chatData); // Debug log
        setChats(chatData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching chats:", error);
        setLoading(false);
      }
    };

    fetchChats();
  }, []);

  const handleFilterChange = (event) => {
    setFilter(event.target.value);
  };

  const filteredChats = chats.filter(chat => {
    return chat.status.toLowerCase().includes(filter.toLowerCase());
  });

  const handleChatClick = (chat) => {
    if (chat.serviceProviderId) {
      console.log('Navigating to chat with providerId:', chat.serviceProviderId);
      navigate(`/chat/${chat.serviceProviderId}`);
    } else {
      console.error('No service provider ID found for chat:', chat);
    }
  };

  return (
    <div className="user-chat-list-view">
      <div className="filters">
        <input
          type="text"
          placeholder="Filter by status"
          value={filter}
          onChange={handleFilterChange}
          className="filter-input"
        />
      </div>

      <div className="chat-list">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : filteredChats.length === 0 ? (
          <div className="no-chats">No chats found.</div>
        ) : (
          filteredChats.map(chat => {
            const formattedDate = chat.lastMessageDate
              ? new Date(chat.lastMessageDate.seconds * 1000).toLocaleString()
              : 'Date unavailable';

            return (
              <div 
                key={chat.id} 
                className="chat-card" 
                onClick={() => handleChatClick(chat)}
              >
                <div className="chat-header">
                  <img 
                    className="profile-image" 
                    src={chat.providerProfileImageURL || '/default-profile.png'} 
                    alt={`Profile of ${chat.providerName}`}
                    onError={(e) => {
                      e.target.src = '/default-profile.png';
                    }}
                  />
                  <div className="chat-info">
                    <h4>{chat.providerName}</h4>
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

export default UserChatListView;