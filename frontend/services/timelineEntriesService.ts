// services/timelineEntriesService.ts —— 甜玉米日记可编辑条目
import { apiFetch } from '../utils/apiClient';

import { API_BASE_URL } from '../config/api';

const BASE_URL = `${API_BASE_URL}/api`;

export interface TimelineEntry {
  id: string;
  date: string;
  title: string;
  summary: string;
  content: string;
  image: string;
  orderNum: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TimelineEntryInput {
  date: string;
  title: string;
  summary?: string;
  content?: string;
  image?: string;
  orderNum?: number;
  isPublished?: boolean;
}

export async function getTimelineEntries(): Promise<TimelineEntry[]> {
  const res = await apiFetch<{ entries: TimelineEntry[] }>(`${BASE_URL}/timeline-entries`);
  return res.entries;
}

export async function getTimelineEntry(id: string): Promise<TimelineEntry> {
  const res = await apiFetch<{ entry: TimelineEntry }>(`${BASE_URL}/timeline-entries/${id}`);
  return res.entry;
}

export async function createTimelineEntry(data: TimelineEntryInput): Promise<TimelineEntry> {
  const res = await apiFetch<{ entry: TimelineEntry }>(`${BASE_URL}/timeline-entries`, {
    method: 'POST',
    body: data,
  });
  return res.entry;
}

export async function updateTimelineEntry(
  id: string,
  data: Partial<TimelineEntryInput>,
): Promise<TimelineEntry> {
  const res = await apiFetch<{ entry: TimelineEntry }>(`${BASE_URL}/timeline-entries/${id}`, {
    method: 'PATCH',
    body: data,
  });
  return res.entry;
}

export async function deleteTimelineEntry(id: string): Promise<{ success: boolean }> {
  return apiFetch(`${BASE_URL}/timeline-entries/${id}`, { method: 'DELETE' });
}
