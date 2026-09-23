import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ListingMaster, ListingItem } from "@/types/domain";
import { DateRange } from "react-day-picker";
import { useOrderStore } from "@/stores/orderStore";
import { useAuthStore } from "@/stores/authStore";
import { differenceInDays, format } from "date-fns";
import { Loader2, CheckCircle2, CreditCard, Wallet, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from 'react-router-dom';

interface InstantPayFlowProps {
    isOpen: boolean;
    onClose: () => void;
    master: ListingMaster;
    item: ListingItem;
    dateRange?: DateRange;
    consultHours?: number;
}

type Step = 'REVIEW' | 'PAYMENT' | 'PROCESSING' | 'SUCCESS';

export const InstantPayFlow = ({ isOpen, onClose, master, item, dateRange, consultHours = 1 }: InstantPayFlowProps) => {
    const navigate = useNavigate();
    const { currentUser } = useAuthStore();
    const { createOrder } = useOrderStore();
    const [step, setStep] = useState<Step>('REVIEW');
    const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'APPLE_PAY' | 'JINBEAN'>('CARD');

    const formatMoney = (amount: number, currency: string = 'CAD') => {
        return new Intl.NumberFormat('en-CA', { style: 'currency', currency }).format(amount / 100);
    };

    // Calculate Totals
    const calculatePricing = () => {
        const basePrice = item.pricing.price.amount;
        let quantity = 1;
        let unitLabel = item.pricing.unit || 'ea';

        if (master.type === 'RENTAL' && dateRange?.from && dateRange?.to) {
            quantity = differenceInDays(dateRange.to, dateRange.from) || 1;
            unitLabel = 'days';
        } else if (master.type === 'CONSULTATION') {
            quantity = consultHours;
            unitLabel = 'hours';
        }

        const subtotal = basePrice * quantity;
        const platformFee = Math.round(subtotal * 0.05); // 5% Platform Fee
        const tax = Math.round((subtotal + platformFee) * 0.13); // 13% HST
        const total = subtotal + platformFee + tax;

        return {
            quantity,
            unitLabel,
            subtotal,
            platformFee,
            tax,
            total
        };
    };

    const pricing = calculatePricing();

    const handleConfirmPayment = async () => {
        if (!currentUser) {
            toast.error("Please login to continue");
            return;
        }

        setStep('PROCESSING');

        const orderData = {
            masterId: master.id,
            itemId: item.id,
            buyerId: currentUser.id,
            providerId: master.providerId,
            providerUserId: master.providerId, // Same as providerId for pilot
            status: 'IN_PROGRESS' as const,
            paymentStatus: 'PAID' as const,
            currency: 'CAD',
            pricing: {
                baseAmount: { amount: pricing.subtotal, currency: 'CAD', formatted: formatMoney(pricing.subtotal) },
                platformFee: { amount: pricing.platformFee, currency: 'CAD', formatted: formatMoney(pricing.platformFee) },
                taxAmount: { amount: pricing.tax, currency: 'CAD', formatted: formatMoney(pricing.tax) },
                total: { amount: pricing.total, currency: 'CAD', formatted: formatMoney(pricing.total) }
            },
            snapshot: {
                masterTitle: master.titleEn || master.titleZh,
                masterDescription: master.descriptionEn || master.descriptionZh || '',
                masterImages: master.images,
                itemName: item.nameEn || item.nameZh,
                itemDescription: item.descriptionEn || item.descriptionZh || '',
                itemPricing: {
                    model: item.pricing.model,
                    price: item.pricing.price,
                    unit: item.pricing.unit,
                    deposit: item.pricing.deposit
                },
                providerName: 'Provider',
                providerBadges: []
            },
            rentalStartDate: dateRange?.from?.toISOString(),
            rentalEndDate: dateRange?.to?.toISOString(),
            depositAmount: item.pricing.deposit?.amount || 0,
            depositStatus: 'NONE' as const,
            serviceCallFee: item.pricing.model === 'VISIT_FEE' ? item.pricing.price.amount : 0
        };

        const result = await createOrder(orderData);

        if (result) {
            setTimeout(() => {
                setStep('SUCCESS');
            }, 1000);
        } else {
            setStep('PAYMENT');
            toast.error("Payment failed. Please try again.");
        }
    };



    const renderReviewStep = () => (
        <div className="space-y-6">
            <div className="flex gap-4 p-4 bg-muted/30 rounded-lg">
                <img src={master.images[0]} alt={master.titleEn} className="w-20 h-20 object-cover rounded-md" />
                <div>
                    <h3 className="font-bold text-lg">{master.titleEn || master.titleZh}</h3>
                    <p className="text-sm text-muted-foreground">{item.nameEn || item.nameZh}</p>
                    <div className="mt-1 text-sm font-medium">
                        {master.type === 'RENTAL' && dateRange?.from && dateRange?.to && (
                            <span className="text-primary">
                                {format(dateRange.from, 'MMM d')} - {format(dateRange.to, 'MMM d')} ({pricing.quantity} days)
                            </span>
                        )}
                        {master.type === 'CONSULTATION' && (
                            <span className="text-primary">{pricing.quantity} Hours Consultation</span>
                        )}
                    </div>
                </div>
            </div>

            <div className="space-y-3 border-t pt-4">
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatMoney(pricing.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Platform Fee (5%)</span>
                    <span>{formatMoney(pricing.platformFee)}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">HST (13%)</span>
                    <span>{formatMoney(pricing.tax)}</span>
                </div>
                <div className="flex justify-between text-lg font-black border-t pt-2">
                    <span>Total</span>
                    <span className="text-primary">{formatMoney(pricing.total)}</span>
                </div>
            </div>

            <Button className="w-full h-12 text-lg font-bold" onClick={() => setStep('PAYMENT')}>
                Proceed to Payment
            </Button>
        </div>
    );

    const renderPaymentStep = () => (
        <div className="space-y-6">
            <div className="space-y-2">
                <h3 className="font-semibold mb-3">Select Payment Method</h3>

                <div
                    className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'CARD' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted/50'}`}
                    onClick={() => setPaymentMethod('CARD')}
                >
                    <div className="flex items-center gap-3">
                        <CreditCard className="w-5 h-5 text-primary" />
                        <span className="font-medium">Credit / Debit Card</span>
                    </div>
                    {paymentMethod === 'CARD' && <CheckCircle2 className="w-5 h-5 text-primary" />}
                </div>

                <div
                    className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'JINBEAN' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted/50'}`}
                    onClick={() => setPaymentMethod('JINBEAN')}
                >
                    <div className="flex items-center gap-3">
                        <Wallet className="w-5 h-5 text-amber-500" />
                        <span className="font-medium">Pay with Beans</span>
                    </div>
                    {paymentMethod === 'JINBEAN' && <CheckCircle2 className="w-5 h-5 text-primary" />}
                </div>
            </div>

            <div className="pt-4">
                <Button className="w-full h-12 text-lg font-bold" onClick={handleConfirmPayment}>
                    Pay {formatMoney(pricing.total)}
                </Button>
                <button onClick={() => setStep('REVIEW')} className="w-full mt-3 text-sm text-muted-foreground hover:text-foreground">
                    Back to Review
                </button>
            </div>
        </div>
    );

    const renderProcessingStep = () => (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <h3 className="text-xl font-bold">Processing Payment...</h3>
            <p className="text-muted-foreground text-center max-w-xs">
                Please wait while we secure your booking with the neighbor.
            </p>
        </div>
    );

    const renderSuccessStep = () => (
        <div className="flex flex-col items-center justify-center py-8 space-y-6">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-center space-y-2">
                <h3 className="text-2xl font-black">Booking Confirmed!</h3>
                <p className="text-muted-foreground">
                    Your order has been placed successfully.
                </p>
            </div>

            <div className="flex flex-col w-full gap-3 pt-4">
                <Button className="w-full h-12 font-bold" onClick={() => navigate('/orders')}>
                    View My Orders
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
                        {step === 'REVIEW' && 'Confirm Booking'}
                        {step === 'PAYMENT' && 'Checkout'}
                        {step === 'PROCESSING' && 'Please Wait'}
                        {step === 'SUCCESS' && 'Success'}
                    </DialogTitle>
                </DialogHeader>

                {step === 'REVIEW' && renderReviewStep()}
                {step === 'PAYMENT' && renderPaymentStep()}
                {step === 'PROCESSING' && renderProcessingStep()}
                {step === 'SUCCESS' && renderSuccessStep()}
            </DialogContent>
        </Dialog>
    );
};
