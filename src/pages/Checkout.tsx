import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    ChevronLeft, CreditCard, ShieldCheck, MapPin,
    Calendar as CalendarIcon, Clock, Info, CheckCircle2,
    ArrowRight, Loader2, Wallet, ShoppingBag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useCartStore } from '@/stores/cartStore';
import { useListingStore } from '@/stores/listingStore';
import { useAuthStore } from '@/stores/authStore';
import { useConfigStore } from '@/stores/configStore';
import { useOrderStore } from '@/stores/orderStore';
import { format, differenceInDays } from 'date-fns';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { repositoryFactory } from '@/services/repositories/factory';

const Checkout = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { items: cartItems, clearCart } = useCartStore();
    const { listings, listingItems, setListings, setListingItems } = useListingStore();
    const { currentUser } = useAuthStore();
    const { language } = useConfigStore();
    const { createOrder } = useOrderStore();

    const [processing, setProcessing] = useState(false);
    const [loadingData, setLoadingData] = useState(false);
    const [step, setStep] = useState<'REVIEW' | 'PAYMENT' | 'SUCCESS'>('REVIEW');

    // NEW: Get single item from URL if direct checkout
    const directItemId = searchParams.get('item_id');
    const rentalStart = searchParams.get('start');
    const rentalEnd = searchParams.get('end');
    const consultHours = searchParams.get('hours');

    useEffect(() => {
        if (!currentUser) {
            navigate('/login?redirect=/checkout');
            return;
        }

        const loadMissingData = async () => {
            if (directItemId) {
                const itemInStore = listingItems.find(li => li.id === directItemId);
                if (!itemInStore) {
                    setLoadingData(true);
                    try {
                        const itemRepo = repositoryFactory.getListingItemRepository();
                        const listingRepo = repositoryFactory.getListingRepository();

                        const item = await itemRepo.getById(directItemId);
                        if (item) {
                            setListingItems([item, ...listingItems]);
                            const masterInStore = listings.find(l => l.id === item.masterId);
                            if (!masterInStore) {
                                const master = await listingRepo.getById(item.masterId);
                                if (master) setListings([master, ...listings]);
                            }
                        }
                    } catch (err) {
                        console.error('Failed to load checkout data:', err);
                        toast.error('Failed to load item details');
                    } finally {
                        setLoadingData(false);
                    }
                }
            }
        };

        loadMissingData();
    }, [currentUser, directItemId, navigate, listingItems, listings, setListingItems, setListings]);

    // Data Preparation
    const checkoutItems = directItemId
        ? [{ itemId: directItemId, quantity: 1, rentalStart, rentalEnd, consultHours }]
        : cartItems;

    const enrichedItems = checkoutItems.map(ci => {
        const item = listingItems.find(li => li.id === ci.itemId);
        const master = listings.find(l => l.id === item?.masterId);
        return { ...ci, item, master };
    }).filter(ei => ei.item && ei.master);

    const t = {
        zh: {
            title: '确认订单',
            payment: '支付方式',
            summary: '订单摘要',
            total: '合计',
            placeOrder: '立即下单',
            secure: '安全支付保障',
            processing: '正在处理...',
            successTitle: '下单成功！',
            viewOrders: '查看我的订单',
            backHome: '返回首页',
            subtotal: '小计',
            fee: '平台服务费 (5%)',
            tax: '税费 (13%)',
            deposit: '押金 (可加电)',
            rentalPeriod: '租赁周期',
            consultDuration: '咨询时长',
            visitFee: '上门费 (预付)',
            quoteNote: '此订单为报价模式，当前仅收取上门/服务基础费。',
            hours: '小时',
            bookingFee: '预约费',
            payMethodCard: '信用卡 / 借记卡',
            securedBy: '由 Stripe 提供安全保障',
            soon: '即将推出',
            balance: '余额',
            incVat: '含税',
            submitRequest: '提交询价单',
            back: '返回',
        },
        en: {
            title: 'Checkout',
            payment: 'Payment Method',
            summary: 'Order Summary',
            total: 'Total',
            placeOrder: 'Place Order',
            secure: 'Secure Payment',
            processing: 'Processing...',
            successTitle: 'Order Placed!',
            viewOrders: 'View My Orders',
            backHome: 'Back to Home',
            subtotal: 'Subtotal',
            fee: 'Service Fee (5%)',
            tax: 'HST (13%)',
            deposit: 'Security Deposit',
            rentalPeriod: 'Rental Period',
            consultDuration: 'Duration',
            visitFee: 'Booking Fee',
            quoteNote: 'This is a quote-based service. The current charge is for the visit/booking fee only.',
            hours: 'Hours',
            bookingFee: 'Booking Fee',
            payMethodCard: 'Credit / Debit Card',
            securedBy: 'Secured by Stripe',
            soon: 'Soon',
            balance: 'Balance',
            incVat: 'inc. VAT',
            submitRequest: 'Submit Request',
            back: 'Back',
        }
    }[language === 'zh' ? 'zh' : 'en'];

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat(language === 'zh' ? 'zh-CN' : 'en-CA', {
            style: 'currency',
            currency: 'CAD',
        }).format(amount / 100);
    };

    const getItemCalculatedPrice = (ci: any) => {
        const basePrice = ci.item!.pricing.price.amount;
        let qty = ci.quantity || 1;

        if (ci.master?.type === 'RENTAL' && ci.rentalStart && ci.rentalEnd) {
            qty = differenceInDays(new Date(ci.rentalEnd), new Date(ci.rentalStart)) || 1;
        } else if (ci.master?.type === 'CONSULTATION' && ci.consultHours) {
            qty = parseFloat(ci.consultHours);
        }

        if (ci.item!.pricing.model === 'VISIT_FEE') {
            return basePrice;
        }
        return basePrice * qty;
    };

    const calculateTotals = () => {
        let subtotal = 0;
        let depositTotal = 0;
        let serviceCallFeeTotal = 0;

        enrichedItems.forEach(ci => {
            const basePrice = ci.item!.pricing.price.amount;
            let qty = ci.quantity || 1;

            if (ci.master?.type === 'RENTAL' && ci.rentalStart && ci.rentalEnd) {
                qty = differenceInDays(new Date(ci.rentalEnd), new Date(ci.rentalStart)) || 1;
                depositTotal += ci.item!.pricing.deposit?.amount || 0;
            } else if (ci.master?.type === 'CONSULTATION' && ci.consultHours) {
                qty = parseFloat(ci.consultHours);
            }

            // If it's a quote model with visit fee
            if (ci.item!.pricing.model === 'VISIT_FEE') {
                serviceCallFeeTotal += basePrice;
                // subtotal doesn't increment by basePrice since it's the fee itself here
            } else {
                subtotal += basePrice * qty;
            }
        });

        const platformFee = Math.round((subtotal + serviceCallFeeTotal) * 0.05);
        const tax = Math.round((subtotal + serviceCallFeeTotal + platformFee) * 0.13);
        const total = subtotal + serviceCallFeeTotal + platformFee + tax + depositTotal;

        return { subtotal, depositTotal, serviceCallFeeTotal, platformFee, tax, total };
    };

    const totals = calculateTotals();

    const handlePlaceOrder = async () => {
        if (!currentUser) return;
        setProcessing(true);

        try {
            // 1. Create Order(s) in database first as PENDING_PAYMENT
            const orderPromises = enrichedItems.map(async (ci) => {
                const itemSubtotal = getItemCalculatedPrice(ci);
                const platformFee = Math.round(itemSubtotal * 0.05);
                const tax = Math.round((itemSubtotal + platformFee) * 0.13);
                const itemTotal = itemSubtotal + platformFee + tax;

                // Determine Status based on Pricing Mode & Payment
                let orderStatus = 'PENDING_PAYMENT';
                if (ci.master!.attributes?.pricingMode === 'QUOTE') {
                    // Quote Logic: If no upfront payment, it is a Request
                    if (itemTotal === 0) {
                        orderStatus = 'PENDING_QUOTE';
                    } else {
                        // If there is a total, it means there is a Visit Fee -> Pending Payment
                        orderStatus = 'PENDING_PAYMENT';
                    }
                }

                // Determine Service Call Fee
                // Logic: If Item Pricing Model is explicit VISIT_FEE -> take price
                // OR if Quote Mode and total > 0 (Visit fee assumed) -> take price as fee
                let serviceFee = 0;
                if (ci.item!.pricing.model === 'VISIT_FEE') {
                    serviceFee = ci.item!.pricing.price.amount;
                } else if (ci.master!.attributes?.pricingMode === 'QUOTE' && itemSubtotal > 0) {
                    serviceFee = itemSubtotal; // For Quotes, any base price is the visit fee
                }

                return createOrder({
                    masterId: ci.master!.id,
                    itemId: ci.item!.id,
                    buyerId: currentUser.id,
                    providerId: ci.master!.providerId,
                    providerUserId: ci.master!.providerId,
                    status: orderStatus as any,
                    paymentStatus: 'UNPAID',
                    currency: 'CAD',
                    pricing: {
                        baseAmount: { amount: itemSubtotal, currency: 'CAD', formatted: formatMoney(itemSubtotal) },
                        platformFee: { amount: platformFee, currency: 'CAD', formatted: formatMoney(platformFee) },
                        taxAmount: { amount: tax, currency: 'CAD', formatted: formatMoney(tax) },
                        total: { amount: itemTotal, currency: 'CAD', formatted: formatMoney(itemTotal) }
                    },
                    snapshot: {
                        masterTitle: ci.master!.titleZh || ci.master!.titleEn || 'Service',
                        masterDescription: ci.master!.descriptionZh || ci.master!.descriptionEn || '',
                        masterImages: ci.master!.images,
                        itemName: ci.item!.nameZh || ci.item!.nameEn || 'Item',
                        itemDescription: ci.item!.descriptionZh || ci.item!.descriptionEn || '',
                        itemPricing: ci.item!.pricing,
                        providerName: 'Neighbor',
                        providerBadges: []
                    },
                    rentalStartDate: ci.rentalStart,
                    rentalEndDate: ci.rentalEnd,
                    rentalDays: (ci.master?.type === 'RENTAL' && ci.rentalStart && ci.rentalEnd)
                        ? (differenceInDays(new Date(ci.rentalEnd), new Date(ci.rentalStart)) || 1)
                        : undefined,
                    depositAmount: ci.item!.pricing.deposit?.amount || 0,
                    depositStatus: ci.item!.pricing.deposit ? 'HELD' : 'NONE',
                    serviceCallFee: serviceFee
                });
            });

            const createdOrders = await Promise.all(orderPromises);
            const validOrders = createdOrders.filter(o => o !== null) as any[];

            if (validOrders.length === 0) throw new Error("Order creation failed");

            // 2. If it's a paid order (not just a quote), trigger Stripe
            if (totals.total > 0) {
                const firstOrder = validOrders[0];
                const { data, error } = await supabase.functions.invoke('create-checkout-session', {
                    headers: {
                        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                    },
                    body: {
                        orderType: 'WEB_ORDER',
                        orderId: firstOrder.id, // Only handles single order for now in this pilot
                        listingItemId: firstOrder.itemId,
                        masterId: firstOrder.masterId,
                        buyerId: currentUser.id,
                        productName: firstOrder.snapshot.itemName || (language === 'zh' ? '服务订单' : 'Service Order'),
                        price: totals.total,
                        metadata: {
                            rentalStart: firstOrder.rentalStartDate || '',
                            rentalEnd: firstOrder.rentalEndDate || '',
                            rentalDays: (firstOrder.rentalDays || '').toString(),
                            depositAmount: firstOrder.depositAmount || 0,
                            serviceCallFee: firstOrder.serviceCallFee || 0
                        }
                    }
                });

                if (error || !data?.url) {
                    console.error('Stripe session error details:', error);
                    if (error instanceof Error) {
                        try {
                            const errBody = await (error as any).response?.json();
                            console.error('Stripe edge function error body:', errBody);
                        } catch (e) { }
                    }
                    toast.error('Payment system unavailable');
                    return;
                }

                // Redirect to Stripe
                window.location.href = data.url;
            } else {
                // For Quote models with 0 upfront cost
                if (!directItemId) clearCart();
                setStep('SUCCESS');
            }
        } catch (error: any) {
            console.error('Order creation failed full error:', error);
            toast.error(error.message || 'Failed to place order');
        } finally {
            setProcessing(false);
        }
    };

    if (loadingData) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground font-bold italic">Loading item details...</p>
            </div>
        );
    }

    if (step === 'SUCCESS') {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-12 h-12 text-primary" />
                    </div>
                    <h1 className="text-3xl font-black mb-2">{t.successTitle}</h1>
                    <p className="text-muted-foreground mb-8">
                        {language === 'zh' ? '您的订单已成功创建，商家将尽快处理。' : 'Your order has been created and the provider will process it soon.'}
                    </p>
                    <div className="flex flex-col gap-3 w-full max-w-xs mx-auto">
                        <Button onClick={() => navigate('/orders')} className="btn-action h-12">
                            {t.viewOrders}
                        </Button>
                        <Button variant="outline" onClick={() => navigate('/')} className="h-12">
                            {t.backHome}
                        </Button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-32">
            <Header />
            <div className="container max-w-4xl py-6 px-4">
                <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm font-bold text-muted-foreground mb-6 hover:text-primary transition-colors">
                    <ChevronLeft className="w-4 h-4" /> {t.back}
                </button>

                <h1 className="text-3xl font-black mb-8 tracking-tighter">{t.title}</h1>

                <div className="grid lg:grid-cols-5 gap-8">
                    {/* Left Column: Items & Payment */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Order Items */}
                        <div className="space-y-4">
                            {enrichedItems.map((ei, idx) => (
                                <Card key={idx} className="border-none shadow-sm card-warm overflow-hidden">
                                    <div className="flex gap-4 p-4">
                                        <img src={ei.master!.images[0]} alt="" className="w-20 h-20 rounded-xl object-cover shrink-0" loading="lazy" />
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-lg leading-tight mb-1 truncate">{language === 'zh' ? ei.master!.titleZh : ei.master!.titleEn}</h3>
                                            <p className="text-sm text-muted-foreground mb-2">{language === 'zh' ? ei.item!.nameZh : ei.item!.nameEn}</p>

                                            {/* Model Specific Tags */}
                                            <div className="flex flex-wrap gap-2">
                                                {ei.rentalStart && (
                                                    <Badge variant="secondary" className="capitalize text-[10px] bg-blue-50 text-blue-600 border-none">
                                                        <CalendarIcon className="w-3 h-3 mr-1" />
                                                        {format(new Date(ei.rentalStart), 'MMM d')} - {format(new Date(ei.rentalEnd!), 'MMM d')}
                                                    </Badge>
                                                )}
                                                {ei.consultHours && (
                                                    <Badge variant="secondary" className="text-[10px] bg-purple-50 text-purple-600 border-none">
                                                        <Clock className="w-3 h-3 mr-1" />
                                                        {ei.consultHours} {t.hours}
                                                    </Badge>
                                                )}
                                                {ei.item!.pricing.model === 'VISIT_FEE' && (
                                                    <Badge className="text-[10px] bg-orange-50 text-orange-600 border-none">
                                                        {t.bookingFee}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="font-black text-primary">{formatMoney(ei.item!.pricing.price.amount)}</p>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">x{ei.quantity || 1}</p>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>

                        {/* Payment Selection - Hide if Total is 0 (Quote Request) */}
                        {totals.total > 0 && (
                            <Card className="border-none shadow-sm bg-muted/30 p-6 rounded-3xl">
                                <h2 className="font-black text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <CreditCard className="w-4 h-4 text-primary" /> {t.payment}
                                </h2>
                                <div className="grid gap-3">
                                    <div className="flex items-center justify-between p-4 bg-white border-2 border-primary rounded-2xl shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center">
                                                <CreditCard className="w-5 h-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm">{t.payMethodCard}</p>
                                                <p className="text-[10px] text-muted-foreground font-medium">{t.securedBy}</p>
                                            </div>
                                        </div>
                                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                            <CheckCircle2 className="w-3 h-3 text-white" />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-white/50 border-2 border-transparent rounded-2xl opacity-60">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                                                <Wallet className="w-5 h-5 text-amber-500" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm">JinBeans ({t.soon})</p>
                                                <p className="text-[10px] text-muted-foreground font-medium">{t.balance}: 0 beans</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        )}
                    </div>

                    {/* Right Column: Summary */}
                    <div className="lg:col-span-2">
                        <Card className="border-none shadow-elevated p-6 rounded-3xl sticky top-24 bg-card">
                            <h2 className="font-black text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
                                <ShoppingBag className="w-4 h-4 text-primary" /> {t.summary}
                            </h2>

                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground font-medium">{t.subtotal}</span>
                                    <span className="font-bold">{formatMoney(totals.subtotal)}</span>
                                </div>
                                {totals.serviceCallFeeTotal > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground font-medium">{t.visitFee}</span>
                                        <span className="font-bold">{formatMoney(totals.serviceCallFeeTotal)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground font-medium">{t.fee}</span>
                                    <span className="font-bold">{formatMoney(totals.platformFee)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground font-medium">{t.tax}</span>
                                    <span className="font-bold">{formatMoney(totals.tax)}</span>
                                </div>
                                {totals.depositTotal > 0 && (
                                    <div className="flex justify-between text-sm pt-2 border-t border-dashed">
                                        <span className="text-muted-foreground font-bold flex items-center gap-1">
                                            {t.deposit} <Info className="w-3 h-3" />
                                        </span>
                                        <span className="font-black text-orange-600">{formatMoney(totals.depositTotal)}</span>
                                    </div>
                                )}

                                <Separator />

                                <div className="flex justify-between items-baseline pt-2">
                                    <span className="text-lg font-black">{t.total}</span>
                                    <div className="text-right">
                                        <span className="text-3xl font-black text-primary tracking-tighter">{formatMoney(totals.total)}</span>
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">CAD {t.incVat}</p>
                                    </div>
                                </div>
                            </div>

                            {enrichedItems.some(ei => ei.item!.pricing.model === 'QUOTE' || ei.item!.pricing.model === 'VISIT_FEE' || ei.master?.attributes?.pricingMode === 'QUOTE') && (
                                <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 mb-6">
                                    <p className="text-[10px] font-bold text-orange-700 leading-tight">
                                        <Info className="w-3 h-3 inline mr-1" /> {t.quoteNote}
                                    </p>
                                </div>
                            )}

                            {/* Liability Waiver */}
                            <div className="bg-muted/30 p-4 rounded-2xl mb-6">
                                <label className="flex items-start gap-3 cursor-pointer group">
                                    <input type="checkbox" className="mt-1 w-4 h-4 rounded border-gray-400 text-primary focus:ring-primary group-hover:border-primary transition-colors" id="waiver-check" />
                                    <span className="text-xs text-muted-foreground font-medium leading-relaxed select-none">
                                        {language === 'zh'
                                            ? '我同意免责声明：平台仅作为中介，不承担服务或租赁过程中产生的财产损失、人身伤害等连带责任。'
                                            : 'I agree to the Release of Liability: The platform acts as an intermediary and is not liable for damages or injuries arising from this service/rental.'}
                                    </span>
                                </label>
                            </div>

                            <Button
                                onClick={() => {
                                    const waiver = document.getElementById('waiver-check') as HTMLInputElement;
                                    if (!waiver?.checked) {
                                        toast.error(language === 'zh' ? '请先同意免责声明' : 'Please agree to the liability waiver');
                                        return;
                                    }
                                    handlePlaceOrder();
                                }}
                                disabled={processing}
                                className="w-full h-16 rounded-2xl text-lg font-black uppercase tracking-widest shadow-warm btn-action"
                            >
                                {processing ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    <>
                                        {totals.total > 0 ? t.placeOrder : t.submitRequest}
                                        <ArrowRight className="w-5 h-5 ml-2" />
                                    </>
                                )}
                            </Button>

                            <div className="mt-6 flex items-center justify-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest bg-muted/30 py-2 rounded-xl">
                                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                {t.secure}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Checkout;
