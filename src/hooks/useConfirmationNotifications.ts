import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

const STORAGE_KEY = 'gaonride:pending-confirmations';
const STATUS_KEY = 'gaonride:pending-statuses';

type PendingMap = Record<string, string[]>;
type StatusMap = Record<string, Record<string, string>>;

const readPending = (): PendingMap => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PendingMap) : {};
  } catch {
    return {};
  }
};

const writePending = (data: PendingMap) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const readStatusMap = (): StatusMap => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STATUS_KEY);
    return raw ? (JSON.parse(raw) as StatusMap) : {};
  } catch {
    return {};
  }
};

const writeStatusMap = (data: StatusMap) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STATUS_KEY, JSON.stringify(data));
};

const getLastStatus = (table: string, id: string) => {
  const map = readStatusMap();
  return map[table]?.[id];
};

const setLastStatus = (table: string, id: string, status: string) => {
  const map = readStatusMap();
  map[table] = { ...(map[table] || {}), [id]: status };
  writeStatusMap(map);
};

const clearLastStatus = (table: string, id: string) => {
  const map = readStatusMap();
  if (!map[table]) return;
  const { [id]: _, ...rest } = map[table];
  if (Object.keys(rest).length) {
    map[table] = rest;
  } else {
    delete map[table];
  }
  writeStatusMap(map);
};

export const addPendingConfirmation = (table: string, id: string) => {
  const pending = readPending();
  const list = new Set(pending[table] || []);
  list.add(id);
  const ordered = Array.from(list);
  // Keep storage bounded to avoid unbounded growth per user
  const trimmed = ordered.slice(-50);
  const removed = ordered.slice(0, Math.max(0, ordered.length - trimmed.length));
  pending[table] = trimmed;
  writePending(pending);
  removed.forEach(removedId => clearLastStatus(table, removedId));
};

const removePendingConfirmation = (table: string, id: string) => {
  const pending = readPending();
  const list = (pending[table] || []).filter(item => item !== id);
  if (list.length) {
    pending[table] = list;
  } else {
    delete pending[table];
  }
  writePending(pending);
};

const isPending = (table: string, id: string) => {
  const pending = readPending();
  return (pending[table] || []).includes(id);
};

export const requestBrowserNotificationPermission = () => {
  if (typeof window === 'undefined') return;
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    Notification.requestPermission().catch(() => {});
  }
};

export const useConfirmationNotifications = (params: {
  table: string;
  label: string;
  showToast: (message: string) => void;
}) => {
  const { table, label, showToast } = params;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const formatStatus = (status: string) =>
      status.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());

    const buildMessage = (status: string) => {
      const normalized = status.toLowerCase();
      if (normalized === 'confirmed') {
        return {
          toast: `${label} confirmed! We'll contact you shortly.`,
          title: `${label} Confirmed`,
          body: `Your ${label.toLowerCase()} is confirmed. We'll contact you shortly.`,
        };
      }
      if (normalized === 'completed') {
        return {
          toast: `${label} completed. Thanks for choosing GaonRide.`,
          title: `${label} Completed`,
          body: `Your ${label.toLowerCase()} is completed. Thanks for choosing GaonRide.`,
        };
      }
      if (normalized === 'cancelled' || normalized === 'canceled') {
        return {
          toast: `${label} cancelled. If this is unexpected, please contact support.`,
          title: `${label} Cancelled`,
          body: `Your ${label.toLowerCase()} was cancelled. Please contact support if needed.`,
        };
      }
      const pretty = formatStatus(status);
      return {
        toast: `${label} status updated: ${pretty}.`,
        title: `${label} Updated`,
        body: `Status changed to ${pretty}.`,
      };
    };

    const shouldNotify = (status: string) => status.toLowerCase() !== 'pending';

    const notify = (status: string) => {
      const message = buildMessage(status);
      if (!shouldNotify(status)) return;
      showToast(message.toast);

      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(message.title, { body: message.body });
      }
    };

    const processStatusUpdate = (id: string, status: string) => {
      if (!isPending(table, id)) return;
      const normalized = status.toLowerCase();
      const last = getLastStatus(table, id);
      if (last === normalized) return;
      setLastStatus(table, id, normalized);
      notify(status);
    };

    const checkExisting = async () => {
      const pending = readPending()[table] || [];
      if (!pending.length) return;
      const { data } = await supabase.from(table).select('id,status').in('id', pending);
      (data || []).forEach((row: { id: string | number; status?: string }) => {
        const id = String(row.id);
        if (!row.status) return;
        processStatusUpdate(id, row.status);
      });
    };

    checkExisting();
    const pollId = window.setInterval(checkExisting, 15000);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkExisting();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const channel = supabase
      .channel(`confirmations-${table}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table },
        payload => {
          const row = payload.new as { id?: string | number; status?: string } | null;
          if (!row?.id || !row.status) return;
          const id = String(row.id);
          processStatusUpdate(id, row.status);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      window.clearInterval(pollId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [label, showToast, table]);
};
