import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Socket } from 'socket.io-client';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import { Loader, PawPrint, ExternalLink } from 'lucide-react';

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
  messages,
  currentUserId,
  onSendMessage,
  isLoading = false,
  otherUserName = 'User',
  listingId,
}: ChatWindowProps) {
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

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
      <ChatInput onSend={onSendMessage} isLoading={isLoading} />
    </div>
  );
}
