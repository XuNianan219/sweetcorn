import React from 'react';
import {
  type EventItem,
  EVENT_TYPE_META,
  countdownText,
} from '../../services/eventsService';

interface CountdownItemProps {
  event: EventItem;
}

export const CountdownItem: React.FC<CountdownItemProps> = ({ event }) => {
  const meta = EVENT_TYPE_META[event.eventType];

  return (
    <div className="flex items-center gap-3 bg-white rounded-2xl border border-green-50 shadow-sm px-4 py-3 min-w-[15rem]">
      <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-xl shrink-0">
        {meta.emoji}
      </div>
      <div className="min-w-0">
        <p className="font-black text-gray-800 text-sm truncate">{event.title}</p>
        <p className="text-xs font-bold text-green-600">{countdownText(event.startAt)}</p>
      </div>
    </div>
  );
};
