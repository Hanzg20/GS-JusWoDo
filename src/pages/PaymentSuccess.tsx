import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Copy, Gift, ArrowRight, Home, Package, CreditCard, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useConfigStore } from '@/stores/configStore';
import { useAuthStore } from '@/stores/authStore';
import { motion } from 'framer-motion';
import { repositoryFactory } from '@/services/repositories/factory';
import { supabase } from '@/lib/supabase';

interface OrderDetails {
    productName: string;
    productType: 'GOODS' | 'SERVICE' | 'SERIALIZED_ITEM'; // SERIALIZED_ITEM for wash cards, tickets, etc.
    serialNumber?: string; // For wash cards, tickets, vouchers
    orderNumber: string;
    amount: number;
    currency: string;
    deliveryInfo?: {
        address?: string;
        estimatedDate?: string;
    };
}

const PaymentSuccess = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { toast } = useToast();
    const { language } = useConfigStore();
    const { currentUser } = useAuthStore();

    const sessionId = searchParams.get('session_id');
    const itemId = searchParams.get('item_id');
    const fromScan = searchParams.get('from') === 'scan'; // Detect if from QR scan

    const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
    const [loading, setLoading] = useState(true);

    const t = {
        zh: {
            title: '支付成功！',
            subtitles: {
                SERIALIZED_ITEM: '您的商品已激活',
                GOODS: '您的订单已确认',
                SERVICE: '服务已预订成功',
            },
            serialLabel: '序列号',
            orderLabel: '订单号',
            productLabel: '商品',
            amountLabel: '金额',
            deliveryLabel: '配送信息',
            copyBtn: '复制',
            copied: '已复制！',
            reward: '恭喜获得 5 积分奖励！',
            rewardDesc: '注册',
            rewardDescAfter: '账号即可领取并在下次消费时使用',
            registerBtn: '立即注册领取',
            closeBtn: '完成',
            homeBtn: '返回首页',
            ordersBtn: '查看订单',
            loading: '正在处理您的订单...',
            deliveryEstimate: '预计送达',
        },
        en: {
            title: 'Payment Successful!',
            subtitles: {
                SERIALIZED_ITEM: 'Your item has been activated',
                GOODS: 'Your order has been confirmed',
                SERVICE: 'Service booked successfully',
            },
            serialLabel: 'Serial Number',
            orderLabel: 'Order Number',
            productLabel: 'Product',
            amountLabel: 'Amount',
            deliveryLabel: 'Delivery Info',
            copyBtn: 'Copy',
            copied: 'Copied!',
            reward: 'You earned 5 Credits!',
            rewardDesc: 'Register on',
            rewardDescAfter: 'to claim and use on your next purchase',
            registerBtn: 'Register & Claim',
            closeBtn: 'Done',
            homeBtn: 'Back to Home',
            ordersBtn: 'View Orders',
            loading: 'Processing your order...',
            deliveryEstimate: 'Estimated delivery',
        }
    }[language === 'zh' ? 'zh' : 'en'];

    useEffect(() => {
        let attempts = 0;
        const maxAttempts = 10; // Poll for 20 seconds (10 * 2000ms)
        let timeoutId: NodeJS.Timeout;

        const fetchOrderDetails = async () => {
            if (!sessionId) {
                setLoading(false);
                return;
            }

            try {
                const orderRepo = repositoryFactory.getOrderRepository();
                const inventoryRepo = repositoryFactory.getInventoryRepository();

                // 1. Fetch order by session ID
                const { data: orderData, error: orderError } = await supabase
                    .from('orders')
                    .select('*, listing_masters(*), listing_items(*)')
                    .filter('snapshot->>session_id', 'eq', sessionId)
                    .maybeSingle();

                if (orderError) throw orderError;

                if (orderData) {
                    // Order found!
                    // 2. Fetch inventory if it's a serialized item
                    let serialNumber = undefined;
                    const isSerialized = orderData.actual_transaction_model === 'SCAN_TO_BUY';

                    if (isSerialized) {
                        const invItem = await inventoryRepo.getByOrder(orderData.id);
                        if (invItem) {
                            serialNumber = invItem.serialNumber;
                        }
                    }

                    // Language-aware product name extraction
                    const itemNameZh = (orderData.listing_items as any)?.name_zh;
                    const itemNameEn = (orderData.listing_items as any)?.name_en;
                    const masterNameZh = (orderData.listing_masters as any)?.title_zh;
                    const masterNameEn = (orderData.listing_masters as any)?.title_en;

                    const productName = language === 'zh'
                        ? (itemNameZh || itemNameEn || masterNameZh || masterNameEn || 'JUSTWEDO Order')
                        : (itemNameEn || itemNameZh || masterNameEn || masterNameZh || 'JUSTWEDO Order');

                    const details: OrderDetails = {
                        productName,
                        productType: isSerialized ? 'SERIALIZED_ITEM' : 'GOODS',
                        serialNumber,
                        orderNumber: orderData.id.split('-')[0].toUpperCase(),
                        amount: orderData.amount_total,
                        currency: orderData.currency,
                        deliveryInfo: orderData.snapshot?.delivery_info
                    };

                    setOrderDetails(details);
                    setLoading(false);
                } else {
                    // Order not found yet
                    attempts++;
                    if (attempts < maxAttempts) {
                        console.log(`Order not found, retrying... (${attempts}/${maxAttempts})`);
                        timeoutId = setTimeout(fetchOrderDetails, 2000);
                    } else {
                        console.warn('Max retry attempts reached. Order not found.');
                        setLoading(false);
                    }
                }
            } catch (error) {
                console.error('Error fetching order details:', error);
                setLoading(false);
            }
        };

        fetchOrderDetails();

        return () => clearTimeout(timeoutId);
    }, [sessionId]);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: t.copied,
            description: text,
        });
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'SERIALIZED_ITEM':
                return <Ticket className="w-6 h-6" />;
            case 'GOODS':
                return <Package className="w-6 h-6" />;
            case 'SERVICE':
                return <CreditCard className="w-6 h-6" />;
            default:
                return <Package className="w-6 h-6" />;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardContent className="p-8 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        <p className="text-lg font-semibold text-muted-foreground">{t.loading}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!orderDetails) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardContent className="p-8 text-center">
                        <p className="text-lg font-semibold text-muted-foreground">订单信息未找到</p>
                        <Button onClick={() => navigate('/')} className="mt-4">
                            {t.homeBtn}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md"
            >
                <Card className="shadow-2xl border-2 border-green-200">
                    <CardContent className="p-8">
                        {/* Success Icon */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                            className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center"
                        >
                            <CheckCircle2 className="w-12 h-12 text-green-600" />
                        </motion.div>

                        {/* Title */}
                        <h1 className="text-3xl font-black text-center mb-2 text-green-900">
                            {t.title}
                        </h1>
                        <p className="text-center text-muted-foreground mb-8">
                            {t.subtitles[orderDetails.productType]}
                        </p>

                        {/* Order Details */}
                        <div className="space-y-4 mb-6">
                            {/* Serial Number (for SERIALIZED_ITEM) */}
                            {orderDetails.productType === 'SERIALIZED_ITEM' && orderDetails.serialNumber && (
                                <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-6 text-white">
                                    <p className="text-sm opacity-90 mb-2">{t.serialLabel}</p>
                                    <div className="flex items-center justify-between">
                                        <p className="text-2xl font-black tracking-wider">{orderDetails.serialNumber}</p>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleCopy(orderDetails.serialNumber!)}
                                            className="text-white hover:bg-white/20"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Order Summary */}
                            <div className="bg-white border-2 border-border rounded-2xl p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">{t.orderLabel}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-sm">{orderDetails.orderNumber}</span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleCopy(orderDetails.orderNumber)}
                                            className="h-6 w-6 p-0"
                                        >
                                            <Copy className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex items-start justify-between pt-3 border-t">
                                    <div className="flex items-center gap-2">
                                        {getIcon(orderDetails.productType)}
                                        <span className="text-sm text-muted-foreground">{t.productLabel}</span>
                                    </div>
                                    <span className="font-semibold text-right max-w-[200px]">{orderDetails.productName}</span>
                                </div>

                                <div className="flex items-center justify-between pt-3 border-t">
                                    <span className="text-sm text-muted-foreground">{t.amountLabel}</span>
                                    <span className="font-bold text-lg">
                                        ${(orderDetails.amount / 100).toFixed(2)} {orderDetails.currency}
                                    </span>
                                </div>

                                {/* Delivery Info (for GOODS) */}
                                {orderDetails.productType === 'GOODS' && orderDetails.deliveryInfo && (
                                    <div className="pt-3 border-t">
                                        <p className="text-sm text-muted-foreground mb-2">{t.deliveryLabel}</p>
                                        {orderDetails.deliveryInfo.address && (
                                            <p className="text-sm">{orderDetails.deliveryInfo.address}</p>
                                        )}
                                        {orderDetails.deliveryInfo.estimatedDate && (
                                            <p className="text-sm text-muted-foreground">
                                                {t.deliveryEstimate}: {orderDetails.deliveryInfo.estimatedDate}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Reward Banner */}
                        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 mb-6">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Gift className="w-5 h-5 text-amber-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-amber-900 mb-1">{t.reward}</p>
                                    <p className="text-sm text-amber-700">
                                        {t.rewardDesc}{' '}
                                        <button
                                            onClick={() => navigate('/about')}
                                            className="text-amber-800 hover:text-amber-900 font-bold underline decoration-2"
                                        >
                                            JUSTWEDO
                                        </button>
                                        {' '}{t.rewardDescAfter}
                                    </p>
                                </div>
                            </div>
                            <Button
                                onClick={() => navigate('/register')}
                                className="w-full mt-4 bg-amber-500 hover:bg-amber-600 text-white"
                            >
                                {t.registerBtn}
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>

                        {/* Actions */}
                        <div className="space-y-2">
                            {/* Show "View Orders" only for logged-in users */}
                            {currentUser && !fromScan && (
                                <Button
                                    onClick={() => navigate('/orders')}
                                    className="w-full rounded-xl"
                                >
                                    {t.ordersBtn}
                                </Button>
                            )}
                            {/* Show different button based on purchase source */}
                            {fromScan ? (
                                <Button
                                    onClick={() => {
                                        // Try to close window (works for popups/new tabs).
                                        // window.close() returns nothing; if the page is
                                        // still here 150ms later, it didn't close — go home.
                                        window.close();
                                        setTimeout(() => navigate('/'), 150);
                                    }}
                                    className="w-full rounded-xl"
                                >
                                    {t.closeBtn}
                                </Button>
                            ) : (
                                <Button
                                    variant={currentUser ? "outline" : "default"}
                                    onClick={() => navigate('/')}
                                    className="w-full rounded-xl"
                                >
                                    <Home className="w-4 h-4 mr-2" />
                                    {t.homeBtn}
                                </Button>
                            )}
                        </div>

                        {/* Debug Info (remove in production) */}
                        {sessionId && (
                            <div className="mt-4 p-3 bg-muted rounded-lg">
                                <p className="text-xs text-muted-foreground">
                                    Session ID: {sessionId.substring(0, 20)}...
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
};

export default PaymentSuccess;
