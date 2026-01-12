import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Socket } from 'socket.io-client';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import { Loader, PawPrint, ExternalLink, Smile, Paperclip, X } from 'lucide-react';
import EmojiPicker, { type EmojiClickData } from 'emoji-picker-react';
import { chatService, type ChatAttachment } from '@/services/chatService';

interface ChatWindowProps {
  roomId: string;
  messages: any[];
  currentUserId: string;
  onSendMessage: (content: string) => Promise<void>;
  isLoading?: boolean;
  otherUserName?: string;
  listingId?: {
    _id: string;
    title: string;
    photos?: string[];
    userId?: string;
  };
  socket?: Socket | null;
}

export default function ChatWindow({
  roomId,
  messages,
  currentUserId,
  onSendMessage,
  isLoading = false,
  otherUserName = 'User',
  listingId,
  socket,
}: ChatWindowProps) {
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [messageText, setMessageText] = useState<string>('');
  const [isEmojiOpen, setIsEmojiOpen] = useState<boolean>(false);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleViewListing = () => {
    if (listingId?._id) {
      navigate(`/matchmaking/${listingId._id}`, { state: { listing: listingId } });
    }
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setMessageText((prev) => `${prev}${emojiData.emoji}`);
  };

  const handlePickFile = () => {
    fileInputRef.current?.click();
  };

  const handleFilesSelected = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      setIsUploading(true);
      const uploaded = await Promise.all(files.map((f) => chatService.uploadChatFile(f)));
      setAttachments((prev) => [...prev, ...uploaded]);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const sendWithAttachmentsIfNeeded = async (content: string) => {
    if (attachments.length === 0) {
      await onSendMessage(content);
      return;
    }

    if (!socket) {
      return;
    }

    const isAllImages = attachments.every((a) => a.mimeType?.startsWith('image/'));
    const type: 'image' | 'file' = isAllImages ? 'image' : 'file';

    socket.emit('chat:send_message', {
      roomId,
      content,
      attachments,
      type,
    });

    setMessageText('');
    setAttachments([]);
    setIsEmojiOpen(false);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between gap-3">
          {/* Left: Listing Photo + Title */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Listing Thumbnail */}
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center overflow-hidden">
              {listingId?.photos?.[0] ? (
                <img
                  src={listingId.photos[0]}
                  alt={listingId.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <PawPrint size={20} className="text-gray-400" />
              )}
            </div>

            {/* Title */}
            <h2 className="text-lg font-semibold text-gray-900 truncate">
              {listingId?.title || otherUserName}
            </h2>
          </div>

          {/* Right: View Listing Button */}
          <button
            type="button"
            onClick={handleViewListing}
            className="flex-shrink-0 text-sm px-3 py-1 rounded-md bg-orange-500 text-white hover:bg-orange-600 transition-colors flex items-center gap-1"
          >
            <ExternalLink size={14} />
            View Listing
          </button>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-2"
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg._id}
              message={msg}
              isOwn={msg.senderId === currentUserId}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="px-4 py-2 flex items-center gap-2 text-gray-500 text-sm">
          <Loader size={16} className="animate-spin" />
          Sending...
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-200 bg-white">
        {attachments.length > 0 && (
          <div className="px-4 pt-3 flex flex-wrap gap-2">
            {attachments.map((a, idx) => (
              <div
                key={`${a.url}-${idx}`}
                className="flex items-center gap-2 bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-md"
              >
                <span className="max-w-[200px] truncate">{a.name}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(idx)}
                  className="text-gray-500 hover:text-gray-800"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2 px-4 pt-3">
          <button
            type="button"
            onClick={() => setIsEmojiOpen((v) => !v)}
            className="p-2 rounded-md hover:bg-gray-100 text-gray-600"
            disabled={isLoading}
          >
            <Smile size={20} />
          </button>

          <button
            type="button"
            onClick={handlePickFile}
            className="p-2 rounded-md hover:bg-gray-100 text-gray-600"
            disabled={isLoading || isUploading}
          >
            <Paperclip size={20} />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFilesSelected}
          />
        </div>

        {isEmojiOpen && (
          <div className="px-4 pt-2">
            <EmojiPicker onEmojiClick={handleEmojiClick} />
          </div>
        )}

        <ChatInput
          value={messageText}
          onChange={setMessageText}
          onSend={sendWithAttachmentsIfNeeded}
          isLoading={isLoading || isUploading}
        />
      </div>
    </div>
  );
}
