import './ChatApp.css';
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Box, Container, Paper, TextField, Button, List, ListItem, Typography, Avatar, IconButton, Popover, CircularProgress } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { db, storage } from '../firebaseConfig';
import { collection, doc, getDocs, setDoc, query, onSnapshot, orderBy, Timestamp, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';


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
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Reset state when auth state changes
  useEffect(() => {
    if (!currentUser) {
      setSelectedUser(null);
      setMessages([]);
      setAllParticipants([]);
    }
  }, [currentUser]);

  // Load participants when auth is ready
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

  // Load messages when selected user changes
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
      // Charger tous les utilisateurs
      const usersRef = collection(db, 'normal_users');
      const usersSnapshot = await getDocs(usersRef);
      const usersList = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        name: doc.data().fullName || 'Unknown User',
        type: 'user',
        profileImage: doc.data().profileImageURL || null,
      }));

      // Charger tous les providers
      const providersRef = collection(db, 'service_providers');
      const providersSnapshot = await getDocs(providersRef);
      const providersList = providersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        name: doc.data().name || 'Unknown Provider',
        type: 'provider',
        profileImage: doc.data().profileImageURL || null,
      }));

      // Filtrer les participants en fonction du rôle de l'utilisateur actuel
      if (currentUser.role === 'provider') {
        // Pour les providers, ne montrer que les utilisateurs ayant déjà envoyé un message
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
        // Pour les utilisateurs, ne montrer que les providers
        setAllParticipants(providersList);
      } else {
        setAllParticipants([]); // Par défaut, aucun participant
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
      };
      const messageRef = doc(collection(db, `chats/${chatId}/messages`));
      await setDoc(messageRef, newMessage);
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
 {/* Ajout de padding-top pour éviter que le contenu soit masqué par la navbar */}
      <Box display="flex" gap={2} height="80vh">
        {/* Contacts List */}
        <Paper elevation={3} sx={{ width: 300, p: 2, bgcolor: '#f5f5f5', borderRadius: '16px' }} className="chat-app-sidebar">          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
            Contacts
          </Typography>
          {loading ? (
            <Box display="flex" justifyContent="center" mt={2}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Typography color="error" align="center" mt={2}>
              {error}
            </Typography>
          ) : allParticipants.length === 0 ? (
            <Typography color="textSecondary" align="center" mt={2}>
              No contacts found
            </Typography>
          ) : (
            <List>
              {allParticipants.map(participant => (
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
          )}
        </Paper>

        {/* Chat Area */}
        <Paper elevation={3} sx={{ flex: 1, p: 2, display: 'flex', flexDirection: 'column', bgcolor: '#fff', borderRadius: '16px' }} className="chat-app-window">          {selectedUser ? (
            <>
              {/* Chat Header */}
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

              {/* Messages Area */}
              <Box
                flex={1}
                overflow="auto"
                mb={2}
                sx={{
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

              {/* Message Input Area */}
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
                  sx={{ bgcolor: '#f5f5f5', borderRadius: '8px' }}    className="chat-app-textfield"

                />
                <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} color="primary">
                  <EmojiEmotionsIcon />
                </IconButton>
                <input ref={fileInputRef} type="file" onChange={handleFileChange} style={{ display: 'none' }} id="file-upload" />
                <label htmlFor="file-upload">
                <IconButton component="span" color="primary" className="chat-app-file-button">                    <AttachFileIcon />
                  </IconButton>
                </label>
                <IconButton color="primary" onClick={sendMessage} disabled={!message.trim() && !file}     className="chat-app-send-button"
>
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
