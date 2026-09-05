import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ListingMaster, ListingItem } from "@/types/domain";
import { useOrderStore } from "@/stores/orderStore";
import { useAuthStore } from "@/stores/authStore";
import { useMessageStore } from "@/stores/messageStore";
import { Loader2, CheckCircle2, MessageSquare, Calendar as CalendarIcon, FileText } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from 'react-router-dom';
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PAYMENTS_ENABLED } from "@/config/launchFlags";

interface QuoteRequestFlowProps {
    isOpen: boolean;
    onClose: () => void;
    master: ListingMaster;
    item: ListingItem;
}

type Step = 'REQUEST' | 'PROCESSING' | 'SUCCESS';

export const QuoteRequestFlow = ({ isOpen, onClose, master, item }: QuoteRequestFlowProps) => {
    const navigate = useNavigate();
    const { currentUser } = useAuthStore();
    const { createOrder } = useOrderStore();
    const [step, setStep] = useState<Step>('REQUEST');
    const [description, setDescription] = useState('');
    const [preferredDate, setPreferredDate] = useState('');

    const isVisitFee = item.pricing.model === 'VISIT_FEE';

    const handleSubmit = async () => {
        if (!currentUser) {
            toast.error("Please login to continue");
            return;
        }

        if (!description.trim()) {
            toast.error("Please describe your needs");
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
                masterTitle: master.titleEn || master.titleZh,
                masterDescription: master.descriptionEn || master.descriptionZh || '',
                masterImages: master.images,
                itemName: item.nameEn || item.nameZh,
                itemDescription: item.descriptionEn || item.descriptionZh || '',
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
                const messageStore = useMessageStore.getState();
                const conversation = await messageStore.createConversation(
                    currentUser.id,
                    master.providerId,
                    result.id
                );

                if (conversation) {
                    const messageContent = isVisitFee
                        ? `I've booked an assessment for "${master.titleEn || master.titleZh}". Looking forward to meeting you!`
                        : `I've submitted a quote request for "${master.titleEn || master.titleZh}".\nDetails: ${description}`;

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
            toast.error("Request failed. Please try again.");
        }
    };

    const renderRequestStep = () => (
        <div className="space-y-6">
            <div className="bg-muted/30 p-4 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-primary font-bold">
                    <MessageSquare className="w-4 h-4" />
                    {isVisitFee ? 'Request On-Site Assessment' : 'Request Custom Quote'}
                </div>
                <p className="text-sm text-muted-foreground">
                    {isVisitFee
                        ? `This service requires an on-site visit fee of $${item.pricing.price.amount / 100}. The provider will contact you to schedule.`
                        : "Describe your project. The provider will review and send you a price quote."}
                </p>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label>Project Description / Scope</Label>
                    <Textarea
                        placeholder="Describe what you need done..."
                        className="h-32 resize-none"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <Label>Preferred Date (Optional)</Label>
                    <div className="relative">
                        <CalendarIcon className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="e.g. Next Monday morning"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 pl-9"
                            value={preferredDate}
                            onChange={(e) => setPreferredDate(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <Button className="w-full h-12 text-lg font-bold" onClick={handleSubmit}>
                {isVisitFee
                    ? (PAYMENTS_ENABLED ? `Continue to Payment ($${item.pricing.price.amount / 100})` : 'Request Assessment')
                    : 'Submit Request'}
            </Button>
            <div className="flex justify-center mt-4">
                <Button variant="ghost" size="sm" onClick={onClose} className="text-muted-foreground">
                    Cancel
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
                <h3 className="text-2xl font-black">Request Sent!</h3>
                <p className="text-muted-foreground max-w-xs mx-auto">
                    {isVisitFee
                        ? (PAYMENTS_ENABLED ? "Please complete the payment to confirm your visit." : "The provider will contact you to confirm the visit and arrange payment directly.")
                        : "The provider has been notified. Check your 'Orders' tab for their response."}
                </p>
            </div>

            <div className="flex flex-col w-full gap-3 pt-4">
                <Button className="w-full h-12 font-bold" onClick={() => navigate('/orders')}>
                    {isVisitFee ? (PAYMENTS_ENABLED ? 'Pay Visit Fee' : 'View Status') : 'View Status'}
                </Button>
                <Button variant="outline" className="w-full" onClick={onClose}>
                    Close
                </Button>
            </div>
        </div>
    );

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-center">
                        {step === 'REQUEST' && (isVisitFee ? 'Book Assessment' : 'Request Quote')}
                        {step === 'PROCESSING' && 'Sending...'}
                        {step === 'SUCCESS' && 'Success'}
                    </DialogTitle>
                </DialogHeader>

                {step === 'REQUEST' && renderRequestStep()}
                {step === 'PROCESSING' && (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                        <Loader2 className="w-12 h-12 text-primary animate-spin" />
                        <p className="text-muted-foreground">Submitting your request...</p>
                    </div>
                )}
                {step === 'SUCCESS' && renderSuccessStep()}
            </DialogContent>
        </Dialog>
    );
};
