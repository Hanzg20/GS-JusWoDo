import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Package, Calendar, MapPin, MessageCircle, DollarSign, Clock, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useOrderStore } from "@/stores/orderStore";
import { useAuthStore } from "@/stores/authStore";
import { useMessageStore } from "@/stores/messageStore";
import { useConfigStore } from "@/stores/configStore";
import { OrderStatus, Order } from "@/types/orders";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { QuoteDialog } from "@/components/orders/QuoteDialog";
import { PAYMENTS_ENABLED } from "@/config/launchFlags";

const OrderDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuthStore();
    const { language } = useConfigStore();
    const { orders, updateOrderStatus, updateOrder } = useOrderStore();
    const { createConversation } = useMessageStore();
    const [isLoading, setIsLoading] = useState(false);
    const [isQuoteDialogOpen, setIsQuoteDialogOpen] = useState(false);

    const t = {
        back: language === 'zh' ? '返回订单' : 'Back to Orders',
        orderNo: language === 'zh' ? '订单号' : 'Order #',
        orderNotFound: language === 'zh' ? '未找到订单' : 'Order not found',
        quoteSuccess: language === 'zh' ? '报价提交成功' : 'Quote submitted successfully',
        quoteError: language === 'zh' ? '报价提交失败' : 'Failed to submit quote',
        rejectConfirm: language === 'zh' ? '确定要拒绝此订单吗？此操作无法撤销。' : 'Are you sure you want to reject this order? This cannot be undone.',
        rejectSuccess: language === 'zh' ? '订单已拒绝' : 'Order rejected',
        rejectError: language === 'zh' ? '拒绝失败' : 'Failed to reject order',
        workDoneConfirm: language === 'zh' ? '确认工作已完成？' : 'Confirm work is done?',
        completeSuccess: language === 'zh' ? '订单已标记为完成！' : 'Order marked as completed!',
        updateError: language === 'zh' ? '更新状态失败' : 'Failed to update status',
        quoteApproveSuccess: language === 'zh' ? '报价已批准。请继续支付。' : 'Quote approved. Please proceed to payment.',
        quoteApproveError: language === 'zh' ? '批准报价失败' : 'Failed to approve quote',
        payNow: language === 'zh' ? '立即支付' : 'Pay Now',
        payDeposit: language === 'zh' ? '支付押金' : 'Pay Deposit',
        confirmOffline: language === 'zh' ? '确认订单（线下付款）' : 'Confirm (Pay Offline)',
        approvePrice: language === 'zh' ? '批准价格' : 'Approve Price',
        confirmComplete: language === 'zh' ? '确认完成' : 'Confirm Complete',
        writeReview: language === 'zh' ? '写评价' : 'Write Review',
        acceptOrder: language === 'zh' ? '接受订单' : 'Accept Order',
        reject: language === 'zh' ? '拒绝' : 'Reject',
        decline: language === 'zh' ? '拒绝' : 'Decline',
        submitQuote: language === 'zh' ? '提交报价' : 'Submit Quote',
        markComplete: language === 'zh' ? '标记为完成' : 'Mark as Completed',
        confirmPickup: language === 'zh' ? '确认取件' : 'Confirm Pickup',
        confirmReturn: language === 'zh' ? '确认归还' : 'Confirm Return',
        settleComplete: language === 'zh' ? '结算并完成' : 'Settle & Complete',
        contact: language === 'zh' ? '联系' : 'Contact',
        buyer: language === 'zh' ? '买家' : 'Buyer',
        provider: language === 'zh' ? '提供商' : 'Provider',
        basePrice: language === 'zh' ? '基础价格' : 'Base Price',
        couponDiscount: language === 'zh' ? '优惠券折扣' : 'Coupon Discount',
        couponCode: language === 'zh' ? '优惠码' : 'Coupon Code',
        tax: language === 'zh' ? '税费' : 'Tax',
        platformFee: language === 'zh' ? '平台费' : 'Platform Fee',
        bookingFee: language === 'zh' ? '预约费（不退还）' : 'Booking Fee (Non-refundable)',
        totalPaid: language === 'zh' ? '实付总额' : 'Total Paid',
        status: {
            'PENDING_PAYMENT': language === 'zh' ? '等待支付' : 'Waiting for Payment',
            'PENDING_CONFIRMATION': language === 'zh' ? '等待确认' : 'Pending Confirmation',
            'IN_PROGRESS': language === 'zh' ? '进行中' : 'In Progress',
            'COMPLETED': language === 'zh' ? '已完成' : 'Completed',
            'CANCELLED': language === 'zh' ? '已取消' : 'Cancelled',
            'PENDING_DEPOSIT': language === 'zh' ? '等待押金' : 'Waiting for Deposit',
            'PENDING_QUOTE': language === 'zh' ? '等待报价' : 'Awaiting Quote',
            'WAITING_FOR_PRICE_APPROVAL': language === 'zh' ? '待批准报价' : 'Reviewing Quote',
            'PICKED_UP': language === 'zh' ? '已取件' : 'Item Picked Up',
            'RETURNED': language === 'zh' ? '已归还' : 'Item Returned',
        }
    };

    // Find order in store (assuming loaded)
    const order = orders.find(o => o.id === id);

    useEffect(() => {
        if (!currentUser) {
            navigate('/login');
        }
    }, [currentUser, navigate]);

    if (!currentUser) {
        return null; // Don't render anything while waiting for the effect
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <div className="container py-20 text-center">
                    <p className="text-muted-foreground">Order not found.</p>
                    <Button onClick={() => navigate('/orders')} className="mt-4" variant="outline">
                        Back to Orders
                    </Button>
                </div>
            </div>
        );
    }

    const isBuyer = order.buyerId === currentUser.id;
    const isProvider = order.providerId === currentUser.id;

    const handleSubmitQuote = async (amount: number) => {
        setIsLoading(true);
        const cents = Math.round(amount * 100);
        const platformFee = Math.round(cents * 0.05);
        const tax = Math.round((cents + platformFee) * 0.13);
        const total = cents + platformFee + tax;

        const formatCAD = (val: number) => `$${(val / 100).toFixed(2)}`;

        try {
            await updateOrder(order.id, {
                status: 'WAITING_FOR_PRICE_APPROVAL',
                pricing: {
                    baseAmount: { amount: cents, currency: 'CAD', formatted: formatCAD(cents) },
                    platformFee: { amount: platformFee, currency: 'CAD', formatted: formatCAD(platformFee) },
                    taxAmount: { amount: tax, currency: 'CAD', formatted: formatCAD(tax) },
                    total: { amount: total, currency: 'CAD', formatted: formatCAD(total) }
                }
            });
            toast.success(t.quoteSuccess);
            setIsQuoteDialogOpen(false);
        } catch (error) {
            toast.error(t.quoteError);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReject = async () => {
        if (!confirm(t.rejectConfirm)) return;
        setIsLoading(true);
        try {
            await updateOrderStatus(order.id, 'CANCELLED');
            toast.info(t.rejectSuccess);
        } catch (error) {
            toast.error(t.rejectError);
        } finally {
            setIsLoading(false);
        }
    };

    const handleProviderComplete = async () => {
        if (!confirm(t.workDoneConfirm)) return;
        try {
            await updateOrderStatus(order.id, 'COMPLETED');
            toast.success(t.completeSuccess);
        } catch (e) { toast.error(t.updateError); }
    };

    const handleApproveQuote = async () => {
        setIsLoading(true);
        try {
            await updateOrder(order.id, {
                status: 'PENDING_PAYMENT'
            });
            toast.success(t.quoteApproveSuccess);
        } catch (error) {
            toast.error(t.quoteApproveError);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePay = async () => {
        setIsLoading(true);
        // Payments/escrow are deferred to v2 (see src/config/launchFlags.ts) —
        // confirm the order and let the two sides settle payment
        // off-platform instead of collecting through Stripe.
        if (!PAYMENTS_ENABLED) {
            try {
                await updateOrderStatus(order.id, 'IN_PROGRESS');
                toast.success(language === 'zh' ? '已确认，请与对方线下完成付款' : 'Confirmed — please arrange payment with them directly.');
            } catch (e) {
                toast.error(t.updateError);
            } finally {
                setIsLoading(false);
            }
            return;
        }
        try {
            const { data, error } = await supabase.functions.invoke('create-checkout-session', {
                headers: {
                    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                },
                body: {
                    orderType: 'WEB_ORDER',
                    orderId: order.id,
                    listingItemId: order.itemId,
                    masterId: order.masterId,
                    buyerId: currentUser.id,
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
                console.error('Stripe session error details:', error);
                throw error || new Error("Failed to create session");
            }
            window.location.href = data.url;
        } catch (error) {
            console.error('Payment failed:', error);
            toast.error('Failed to initiate payment');
        } finally {
            setIsLoading(false);
        }
    };

    const handleMessage = async () => {
        setIsLoading(true);
        try {
            let partnerId = isBuyer ? order.providerUserId : order.buyerId;
            if (isBuyer && (!partnerId || partnerId === order.providerId)) {
                const { data: profile, error } = await supabase
                    .from('provider_profiles')
                    .select('user_id')
                    .eq('id', order.providerId)
                    .single();

                if (error || !profile) {
                    throw new Error("Could not find Provider User ID.");
                }
                partnerId = profile.user_id;
            }

            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!partnerId || !uuidRegex.test(partnerId)) {
                alert(`Cannot start chat: Invalid Partner ID (${partnerId}).`);
                setIsLoading(false);
                return;
            }

            await createConversation(currentUser.id, partnerId, order.id);
            navigate('/chat');
        } catch (error: any) {
            toast.error(`Failed to start chat: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const StatusBadge = ({ status }: { status: OrderStatus }) => {
        const config = {
            'PENDING_PAYMENT': { color: 'text-orange-500', bg: 'bg-orange-50', label: t.status.PENDING_PAYMENT },
            'PENDING_CONFIRMATION': { color: 'text-blue-500', bg: 'bg-blue-50', label: t.status.PENDING_CONFIRMATION },
            'IN_PROGRESS': { color: 'text-purple-500', bg: 'bg-purple-50', label: t.status.IN_PROGRESS },
            'COMPLETED': { color: 'text-green-500', bg: 'bg-green-50', label: t.status.COMPLETED },
            'CANCELLED': { color: 'text-gray-500', bg: 'bg-gray-50', label: t.status.CANCELLED },
            'PENDING_DEPOSIT': { color: 'text-orange-500', bg: 'bg-orange-50', label: t.status.PENDING_DEPOSIT },
            'PENDING_QUOTE': { color: 'text-amber-500', bg: 'bg-amber-50', label: t.status.PENDING_QUOTE },
            'WAITING_FOR_PRICE_APPROVAL': { color: 'text-orange-600', bg: 'bg-orange-50', label: t.status.WAITING_FOR_PRICE_APPROVAL },
            'PICKED_UP': { color: 'text-blue-600', bg: 'bg-blue-50', label: t.status.PICKED_UP },
            'RETURNED': { color: 'text-emerald-600', bg: 'bg-emerald-50', label: t.status.RETURNED },
        }[status] || { color: 'text-gray-500', bg: 'bg-gray-50', label: status };

        return (
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${config.color} ${config.bg}`}>
                {config.label}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <div className="container py-20 text-center" style={{ display: !order ? 'block' : 'none' }}>
                <p className="text-muted-foreground">{t.orderNotFound}</p>
                <Button onClick={() => navigate('/orders')} className="mt-4" variant="outline">
                    {t.back}
                </Button>
            </div>

            <div className="container max-w-3xl py-8 px-4" style={{ display: order ? 'block' : 'none' }}>
                {order && (
                    <>
                        <button
                            onClick={() => navigate('/orders')}
                            className="flex items-center text-muted-foreground hover:text-foreground mb-6"
                        >
                            <ArrowLeft className="w-4 h-4 mr-1" /> {t.back}
                        </button>

                        <div className="card-warm overflow-hidden mb-6">
                            <div className="bg-muted/30 p-6 border-b border-border">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">{t.orderNo}{order.id.slice(0, 8)}</p>
                                        <h1 className="text-2xl font-black">{order.snapshot.masterTitle}</h1>
                                    </div>
                                    <StatusBadge status={order.status} />
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="flex gap-4 items-start">
                                    <img
                                        src={order.snapshot.masterImages[0]}
                                        alt={order.snapshot.masterTitle}
                                        className="w-20 h-20 rounded-lg object-cover bg-muted"
                                        loading="lazy"
                                    />
                                    <div>
                                        <h3 className="font-bold text-lg">{order.snapshot.itemName}</h3>
                                        <p className="text-muted-foreground">{order.snapshot.itemDescription}</p>
                                        <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                                            <span className="flex items-center">
                                                <Calendar className="w-4 h-4 mr-1" />
                                                {new Date(order.createdAt).toLocaleDateString()}
                                            </span>
                                            {order.snapshot.itemPricing.unit && (
                                                <span className="flex items-center">
                                                    <Package className="w-4 h-4 mr-1" />
                                                    {order.snapshot.itemPricing.unit}
                                                </span>
                                            )}
                                            {order.rentalStartDate && (
                                                <span className="flex items-center text-blue-600 font-bold">
                                                    <Calendar className="w-4 h-4 mr-1" />
                                                    {new Date(order.rentalStartDate).toLocaleDateString()} - {order.rentalEndDate ? new Date(order.rentalEndDate).toLocaleDateString() : '?'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-muted/20 p-4 rounded-xl space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">{t.basePrice}</span>
                                        <span>{order.pricing.baseAmount.formatted}</span>
                                    </div>
                                    {order.snapshot?.coupon_code && (
                                        <div className="flex justify-between text-sm text-emerald-600">
                                            <span className="flex items-center gap-1">
                                                <span>{t.couponDiscount}</span>
                                                <span className="text-xs font-mono">({order.snapshot.coupon_code})</span>
                                            </span>
                                            <span>-${((order.snapshot.coupon_discount || 0) / 100).toFixed(2)}</span>
                                        </div>
                                    )}
                                    {order.pricing.taxAmount?.amount > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">{t.tax}</span>
                                            <span>{order.pricing.taxAmount.formatted}</span>
                                        </div>
                                    )}
                                    {order.pricing.platformFee.amount > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">{t.platformFee}</span>
                                            <span>{order.pricing.platformFee.formatted}</span>
                                        </div>
                                    )}
                                    {order.serviceCallFee && order.serviceCallFee > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">{t.bookingFee}</span>
                                            <span>${(order.serviceCallFee / 100).toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
                                        <span>{t.totalPaid}</span>
                                        <span className="text-primary">{order.pricing.total.formatted}</span>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={handleMessage}
                                        disabled={isLoading}
                                    >
                                        <MessageCircle className="w-4 h-4 mr-2" />
                                        {t.contact} {isBuyer ? t.provider : t.buyer}
                                    </Button>

                                    {isBuyer && order.status === 'PENDING_PAYMENT' && (
                                        <Button className="flex-1 btn-action" onClick={handlePay} disabled={isLoading}>
                                            {PAYMENTS_ENABLED ? t.payNow : t.confirmOffline}
                                        </Button>
                                    )}
                                    {isBuyer && order.status === 'PENDING_DEPOSIT' && (
                                        <Button className="flex-1 btn-action bg-orange-600 hover:bg-orange-700 text-white" onClick={handlePay} disabled={isLoading}>
                                            {PAYMENTS_ENABLED ? t.payDeposit : t.confirmOffline}
                                        </Button>
                                    )}
                                    {isBuyer && order.status === 'WAITING_FOR_PRICE_APPROVAL' && (
                                        <Button className="flex-1 btn-action" onClick={handleApproveQuote} disabled={isLoading}>
                                            {t.approvePrice}
                                        </Button>
                                    )}
                                    {isBuyer && order.status === 'IN_PROGRESS' && (
                                        <Button className="flex-1 btn-action" onClick={() => updateOrderStatus(order.id, 'COMPLETED')}>
                                            {t.confirmComplete}
                                        </Button>
                                    )}

                                    {/* Review doesn't require payment/completion — any contact (an
                                        order was created the moment a message was sent) is enough,
                                        same as Facebook Marketplace. */}
                                    {isBuyer && order.status !== 'CANCELLED' && (
                                        <Button className="flex-1 bg-secondary hover:bg-secondary/90 text-white font-black uppercase tracking-widest rounded-xl" onClick={() => navigate(`/review/${order.id}`)}>
                                            {t.writeReview}
                                        </Button>
                                    )}

                                    {isProvider && order.status === 'PENDING_CONFIRMATION' && (
                                        <>
                                            <Button variant="outline" className="flex-1" onClick={handleReject} disabled={isLoading}>
                                                {t.reject}
                                            </Button>
                                            <Button className="flex-1 btn-action" onClick={() => updateOrderStatus(order.id, 'IN_PROGRESS')}>
                                                {t.acceptOrder}
                                            </Button>
                                        </>
                                    )}
                                    {isProvider && order.status === 'PENDING_QUOTE' && (
                                        <>
                                            <Button variant="outline" className="flex-1" onClick={handleReject} disabled={isLoading}>
                                                {t.decline}
                                            </Button>
                                            <Button className="flex-1 btn-action" onClick={() => setIsQuoteDialogOpen(true)} disabled={isLoading}>
                                                {t.submitQuote}
                                            </Button>
                                        </>
                                    )}
                                    {isProvider && order.status === 'IN_PROGRESS' && (
                                        <Button className="flex-1 btn-action" onClick={() => updateOrderStatus(order.id, order.rentalStartDate ? 'PICKED_UP' : 'COMPLETED')} disabled={isLoading}>
                                            {order.rentalStartDate ? t.confirmPickup : t.markComplete}
                                        </Button>
                                    )}
                                    {isProvider && order.status === 'PICKED_UP' && (
                                        <Button className="flex-1 btn-action bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => updateOrderStatus(order.id, 'RETURNED')} disabled={isLoading}>
                                            {t.confirmReturn}
                                        </Button>
                                    )}
                                    {isProvider && order.status === 'RETURNED' && (
                                        <Button className="flex-1 btn-action" onClick={() => updateOrderStatus(order.id, 'COMPLETED')} disabled={isLoading}>
                                            {t.settleComplete}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <Footer />


            <QuoteDialog
                isOpen={isQuoteDialogOpen}
                onClose={() => setIsQuoteDialogOpen(false)}
                onSubmit={handleSubmitQuote}
                isLoading={isLoading}
            />
        </div>
    );
};

export default OrderDetail;
