import { httpClient } from './httpClient.js';

/** In-app notifications (job post approved/rejected, company verified/rejected). */
export const NotificationModel = {
  /** Returns { results, unread_count }, newest first. */
  list() {
    return httpClient.get('/notifications/');
  },

  /** ids: the notifications to mark read; omit to mark all of them. Returns { unread_count }. */
  markRead(ids) {
    return httpClient.post('/notifications/read/', ids ? { ids } : {});
  },
};

/** Fired on window when new notifications arrive, so open pages can reload their data. */
export const NOTIFICATION_EVENT = 'jobfinder:notifications';
