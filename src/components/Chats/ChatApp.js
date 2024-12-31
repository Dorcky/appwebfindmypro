import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, orderBy, addDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '../firebaseConfig'; // Assurez-vous que vous importez auth depuis firebaseConfig
import { Camera, Send, Smile } from 'lucide-react';
import { FaPaperclip } from 'react-icons/fa';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { Avatar, Typography, Button, IconButton, TextField, Popover } from '@mui/material';
import { signOut } from 'firebase/auth'; // Importation pour la déconnexion

const ChatApp = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [file, setFile] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Gérer l'authentification de l'utilisateur
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setCurrentUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchProviders = () => {
      const q = collection(db, 'service_providers');
      onSnapshot(q, (snapshot) => {
        const providerData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProviders(providerData);
      });
    };
    fetchProviders();
  }, []);

  useEffect(() => {
    if (selectedProvider && currentUser) {
      const chatQuery = query(
        collection(db, 'messages'),
        where('participants', 'array-contains', currentUser.uid),
        orderBy('created_at', 'asc')
      );
      const unsubscribe = onSnapshot(chatQuery, (snapshot) => {
        const messageData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMessages(messageData);
        scrollToBottom();
      });
      return () => unsubscribe();
    }
  }, [selectedProvider, currentUser]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFileUpload = async (file) => {
    if (!file) return null;
    const fileRef = ref(storage, `chat_files/${Date.now()}_${file.name}`);
    await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(fileRef);
    return { file_url: downloadURL, file_type: file.type, file_name: file.name };
  };

  const sendMessage = async () => {
    if ((!message.trim() && !file)) {
      console.log("Error: Message is empty and no file attached.");
      return;
    }

    if (!selectedProvider || !currentUser) {
      console.log("Error: Missing selected provider or current user.");
      return;
    }

    let fileData = null;
    if (file) {
      try {
        fileData = await handleFileUpload(file);
      } catch (error) {
        console.error("Error uploading file:", error);
        return;
      }
    }

    const chatId = `chat_${currentUser.uid}_${selectedProvider.id}`;
    try {
      const docRef = await addDoc(collection(db, 'messages'), {
        chat_id: chatId,
        sender_id: currentUser.uid,
        receiver_id: selectedProvider.id,
        content: message.trim(),
        file_url: fileData?.file_url || null,
        file_type: fileData?.file_type || null,
        file_name: fileData?.file_name || null,
        created_at: serverTimestamp(),
        participants: [currentUser.uid, selectedProvider.id],
        status: { is_sent: true, is_delivered: false, is_read: false, read_at: null },
      });

      setMessage('');
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleEmojiSelect = (emoji) => {
    setMessage(prev => prev + emoji.native);
    setAnchorEl(null);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.size <= 5 * 1024 * 1024) {
      setFile(selectedFile);
    } else {
      alert('File size must be less than 5MB');
    }
  };

  const renderFilePreview = (msg) => {
    if (!msg.file_url) return null;
    if (msg.file_type?.startsWith('image/')) {
      return (
        <img src={msg.file_url} alt="Shared content" className="max-w-[200px] rounded-lg" />
      );
    }
    return (
      <Button variant="outlined" className="gap-2" onClick={() => window.open(msg.file_url, '_blank')}>
        <FaPaperclip className="h-4 w-4" /> {msg.file_name || 'Download file'}
      </Button>
    );
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <div className="container mx-auto mt-4">
      {currentUser ? (
        <div className="flex gap-4 h-[80vh] border shadow-lg rounded-lg">
          <div className="w-[300px] bg-gray-100 border-r">
            <h2 className="text-lg font-semibold p-4">Healthcare Providers</h2>
            <div className="overflow-y-auto h-full">
              {providers.map(provider => (
                <div
                  key={provider.id}
                  onClick={() => setSelectedProvider(provider)}
                  className={`cursor-pointer p-4 flex items-center gap-2 hover:bg-gray-200 rounded-lg transition-colors duration-200 ${
                    selectedProvider?.id === provider.id ? 'bg-gray-300' : ''
                  }`}
                >
                  <Avatar src={provider.profileImageURL} alt={provider.name} />
                  <div>
                    <Typography className="font-medium text-sm">{provider.name}</Typography>
                    <Typography className="text-xs text-gray-600"> {provider.serviceType} </Typography>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 bg-white">
            <div className="h-full flex flex-col">
              {selectedProvider ? (
                <>
                  <div className="mb-4 p-4 flex items-center gap-2 border-b">
                    <Avatar src={selectedProvider.profileImageURL} alt={selectedProvider.name} />
                    <div>
                      <Typography className="font-medium text-lg"> {selectedProvider.name} </Typography>
                      <Typography className="text-sm text-gray-500"> {selectedProvider.serviceType} </Typography>
                    </div>
                  </div>
                  <div className="flex-1 overflow-auto p-4">
                    {messages.map(msg => (
                      <div key={msg.id} className={`flex mb-2 ${msg.sender_id === currentUser.uid ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`p-3 rounded-lg max-w-[70%] shadow-md ${
                            msg.sender_id === currentUser.uid ? 'bg-blue-100' : 'bg-gray-100'
                          }`}
                        >
                          {msg.content && (
                            <Typography className="mb-1 text-sm">{msg.content}</Typography>
                          )}
                          {renderFilePreview(msg)}
                          <Typography className="text-xs text-gray-500 mt-1">
                            {msg.created_at?.toDate().toLocaleTimeString()}
                          </Typography>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                  <div className="p-4 flex gap-2 items-center border-t">
                    <TextField
                      className="flex-1"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type a message..."
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    />
                    <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
                      <Smile className="h-5 w-5" />
                    </IconButton>
                    <input ref={fileInputRef} type="file" onChange={handleFileChange} className="hidden" id="file-upload" />
                    <label htmlFor="file-upload">
                      <IconButton component="span">
                        <FaPaperclip className="h-5 w-5" />
                      </IconButton>
                    </label>
                    <IconButton onClick={sendMessage} className="bg-blue-500 text-white">
                      <Send className="h-5 w-5" />
                    </IconButton>
                    <Popover
                      open={Boolean(anchorEl)}
                      anchorEl={anchorEl}
                      onClose={() => setAnchorEl(null)}
                      anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                      }}
                      transformOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                      }}
                    >
                      <Picker data={data} onEmojiSelect={handleEmojiSelect} />
                    </Popover>
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <Typography className="text-gray-500"> Select a service provider to start chatting </Typography>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-center items-center h-screen">
          <Typography className="text-xl">Please sign in to continue.</Typography>
        </div>
      )}
    </div>
  );
};

export default ChatApp;
