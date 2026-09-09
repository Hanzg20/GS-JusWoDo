import { create } from 'zustand';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

// Real online/offline status via Supabase Realtime Presence — a single
// shared channel all logged-in users join and track themselves on, not a
// DB table (presence is ephemeral, scoped to the channel's live
// connections). This replaces the hardcoded "Online" badge that used to
// sit in Chat.tsx regardless of whether the other person was actually there.
const PRESENCE_CHANNEL = 'presence:online';

interface PresenceState {
    onlineUserIds: Set<string>;
    channel: RealtimeChannel | null;
    joinPresence: (userId: string) => void;
    leavePresence: () => void;
}

export const usePresenceStore = create<PresenceState>((set, get) => ({
    onlineUserIds: new Set(),
    channel: null,

    joinPresence: (userId: string) => {
        if (get().channel) return; // already joined this session

        const channel = supabase.channel(PRESENCE_CHANNEL, {
            config: { presence: { key: userId } },
        });

        const syncOnlineIds = () => {
            const state = channel.presenceState();
            set({ onlineUserIds: new Set(Object.keys(state)) });
        };

        channel
            .on('presence', { event: 'sync' }, syncOnlineIds)
            .on('presence', { event: 'join' }, syncOnlineIds)
            .on('presence', { event: 'leave' }, syncOnlineIds)
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({ online_at: new Date().toISOString() });
                }
            });

        set({ channel });
    },

    leavePresence: () => {
        const { channel } = get();
        if (channel) {
            supabase.removeChannel(channel);
        }
        set({ channel: null, onlineUserIds: new Set() });
    },
}));
