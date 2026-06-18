import React from 'react';
import { CalendarDays, ExternalLink, MapPin } from 'lucide-react';
import {
  type EventItem,
  EVENT_TYPE_BADGE,
  EVENT_TYPE_META,
  formatEventDate,
} from '../../services/eventsService';

interface TimelineEventProps {
  event: EventItem;
  isLast?: boolean;
}

export const TimelineEvent: React.FC<TimelineEventProps> = ({ event, isLast }) => {
  const meta = EVENT_TYPE_META[event.eventType];

  return (
    <div className="flex gap-4">
      {/* 时间轴 */}
      <div className="flex flex-col items-center shrink-0">
        <div className="w-4 h-4 rounded-full gradient-ningyuzhi border-2 border-white shadow shrink-0 mt-1.5" />
        {!isLast && <div className="w-0.5 flex-grow bg-green-100 my-1" />}
      </div>

      {/* 卡片 */}
      <div className="flex-grow bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4 flex gap-4">
        <div className="flex-grow min-w-0 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${EVENT_TYPE_BADGE[event.eventType]}`}>
              {meta.emoji} {meta.label}
            </span>
            <span className="text-xs font-bold text-green-600 flex items-center gap-1">
              <CalendarDays size={12} />
              {formatEventDate(event.startAt)}
            </span>
          </div>

          <h3 className="font-black text-gray-900 leading-snug">{event.title}</h3>
          {event.description && (
            <p className="text-sm text-gray-500 font-medium line-clamp-2">{event.description}</p>
          )}
          {event.location && (
            <p className="text-xs text-gray-400 font-medium flex items-center gap-1">
              <MapPin size={12} className="text-green-500" />
              {event.location}
            </p>
          )}

          {event.externalUrl && (
            <a
              href={event.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 gradient-ningyuzhi text-green-950 font-black rounded-xl text-xs hover:scale-[1.02] transition-transform"
            >
              {meta.cta}
              <ExternalLink size={13} />
            </a>
          )}
        </div>

        {event.coverImage && (
          <img
            src={event.coverImage}
            alt={event.title}
            className="w-24 h-24 object-cover rounded-xl shrink-0 hidden sm:block"
          />
        )}
      </div>
    </div>
  );
};
