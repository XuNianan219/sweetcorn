import React from 'react';
import { CalendarDays, ExternalLink, MapPin, Star } from 'lucide-react';
import {
  type EventItem,
  EVENT_TYPE_META,
  countdownText,
  formatEventDate,
} from '../../services/eventsService';

interface PinnedEventBannerProps {
  event: EventItem;
}

export const PinnedEventBanner: React.FC<PinnedEventBannerProps> = ({ event }) => {
  const meta = EVENT_TYPE_META[event.eventType];

  return (
    <div className="relative rounded-[2rem] overflow-hidden shadow-sm border border-green-50 bg-white">
      <div className="grid md:grid-cols-2">
        {/* 封面 */}
        <div className="relative h-56 md:h-full min-h-[14rem] bg-gray-50">
          {event.coverImage ? (
            <img src={event.coverImage} alt={event.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full gradient-ningyuzhi flex items-center justify-center text-6xl">
              {meta.emoji}
            </div>
          )}
          <span className="absolute top-4 left-4 flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-full text-xs font-black shadow">
            <Star size={12} className="fill-white" />
            置顶推荐
          </span>
        </div>

        {/* 内容 */}
        <div className="p-6 md:p-8 flex flex-col justify-center gap-3 bg-[#fcf9e8]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-green-100 text-green-700">
              {meta.emoji} {meta.label}
            </span>
            {event.celebrities.map((c) => (
              <span key={c} className="px-2 py-0.5 rounded-full text-xs font-bold bg-white text-green-600">
                {c}
              </span>
            ))}
          </div>

          <h2 className="text-2xl md:text-3xl font-black text-green-950 leading-tight">{event.title}</h2>
          {event.description && (
            <p className="text-sm text-gray-500 font-medium line-clamp-2">{event.description}</p>
          )}

          <div className="inline-flex w-fit items-center gap-2 px-4 py-2 bg-white rounded-2xl text-green-700 font-black shadow-sm">
            ⏳ {countdownText(event.startAt)}
          </div>

          <div className="flex flex-wrap gap-3 text-xs text-gray-500 font-medium">
            <span className="flex items-center gap-1">
              <CalendarDays size={13} className="text-green-500" />
              {formatEventDate(event.startAt)}
            </span>
            {event.location && (
              <span className="flex items-center gap-1">
                <MapPin size={13} className="text-green-500" />
                {event.location}
              </span>
            )}
          </div>

          {event.externalUrl && (
            <a
              href={event.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex w-fit items-center gap-2 px-6 py-3 gradient-ningyuzhi text-green-950 font-black rounded-2xl hover:scale-[1.03] transition-transform shadow"
            >
              {meta.cta}
              <ExternalLink size={16} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
