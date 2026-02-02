import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, MessageCircle, Package, User } from 'lucide-react';
import { useConfigStore } from '@/stores/configStore';
import { useOrderStore } from '@/stores/orderStore';
import { useAuthStore } from '@/stores/authStore';
import { useMessageStore } from '@/stores/messageStore';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface StartConversationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const StartConversationDialog: React.FC<StartConversationDialogProps> = ({
    open,
    onOpenChange
}) => {
    const { language } = useConfigStore();
    const { orders } = useOrderStore();
    const { currentUser } = useAuthStore();
    const { createConversation, setActiveConversation } = useMessageStore();
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const t = language === 'zh' ? {
        title: '开始新对话',
        searchPlaceholder: '搜索用户...',
        recentOrders: '最近订单',
        noOrders: '暂无订单',
        startChat: '开始聊天',
        cancel: '取消',
        buyer: '买家',
        seller: '卖家',
        searching: '搜索中...',
    } : {
        title: 'Start New Conversation',
        searchPlaceholder: 'Search users...',
        recentOrders: 'Recent Orders',
        noOrders: 'No orders yet',
        startChat: 'Start Chat',
        cancel: 'Cancel',
        buyer: 'Buyer',
        seller: 'Seller',
        searching: 'Searching...',
    };

    // Filter orders where user can chat (either buyer or seller)
    const chatableOrders = orders.filter(order => {
        // User is buyer or seller
        const isBuyer = order.buyerId === currentUser?.id;
        const isSeller = order.providerId === currentUser?.id;
        return isBuyer || isSeller;
    }).slice(0, 5); // Show only recent 5

    const handleStartChat = async (order: any) => {
        setLoading(true);
        try {
            const isBuyer = order.buyerId === currentUser?.id;
            let partnerId: string;

            if (isBuyer) {
                // User is buyer, chat with provider
                // Need to get provider's user_id from provider_profiles
                const { data: providerProfile } = await supabase
                    .from('provider_profiles')
                    .select('user_id')
                    .eq('id', order.providerId)
                    .single();

                if (!providerProfile?.user_id) {
                    throw new Error('Provider user not found');
                }
                partnerId = providerProfile.user_id;
            } else {
                // User is seller, chat with buyer
                partnerId = order.buyerId;
            }

            // Create or get conversation
            const conversation = await createConversation(
                currentUser!.id,
                partnerId,
                order.id
            );

            // Set as active conversation
            setActiveConversation(conversation.id);

            toast.success(language === 'zh' ? '对话已开启' : 'Conversation started');
            onOpenChange(false);
        } catch (error: any) {
            console.error('Failed to start conversation:', error);
            toast.error(error.message || 'Failed to start conversation');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MessageCircle className="w-5 h-5" />
                        {t.title}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Search Input (Future: search by username/phone) */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder={t.searchPlaceholder}
                            className="pl-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            disabled
                        />
                        <Badge
                            variant="secondary"
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px]"
                        >
                            Coming Soon
                        </Badge>
                    </div>

                    {/* Recent Orders */}
                    <div>
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            {t.recentOrders}
                        </h4>

                        {chatableOrders.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <Package className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                <p className="text-sm">{t.noOrders}</p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {chatableOrders.map((order) => {
                                    const isBuyer = order.buyerId === currentUser?.id;
                                    const role = isBuyer ? t.seller : t.buyer;

                                    return (
                                        <button
                                            key={order.id}
                                            onClick={() => handleStartChat(order)}
                                            disabled={loading}
                                            className="w-full p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left group"
                                        >
                                            <div className="flex items-start gap-3">
                                                {/* Order Image */}
                                                <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                                                    {order.snapshot?.masterImages?.[0] ? (
                                                        <img
                                                            src={order.snapshot.masterImages[0]}
                                                            alt={order.snapshot.masterTitle}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <Package className="w-6 h-6 text-muted-foreground" />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Order Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2 mb-1">
                                                        <p className="font-medium text-sm line-clamp-1">
                                                            {order.snapshot?.masterTitle || 'Order'}
                                                        </p>
                                                        <Badge
                                                            variant="outline"
                                                            className="text-[10px] whitespace-nowrap"
                                                        >
                                                            {role}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mb-1">
                                                        {order.pricing?.total?.formatted}
                                                    </p>
                                                    <Badge
                                                        variant={order.status === 'COMPLETED' ? 'default' : 'secondary'}
                                                        className="text-[9px]"
                                                    >
                                                        {order.status.replace('_', ' ')}
                                                    </Badge>
                                                </div>

                                                {/* Chat Icon */}
                                                <MessageCircle className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="flex-1"
                        >
                            {t.cancel}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};