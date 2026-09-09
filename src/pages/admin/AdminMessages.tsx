import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { useAuthStore } from "@/stores/authStore";
import { repositoryFactory } from "@/services/repositories/factory";
import { AdminConversation, Message } from "@/services/repositories/interfaces";
import { cn } from "@/lib/utils";
import { Loader2, ShieldAlert } from "lucide-react";

// Minimal, read-only support/dispute tool — not a polished admin panel.
// Bypasses the normal participant-only RLS via the "Admins can view all
// conversations/messages" policies (see
// supabase/migrations/20260908_admin_chat_visibility.sql), gated on
// currentUser.roles containing 'SUPER_ADMIN'. No moderation actions here
// (delete/hide) — just visibility for support/disputes, deliberately.
const AdminMessages = () => {
    const navigate = useNavigate();
    const { currentUser, isLoading: authLoading } = useAuthStore();
    const isAdmin = !!currentUser?.roles?.includes('SUPER_ADMIN');

    const [conversations, setConversations] = useState<AdminConversation[]>([]);
    const [isLoadingConvs, setIsLoadingConvs] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeId, setActiveId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);

    useEffect(() => {
        if (authLoading) return;
        if (!currentUser || !isAdmin) {
            navigate('/');
        }
    }, [authLoading, currentUser, isAdmin, navigate]);

    useEffect(() => {
        if (!isAdmin) return;
        const repo = repositoryFactory.getMessageRepository();
        repo.getAllConversations()
            .then(setConversations)
            .catch(console.error)
            .finally(() => setIsLoadingConvs(false));
    }, [isAdmin]);

    useEffect(() => {
        if (!activeId) return;
        setIsLoadingMessages(true);
        const repo = repositoryFactory.getMessageRepository();
        repo.getMessages(activeId)
            .then(setMessages)
            .catch(console.error)
            .finally(() => setIsLoadingMessages(false));
    }, [activeId]);

    const visibleConversations = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return conversations;
        return conversations.filter(c =>
            (c.participantAName || '').toLowerCase().includes(query) ||
            (c.participantBName || '').toLowerCase().includes(query)
        );
    }, [conversations, searchQuery]);

    const activeConversation = conversations.find(c => c.id === activeId);

    if (authLoading || !currentUser || !isAdmin) return null;

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />
            <div className="flex-1 container max-w-6xl py-4 flex gap-4 h-[calc(100vh-80px)] overflow-hidden">
                <div className="w-72 flex-shrink-0 flex flex-col border rounded-2xl overflow-hidden">
                    <div className="p-3 border-b space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            Admin — all conversations
                        </div>
                        <input
                            type="text"
                            placeholder="Search by name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg bg-muted/50 border-none outline-none text-xs"
                        />
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {isLoadingConvs ? (
                            <div className="p-6 text-center text-xs text-muted-foreground">
                                <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
                                Loading...
                            </div>
                        ) : visibleConversations.length === 0 ? (
                            <div className="p-6 text-center text-xs text-muted-foreground">No conversations</div>
                        ) : (
                            visibleConversations.map(conv => (
                                <button
                                    key={conv.id}
                                    onClick={() => setActiveId(conv.id)}
                                    className={cn(
                                        "w-full px-3 py-2.5 text-left border-b hover:bg-muted/30 transition-colors",
                                        activeId === conv.id && "bg-primary/5"
                                    )}
                                >
                                    <p className="text-xs font-semibold truncate">
                                        {conv.participantAName} ↔ {conv.participantBName}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                                        {conv.lastMessagePreview || 'No messages'}
                                    </p>
                                    <p className="text-[9px] text-muted-foreground/70 mt-0.5">
                                        {new Date(conv.lastMessageAt).toLocaleString()}
                                    </p>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                <div className="flex-1 flex flex-col border rounded-2xl overflow-hidden">
                    {!activeId ? (
                        <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
                            Select a conversation
                        </div>
                    ) : (
                        <>
                            <div className="p-3 border-b text-xs font-semibold">
                                {activeConversation?.participantAName} ↔ {activeConversation?.participantBName}
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {isLoadingMessages ? (
                                    <div className="text-center text-xs text-muted-foreground">
                                        <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                                    </div>
                                ) : (
                                    messages.map(msg => (
                                        <div key={msg.id} className="text-xs">
                                            <div className="flex items-baseline gap-2">
                                                <span className="font-bold">
                                                    {msg.senderId === activeConversation?.participantA
                                                        ? activeConversation?.participantAName
                                                        : activeConversation?.participantBName}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {new Date(msg.createdAt).toLocaleString()}
                                                </span>
                                            </div>
                                            <p className="mt-0.5 text-foreground/90 whitespace-pre-wrap">{msg.content}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminMessages;
