import React, { useState, useEffect, useRef } from 'react';
import { Box, Container, Paper, TextField, Button, List, ListItem, Typography, Avatar, IconButton, Popover } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { db, storage } from '../firebaseConfig';
import { collection, doc, getDocs, setDoc, query, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const ChatApp = ({ currentUser }) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [file, setFile] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [allParticipants, setAllParticipants] = useState([]);
  const fileInputRef = useRef(null);

  // Load both users and service providers
  useEffect(() => {
    const loadParticipants = async () => {
      try {
        // Load regular users
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);
        const usersList = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          name: doc.data().fullName || 'Unknown User',
          type: 'user',
          profileImage: doc.data().profileImageURL
        }));

        // Load service providers
        const providersRef = collection(db, 'service_providers');
        const providersSnapshot = await getDocs(providersRef);
        const providersList = providersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          name: doc.data().name || 'Unknown Provider',
          type: 'provider',
          profileImage: doc.data().profileImageURL
        }));

        // Combine and set all participants
        const allParticipantsList = [...usersList, ...providersList]
          .filter(participant => participant.id !== currentUser.id);
        
        setAllParticipants(allParticipantsList);
      } catch (error) {
        console.error('Error loading participants:', error);
        setAllParticipants([]);
      }
    };

    loadParticipants();
  }, [currentUser.id]);

  // Generate chat ID based on two users' IDs
  const getChatId = (user1Id, user2Id) => {
    if (!user1Id || !user2Id) {
      console.error('Invalid user IDs:', user1Id, user2Id);
      return null;
    }
    return [user1Id, user2Id].sort().join('_');
  };

  // Load messages for the selected user
  useEffect(() => {
    const loadMessages = async () => {
      if (selectedUser) {
        const chatId = getChatId(currentUser.id, selectedUser.id);
        if (!chatId) return;

        const messagesRef = collection(db, `chats/${chatId}/messages`);
        const q = query(messagesRef, orderBy('timestamp', 'asc'));
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const loadedMessages = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setMessages(loadedMessages);
        });

        return unsubscribe;
      }
    };

    const unsubscribe = loadMessages();
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [selectedUser, currentUser.id]);

  // Handle sending a message
  const sendMessage = async () => {
    if ((!message.trim() && !file) || !selectedUser) {
      console.error('Message or file is missing, or no user selected');
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
        text: message,
        file: fileUrl,
        fileName,
        fileType,
        timestamp: Timestamp.now(),
        status: {
          is_sent: true,
          is_delivered: false,
          is_read: false,
        },
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
    }
  };

  // Handle file upload to Firebase storage
  const handleFileUpload = async (file) => {
    const storageRef = ref(storage, `chat_files/${file.name}`);
    try {
      await uploadBytes(storageRef, file);
      const fileUrl = await getDownloadURL(storageRef);
      return fileUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  };

  // Handle emoji selection
  const handleEmojiSelect = (emoji) => {
    setMessage((prev) => prev + emoji.native);
    setAnchorEl(null);
  };

  // Handle file input change
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

  // Render file preview in message
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

  if (!currentUser || !currentUser.id) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography variant="h6" color="error">
          Error: User information is missing
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box display="flex" gap={2} height="80vh">
        <Paper elevation={3} sx={{ width: 300, p: 2 }}>
          <Typography variant="h6" gutterBottom>Contacts</Typography>
          <List>
            {allParticipants.map(participant => (
              <ListItem 
                button
                key={participant.id}
                onClick={() => setSelectedUser(participant)}
                selected={selectedUser?.id === participant.id}
              >
                <Avatar 
                  src={participant.profileImage}
                  sx={{ mr: 2 }}
                >
                  {!participant.profileImage && participant.name[0].toUpperCase()}
                </Avatar>
                <Box>
                  <Typography>{participant.name}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {participant.type === 'provider' ? 'Service Provider' : 'User'}
                  </Typography>
                </Box>
              </ListItem>
            ))}
          </List>
        </Paper>

        <Paper elevation={3} sx={{ flex: 1, p: 2, display: 'flex', flexDirection: 'column' }}>
          {selectedUser ? (
            <>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar 
                  src={selectedUser.profileImage}
                  sx={{ mr: 2, width: 40, height: 40 }}
                >
                  {!selectedUser.profileImage && selectedUser.name[0].toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h6">{selectedUser.name}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {selectedUser.type === 'provider' ? 'Service Provider' : 'User'}
                  </Typography>
                </Box>
              </Box>

              <Box flex={1} overflow="auto" mb={2}>
                {messages.length > 0 ? (
                  messages.map(msg => (
                    <Box
                      key={msg.id}
                      sx={{
                        display: 'flex',
                        justifyContent: msg.senderId === currentUser.id ? 'flex-end' : 'flex-start',
                        mb: 1
                      }}
                    >
                      <Paper
                        sx={{
                          p: 1,
                          backgroundColor: msg.senderId === currentUser.id ? '#e3f2fd' : '#f5f5f5',
                          maxWidth: '70%'
                        }}
                      >
                        {msg.text && <Typography>{msg.text}</Typography>}
                        {renderFilePreview(msg)}
                      </Paper>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" color="textSecondary" align="center">
                    No messages yet
                  </Typography>
                )}
              </Box>

              <Box display="flex" gap={1} alignItems="center">
                <TextField
                  fullWidth
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />

                <IconButton 
                  onClick={(e) => setAnchorEl(e.currentTarget)}
                  color="primary"
                >
                  <EmojiEmotionsIcon />
                </IconButton>

                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <IconButton component="span" color="primary">
                    <AttachFileIcon />
                  </IconButton>
                </label>

                <IconButton color="primary" onClick={sendMessage}>
                  <SendIcon />
                </IconButton>

                <Popover
                  open={Boolean(anchorEl)}
                  anchorEl={anchorEl}
                  onClose={() => setAnchorEl(null)}
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                  }}
                  transformOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                  }}
                >
                  <Picker 
                    data={data} 
                    onEmojiSelect={handleEmojiSelect}
                  />
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
