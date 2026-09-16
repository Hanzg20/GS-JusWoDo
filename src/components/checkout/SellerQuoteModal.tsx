import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Order } from "@/types/orders";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DollarSign, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useConfigStore } from "@/stores/configStore";

interface SellerQuoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: Order | null;
    onSuccess: (amount: number, notes: string) => Promise<void>;
}

export const SellerQuoteModal = ({ isOpen, onClose, order, onSuccess }: SellerQuoteModalProps) => {
    const [amount, setAmount] = useState<string>('');
    const [notes, setNotes] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { language } = useConfigStore();
    const isZh = language === 'zh';

    if (!order) return null;

    const handleSubmit = async () => {
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            toast.error(isZh ? "请输入有效金额" : "Please enter a valid amount");
            return;
        }

        setIsSubmitting(true);
        try {
            // Convert to cents for the database
            const amountInCents = Math.round(numericAmount * 100);
            await onSuccess(amountInCents, notes);
            toast.success(isZh ? "报价已成功提交" : "Quote submitted successfully");
            onClose();
            // Reset state
            setAmount('');
            setNotes('');
        } catch (error) {
            console.error('Failed to submit quote:', error);
            toast.error(isZh ? "报价提交失败，请重试。" : "Failed to submit quote. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black text-center">{isZh ? '提交您的报价' : 'Submit Your Quote'}</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 pt-4">
                    <div className="bg-primary/5 p-4 rounded-2xl space-y-2 border border-primary/10">
                        <p className="text-xs font-black uppercase tracking-widest text-primary">{isZh ? '任务详情' : 'Task Context'}</p>
                        <p className="font-bold text-sm">{order.snapshot.masterTitle}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{order.snapshot.itemDescription}</p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount" className="font-bold uppercase tracking-tighter text-xs">{isZh ? '总报价金额 (CAD)' : 'Total Quote Amount (CAD)'}</Label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="amount"
                                    type="number"
                                    placeholder="0.00"
                                    className="pl-9 h-12 rounded-xl font-bold text-lg"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    step="0.01"
                                    min="0"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes" className="font-bold uppercase tracking-tighter text-xs">{isZh ? '给买家的备注（可选）' : 'Notes to Buyer (Optional)'}</Label>
                            <Textarea
                                id="notes"
                                placeholder={isZh ? "说明您的定价或服务范围..." : "Explain your pricing or scope..."}
                                className="h-24 rounded-xl resize-none"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>
                    </div>

                    <Button
                        className="w-full h-14 rounded-2xl font-black text-lg shadow-elevated bg-primary hover:bg-primary/90"
                        onClick={handleSubmit}
                        disabled={isSubmitting || !amount}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                {isZh ? '提交中...' : 'Submitting...'}
                            </>
                        ) : (
                            <>
                                <DollarSign className="w-5 h-5 mr-1" />
                                {isZh ? '提交报价' : 'Submit Quote'}
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
