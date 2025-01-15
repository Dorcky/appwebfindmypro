import './ChatApp.css';
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Box, Container, Paper, TextField, Button, List, ListItem, Typography, Avatar, IconButton, Popover, CircularProgress, InputAdornment } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import SearchIcon from '@mui/icons-material/Search';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { db, storage, messaging } from '../firebaseConfig';
import { collection, doc, getDocs, setDoc, query, onSnapshot, orderBy, Timestamp, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getToken, onMessage } from 'firebase/messaging';
import { debounce } from 'lodash';

const ChatApp = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [file, setFile] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [allParticipants, setAllParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const contactsListRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleResize = debounce(() => {}, 250);

  window.addEventListener('resize', handleResize);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!currentUser) {
      setSelectedUser(null);
      setMessages([]);
      setAllParticipants([]);
    }
  }, [currentUser]);

  useEffect(() => {
    const loadData = async () => {
      if (currentUser && !authLoading) {
        setLoading(true);
        setError(null);
        try {
          await loadParticipants();
        } catch (err) {
          console.error('Error loading participants:', err);
          setError('Failed to load contacts. Please try again.');
        } finally {
          setLoading(false);
        }
      }
    };
    loadData();
  }, [currentUser, authLoading]);

  useEffect(() => {
    let unsubscribe = null;
    const setupMessageListener = async () => {
      if (selectedUser && currentUser) {
        const chatId = getChatId(currentUser.id, selectedUser.id);
        if (!chatId) return;
        const messagesRef = collection(db, `chats/${chatId}/messages`);
        const q = query(messagesRef, orderBy('timestamp', 'asc'));
        unsubscribe = onSnapshot(q, (querySnapshot) => {
          const loadedMessages = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setMessages(loadedMessages);
        });
      }
    };
    setupMessageListener();
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [selectedUser, currentUser]);

  const loadParticipants = async () => {
    if (!currentUser?.id || !currentUser?.role) {
      console.error('Invalid user data:', currentUser);
      throw new Error('User data is incomplete');
    }
    try {
      const usersRef = collection(db, 'normal_users');
      const usersSnapshot = await getDocs(usersRef);
      const usersList = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        name: doc.data().fullName || 'Unknown User',
        type: 'user',
        profileImage: doc.data().profileImageURL || null,
      }));

      const providersRef = collection(db, 'service_providers');
      const providersSnapshot = await getDocs(providersRef);
      const providersList = providersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        name: doc.data().name || 'Unknown Provider',
        type: 'provider',
        profileImage: doc.data().profileImageURL || null,
      }));

      if (currentUser.role === 'provider') {
        const filteredUsers = [];
        for (const user of usersList) {
          const chatId = getChatId(currentUser.id, user.id);
          const messagesRef = collection(db, `chats/${chatId}/messages`);
          const messagesSnapshot = await getDocs(messagesRef);
          if (!messagesSnapshot.empty) {
            filteredUsers.push(user);
          }
        }
        setAllParticipants(filteredUsers);
      } else if (currentUser.role === 'user') {
        setAllParticipants(providersList);
      } else {
        setAllParticipants([]);
      }
    } catch (error) {
      console.error('Error in loadParticipants:', error);
      throw error;
    }
  };

  const getChatId = (user1Id, user2Id) => {
    if (!user1Id || !user2Id) return null;
    return [user1Id, user2Id].sort().join('_');
  };

  const handleFileUpload = async (file) => {
    if (!file) return null;
    const storageRef = ref(storage, `chat_files/${Date.now()}_${file.name}`);
    try {
      await uploadBytes(storageRef, file);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  };

  const registerFCMToken = async (userId) => {
    try {
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);  // Log pour vérifier la permission
      if (permission === 'granted') {
        const token = await getToken(messaging, {
          vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY
        });
        
        await setDoc(doc(db, 'users', userId), {
          fcmToken: token
        }, { merge: true });
        
        console.log('Token FCM enregistré:', token);
      } else {
        console.log('Notification permission denied');  // Log si la permission est refusée
      }
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du token FCM:', error);
    }
  };

  const sendMessage = async () => {
    if ((!message.trim() && !file) || !selectedUser || !currentUser) {
      return;
    }

    try {
      let fileUrl = null;
      let fileName = null;
      let fileType = null;

      if (file) {
        fileUrl = await handleFileUpload(file);
        fileName = file.name;
        fileType = file.type;
      }

      const chatId = getChatId(currentUser.id, selectedUser.id);
      if (!chatId) return;

      const newMessage = {
        senderId: currentUser.id,
        receiverId: selectedUser.id,
        text: message.trim(),
        file: fileUrl,
        fileName,
        fileType,
        timestamp: Timestamp.now(),
        status: { is_sent: true, is_delivered: false, is_read: false },
        participants: [currentUser.id, selectedUser.id],
        senderName: currentUser.name || 'Unknown User',
        notificationSent: false,
      };

      const messageRef = doc(collection(db, `chats/${chatId}/messages`));
      await setDoc(messageRef, newMessage);

      // Show notification only if we have permission and the app isn't focused
      if (Notification.permission === 'granted' && !document.hasFocus()) {
        try {
          // Get receiver's FCM token
          const receiverDoc = await getDoc(doc(db, 'users', selectedUser.id));
          const receiverData = receiverDoc.data();
          
          if (receiverData?.fcmToken) {
            // Create notification content
            const notificationContent = {
              title: `New message from ${currentUser.name || 'Unknown User'}`,
              body: message.trim() || 'New message received',
              icon: currentUser.profileImage || '/default-avatar.png',
              data: {
                chatId,
                senderId: currentUser.id,
                type: 'chat_message'
              }
            };

            // Show local notification
            new Notification(notificationContent.title, {
              body: notificationContent.body,
              icon: notificationContent.icon,
              tag: chatId, // Prevent duplicate notifications
              requireInteraction: true // Keep notification until user interacts
            });
          }
        } catch (error) {
          console.error('Error sending notification:', error);
          // Continue with message sending even if notification fails
        }
      }

      // Update message status
      await setDoc(messageRef, { ...newMessage, notificationSent: true }, { merge: true });

      // Clear input fields
      setMessage('');
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleEmojiSelect = (emoji) => {
    setMessage((prev) => prev + emoji.native);
    setAnchorEl(null);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value.toLowerCase());
  };

  const filteredParticipants = allParticipants.filter((participant) =>
    participant.name.toLowerCase().includes(searchQuery)
  );

  const renderFilePreview = (msg) => {
    if (!msg.file) return null;
    if (msg.fileType?.startsWith('image/')) {
      return (
        <img
          src={msg.file}
          alt="Shared content"
          style={{ maxWidth: '200px', borderRadius: '8px' }}
        />
      );
    }
    return (
      <Button
        variant="outlined"
        startIcon={<AttachFileIcon />}
        href={msg.file}
        target="_blank"
        rel="noopener noreferrer"
      >
        {msg.fileName || 'Download file'}
      </Button>
    );
  };

  useEffect(() => {
    if (currentUser?.id) {
      // Enregistrer le token FCM
      registerFCMToken(currentUser.id);

      // Gérer les notifications reçues lorsque l'application est au premier plan
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log('Message reçu en premier plan:', payload);

        if (Notification.permission === 'granted') {
          // Créer une notification
          const notification = new Notification(payload.notification.title, {
            body: payload.notification.body,
            icon: '/path/to/icon.png', // Remplacez par le chemin de votre icône
            data: payload.data, // Inclure les données supplémentaires pour le clic
          });

          // Gérer le clic sur la notification
          notification.onclick = (event) => {
            event.preventDefault();
            console.log('Notification cliquée:', payload);

            if (payload.data?.chatId) {
              window.location.href = `/chat/${payload.data.chatId}`;
            } else {
              window.focus(); // Ramener l'application au premier plan
            }

            // Fermer la notification
            notification.close();
          };
        } else {
          console.warn('Les notifications ne sont pas autorisées.');
        }
      });

      // Nettoyer l'écouteur lors du démontage du composant
      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    }
  }, [currentUser]);

  if (authLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!currentUser) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography variant="h6" color="error">
          Please log in to access the chat.
        </Typography>
      </Container>
    );
  }

  if (!currentUser.id || !currentUser.role) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography variant="h6" color="error">
          Error: User information is incomplete. Please contact support.
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, pt: 16 }} className="chat-app-container">
      <Box
        display="flex"
        gap={2}
        height="80vh"
        sx={{
          flexDirection: { xs: 'column', md: 'row' },
        }}
      >
        <Paper elevation={3} sx={{ width: { xs: '100%', md: 300 }, p: 2, bgcolor: '#f5f5f5', borderRadius: '16px', flexShrink: 0 }} className="chat-app-sidebar">
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
            Contacts
          </Typography>
          <TextField
            fullWidth
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={handleSearchChange}
            variant="outlined"
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />
          {loading ? (
            <Box display="flex" justifyContent="center" mt={2}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Typography color="error" align="center" mt={2}>
              {error}
            </Typography>
          ) : filteredParticipants.length === 0 ? (
            <Typography color="textSecondary" align="center" mt={2}>
              No contacts found
            </Typography>
          ) : (
            <Box
              ref={contactsListRef}
              sx={{
                overflowY: 'auto',
                maxHeight: 'calc(80vh - 200px)',
                '&::-webkit-scrollbar': {
                  width: '0.4em',
                },
                '&::-webkit-scrollbar-track': {
                  background: '#f1f1f1',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: '#888',
                },
              }}
            >
              <List>
                {filteredParticipants.map(participant => (
                  <ListItem button key={participant.id} onClick={() => setSelectedUser(participant)} selected={selectedUser?.id === participant.id} sx={{ borderRadius: '8px', mb: 1 }}>
                    <Avatar src={participant.profileImage} sx={{ mr: 2 }}>
                      {!participant.profileImage && participant.name[0].toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography sx={{ fontWeight: 'bold' }}>{participant.name}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        {participant.type === 'provider' ? 'Service Provider' : 'User'}
                      </Typography>
                    </Box>
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </Paper>

        <Paper elevation={3} sx={{ flex: 1, p: 2, display: 'flex', flexDirection: 'column', bgcolor: '#fff', borderRadius: '16px', flexShrink: 0, minHeight: '400px' }} className="chat-app-window">
          {selectedUser ? (
            <>
              <Box display="flex" alignItems="center" mb={2} p={1} bgcolor="background.default" borderRadius={1}>
                <Avatar src={selectedUser.profileImage} sx={{ mr: 2 }}>
                  {!selectedUser.profileImage && selectedUser.name[0].toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{selectedUser.name}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {selectedUser.type === 'provider' ? 'Service Provider' : 'User'}
                  </Typography>
                </Box>
              </Box>

              <Box
                flex={1}
                overflow="auto"
                mb={2}
                sx={{
                  maxHeight: 'calc(80vh - 300px)',
                  '&::-webkit-scrollbar': {
                    width: '0.4em',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: '#f1f1f1',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: '#888',
                  },
                }}
              >
                {messages.length === 0 ? (
                  <Typography variant="body2" color="textSecondary" align="center" mt={2}>
                    No messages yet. Start the conversation!
                  </Typography>
                ) : (
                  messages.map((msg) => (
                    <Box key={msg.id} sx={{ display: 'flex', justifyContent: msg.senderId === currentUser.id ? 'flex-end' : 'flex-start', mb: 1, px: 2 }}>
                      <Paper sx={{ p: 1.5, backgroundColor: msg.senderId === currentUser.id ? '#e3f2fd' : '#f5f5f5', borderRadius: 2, maxWidth: '70%' }}>
                        {msg.text && (
                          <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
                            {msg.text}
                          </Typography>
                        )}
                        {renderFilePreview(msg)}
                        <Typography variant="caption" color="textSecondary" display="block" mt={0.5}>
                          {msg.timestamp?.toDate().toLocaleTimeString()}
                        </Typography>
                      </Paper>
                    </Box>
                  ))
                )}
                <div ref={messagesEndRef} />
              </Box>

              <Box display="flex" gap={1} alignItems="center" className="chat-app-input-area">
                <TextField
                  fullWidth
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  variant="outlined"
                  size="small"
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  multiline
                  maxRows={4}
                  sx={{ bgcolor: '#f5f5f5', borderRadius: '8px' }}
                  className="chat-app-textfield"
                />
                <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} color="primary">
                  <EmojiEmotionsIcon />
                </IconButton>
                <input ref={fileInputRef} type="file" onChange={handleFileChange} style={{ display: 'none' }} id="file-upload" />
                <label htmlFor="file-upload">
                  <IconButton component="span" color="primary" className="chat-app-file-button">
                    <AttachFileIcon />
                  </IconButton>
                </label>
                <IconButton color="primary" onClick={sendMessage} disabled={!message.trim() && !file} className="chat-app-send-button">
                  <SendIcon />
                </IconButton>
                <Popover
                  open={Boolean(anchorEl)}
                  anchorEl={anchorEl}
                  onClose={() => setAnchorEl(null)}
                  anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                  transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                  <Picker data={data} onEmojiSelect={handleEmojiSelect} />
                </Popover>
              </Box>
            </>
          ) : (
            <Typography variant="h6" align="center" sx={{ mt: 4 }}>
              Select a contact to start chatting
            </Typography>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default ChatApp;