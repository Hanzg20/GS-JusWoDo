import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Package, Clock, CheckCircle, XCircle, AlertCircle, ChevronRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useOrderStore } from "@/stores/orderStore";
import { useAuthStore } from "@/stores/authStore";
import { OrderStatus } from "@/types/orders";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { SellerQuoteModal } from "@/components/checkout/SellerQuoteModal";
import { useMessageStore } from "@/stores/messageStore";
import { Order } from "@/types/orders";
import { PAYMENTS_ENABLED } from "@/config/launchFlags";

const Orders = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const paymentStatus = searchParams.get('payment');
    const { currentUser } = useAuthStore();
    const { orders, updateOrderStatus, updateOrder, loadUserOrders, subscribeToOrders, unsubscribeFromOrders } = useOrderStore();
    const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'completed'>('all');
    const [viewMode, setViewMode] = useState<'buyer' | 'seller'>('buyer');

    // Seller Quote Flow
    const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
    const [selectedOrderForQuote, setSelectedOrderForQuote] = useState<Order | null>(null);
    const sendQuoteMessage = useMessageStore(state => state.sendQuote);

    useEffect(() => {
        if (currentUser?.id) {
            loadUserOrders(currentUser.id);
            subscribeToOrders(currentUser.id);
        }
        return () => {
            unsubscribeFromOrders();
        };
    }, [currentUser?.id, loadUserOrders, subscribeToOrders, unsubscribeFromOrders]);

    const userOrders = orders.filter(o =>
        viewMode === 'buyer' ? o.buyerId === currentUser?.id : o.providerId === currentUser?.id
    );

    useEffect(() => {
        if (!currentUser) {
            navigate('/login');
            return;
        }

        if (paymentStatus === 'success') {
            toast.success('Payment Successful! Your order is being processed.', {
                duration: 5000,
                icon: <CheckCircle className="w-5 h-5 text-green-500" />
            });
            window.history.replaceState({}, '', '/orders');
            setActiveTab('pending');
        } else if (paymentStatus === 'cancelled') {
            toast.info('Payment cancelled.');
            window.history.replaceState({}, '', '/orders');
        }
    }, [currentUser, navigate, paymentStatus]);

    if (!currentUser) {
        return null; // Don't render anything while waiting for the effect
    }

    const filteredOrders = userOrders.filter(order => {
        if (activeTab === 'pending') return ['PENDING_PAYMENT', 'PENDING_CONFIRMATION', 'IN_PROGRESS'].includes(order.status);
        if (activeTab === 'completed') return ['COMPLETED', 'CANCELLED'].includes(order.status);
        return true;
    });

    const getStatusConfig = (status: OrderStatus) => {
        switch (status) {
            case 'PENDING_PAYMENT':
                return { icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50', label: '待支付' };
            case 'PENDING_CONFIRMATION':
                return { icon: AlertCircle, color: 'text-blue-500', bg: 'bg-blue-50', label: '待确认' };
            case 'PENDING_QUOTE':
                return { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50', label: '待报价' };
            case 'WAITING_FOR_PRICE_APPROVAL':
                return { icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50', label: '待确认价格' };
            case 'IN_PROGRESS':
                return { icon: Package, color: 'text-purple-500', bg: 'bg-purple-50', label: '进行中' };
            case 'COMPLETED':
                return { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50', label: '已完成' };
            case 'CANCELLED':
                return { icon: XCircle, color: 'text-gray-500', bg: 'bg-gray-50', label: '已取消' };
            case 'PENDING_DEPOSIT':
                return { icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50', label: '待付押金' };
            default:
                return { icon: Package, color: 'text-gray-500', bg: 'bg-gray-50', label: status };
        }
    };

    const handlePayOrder = async (orderId: string) => {
        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        // Payments/escrow are deferred to v2 (see src/config/launchFlags.ts) —
        // confirm the order and let the two sides settle payment off-platform
        // instead of collecting through Stripe.
        if (!PAYMENTS_ENABLED) {
            await updateOrderStatus(orderId, 'IN_PROGRESS');
            toast.success(
                order.pricing.total.amount > 0
                    ? `Confirmed — please arrange payment (${order.pricing.total.formatted}) directly with them.`
                    : 'Confirmed!'
            );
            return;
        }

        // If it's a paid order (amount > 0), trigger Stripe
        if (order.pricing.total.amount > 0) {
            console.log('[🔵 Orders] Initiating payment for order:', orderId);
            const { data, error } = await supabase.functions.invoke('create-checkout-session', {
                headers: {
                    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                },
                body: {
                    orderType: 'WEB_ORDER',
                    orderId: order.id,
                    listingItemId: order.itemId,
                    masterId: order.masterId,
                    buyerId: currentUser?.id,
                    productName: order.snapshot.itemName || 'Service Order',
                    price: order.pricing.total.amount,
                    metadata: {
                        rentalStart: order.rentalStartDate || '',
                        rentalEnd: order.rentalEndDate || '',
                        rentalDays: (order.rentalDays || '').toString(),
                        depositAmount: order.depositAmount || 0,
                        serviceCallFee: order.serviceCallFee || 0
                    }
                }
            });

            if (error || !data?.url) {
                console.error('Stripe session error:', error);
                toast.error('Payment system unavailable');
                return;
            }

            // Redirect to Stripe
            window.location.href = data.url;
        } else {
            // Free or negotiable order without price - just confirm (unlikely in this flow)
            updateOrderStatus(orderId, 'PENDING_CONFIRMATION');
        }
    };

    // Seller actions
    const acceptOrder = async (orderId: string) => {
        await updateOrderStatus(orderId, 'IN_PROGRESS');
    };

    const handleQuoteSubmit = async (orderId: string) => {
        const order = orders.find(o => o.id === orderId);
        if (order) {
            setSelectedOrderForQuote(order);
            setIsQuoteModalOpen(true);
        }
    };

    const onQuoteSuccess = async (amount: number, notes: string) => {
        if (!selectedOrderForQuote || !currentUser) return;

        const orderId = selectedOrderForQuote.id;

        // 1. Update order status
        await updateOrderStatus(orderId, 'WAITING_FOR_PRICE_APPROVAL', {
            quoteAmount: amount,
            sellerNotes: notes
        });

        // 2. Send automated message to buyer
        try {
            await sendQuoteMessage(
                currentUser.id,
                orderId,
                amount,
                notes
            );
        } catch (msgError) {
            console.error('Failed to send quote message:', msgError);
            // Non-critical, but maybe toast?
        }
    };

    const completeOrder = async (orderId: string) => {
        await updateOrderStatus(orderId, 'COMPLETED');
    };

    const handleAcceptQuote = async (orderId: string) => {
        const order = orders.find(o => o.id === orderId);
        if (!order || !order.metadata?.quoteAmount) {
            toast.error("Invalid quote data");
            return;
        }

        const quoteAmount = order.metadata.quoteAmount;

        // 1. Update order status and pricing (Optimistic local update will be handled by store)
        try {
            await updateOrder(orderId, {
                status: 'PENDING_PAYMENT',
                pricing: {
                    ...order.pricing,
                    baseAmount: {
                        ...order.pricing.baseAmount,
                        amount: quoteAmount,
                        formatted: `$${(quoteAmount / 100).toFixed(2)}`
                    },
                    total: {
                        ...order.pricing.total,
                        amount: quoteAmount,
                        formatted: `$${(quoteAmount / 100).toFixed(2)}`
                    }
                }
            });

            // 2. Refresh orders to ensure we have the latest state before payment
            if (currentUser) {
                await loadUserOrders(currentUser.id);
            }

            // 3. Trigger payment flow
            handlePayOrder(orderId);
        } catch (error) {
            console.error('Failed to accept quote:', error);
            toast.error("Failed to accept quote");
        }
    };

    const handleRejectQuote = async (orderId: string) => {
        if (window.confirm('Are you sure you want to reject this quote?')) {
            await updateOrderStatus(orderId, 'CANCELLED');
            toast.info("Quote rejected");
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <div className="container max-w-4xl py-8 px-4">
                <h1 className="text-3xl font-extrabold mb-6">My Orders</h1>

                {/* View Mode Toggle */}
                <div className="flex gap-4 mb-4">
                    <button
                        onClick={() => setViewMode('buyer')}
                        className={`pb-2 px-4 font-semibold ${viewMode === 'buyer' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
                    >
                        I'm Buying
                    </button>
                    <button
                        onClick={() => setViewMode('seller')}
                        className={`pb-2 px-4 font-semibold ${viewMode === 'seller' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
                    >
                        I'm Selling
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-6 border-b border-border">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`pb-3 px-4 font-semibold transition-colors ${activeTab === 'all'
                            ? 'text-primary border-b-2 border-primary'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        全部 ({userOrders.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`pb-3 px-4 font-semibold transition-colors ${activeTab === 'pending'
                            ? 'text-primary border-b-2 border-primary'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        进行中
                    </button>
                    <button
                        onClick={() => setActiveTab('completed')}
                        className={`pb-3 px-4 font-semibold transition-colors ${activeTab === 'completed'
                            ? 'text-primary border-b-2 border-primary'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        已完成
                    </button>
                </div>

                {/* Order List */}
                {filteredOrders.length === 0 ? (
                    <div className="text-center py-20">
                        <Package className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                        <p className="text-muted-foreground">暂无订单</p>
                        <Button
                            onClick={() => navigate('/')}
                            className="mt-4 btn-action"
                        >
                            去逛逛
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredOrders.map((order) => {
                            const statusConfig = getStatusConfig(order.status);
                            const StatusIcon = statusConfig.icon;

                            return (
                                <div
                                    key={order.id}
                                    className="card-warm p-6 hover:shadow-lg transition-shadow cursor-pointer"
                                    onClick={() => navigate(`/orders/${order.id}`)}
                                >
                                    {/* Header */}
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className={`p-2 rounded-full ${statusConfig.bg}`}>
                                                <StatusIcon className={`w-5 h-5 ${statusConfig.color}`} />
                                            </div>
                                            <span className={`font-semibold ${statusConfig.color}`}>
                                                {statusConfig.label}
                                            </span>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                    </div>

                                    {/* Order Content */}
                                    <div className="flex gap-4">
                                        <img
                                            src={order.snapshot.masterImages[0]}
                                            alt={order.snapshot.masterTitle}
                                            className="w-24 h-24 rounded-xl object-cover"
                                        />
                                        <div className="flex-1">
                                            <h3 className="font-bold text-lg mb-1">
                                                {order.snapshot.masterTitle}
                                            </h3>
                                            <p className="text-sm text-muted-foreground mb-2">
                                                {order.snapshot.itemName}
                                            </p>
                                            {/* Web Ordering Info */}
                                            <div className="flex flex-wrap gap-2 mb-2">
                                                {order.rentalStartDate && (
                                                    <Badge variant="outline" className="text-[10px] border-blue-100 bg-blue-50 text-blue-600">
                                                        {new Date(order.rentalStartDate).toLocaleDateString()} - {order.rentalEndDate ? new Date(order.rentalEndDate).toLocaleDateString() : '?'}
                                                    </Badge>
                                                )}
                                                {order.serviceCallFee ? (
                                                    <Badge variant="outline" className="text-[10px] border-orange-100 bg-orange-50 text-orange-600">
                                                        Booking Fee: ${order.serviceCallFee / 100}
                                                    </Badge>
                                                ) : null}
                                                {order.depositAmount ? (
                                                    <Badge variant="outline" className="text-[10px] border-amber-100 bg-amber-50 text-amber-600">
                                                        Deposit: ${order.depositAmount / 100} ({order.depositStatus})
                                                    </Badge>
                                                ) : null}
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs text-muted-foreground">
                                                    下单时间: {new Date(order.createdAt).toLocaleDateString('zh-CN')}
                                                </p>
                                                <p className="text-xl font-bold text-primary">
                                                    {order.pricing.total.formatted}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Buyer Actions */}
                                    {viewMode === 'buyer' && order.status === 'PENDING_PAYMENT' && (
                                        <div className="mt-4 pt-4 border-t border-border flex gap-2 justify-end">
                                            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); updateOrderStatus(order.id, 'CANCELLED'); }}>Cancel</Button>
                                            <Button size="sm" className="btn-action" onClick={(e) => { e.stopPropagation(); handlePayOrder(order.id); }}>{PAYMENTS_ENABLED ? 'Pay Now' : 'Confirm'}</Button>
                                        </div>
                                    )}
                                    {viewMode === 'buyer' && order.status === 'IN_PROGRESS' && (
                                        <div className="mt-4 pt-4 border-t border-border flex gap-2 justify-end">
                                            <Button size="sm" className="btn-action" onClick={(e) => { e.stopPropagation(); completeOrder(order.id); }}>Confirm Complete</Button>
                                        </div>
                                    )}

                                    {viewMode === 'buyer' && order.status === 'WAITING_FOR_PRICE_APPROVAL' && (
                                        <div className="mt-4 pt-4 border-t border-border flex gap-2 justify-end">
                                            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleRejectQuote(order.id); }}>Reject</Button>
                                            <Button size="sm" className="btn-action bg-blue-600 hover:bg-blue-700" onClick={(e) => { e.stopPropagation(); handleAcceptQuote(order.id); }}>{PAYMENTS_ENABLED ? 'Accept & Pay' : 'Accept Quote'}</Button>
                                        </div>
                                    )}

                                    {/* Seller Actions */}
                                    {viewMode === 'seller' && order.status === 'PENDING_CONFIRMATION' && (
                                        <div className="mt-4 pt-4 border-t border-border flex gap-2 justify-end">
                                            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); updateOrderStatus(order.id, 'CANCELLED'); }}>Reject</Button>
                                            <Button size="sm" className="btn-action" onClick={(e) => { e.stopPropagation(); acceptOrder(order.id); }}>Accept Order</Button>
                                        </div>
                                    )}
                                    {viewMode === 'seller' && order.status === 'PENDING_QUOTE' && (
                                        <div className="mt-4 pt-4 border-t border-border flex gap-2 justify-end">
                                            <Button size="sm" className="btn-action" onClick={(e) => { e.stopPropagation(); handleQuoteSubmit(order.id); }}>Submit Quote</Button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <Footer />

            <SellerQuoteModal
                isOpen={isQuoteModalOpen}
                onClose={() => setIsQuoteModalOpen(false)}
                order={selectedOrderForQuote}
                onSuccess={onQuoteSuccess}
            />
        </div>
    );
};

export default Orders;
