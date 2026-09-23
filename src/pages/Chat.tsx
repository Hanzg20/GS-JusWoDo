import { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "@/components/Header";
import { Search, MoreVertical, Video, Image, Mic, Send, MessageCircle, DollarSign, Package, CheckCircle2, Clock, ChevronRight, Hash, Loader2, User, ShoppingBag, Store, UserCircle, Check, CheckCheck, ArrowLeft, MapPin, ShieldCheck, Shield, UserX, Undo2, Trash2, Copy, Reply, Languages, X, UserPlus, Archive, Inbox } from "lucide-react";
import { useMessageStore } from "@/stores/messageStore";
import { useAuthStore } from "@/stores/authStore";
import { usePresenceStore } from "@/stores/presenceStore";
import { useOrderStore } from "@/stores/orderStore";
import { SUPPORT_USER_ID } from "@/config/support";
import { useConfigStore } from "@/stores/configStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useMessageReadStatus } from "@/hooks/useMessageReadStatus";
import { MessageNotificationService } from "@/services/MessageNotificationService";
import { QuickReplyTemplates } from "@/components/chat/QuickReplyTemplates";
import { useMessagePagination } from "@/hooks/useMessagePagination";
import { StartConversationDialog } from "@/components/chat/StartConversationDialog";
import { EmojiPicker } from "@/components/chat/EmojiPicker";
import { ImageUpload } from "@/components/chat/ImageUpload";
import { LocationShare } from "@/components/chat/LocationShare";
import { userRepository } from "@/services/repositories/supabase/UserRepository";
import { supabase } from "@/lib/supabase";
import { ReportDialog } from "@/components/common/ReportDialog";
import { setPostLoginRedirect } from "@/utils/postLoginRedirect";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Chat = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuthStore();
    const { language } = useConfigStore();
    const isZh = language === 'zh';
    const { onlineUserIds } = usePresenceStore();

    // 小海狸's user_profiles.name is a single plain-text DB field ("小海狸"),
    // not a bilingual zh/en pair like listing content — every English-UI
    // visitor was seeing her name in Chinese characters in their own chat
    // list. Special-cased here (same mechanism as her pin-to-top/badge
    // treatment below) rather than adding a schema column just for one
    // account.
    const supportDisplayName = isZh ? '小海狸' : 'Beaver';
    const getDisplayName = (otherUserId: string | undefined, rawName: string | undefined) =>
        otherUserId === SUPPORT_USER_ID ? supportDisplayName : (rawName || (isZh ? '用户' : 'User'));
    const {
        conversations,
        messages,
        activeConversationId,
        isLoading,
        loadConversations,
        setActiveConversation,
        sendMessage,
        sendQuote,
        recallMessage,
        deleteMessageForMe,
        archiveConversation,
        unarchiveConversation,
        deleteConversationForMe,
        cleanup
    } = useMessageStore();
    const { orders } = useOrderStore();

    const [input, setInput] = useState("");
    const [replyingTo, setReplyingTo] = useState<typeof messages[number] | null>(null);
    const [translations, setTranslations] = useState<Record<string, string>>({});
    const [translatingIds, setTranslatingIds] = useState<Set<string>>(new Set());
    const [showStartDialog, setShowStartDialog] = useState(false);
    const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);
    const [followingUserIds, setFollowingUserIds] = useState<string[]>([]);
    const [showArchived, setShowArchived] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const notificationService = useRef<MessageNotificationService | null>(null);

    // Blocked neighbors' conversations stay out of the list entirely —
    // see UserProfile.tsx's Block User action.
    useEffect(() => {
        if (currentUser?.id) {
            userRepository.getBlockedUserIds(currentUser.id).then(setBlockedUserIds).catch(console.error);
            userRepository.getFollowingUserIds(currentUser.id).then(setFollowingUserIds).catch(console.error);
        }
    }, [currentUser?.id]);

    // Conversations after the two "invisible to me" filters (blocked,
    // deleted-for-me) but before the archived/active split — shared by
    // both visibleConversations and the archived-count badge so the two
    // never drift out of sync with each other.
    const selectableConversations = useMemo(() => {
        return conversations.filter(conv => {
            const otherUserId = conv.participantA === currentUser?.id ? conv.participantB : conv.participantA;
            if (blockedUserIds.includes(otherUserId)) return false;
            if ((conv.deletedFor || []).includes(currentUser?.id || '')) return false;
            return true;
        });
    }, [conversations, blockedUserIds, currentUser?.id]);

    const archivedCount = useMemo(
        () => selectableConversations.filter(conv => (conv.archivedFor || []).includes(currentUser?.id || '')).length,
        [selectableConversations, currentUser?.id]
    );

    const visibleConversations = useMemo(() => {
        const byArchiveView = selectableConversations.filter(conv => {
            const isArchived = (conv.archivedFor || []).includes(currentUser?.id || '');
            return showArchived ? isArchived : !isArchived;
        });

        // 小海狸's conversation always pins to the top — another cue (with
        // the official badge below) that she's the platform's actual
        // support channel, not just another chat that happens to sort by
        // recency like everyone else. Array.sort is stable (ES2019+), so
        // this only reorders the support conversation itself; everyone
        // else keeps their existing relative order.
        const pinned = [...byArchiveView].sort((a, b) => {
            const aIsSupport = (a.participantA === currentUser?.id ? a.participantB : a.participantA) === SUPPORT_USER_ID;
            const bIsSupport = (b.participantA === currentUser?.id ? b.participantB : b.participantA) === SUPPORT_USER_ID;
            if (aIsSupport === bIsSupport) return 0;
            return aIsSupport ? -1 : 1;
        });

        const query = searchQuery.trim().toLowerCase();
        if (!query) return pinned;
        return pinned.filter(conv => (conv.otherUserName || '').toLowerCase().includes(query));
    }, [selectableConversations, currentUser?.id, searchQuery, showArchived]);

    const activeOtherUserId = useMemo(() => {
        const conv = conversations.find(c => c.id === activeConversationId);
        if (!conv) return null;
        return conv.participantA === currentUser?.id ? conv.participantB : conv.participantA;
    }, [conversations, activeConversationId, currentUser?.id]);

    const handleBlockUser = async (targetUserId?: string) => {
        const otherUserId = targetUserId || activeOtherUserId;
        if (!currentUser?.id || !otherUserId) return;
        try {
            await userRepository.blockUser(currentUser.id, otherUserId);
            setBlockedUserIds(prev => [...prev, otherUserId]);
            if (activeOtherUserId === otherUserId) setActiveConversation(null);
            toast.success(isZh ? '已拉黑' : 'User blocked');
        } catch (err) {
            console.error('Failed to block user:', err);
            toast.error(isZh ? '拉黑失败，请重试' : 'Failed to block user');
        }
    };

    const handleToggleFollow = async (otherUserId: string) => {
        if (!currentUser?.id) return;
        const isFollowing = followingUserIds.includes(otherUserId);
        try {
            if (isFollowing) {
                await userRepository.unfollowUser(currentUser.id, otherUserId);
                setFollowingUserIds(prev => prev.filter(id => id !== otherUserId));
                toast.success(isZh ? '已取消关注' : 'Unfollowed');
            } else {
                await userRepository.followUser(currentUser.id, otherUserId);
                setFollowingUserIds(prev => [...prev, otherUserId]);
                toast.success(isZh ? '已关注' : 'Followed');
            }
        } catch (err) {
            console.error('Failed to toggle follow:', err);
            toast.error(isZh ? '操作失败，请重试' : 'Failed, please try again');
        }
    };

    const handleToggleArchive = async (conversationId: string, isArchived: boolean) => {
        if (!currentUser?.id) return;
        try {
            if (isArchived) {
                await unarchiveConversation(conversationId, currentUser.id);
                toast.success(isZh ? '已取消归档' : 'Unarchived');
            } else {
                await archiveConversation(conversationId, currentUser.id);
                if (activeConversationId === conversationId) setActiveConversation(null);
                toast.success(isZh ? '已归档' : 'Archived');
            }
        } catch (err) {
            console.error('Failed to toggle archive:', err);
            toast.error(isZh ? '操作失败，请重试' : 'Failed, please try again');
        }
    };

    const handleDeleteConversation = async (conversationId: string) => {
        if (!currentUser?.id) return;
        try {
            await deleteConversationForMe(conversationId, currentUser.id);
            if (activeConversationId === conversationId) setActiveConversation(null);
            toast.success(isZh ? '已删除' : 'Deleted');
        } catch (err) {
            console.error('Failed to delete conversation:', err);
            toast.error(isZh ? '删除失败，请重试' : 'Failed to delete, please try again');
        }
    };

    // Initialize notification service
    useEffect(() => {
        notificationService.current = MessageNotificationService.getInstance();
        notificationService.current.loadOptions();
    }, []);

    // Integrate message read status sync
    useMessageReadStatus(activeConversationId, currentUser?.id || '');

    // Load conversations on mount. If a first-time visitor genuinely has
    // zero conversations after that load, seed one with 小海狸 so the
    // list isn't just empty — chained directly off the load promise (and
    // reading the store's freshest state via getState(), not the reactive
    // `conversations` value from this render) rather than a second effect
    // watching `isLoading`/`conversations.length`, which raced: effects run
    // in declaration order within the same commit, so a second effect could
    // see this render's stale `isLoading === false` before the first
    // effect's loadConversations() call had a chance to flip it.
    useEffect(() => {
        if (currentUser?.id) {
            loadConversations(currentUser.id).then(() => {
                if (useMessageStore.getState().conversations.length === 0) {
                    return supabase.functions
                        .invoke('create-welcome-conversation', { body: { userId: currentUser.id } })
                        .then(() => loadConversations(currentUser.id));
                }
            }).catch((err) => console.error('Failed to seed welcome conversation:', err));
            // Check for offline messages
            notificationService.current?.checkOfflineMessages(currentUser.id);
        }
        return () => cleanup();
    }, [currentUser?.id]);

    // Auto-scroll logic - improved to handle new messages better
    useEffect(() => {
        const scrollToBottom = () => {
            if (messagesEndRef.current) {
                const container = messagesEndRef.current.parentElement;
                const isNearBottom = container && (container.scrollHeight - container.scrollTop - container.clientHeight) < 200;

                // Only auto-scroll if user is near the bottom or it's the first load
                if (isNearBottom || messages.length === 0) {
                    messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
                }
            }
        };

        // Small delay to ensure DOM is updated
        const timer = setTimeout(scrollToBottom, 100);
        return () => clearTimeout(timer);
    }, [messages]);

    const activeConversation = useMemo(() =>
        conversations.find(c => c.id === activeConversationId),
        [conversations, activeConversationId]);

    const activeOrder = useMemo(() =>
        activeConversation?.orderId ? orders.find(o => o.id === activeConversation.orderId) : null,
        [orders, activeConversation]);

    // "删除" (delete) hides a message from just the deleting party's own
    // view (WeChat's "delete for me only" semantics) — filtered here at
    // render time rather than in the repo, so the admin conversation
    // viewer still sees everything for moderation.
    const visibleMessages = useMemo(
        () => messages.filter(m => !(m.deletedFor || []).includes(currentUser?.id || '')),
        [messages, currentUser?.id]
    );

    // WeChat allows recalling a message you sent within a short window
    // after sending; enforced client-side only (no server-side check),
    // matching this app's existing row-level-trust RLS style elsewhere.
    const RECALL_WINDOW_MS = 2 * 60 * 1000;
    const canRecall = (msg: { senderId: string; createdAt: string; isRecalled?: boolean }) =>
        msg.senderId === currentUser?.id &&
        !msg.isRecalled &&
        (Date.now() - new Date(msg.createdAt).getTime()) < RECALL_WINDOW_MS;

    const handleRecallMessage = async (messageId: string) => {
        try {
            await recallMessage(messageId);
        } catch (err) {
            console.error('Failed to recall message:', err);
            toast.error(isZh ? '撤回失败，请重试' : 'Failed to recall, please try again');
        }
    };

    const handleDeleteMessage = async (messageId: string) => {
        if (!currentUser?.id) return;
        try {
            await deleteMessageForMe(messageId, currentUser.id);
        } catch (err) {
            console.error('Failed to delete message:', err);
            toast.error(isZh ? '删除失败，请重试' : 'Failed to delete, please try again');
        }
    };

    // Preview text for a message being quoted (引用) — non-text message
    // types get a generic label instead of their raw content (a location's
    // lat/lng or an image URL isn't meaningful to show in the quote bar).
    const getReplyPreviewText = (msg: typeof messages[number]) => {
        if (msg.messageType === 'IMAGE') return isZh ? '[图片]' : '[Image]';
        if (msg.messageType === 'LOCATION') return isZh ? '[位置]' : '[Location]';
        return (msg.content || '').slice(0, 80);
    };

    const handleSendMessage = async () => {
        if (!input.trim() || !currentUser?.id) return;

        // Haptic feedback on mobile
        if ('vibrate' in navigator) {
            navigator.vibrate(10);
        }

        const metadata = replyingTo ? {
            quotedMessageId: replyingTo.id,
            quotedSenderId: replyingTo.senderId,
            quotedContent: getReplyPreviewText(replyingTo),
        } : undefined;

        await sendMessage(currentUser.id, input, 'TEXT', metadata);
        setInput("");
        setReplyingTo(null);
    };

    const handleCopyMessage = async (msg: typeof messages[number]) => {
        try {
            await navigator.clipboard.writeText(msg.content);
            toast.success(isZh ? '已复制' : 'Copied');
        } catch (err) {
            console.error('Failed to copy message:', err);
            toast.error(isZh ? '复制失败' : 'Failed to copy');
        }
    };

    const handleTranslateMessage = async (msg: typeof messages[number]) => {
        if (translations[msg.id]) {
            setTranslations(prev => {
                const next = { ...prev };
                delete next[msg.id];
                return next;
            });
            return;
        }

        setTranslatingIds(prev => new Set(prev).add(msg.id));
        try {
            const { data, error } = await supabase.functions.invoke('translate-text', {
                body: { text: msg.content, targetLanguage: isZh ? 'zh' : 'en' }
            });
            if (error) throw error;
            if (data?.skipped) {
                toast.info(isZh ? '消息已经是中文了' : 'Message is already in English');
            } else if (data?.translated) {
                setTranslations(prev => ({ ...prev, [msg.id]: data.translated }));
            } else {
                throw new Error('No translation returned');
            }
        } catch (err) {
            console.error('Failed to translate message:', err);
            toast.error(isZh ? '翻译失败，请重试' : 'Failed to translate, please try again');
        } finally {
            setTranslatingIds(prev => {
                const next = new Set(prev);
                next.delete(msg.id);
                return next;
            });
        }
    };

    const handleSendQuote = async () => {
        if (!activeOrder || !currentUser?.id) return;
        const amountStr = prompt("Enter custom price (CAD):");
        if (!amountStr) return;
        const amount = parseFloat(amountStr);
        if (isNaN(amount) || amount <= 0) {
            toast.error("Invalid amount");
            return;
        }
        await sendQuote(currentUser.id, activeOrder.id, Math.round(amount * 100));
        toast.success("Quote sent!");
    };

    // Logged-out visitors still get the real chat layout (WeChat review
    // rejects pages that bounce straight to login) — the login prompt sits
    // inside it and only fires when they tap it themselves.
    const goLogin = () => {
        setPostLoginRedirect('/chat');
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-background/50 flex flex-col overflow-hidden">
            <Header />

            <div className="flex-1 container max-w-7xl py-4 md:py-4 py-0 flex gap-4 h-[calc(100vh-80px)] md:h-[calc(100vh-80px)] h-[calc(100vh-56px)] overflow-hidden">
                {/* Slim Sidebar - Show on mobile when no active conversation */}
                <div className={cn(
                    "flex w-full md:w-72 flex-col bg-card/40 backdrop-blur-md border-0 md:border md:border-border/50 rounded-none md:rounded-3xl overflow-hidden shadow-sm",
                    activeConversationId ? "hidden md:flex" : "flex"
                )}>
                    <div className="p-4 border-b border-border/50">
                        <div className="flex items-center justify-between mb-4 px-1">
                            {showArchived ? (
                                <button onClick={() => setShowArchived(false)} className="flex items-center gap-1.5 text-lg font-bold tracking-tight">
                                    <ArrowLeft className="w-4 h-4" />
                                    {isZh ? '已归档聊天' : 'Archived Chats'}
                                </button>
                            ) : (
                                <>
                                    <h2 className="font-bold text-lg tracking-tight">Chat</h2>
                                    <Badge variant="secondary" className="bg-primary/10 text-primary border-none">
                                        {visibleConversations.reduce((acc, curr) => acc + (curr.unreadCount || 0), 0)} New
                                    </Badge>
                                </>
                            )}
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-muted/50 border-none outline-none text-xs"
                            />
                        </div>
                        {!showArchived && archivedCount > 0 && (
                            <button
                                onClick={() => setShowArchived(true)}
                                className="w-full flex items-center gap-2 mt-3 px-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <Archive className="w-3.5 h-3.5" />
                                {isZh ? `已归档聊天 (${archivedCount})` : `Archived Chats (${archivedCount})`}
                            </button>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {!currentUser ? (
                            <div className="p-8 text-center text-muted-foreground">
                                <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                <p className="text-xs mb-4">{isZh ? '登录后查看你的聊天消息' : 'Log in to see your messages'}</p>
                                <Button size="sm" className="text-xs h-8 rounded-xl" onClick={goLogin}>
                                    {isZh ? '去登录' : 'Log In'}
                                </Button>
                            </div>
                        ) : isLoading && visibleConversations.length === 0 ? (
                            <div className="p-8 text-center text-xs text-muted-foreground animate-pulse">Loading conversations...</div>
                        ) : visibleConversations.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">
                                {showArchived ? (
                                    <>
                                        <Archive className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                        <p className="text-xs mb-4">{isZh ? '暂无已归档聊天' : 'No archived chats'}</p>
                                    </>
                                ) : (
                                    <>
                                        <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                        <p className="text-xs mb-4">No chats yet</p>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-xs h-8"
                                            onClick={() => setShowStartDialog(true)}
                                        >
                                            Start Chat
                                        </Button>
                                    </>
                                )}
                            </div>
                        ) : (
                            visibleConversations.map(conv => {
                                const convOtherUserId = conv.participantA === currentUser?.id ? conv.participantB : conv.participantA;
                                return (
                                <div
                                    key={`sidebar-conv-${conv.id}`}
                                    onClick={() => setActiveConversation(conv.id)}
                                    className={cn(
                                        "w-full px-4 py-3 flex items-center gap-3 transition-all relative group cursor-pointer",
                                        activeConversationId === conv.id ? 'bg-primary/5' : 'hover:bg-muted/30'
                                    )}
                                >
                                    {activeConversationId === conv.id && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                                    )}
                                    <div className="relative flex-shrink-0">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center border border-primary/10">
                                            {conv.otherUserAvatar ? (
                                                <img
                                                    src={conv.otherUserAvatar}
                                                    alt={getDisplayName(convOtherUserId, conv.otherUserName)}
                                                    className="w-full h-full rounded-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-sm font-black text-primary/80">
                                                    {getDisplayName(convOtherUserId, conv.otherUserName).charAt(0).toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                        {conv.unreadCount && conv.unreadCount > 0 && (
                                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-card">
                                                {conv.unreadCount}
                                            </div>
                                        )}
                                        {/* Warmer isn't the same as unofficial — 小海狸's casual voice
                                            (see ai-support-reply/index.ts) shouldn't leave a visitor
                                            unsure whether this is genuinely the platform's own support
                                            channel, so her conversation gets an official badge here
                                            instead of the generic 1-on-1 indicator every other chat gets. */}
                                        {convOtherUserId === SUPPORT_USER_ID ? (
                                            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full border-2 border-card flex items-center justify-center" title={isZh ? '客服' : 'Support'}>
                                                <ShieldCheck className="w-2.5 h-2.5 text-white" />
                                            </div>
                                        ) : (
                                            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-500 rounded-full border-2 border-card flex items-center justify-center">
                                                <User className="w-2.5 h-2.5 text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 text-left overflow-hidden">
                                        <div className="flex justify-between items-baseline mb-0.5">
                                            <span className={cn(
                                                "text-sm font-semibold truncate",
                                                activeConversationId === conv.id ? 'text-primary' : 'text-foreground'
                                            )}>
                                                {getDisplayName(convOtherUserId, conv.otherUserName)}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground">
                                                {new Date(conv.lastMessageAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            {conv.orderId && (
                                                <Badge variant="outline" className="h-3.5 px-1 text-[8px] border-amber-300/50 text-amber-700 bg-amber-50/50">
                                                    ORDER
                                                </Badge>
                                            )}
                                            <p className="text-xs text-muted-foreground truncate opacity-70 flex-1">
                                                {conv.lastMessagePreview || (isZh ? '新消息' : 'New message')}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Row actions — always visible (not hover-only): this page runs
                                        inside a touch-only WeChat Mini Program web-view with no
                                        mouse, where a hover-reveal control is simply unreachable. */}
                                    <div
                                        onClick={(e) => e.stopPropagation()}
                                        className="flex-shrink-0"
                                    >
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="w-6 h-6 rounded-full hover:bg-muted flex items-center justify-center">
                                                    <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="rounded-xl min-w-[130px] p-1">
                                                {convOtherUserId !== SUPPORT_USER_ID && (
                                                    <DropdownMenuItem onClick={() => handleToggleFollow(convOtherUserId)} className="gap-2 cursor-pointer rounded-lg py-2 text-xs font-bold">
                                                        <UserPlus className="w-3.5 h-3.5" />
                                                        {followingUserIds.includes(convOtherUserId) ? (isZh ? '取消关注' : 'Unfollow') : (isZh ? '关注' : 'Follow')}
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem onClick={() => handleToggleArchive(conv.id, showArchived)} className="gap-2 cursor-pointer rounded-lg py-2 text-xs font-bold">
                                                    <Archive className="w-3.5 h-3.5" />
                                                    {showArchived ? (isZh ? '取消归档' : 'Unarchive') : (isZh ? '归档' : 'Archive')}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDeleteConversation(conv.id)} className="gap-2 cursor-pointer rounded-lg py-2 text-xs font-bold text-red-500 focus:text-red-500">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                    {isZh ? '删除' : 'Delete'}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleBlockUser(convOtherUserId)} className="gap-2 cursor-pointer rounded-lg py-2 text-xs font-bold text-red-500 focus:text-red-500">
                                                    <UserX className="w-3.5 h-3.5" />
                                                    {isZh ? '拉黑' : 'Block'}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            );})
                        )}
                    </div>
                </div>

                {/* Main Chat Area - Hide on mobile when no active conversation */}
                <div className={cn(
                    "flex-1 flex flex-col bg-card/60 backdrop-blur-xl border-0 md:border md:border-border/50 rounded-none md:rounded-3xl overflow-hidden shadow-2xl relative",
                    !activeConversationId ? "hidden md:flex" : "flex"
                )}>
                    {activeConversationId ? (
                        <>
                            <div className="bg-amber-50/80 border-b border-amber-200/50 px-4 py-1.5 flex items-center justify-center text-[10px] font-bold text-amber-800 text-center">
                                <ShieldCheck className="w-3 h-3 mr-1.5" />
                                {isZh
                                    ? '安全提示：见面交易请选择公共场所，交易前核实对方身份，谨防诈骗。'
                                    : 'Safety Tip: Meet in public places, verify the other party before dealing, and stay alert for scams.'}
                            </div>
                            <div className="px-4 py-3 border-b border-border/40 bg-gradient-to-r from-muted/5 to-primary/5">
                                <div className="flex items-center justify-between">
                                    {/* Back button for mobile */}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="md:hidden h-9 w-9 rounded-full mr-2 flex-shrink-0"
                                        onClick={() => setActiveConversation(null)}
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                    </Button>

                                    {/* Left: User Info */}
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        {/* Avatar with Role Indicator */}
                                        <div className="relative flex-shrink-0">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border-2 border-primary/10">
                                                {activeConversation?.otherUserAvatar ? (
                                                    <img
                                                        src={activeConversation.otherUserAvatar}
                                                        alt={getDisplayName(activeOtherUserId, activeConversation?.otherUserName)}
                                                        className="w-full h-full rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <UserCircle className="w-6 h-6 text-primary/60" />
                                                )}
                                            </div>
                                            {/* Role Badge */}
                                            {activeOtherUserId === SUPPORT_USER_ID ? (
                                                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary border-2 border-card flex items-center justify-center" title={isZh ? '客服' : 'Support'}>
                                                    <ShieldCheck className="w-3 h-3 text-white" />
                                                </div>
                                            ) : activeOrder && (
                                                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border-2 border-card flex items-center justify-center">
                                                    {currentUser?.id === activeOrder.buyerId ? (
                                                        <div title="Seller">
                                                            <Store className="w-3 h-3 text-amber-600" />
                                                        </div>
                                                    ) : (
                                                        <div title="Buyer">
                                                            <ShoppingBag className="w-3 h-3 text-blue-600" />
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Name and Status */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-sm font-bold tracking-tight truncate">
                                                    {getDisplayName(activeOtherUserId, activeConversation?.otherUserName)}
                                                </h3>
                                                {/* Casual/playful tone (see ai-support-reply/index.ts) shouldn't
                                                    leave it unclear that this is genuinely the platform's own
                                                    support channel — an explicit badge instead of the generic
                                                    1-on-1 indicator every other chat gets. */}
                                                {activeOtherUserId === SUPPORT_USER_ID ? (
                                                    <Badge className="h-4 px-1.5 text-[9px] font-black bg-primary/10 text-primary border-none">
                                                        {isZh ? '客服' : 'Support'}
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="h-4 px-1.5 text-[9px] font-black border-primary/20 text-primary">
                                                        1-ON-1
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <div className="flex items-center gap-1">
                                                    <div className={cn(
                                                        "w-1.5 h-1.5 rounded-full",
                                                        activeOtherUserId && onlineUserIds.has(activeOtherUserId) ? "bg-green-500 animate-pulse" : "bg-gray-300"
                                                    )} />
                                                    <p className="text-[10px] text-muted-foreground font-medium">
                                                        {activeOtherUserId && onlineUserIds.has(activeOtherUserId)
                                                            ? (isZh ? '在线' : 'Online')
                                                            : (isZh ? '离线' : 'Offline')}
                                                    </p>
                                                </div>
                                                {/* Role Text */}
                                                {activeOrder && (
                                                    <>
                                                        <span className="text-muted-foreground">•</span>
                                                        <p className="text-[10px] text-muted-foreground font-medium">
                                                            {currentUser?.id === activeOrder.buyerId ? 'Seller' : 'Buyer'}
                                                        </p>
                                                    </>
                                                )}
                                                {/* Debug: Conversation ID */}
                                                {import.meta.env.VITE_DEBUG_MODE === 'true' && (
                                                    <>
                                                        <span className="text-muted-foreground">•</span>
                                                        <p className="text-[8px] text-muted-foreground/60 font-mono" title="Conversation ID">
                                                            ID: {activeConversationId?.slice(0, 8)}...
                                                        </p>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Actions */}
                                    <div className="flex items-center gap-1">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary/5">
                                                    <MoreVertical className="w-4 h-4 text-muted-foreground" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="rounded-2xl min-w-[160px] p-2">
                                                {activeOtherUserId && activeOtherUserId !== SUPPORT_USER_ID && (
                                                    <DropdownMenuItem onClick={() => handleToggleFollow(activeOtherUserId)} className="gap-2 cursor-pointer rounded-xl py-2.5 font-bold text-sm">
                                                        <UserPlus className="w-4 h-4" />
                                                        {followingUserIds.includes(activeOtherUserId) ? (isZh ? '取消关注' : 'Unfollow') : (isZh ? '关注' : 'Follow')}
                                                    </DropdownMenuItem>
                                                )}
                                                {activeConversationId && (
                                                    <DropdownMenuItem
                                                        onClick={() => handleToggleArchive(activeConversationId, !!activeConversation?.archivedFor?.includes(currentUser?.id || ''))}
                                                        className="gap-2 cursor-pointer rounded-xl py-2.5 font-bold text-sm"
                                                    >
                                                        <Archive className="w-4 h-4" />
                                                        {activeConversation?.archivedFor?.includes(currentUser?.id || '') ? (isZh ? '取消归档' : 'Unarchive') : (isZh ? '归档' : 'Archive')}
                                                    </DropdownMenuItem>
                                                )}
                                                {activeOtherUserId && (
                                                    <ReportDialog
                                                        targetType="USER"
                                                        targetId={activeOtherUserId}
                                                        trigger={
                                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="gap-2 cursor-pointer rounded-xl py-2.5 font-bold text-sm">
                                                                <Shield className="w-4 h-4" /> {isZh ? '举报' : 'Report'}
                                                            </DropdownMenuItem>
                                                        }
                                                    />
                                                )}
                                                {activeConversationId && (
                                                    <DropdownMenuItem onClick={() => handleDeleteConversation(activeConversationId)} className="gap-2 text-red-500 focus:text-red-500 cursor-pointer rounded-xl py-2.5 font-bold text-sm">
                                                        <Trash2 className="w-4 h-4" /> {isZh ? '删除' : 'Delete'}
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem onClick={() => handleBlockUser()} className="gap-2 text-red-500 focus:text-red-500 cursor-pointer rounded-xl py-2.5 font-bold text-sm">
                                                    <UserX className="w-4 h-4" /> {isZh ? '拉黑' : 'Block'}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            </div>

                            {/* Enhanced Order Context Card */}
                            {activeOrder && (
                                <div className="px-4 py-3 bg-gradient-to-r from-amber-50/50 to-orange-50/50 border-b border-amber-200/30">
                                    <div className="flex items-center justify-between gap-3">
                                        {/* Left: Order Info */}
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            {/* Order Image */}
                                            <div className="w-12 h-12 rounded-xl bg-white overflow-hidden border-2 border-amber-200/50 shadow-sm flex-shrink-0">
                                                <img
                                                    src={activeOrder.snapshot.masterImages[0]}
                                                    className="w-full h-full object-cover"
                                                    alt={activeOrder.snapshot.masterTitle}
                                                />
                                            </div>

                                            {/* Order Details */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Badge className="h-5 px-2 text-[10px] font-black bg-amber-600 hover:bg-amber-700">
                                                        <Package className="w-3 h-3 mr-1" />
                                                        ORDER CHAT
                                                    </Badge>
                                                </div>
                                                <p className="text-sm font-bold text-foreground truncate mb-0.5">
                                                    {activeOrder.snapshot.masterTitle}
                                                </p>
                                                <div className="flex items-center gap-2 text-[11px]">
                                                    <Badge
                                                        variant={activeOrder.status === 'COMPLETED' ? 'default' : 'secondary'}
                                                        className="h-4 text-[9px]"
                                                    >
                                                        {activeOrder.status.replace('_', ' ')}
                                                    </Badge>
                                                    <span className="text-muted-foreground">•</span>
                                                    <span className="font-semibold text-primary">
                                                        {activeOrder.pricing.total.formatted}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right: View Details */}
                                        <Link
                                            to={`/orders/${activeOrder.id}`}
                                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white hover:bg-amber-50 border border-amber-200/50 transition-colors"
                                        >
                                            <span className="text-[11px] font-bold text-amber-700">Details</span>
                                            <ChevronRight className="w-3.5 h-3.5 text-amber-600" />
                                        </Link>
                                    </div>
                                </div>
                            )}

                            {/* Messages List */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-chat-pattern">
                                {visibleMessages.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-10 opacity-50">
                                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                            <Hash className="w-8 h-8 text-muted-foreground" />
                                        </div>
                                        <h4 className="text-sm font-bold">End-to-end encrypted</h4>
                                        <p className="text-xs max-w-xs mt-2">Messages are secure. Start your neighborhood conversation now.</p>
                                    </div>
                                ) : (
                                    visibleMessages.map((msg, idx) => {
                                        const isMe = msg.senderId === currentUser?.id;
                                        const isSystem = msg.messageType === 'SYSTEM';
                                        const isQuote = msg.messageType === 'QUOTE';
                                        const isImage = msg.messageType === 'IMAGE';
                                        const isLocation = msg.messageType === 'LOCATION';
                                        const avatarUrl = isMe ? currentUser?.avatar : activeConversation?.otherUserAvatar;
                                        const avatarInitial = (isMe ? (currentUser?.name || 'U') : getDisplayName(activeOtherUserId, activeConversation?.otherUserName)).charAt(0).toUpperCase();

                                        // Show date separator
                                        const showDateSeparator = idx === 0 ||
                                            new Date(visibleMessages[idx - 1].createdAt).toDateString() !== new Date(msg.createdAt).toDateString();

                                        const dateLabel = (() => {
                                            const msgDate = new Date(msg.createdAt);
                                            const today = new Date();
                                            const yesterday = new Date(today);
                                            yesterday.setDate(yesterday.getDate() - 1);

                                            if (msgDate.toDateString() === today.toDateString()) return 'Today';
                                            if (msgDate.toDateString() === yesterday.toDateString()) return 'Yesterday';
                                            return msgDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
                                        })();

                                        return (
                                            <div key={msg.id}>
                                                {/* Date Separator */}
                                                {showDateSeparator && (
                                                    <div className="flex justify-center my-6">
                                                        <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-[10px] font-bold text-muted-foreground border border-border/30 px-3 py-1">
                                                            {dateLabel}
                                                        </Badge>
                                                    </div>
                                                )}

                                                {/* System Message */}
                                                {isSystem ? (
                                                    <div className="flex justify-center my-4">
                                                        <Badge variant="secondary" className="bg-muted/50 text-[10px] font-medium text-muted-foreground border-none">
                                                            {msg.content}
                                                        </Badge>
                                                    </div>
                                                ) : msg.isRecalled ? (
                                                    /* Recalled Message */
                                                    <div className="flex justify-center my-4">
                                                        <Badge variant="secondary" className="bg-muted/50 text-[10px] font-medium text-muted-foreground border-none">
                                                            {isMe
                                                                ? (isZh ? '你撤回了一条消息' : 'You recalled a message')
                                                                : (isZh ? '对方撤回了一条消息' : 'The other person recalled a message')}
                                                        </Badge>
                                                    </div>
                                                ) : (
                                                    /* Regular Message */
                                                    <div className={cn("flex items-end gap-2 mb-3", isMe ? 'flex-row-reverse' : 'flex-row')}>
                                                        {/* Avatar */}
                                                        <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-primary/10 to-primary/20 border border-primary/10 mb-4">
                                                            {avatarUrl ? (
                                                                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-primary/70">
                                                                    {avatarInitial}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className={cn(
                                                            "max-w-[78%] sm:max-w-[65%] group relative",
                                                        )}>
                                                            <div className={cn(
                                                                "px-3 py-2 rounded-2xl shadow-sm text-sm",
                                                                isMe
                                                                    ? 'bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground rounded-tr-none'
                                                                    : 'bg-white border border-border/50 text-foreground rounded-tl-none',
                                                                isQuote && 'bg-orange-50 border-orange-200 text-orange-950 rounded-2xl'
                                                            )}>
                                                                {msg.metadata?.quotedMessageId && (
                                                                    <div className={cn(
                                                                        "mb-1.5 px-2 py-1 rounded-lg text-[11px] border-l-2 overflow-hidden",
                                                                        isMe ? "bg-white/10 border-white/40" : "bg-muted/50 border-primary/30"
                                                                    )}>
                                                                        <p className="font-bold opacity-80 truncate">
                                                                            {msg.metadata.quotedSenderId === currentUser?.id
                                                                                ? (isZh ? '我' : 'Me')
                                                                                : getDisplayName(activeOtherUserId, activeConversation?.otherUserName)}
                                                                        </p>
                                                                        <p className="opacity-70 truncate">{msg.metadata.quotedContent}</p>
                                                                    </div>
                                                                )}
                                                                {isQuote ? (
                                                                    <div className="space-y-2">
                                                                        <div className="flex items-center gap-2 border-b border-orange-200 pb-1.5 mb-1.5">
                                                                            <DollarSign className="w-4 h-4 text-orange-600" />
                                                                            <span className="font-bold text-base">Custom Quote</span>
                                                                        </div>
                                                                        <div className="bg-white/50 p-2 rounded-lg border border-orange-200">
                                                                            <p className="text-lg font-black text-orange-600">${(msg.metadata?.amount / 100).toFixed(2)}</p>
                                                                            <p className="text-[10px] text-orange-800 opacity-70 italic">{msg.metadata?.description || 'Service price adjustment'}</p>
                                                                        </div>
                                                                        {!isMe && (
                                                                            <Button size="sm" className="w-full h-8 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg text-xs" onClick={() => navigate(`/orders/${msg.metadata?.orderId}`)}>
                                                                                Review & Approve
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                ) : isImage ? (
                                                                    <div className="space-y-1">
                                                                        <img
                                                                            src={msg.metadata?.imageUrl || msg.content}
                                                                            alt="Shared image"
                                                                            className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                                                            onClick={() => window.open(msg.metadata?.imageUrl || msg.content, '_blank')}
                                                                            loading="lazy"
                                                                        />
                                                                    </div>
                                                                ) : isLocation ? (
                                                                    <div className="space-y-2 min-w-[200px]">
                                                                        <div className="flex items-center gap-2">
                                                                            <MapPin className="w-4 h-4" />
                                                                            <span className="font-bold text-xs">位置分享</span>
                                                                        </div>
                                                                        {msg.metadata?.lat && msg.metadata?.lng && (
                                                                            <a
                                                                                href={`https://www.google.com/maps/search/?api=1&query=${msg.metadata.lat},${msg.metadata.lng}`}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="block"
                                                                            >
                                                                                <img
                                                                                    src={`https://staticmap.openstreetmap.de/staticmap.php?center=${msg.metadata.lat},${msg.metadata.lng}&zoom=14&size=280x120&markers=${msg.metadata.lat},${msg.metadata.lng},red-pushpin`}
                                                                                    alt="Location map"
                                                                                    className="w-full rounded-lg border border-border/30 hover:border-primary/50 transition-colors cursor-pointer"
                                                                                    loading="lazy"
                                                                                />
                                                                            </a>
                                                                        )}
                                                                        <p className="text-xs opacity-90">
                                                                            {msg.metadata?.address || msg.content}
                                                                        </p>
                                                                        {msg.metadata?.lat && msg.metadata?.lng && (
                                                                            <a
                                                                                href={`https://www.google.com/maps/search/?api=1&query=${msg.metadata.lat},${msg.metadata.lng}`}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                                                                            >
                                                                                在地图中查看 <ChevronRight className="w-3 h-3" />
                                                                            </a>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                                                )}
                                                                {translatingIds.has(msg.id) && (
                                                                    <div className="flex items-center gap-1.5 mt-1.5 pt-1.5 border-t border-current/10 opacity-60">
                                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                                        <span className="text-[10px]">{isZh ? '翻译中...' : 'Translating...'}</span>
                                                                    </div>
                                                                )}
                                                                {translations[msg.id] && (
                                                                    <p className="mt-1.5 pt-1.5 border-t border-current/10 text-xs leading-relaxed whitespace-pre-wrap opacity-80">
                                                                        {translations[msg.id]}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <div className={cn(
                                                                "flex items-center gap-1.5 mt-1 px-1",
                                                                isMe ? 'flex-row-reverse' : 'flex-row'
                                                            )}>
                                                                <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter opacity-50">
                                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                                {isMe && (
                                                                    <div className="flex items-center" title={msg.isRead ? "Read" : "Delivered"}>
                                                                        <CheckCheck
                                                                            className={cn(
                                                                                "w-3.5 h-3.5 transition-colors",
                                                                                msg.isRead ? "text-blue-500" : "text-muted-foreground/50"
                                                                            )}
                                                                        />
                                                                    </div>
                                                                )}
                                                                {/* Message actions — always visible (not hover-only):
                                                                    this page runs inside a touch-only WeChat Mini
                                                                    Program web-view with no mouse, where a hover-reveal
                                                                    control would be unreachable. Sits inline with the
                                                                    timestamp rather than floating beside the bubble, so
                                                                    it never risks clipping off a narrow phone screen. */}
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <button className="w-4 h-4 rounded-full hover:bg-muted flex items-center justify-center">
                                                                            <MoreVertical className="w-3 h-3 text-muted-foreground/60" />
                                                                        </button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align={isMe ? "end" : "start"} className="rounded-xl min-w-[110px] p-1">
                                                                        {!isImage && (
                                                                            <DropdownMenuItem onClick={() => handleCopyMessage(msg)} className="gap-2 cursor-pointer rounded-lg py-2 text-xs font-bold">
                                                                                <Copy className="w-3.5 h-3.5" /> {isZh ? '复制' : 'Copy'}
                                                                            </DropdownMenuItem>
                                                                        )}
                                                                        <DropdownMenuItem onClick={() => setReplyingTo(msg)} className="gap-2 cursor-pointer rounded-lg py-2 text-xs font-bold">
                                                                            <Reply className="w-3.5 h-3.5" /> {isZh ? '引用' : 'Reply'}
                                                                        </DropdownMenuItem>
                                                                        {!isImage && (
                                                                            <DropdownMenuItem onClick={() => handleTranslateMessage(msg)} className="gap-2 cursor-pointer rounded-lg py-2 text-xs font-bold">
                                                                                <Languages className="w-3.5 h-3.5" /> {translations[msg.id] ? (isZh ? '隐藏翻译' : 'Hide Translation') : (isZh ? '翻译' : 'Translate')}
                                                                            </DropdownMenuItem>
                                                                        )}
                                                                        {canRecall(msg) && (
                                                                            <DropdownMenuItem onClick={() => handleRecallMessage(msg.id)} className="gap-2 cursor-pointer rounded-lg py-2 text-xs font-bold">
                                                                                <Undo2 className="w-3.5 h-3.5" /> {isZh ? '撤回' : 'Recall'}
                                                                            </DropdownMenuItem>
                                                                        )}
                                                                        <DropdownMenuItem onClick={() => handleDeleteMessage(msg.id)} className="gap-2 cursor-pointer rounded-lg py-2 text-xs font-bold text-red-500 focus:text-red-500">
                                                                            <Trash2 className="w-3.5 h-3.5" /> {isZh ? '删除' : 'Delete'}
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Ultra Slim Input Area - with safe area for mobile bottom nav */}
                            <div className="p-3 pb-20 md:pb-3 bg-muted/5 border-t border-border/40">
                                <div className="flex flex-col gap-2">
                                    {/* Reply preview (引用) */}
                                    {replyingTo && (
                                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/40 border-l-2 border-primary/40">
                                            <Reply className="w-3.5 h-3.5 text-primary/70 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] font-bold text-primary/80 truncate">
                                                    {replyingTo.senderId === currentUser?.id
                                                        ? (isZh ? '回复我自己' : 'Replying to yourself')
                                                        : (isZh ? `回复 ${getDisplayName(activeOtherUserId, activeConversation?.otherUserName)}` : `Replying to ${getDisplayName(activeOtherUserId, activeConversation?.otherUserName)}`)}
                                                </p>
                                                <p className="text-xs text-muted-foreground truncate">{getReplyPreviewText(replyingTo)}</p>
                                            </div>
                                            <button
                                                onClick={() => setReplyingTo(null)}
                                                className="w-5 h-5 rounded-full hover:bg-muted flex items-center justify-center flex-shrink-0"
                                            >
                                                <X className="w-3.5 h-3.5 text-muted-foreground" />
                                            </button>
                                        </div>
                                    )}
                                    {/* Quick Actions Bar - Improved scrolling */}
                                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1 snap-x snap-mandatory">
                                        {/* activeOrder.providerId is provider_profiles.id, not the
                                            provider's auth.users.id — currentUser.id can never equal
                                            it, so this (and the context prop below) always evaluated
                                            as false/buyer for a real provider. Order already carries
                                            providerUserId ("The auth.users.id of the provider") for
                                            exactly this comparison — see jwd_chat_provider_fk_bug_and_ai_support
                                            memory for the same mismatch fixed elsewhere. */}
                                        {activeOrder?.status === 'PENDING_QUOTE' && currentUser?.id === activeOrder.providerUserId && (
                                            <Button variant="outline" size="sm" className="h-6 px-2 rounded-full border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 text-[10px] font-bold" onClick={handleSendQuote}>
                                                <DollarSign className="w-3 h-3 mr-1" /> SEND QUOTE
                                            </Button>
                                        )}
                                        <QuickReplyTemplates
                                            onSelectReply={(text) => setInput(text)}
                                            context={currentUser?.id === activeOrder?.providerUserId ? 'seller' : 'buyer'}
                                        />
                                        <EmojiPicker onEmojiSelect={(emoji) => setInput(prev => prev + emoji)} />
                                        <ImageUpload onImageUploaded={async (url) => {
                                            if (currentUser?.id) {
                                                await sendMessage(currentUser.id, url, 'IMAGE', { imageUrl: url });
                                            }
                                        }} />
                                        <LocationShare onLocationShare={async (location) => {
                                            if (currentUser?.id) {
                                                const locationText = `📍 ${location.address || `${location.lat}, ${location.lng}`}`;
                                                await sendMessage(currentUser.id, locationText, 'LOCATION', {
                                                    lat: location.lat,
                                                    lng: location.lng,
                                                    address: location.address
                                                });
                                            }
                                        }} />
                                    </div>

                                    <div className="flex items-end gap-2 bg-white/80 border border-border/50 p-1.5 rounded-2xl shadow-inner focus-within:ring-2 ring-primary/20 transition-all">
                                        <textarea
                                            value={input}
                                            onChange={(e) => {
                                                setInput(e.target.value);
                                                // Auto-resize textarea
                                                const target = e.target;
                                                target.style.height = 'auto';
                                                target.style.height = Math.min(target.scrollHeight, 128) + 'px';
                                            }}
                                            placeholder="Message..."
                                            className="flex-1 bg-transparent border-none outline-none text-sm resize-none py-1.5 px-2 min-h-[36px] max-h-32 custom-scrollbar"
                                            rows={1}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSendMessage();
                                                    // Reset height after sending
                                                    setTimeout(() => {
                                                        const target = e.target as HTMLTextAreaElement;
                                                        target.style.height = 'auto';
                                                    }, 0);
                                                }
                                            }}
                                        />
                                        <Button
                                            size="icon"
                                            className={cn(
                                                "h-8 w-8 rounded-xl shrink-0 mb-0.5 transition-all duration-200",
                                                input.trim()
                                                    ? "bg-primary shadow-lg scale-100 hover:scale-105"
                                                    : "bg-muted/50 shadow-sm scale-95 opacity-50"
                                            )}
                                            onClick={handleSendMessage}
                                            disabled={!input.trim()}
                                        >
                                            <Send className={cn(
                                                "w-4 h-4 transition-all",
                                                input.trim() ? "translate-x-0" : "-translate-x-0.5"
                                            )} />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-transparent to-muted/10 p-12">
                            <div className="relative mb-8">
                                <div className="w-24 h-24 rounded-full bg-primary/5 flex items-center justify-center animate-pulse">
                                    <MessageCircle className="w-12 h-12 text-primary/30" />
                                </div>
                                <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center backdrop-blur-sm border border-white/50">
                                    <Hash className="w-5 h-5 text-secondary" />
                                </div>
                            </div>
                            <h2 className="text-xl font-black tracking-tighter mb-2">Neighborhood Chat</h2>
                            <p className="text-sm text-muted-foreground text-center max-w-sm leading-relaxed">
                                Connect with your neighbors in Kanata Lakes. Select a conversation to start chatting about services or rentals.
                            </p>
                            {!currentUser ? (
                                <Button className="rounded-2xl mt-8" onClick={goLogin}>
                                    {isZh ? '去登录' : 'Log In'}
                                </Button>
                            ) : (
                            <div className="flex gap-3 mt-8">
                                <Button
                                    className="rounded-2xl gap-2"
                                    onClick={() => setShowStartDialog(true)}
                                >
                                    <MessageCircle className="w-4 h-4" />
                                    Start New Chat
                                </Button>
                                <Button
                                    variant="outline"
                                    className="rounded-2xl border-primary/20 text-primary hover:bg-primary/5"
                                    onClick={() => navigate('/orders')}
                                >
                                    View Your Orders
                                </Button>
                            </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Start Conversation Dialog */}
            <StartConversationDialog
                open={showStartDialog}
                onOpenChange={setShowStartDialog}
            />
        </div>
    );
};

export default Chat;
