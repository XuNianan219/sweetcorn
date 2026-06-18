import React from 'react';
import { CalendarDays, ExternalLink, MapPin } from 'lucide-react';
import {
  type EventItem,
  EVENT_TYPE_BADGE,
  EVENT_TYPE_META,
  formatEventDate,
} from '../../services/eventsService';

interface EventCardProps {
  event: EventItem;
}

export const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const meta = EVENT_TYPE_META[event.eventType];

  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow break-inside-avoid mb-4 border border-gray-100">
      {event.coverImage ? (
        <div className="w-full overflow-hidden bg-gray-50">
          <img
            src={event.coverImage}
            alt={event.title}
            className="w-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
          />
        </div>
      ) : (
        <div className="w-full h-32 gradient-ningyuzhi flex items-center justify-center text-4xl">
          {meta.emoji}
        </div>
      )}

      <div className="p-4 space-y-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${EVENT_TYPE_BADGE[event.eventType]}`}>
            {meta.emoji} {meta.label}
          </span>
          {event.celebrities.map((c) => (
            <span key={c} className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-600">
              {c}
            </span>
          ))}
        </div>

        <h3 className="font-black text-gray-900 leading-snug line-clamp-2">{event.title}</h3>

        {event.description && (
          <p className="text-sm text-gray-500 font-medium line-clamp-2">{event.description}</p>
        )}

        <div className="space-y-1 text-xs text-gray-400 font-medium pt-0.5">
          <div className="flex items-center gap-1.5">
            <CalendarDays size={13} className="text-green-500 shrink-0" />
            <span>{formatEventDate(event.startAt)}</span>
          </div>
          {event.location && (
            <div className="flex items-center gap-1.5">
              <MapPin size={13} className="text-green-500 shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
        </div>

        {event.externalUrl && (
          <a
            href={event.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 flex items-center justify-center gap-1.5 w-full py-2 gradient-ningyuzhi text-green-950 font-black rounded-xl text-sm hover:scale-[1.02] transition-transform"
          >
            {meta.cta}
            <ExternalLink size={14} />
          </a>
        )}
      </div>
    </div>
  );
};
