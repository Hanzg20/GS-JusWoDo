import { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "@/components/Header";
import { Search, MoreVertical, Phone, Video, Image, Mic, Send, MessageCircle, DollarSign, Package, CheckCircle2, Clock, ChevronRight, Hash, Loader2, User, ShoppingBag, Store, UserCircle, Check, CheckCheck, ArrowLeft, MapPin, ShieldCheck } from "lucide-react";
import { useMessageStore } from "@/stores/messageStore";
import { useAuthStore } from "@/stores/authStore";
import { useOrderStore } from "@/stores/orderStore";
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

const Chat = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuthStore();
    const {
        conversations,
        messages,
        activeConversationId,
        isLoading,
        loadConversations,
        setActiveConversation,
        sendMessage,
        sendQuote,
        cleanup
    } = useMessageStore();
    const { orders } = useOrderStore();

    const [input, setInput] = useState("");
    const [showStartDialog, setShowStartDialog] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const notificationService = useRef<MessageNotificationService | null>(null);

    // Initialize notification service
    useEffect(() => {
        notificationService.current = MessageNotificationService.getInstance();
        notificationService.current.loadOptions();
    }, []);

    // Integrate message read status sync
    useMessageReadStatus(activeConversationId, currentUser?.id || '');

    // Load conversations on mount
    useEffect(() => {
        if (currentUser?.id) {
            loadConversations(currentUser.id);
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

    const handleSendMessage = async () => {
        if (!input.trim() || !currentUser?.id) return;

        // Haptic feedback on mobile
        if ('vibrate' in navigator) {
            navigator.vibrate(10);
        }

        await sendMessage(currentUser.id, input);
        setInput("");
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

    if (!currentUser) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <Header />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <MessageCircle className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                        <p className="text-muted-foreground mb-4">Please login to view messages</p>
                        <Button onClick={() => navigate('/login')} className="rounded-xl">
                            Login
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

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
                            <h2 className="font-bold text-lg tracking-tight">Messages</h2>
                            <Badge variant="secondary" className="bg-primary/10 text-primary border-none">
                                {conversations.reduce((acc, curr) => acc + (curr.unreadCount || 0), 0)} New
                            </Badge>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-muted/50 border-none outline-none text-xs"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {isLoading && conversations.length === 0 ? (
                            <div className="p-8 text-center text-xs text-muted-foreground animate-pulse">Loading conversations...</div>
                        ) : conversations.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">
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
                            </div>
                        ) : (
                            conversations.map(conv => (
                                <button
                                    key={`sidebar-conv-${conv.id}`}
                                    onClick={() => setActiveConversation(conv.id)}
                                    className={cn(
                                        "w-full px-4 py-3 flex items-center gap-3 transition-all relative group",
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
                                                    alt={conv.otherUserName}
                                                    className="w-full h-full rounded-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-sm font-black text-primary/80">
                                                    {(conv.otherUserName || 'U').charAt(0).toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                        {conv.unreadCount && conv.unreadCount > 0 && (
                                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-card">
                                                {conv.unreadCount}
                                            </div>
                                        )}
                                        {/* 1-on-1 indicator */}
                                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-500 rounded-full border-2 border-card flex items-center justify-center">
                                            <User className="w-2.5 h-2.5 text-white" />
                                        </div>
                                    </div>
                                    <div className="flex-1 text-left overflow-hidden">
                                        <div className="flex justify-between items-baseline mb-0.5">
                                            <span className={cn(
                                                "text-sm font-semibold truncate",
                                                activeConversationId === conv.id ? 'text-primary' : 'text-foreground'
                                            )}>
                                                {conv.otherUserName || 'User'}
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
                                                {conv.lastMessagePreview || 'New message'}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))
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
                                {currentUser?.settings?.language === 'zh'
                                    ? '安全提示：为了您的资金安全，请勿脱离平台进行交易。私下转账无法享受平台担保。'
                                    : 'Safety Tip: Keep payments inside the app to be protected by Escrow. Never transfer money externally.'}
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
                                                        alt={activeConversation.otherUserName}
                                                        className="w-full h-full rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <UserCircle className="w-6 h-6 text-primary/60" />
                                                )}
                                            </div>
                                            {/* Role Badge */}
                                            {activeOrder && (
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
                                                    {activeConversation?.otherUserName || 'User'}
                                                </h3>
                                                {/* 1-on-1 Chat Indicator */}
                                                <Badge variant="outline" className="h-4 px-1.5 text-[9px] font-black border-primary/20 text-primary">
                                                    1-ON-1
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <div className="flex items-center gap-1">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                                    <p className="text-[10px] text-muted-foreground font-medium">Online</p>
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
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary/5">
                                            <Phone className="w-4 h-4 text-muted-foreground" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary/5">
                                            <MoreVertical className="w-4 h-4 text-muted-foreground" />
                                        </Button>
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
                                {messages.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-10 opacity-50">
                                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                            <Hash className="w-8 h-8 text-muted-foreground" />
                                        </div>
                                        <h4 className="text-sm font-bold">End-to-end encrypted</h4>
                                        <p className="text-xs max-w-xs mt-2">Messages are secure. Start your neighborhood conversation now.</p>
                                    </div>
                                ) : (
                                    messages.map((msg, idx) => {
                                        const isMe = msg.senderId === currentUser?.id;
                                        const isSystem = msg.messageType === 'SYSTEM';
                                        const isQuote = msg.messageType === 'QUOTE';
                                        const isImage = msg.messageType === 'IMAGE';
                                        const isLocation = msg.messageType === 'LOCATION';

                                        // Show date separator
                                        const showDateSeparator = idx === 0 ||
                                            new Date(messages[idx - 1].createdAt).toDateString() !== new Date(msg.createdAt).toDateString();

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
                                                ) : (
                                                    /* Regular Message */
                                                    <div className={cn("flex flex-col mb-3", isMe ? 'items-end' : 'items-start')}>
                                                        <div className={cn(
                                                            "max-w-[85%] sm:max-w-[70%] group relative",
                                                        )}>
                                                            <div className={cn(
                                                                "px-3 py-2 rounded-2xl shadow-sm text-sm",
                                                                isMe
                                                                    ? 'bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground rounded-tr-none'
                                                                    : 'bg-white border border-border/50 text-foreground rounded-tl-none',
                                                                isQuote && 'bg-orange-50 border-orange-200 text-orange-950 rounded-2xl'
                                                            )}>
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
                                    {/* Quick Actions Bar - Improved scrolling */}
                                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1 snap-x snap-mandatory">
                                        {activeOrder?.status === 'PENDING_QUOTE' && currentUser?.id === activeOrder.providerId && (
                                            <Button variant="outline" size="sm" className="h-6 px-2 rounded-full border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 text-[10px] font-bold" onClick={handleSendQuote}>
                                                <DollarSign className="w-3 h-3 mr-1" /> SEND QUOTE
                                            </Button>
                                        )}
                                        <QuickReplyTemplates
                                            onSelectReply={(text) => setInput(text)}
                                            context={currentUser?.id === activeOrder?.providerId ? 'seller' : 'buyer'}
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
