import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

interface MessageBubbleProps {
  message: any;
  isOwn: boolean;
}

export default function MessageBubble({
  message,
  isOwn,
}: MessageBubbleProps) {
  const getTickStatus = () => {
    if (!isOwn) return null;

    const seenByIds = (message.seenBy || []).map((id: any) => id.toString?.() || id);

    // If seenBy has any entries, message has been seen
    if (seenByIds.length > 0) {
      return { type: 'seen', label: '✓✓' };
    } else {
      // Single tick for sent/delivered
      return { type: 'sent', label: '✓' };
    }
  };

  const tickStatus = getTickStatus();

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-xs px-4 py-2 rounded-lg ${
          isOwn
            ? 'bg-orange-600 text-white rounded-br-none'
            : 'bg-gray-200 text-gray-900 rounded-bl-none'
        }`}
      >
        <p className="break-words">{message.content}</p>
        <div className="flex items-center justify-between gap-2 mt-1">
          <p
            className={`text-xs ${
              isOwn ? 'text-orange-100' : 'text-gray-600'
            }`}
          >
            {dayjs(message.createdAt).fromNow()}
          </p>
          {tickStatus && (
            <span
              className={`text-xs font-semibold ${
                tickStatus.type === 'seen'
                  ? 'text-blue-400'
                  : 'text-orange-100'
              }`}
            >
              {tickStatus.label}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
