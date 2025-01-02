import React from 'react';
import { Box, TextField, IconButton, Popover } from '@mui/material';
import { Send as SendIcon, EmojiEmotions as EmojiEmotionsIcon, AttachFile as AttachFileIcon } from '@mui/icons-material';
import Picker from '@emoji-mart/react';

const MessageInputArea = ({
  message,
  setMessage,
  sendMessage,
  file,
  fileInputRef,
  handleFileChange,
  anchorEl,
  setAnchorEl,
  handleEmojiSelect,
  data
}) => {
  return (
    <Box 
      display="flex" 
      gap={1} 
      alignItems="center" 
      className="input-area"
      sx={{ 
        padding: '12px',
        borderTop: '1px solid #eee',
        backgroundColor: '#fff'
      }}
    >
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
        sx={{
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#f5f5f5',
            borderRadius: '24px',
            '& fieldset': {
              borderColor: 'transparent'
            },
            '&:hover fieldset': {
              borderColor: 'transparent'
            },
            '&.Mui-focused fieldset': {
              borderColor: 'primary.main'
            }
          }
        }}
      />

      <IconButton 
        onClick={(e) => setAnchorEl(e.currentTarget)}
        color="primary"
        size="medium"
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
        <IconButton 
          component="span" 
          color="primary"
          size="medium"
        >
          <AttachFileIcon />
        </IconButton>
      </label>

      <IconButton 
        color="primary"
        onClick={sendMessage}
        disabled={!message.trim() && !file}
        size="medium"
      >
        <SendIcon />
      </IconButton>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        className="emoji-popover"
      >
        <Picker data={data} onEmojiSelect={handleEmojiSelect} />
      </Popover>
    </Box>
  );
};

export default MessageInputArea;