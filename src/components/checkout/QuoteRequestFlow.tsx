import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ListingMaster, ListingItem } from "@/types/domain";
import { useOrderStore } from "@/stores/orderStore";
import { useAuthStore } from "@/stores/authStore";
import { useMessageStore } from "@/stores/messageStore";
import { useConfigStore } from "@/stores/configStore";
import { getTranslation } from "@/stores/listingStore";
import { Loader2, CheckCircle2, MessageSquare, Calendar as CalendarIcon, FileText } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from 'react-router-dom';
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PAYMENTS_ENABLED } from "@/config/launchFlags";
import { promptLogin } from "@/components/common/LoginRequired";

interface QuoteRequestFlowProps {
    isOpen: boolean;
    onClose: () => void;
    master: ListingMaster;
    item: ListingItem;
    // The provider's real auth user id (provider.userId, NOT
    // master.providerId — that's provider_profiles.id, a different value
    // that fails the FK constraint on conversations.participant_a/b, both
    // of which reference auth.users(id)). Optional since some callers may
    // not have the provider loaded yet — the conversation step is skipped
    // gracefully rather than attempting a doomed insert.
    providerUserId?: string;
}

type Step = 'REQUEST' | 'PROCESSING' | 'SUCCESS';

export const QuoteRequestFlow = ({ isOpen, onClose, master, item, providerUserId }: QuoteRequestFlowProps) => {
    const navigate = useNavigate();
    const { currentUser } = useAuthStore();
    const { createOrder } = useOrderStore();
    const { language } = useConfigStore();
    const isZh = language === 'zh';
    const [step, setStep] = useState<Step>('REQUEST');
    const [description, setDescription] = useState('');
    const [preferredDate, setPreferredDate] = useState('');

    const isVisitFee = item.pricing.model === 'VISIT_FEE';

    const handleSubmit = async () => {
        if (!currentUser) {
            promptLogin(navigate, isZh, isZh ? "请先登录" : "Please login to continue");
            return;
        }

        if (!description.trim()) {
            toast.error(isZh ? "请描述您的需求" : "Please describe your needs");
            return;
        }

        setStep('PROCESSING');

        // Determine status based on model
        const initialStatus = isVisitFee ? 'PENDING_DEPOSIT' : 'PENDING_QUOTE';

        const orderData = {
            masterId: master.id,
            itemId: item.id,
            buyerId: currentUser.id,
            providerId: master.providerId,
            providerUserId: master.providerId,
            status: initialStatus as any,
            paymentStatus: 'UNPAID' as const,
            currency: 'CAD',
            pricing: {
                baseAmount: { ...item.pricing.price, formatted: new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(item.pricing.price.amount / 100) },
                platformFee: { amount: 0, currency: 'CAD', formatted: '$0.00' },
                taxAmount: { amount: 0, currency: 'CAD', formatted: '$0.00' },
                total: { ...item.pricing.price, formatted: new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(item.pricing.price.amount / 100) }
            },
            snapshot: {
                masterTitle: getTranslation(master, 'title'),
                masterDescription: getTranslation(master, 'description') || '',
                masterImages: master.images,
                itemName: getTranslation(item, 'name'),
                itemDescription: getTranslation(item, 'description') || '',
                itemPricing: {
                    model: item.pricing.model,
                    price: item.pricing.price
                },
                providerName: 'Provider',
                providerBadges: []
            },
            metadata: {
                quoteDetails: {
                    scopeDescription: description,
                    preferredDate: preferredDate
                }
            }
        };

        const result = await createOrder(orderData);

        if (result) {
            // Also create a conversation and send a message (JinBean Pattern: Link Order to Chat)
            try {
                if (!providerUserId) throw new Error('No providerUserId available');
                const messageStore = useMessageStore.getState();
                const conversation = await messageStore.createConversation(
                    currentUser.id,
                    providerUserId,
                    result.id
                );

                if (conversation) {
                    const masterTitle = getTranslation(master, 'title');
                    const messageContent = isVisitFee
                        ? (isZh ? `我已预约了"${masterTitle}"的上门评估，期待与您见面！` : `I've booked an assessment for "${masterTitle}". Looking forward to meeting you!`)
                        : (isZh ? `我已提交了"${masterTitle}"的报价请求。\n需求说明：${description}` : `I've submitted a quote request for "${masterTitle}".\nDetails: ${description}`);

                    await messageStore.sendMessage(
                        currentUser.id,
                        messageContent,
                        'TEXT',
                        { orderId: result.id, type: 'QUOTE_SUBMISSION' }
                    );
                }
            } catch (msgError) {
                console.error('Failed to create conversation/send message:', msgError);
                // Non-critical: Don't fail the flow if messaging fails after order creation
            }

            setTimeout(() => {
                setStep('SUCCESS');
            }, 1000);
        } else {
            setStep('REQUEST');
            toast.error(isZh ? "请求失败，请重试。" : "Request failed. Please try again.");
        }
    };

    const renderRequestStep = () => (
        <div className="space-y-6">
            <div className="bg-muted/30 p-4 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-primary font-bold">
                    <MessageSquare className="w-4 h-4" />
                    {isVisitFee ? (isZh ? '预约上门评估' : 'Request On-Site Assessment') : (isZh ? '请求定制报价' : 'Request Custom Quote')}
                </div>
                <p className="text-sm text-muted-foreground">
                    {isVisitFee
                        ? (isZh ? `该服务需要 $${item.pricing.price.amount / 100} 上门费，服务商会联系您安排时间。` : `This service requires an on-site visit fee of $${item.pricing.price.amount / 100}. The provider will contact you to schedule.`)
                        : (isZh ? "描述您的需求，服务商会审核并向您发送报价。" : "Describe your project. The provider will review and send you a price quote.")}
                </p>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label>{isZh ? '需求描述 / 范围' : 'Project Description / Scope'}</Label>
                    <Textarea
                        placeholder={isZh ? "描述您需要做的事情..." : "Describe what you need done..."}
                        className="h-32 resize-none"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <Label>{isZh ? '期望日期（可选）' : 'Preferred Date (Optional)'}</Label>
                    <div className="relative">
                        <CalendarIcon className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder={isZh ? "例如：下周一上午" : "e.g. Next Monday morning"}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 pl-9"
                            value={preferredDate}
                            onChange={(e) => setPreferredDate(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <Button className="w-full h-12 text-lg font-bold" onClick={handleSubmit}>
                {isVisitFee
                    ? (PAYMENTS_ENABLED ? (isZh ? `继续付款 ($${item.pricing.price.amount / 100})` : `Continue to Payment ($${item.pricing.price.amount / 100})`) : (isZh ? '请求评估' : 'Request Assessment'))
                    : (isZh ? '提交请求' : 'Submit Request')}
            </Button>
            <div className="flex justify-center mt-4">
                <Button variant="ghost" size="sm" onClick={onClose} className="text-muted-foreground">
                    {isZh ? '取消' : 'Cancel'}
                </Button>
            </div>

        </div>
    );

    const renderSuccessStep = () => (
        <div className="flex flex-col items-center justify-center py-8 space-y-6">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-center space-y-2">
                <h3 className="text-2xl font-black">{isZh ? '请求已发送！' : 'Request Sent!'}</h3>
                <p className="text-muted-foreground max-w-xs mx-auto">
                    {isVisitFee
                        ? (PAYMENTS_ENABLED ? (isZh ? "请完成付款以确认您的预约。" : "Please complete the payment to confirm your visit.") : (isZh ? "服务商会联系您确认上门时间并直接安排付款。" : "The provider will contact you to confirm the visit and arrange payment directly."))
                        : (isZh ? "服务商已收到通知，请在「订单」页查看他们的回复。" : "The provider has been notified. Check your 'Orders' tab for their response.")}
                </p>
            </div>

            <div className="flex flex-col w-full gap-3 pt-4">
                <Button className="w-full h-12 font-bold" onClick={() => navigate('/orders')}>
                    {isVisitFee ? (PAYMENTS_ENABLED ? (isZh ? '支付上门费' : 'Pay Visit Fee') : (isZh ? '查看状态' : 'View Status')) : (isZh ? '查看状态' : 'View Status')}
                </Button>
                <Button variant="outline" className="w-full" onClick={onClose}>
                    {isZh ? '关闭' : 'Close'}
                </Button>
            </div>
        </div>
    );

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-center">
                        {step === 'REQUEST' && (isVisitFee ? (isZh ? '预约评估' : 'Book Assessment') : (isZh ? '请求报价' : 'Request Quote'))}
                        {step === 'PROCESSING' && (isZh ? '发送中...' : 'Sending...')}
                        {step === 'SUCCESS' && (isZh ? '成功' : 'Success')}
                    </DialogTitle>
                </DialogHeader>

                {step === 'REQUEST' && renderRequestStep()}
                {step === 'PROCESSING' && (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                        <Loader2 className="w-12 h-12 text-primary animate-spin" />
                        <p className="text-muted-foreground">{isZh ? '正在提交您的请求...' : 'Submitting your request...'}</p>
                    </div>
                )}
                {step === 'SUCCESS' && renderSuccessStep()}
            </DialogContent>
        </Dialog>
    );
};
