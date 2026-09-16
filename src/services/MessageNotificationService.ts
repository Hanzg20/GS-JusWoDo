import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useConfigStore } from '@/stores/configStore';

interface NotificationOptions {
    enableSound?: boolean;
    enableDesktop?: boolean;
    enableSMS?: boolean;
    quietHours?: { start: number; end: number };
}

export class MessageNotificationService {
    private static instance: MessageNotificationService;
    private audioContext: AudioContext | null = null;
    private notificationSound: HTMLAudioElement | null = null;
    private options: NotificationOptions = {
        enableSound: true,
        enableDesktop: true,
        enableSMS: false,
        quietHours: { start: 22, end: 8 } // 10 PM to 8 AM
    };

    private constructor() {
        this.initializeAudio();
        this.requestDesktopPermission();
    }

    static getInstance(): MessageNotificationService {
        if (!MessageNotificationService.instance) {
            MessageNotificationService.instance = new MessageNotificationService();
        }
        return MessageNotificationService.instance;
    }

    private initializeAudio() {
        // Create notification sound
        this.notificationSound = new Audio('/notification.mp3');
        this.notificationSound.volume = 0.5;
    }

    private async requestDesktopPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            await Notification.requestPermission();
        }
    }

    /**
     * Check if current time is within quiet hours
     */
    private isQuietHours(): boolean {
        const now = new Date();
        const hour = now.getHours();
        const { start, end } = this.options.quietHours!;

        if (start > end) {
            // Crosses midnight
            return hour >= start || hour < end;
        }
        return hour >= start && hour < end;
    }

    /**
     * Send notification for new message
     */
    async notifyNewMessage(message: {
        senderName: string;
        content: string;
        conversationId: string;
        isQuote?: boolean;
    }) {
        // Skip during quiet hours unless it's a quote
        if (this.isQuietHours() && !message.isQuote) {
            return;
        }

        // Play sound
        if (this.options.enableSound && this.notificationSound) {
            try {
                await this.notificationSound.play();
            } catch (e) {
                console.log('Could not play notification sound');
            }
        }

        // Show toast notification
        const isZh = useConfigStore.getState().language === 'zh';
        const title = message.isQuote
            ? (isZh ? `💰 ${message.senderName} 发来新报价` : `💰 New Quote from ${message.senderName}`)
            : `💬 ${message.senderName}`;

        toast.success(title, {
            description: message.content.substring(0, 50) + (message.content.length > 50 ? '...' : ''),
            action: {
                label: isZh ? '查看' : 'View',
                onClick: () => {
                    window.location.href = `/chat?conversation=${message.conversationId}`;
                }
            },
            duration: 5000,
        });

        // Show desktop notification
        if (this.options.enableDesktop &&
            'Notification' in window &&
            Notification.permission === 'granted' &&
            document.hidden) { // Only show if tab is not active

            const notification = new Notification(title, {
                body: message.content,
                icon: '/logo.png',
                badge: '/badge.png',
                tag: message.conversationId,
                requireInteraction: message.isQuote, // Quotes require interaction
                silent: this.isQuietHours(),
            });

            notification.onclick = () => {
                window.focus();
                window.location.href = `/chat?conversation=${message.conversationId}`;
                notification.close();
            };

            // Auto-close after 10 seconds
            setTimeout(() => notification.close(), 10000);
        }
    }

    /**
     * Send SMS notification for important messages (quotes, first message)
     */
    async sendSMSNotification(
        phoneNumber: string,
        message: string,
        type: 'quote' | 'first_message' | 'urgent'
    ) {
        if (!this.options.enableSMS) return;

        try {
            const { error } = await supabase.functions.invoke('send-notification', {
                body: {
                    phoneNumber,
                    message,
                    type,
                    channel: 'sms'
                }
            });

            if (error) {
                console.error('Failed to send SMS notification:', error);
            }
        } catch (e) {
            console.error('SMS notification error:', e);
        }
    }

    /**
     * Subscribe to offline messages and send notifications
     */
    async checkOfflineMessages(userId: string) {
        const lastSeen = localStorage.getItem('lastSeen') || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        const { data: unreadMessages } = await supabase
            .from('messages')
            .select(`
                *,
                conversations!inner(
                    participant_a,
                    participant_b
                ),
                sender:sender_id(
                    display_name,
                    avatar_url
                )
            `)
            .gt('created_at', lastSeen)
            .eq('is_read', false)
            .neq('sender_id', userId)
            .or(`conversations.participant_a.eq.${userId},conversations.participant_b.eq.${userId}`);

        if (unreadMessages && unreadMessages.length > 0) {
            // Group by conversation
            const messagesByConversation = unreadMessages.reduce((acc, msg) => {
                if (!acc[msg.conversation_id]) {
                    acc[msg.conversation_id] = [];
                }
                acc[msg.conversation_id].push(msg);
                return acc;
            }, {} as Record<string, any[]>);

            // Show summary notification
            const conversationCount = Object.keys(messagesByConversation).length;
            const totalMessages = unreadMessages.length;
            const isZh = useConfigStore.getState().language === 'zh';

            toast.info(
                isZh
                    ? `您有 ${totalMessages} 条未读消息，来自 ${conversationCount} 个对话`
                    : `You have ${totalMessages} unread message${totalMessages > 1 ? 's' : ''} from ${conversationCount} conversation${conversationCount > 1 ? 's' : ''}`,
                {
                    action: {
                        label: isZh ? '查看全部' : 'View All',
                        onClick: () => {
                            window.location.href = '/messages';
                        }
                    },
                    duration: 8000,
                }
            );
        }

        // Update last seen
        localStorage.setItem('lastSeen', new Date().toISOString());
    }

    /**
     * Update notification options
     */
    updateOptions(options: Partial<NotificationOptions>) {
        this.options = { ...this.options, ...options };
        localStorage.setItem('notificationOptions', JSON.stringify(this.options));
    }

    /**
     * Load saved options from localStorage
     */
    loadOptions() {
        const saved = localStorage.getItem('notificationOptions');
        if (saved) {
            this.options = { ...this.options, ...JSON.parse(saved) };
        }
    }
}