import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { ListingMaster, ListingItem } from "@/types/domain";
import { useConfigStore } from "@/stores/configStore";

interface ServiceActionsProps {
    master: ListingMaster;
    selectedItem: ListingItem | null;
    pricingNode?: React.ReactNode;
    onChat: () => void;
    onAction: () => void;
}

export function ServiceActions({ master, selectedItem, pricingNode, onChat, onAction }: ServiceActionsProps) {
    const { language } = useConfigStore();
    const t = {
        chat: language === 'zh' ? '私信' : 'Chat',
        contactPrice: language === 'zh' ? '联系议价' : 'Contact for Price',
        requestQuote: language === 'zh' ? '发起询价' : 'Request Quote',
        bookNow: language === 'zh' ? '立即预订' : 'Book Now',
        rentNow: language === 'zh' ? '立即租赁' : 'Rent Now',
        bookTime: language === 'zh' ? '预约时间' : 'Book Time',
        deposit: language === 'zh' ? '押金 (可退)' : 'Ref. Deposit',
        free: language === 'zh' ? '免费' : 'Free',
        haveThis: language === 'zh' ? '我有这个' : 'I Have This',
        claimIt: language === 'zh' ? '免费领取' : 'Claim It',
    };

    const getActionButtonText = () => {
        if (!master) return t.bookNow;
        switch (master.type) {
            case 'RENTAL': return t.rentNow;
            case 'CONSULTATION': return t.bookTime;
            case 'SERVICE': return t.bookNow;
            case 'WANTED': return t.haveThis;
            case 'FREE_GIVEAWAY': return t.claimIt;
            default: return t.bookNow;
        }
    };

    const renderPricingCard = () => {
        if (!selectedItem) return null;
        const isFree = selectedItem.pricing.price.amount === 0;
        return (
            <div className="flex flex-col">
                {isFree ? (
                    <span className="text-2xl font-black text-primary tracking-tighter">{t.free}</span>
                ) : (
                    <div className="flex items-baseline gap-1">
                        <span className="text-xs font-bold text-muted-foreground">$</span>
                        <span className="text-2xl font-black text-primary tracking-tighter">
                            {selectedItem.pricing.price.amount / 100}
                        </span>
                        <span className="text-xs font-bold text-muted-foreground uppercase">
                            /{selectedItem.pricing.unit || 'unit'}
                        </span>
                    </div>
                )}
                {selectedItem.pricing.deposit && selectedItem.pricing.deposit.amount > 0 && (
                    <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-md w-fit">
                        {t.deposit}: ${selectedItem.pricing.deposit.amount / 100}
                    </span>
                )}
            </div>
        );
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 glass-sticky-bar px-4 py-5 z-50 safe-area-bottom">
            <div className="container max-w-4xl flex items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <button onClick={onChat} className="flex flex-col items-center gap-1 group">
                        <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center group-hover:bg-primary/5 transition-all">
                            <MessageCircle className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                        </div>
                        <span className="text-[10px] font-black text-muted-foreground uppercase group-hover:text-primary">{t.chat}</span>
                    </button>
                </div>
                <div className="flex-1 flex items-center justify-between gap-4">
                    {pricingNode || renderPricingCard()}

                    {/* Action Button */}
                    {master.attributes?.pricingMode === 'NEGOTIABLE' ? (
                        <Button
                            onClick={onAction}
                            className="btn-action h-14 flex-1 max-w-[200px] text-sm font-black uppercase tracking-widest shadow-elevated rounded-2xl bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                        >
                            {t.contactPrice}
                        </Button>
                    ) : master.attributes?.pricingMode === 'QUOTE' ? (
                        <Button
                            onClick={onAction}
                            className="btn-action h-14 flex-1 max-w-[200px] text-sm font-black uppercase tracking-widest shadow-elevated rounded-2xl bg-blue-600 hover:bg-blue-700"
                        >
                            {t.requestQuote}
                        </Button>
                    ) : (
                        <Button
                            onClick={onAction}
                            className="btn-action h-14 flex-1 max-w-[200px] text-sm font-black uppercase tracking-widest shadow-elevated rounded-2xl"
                        >
                            {getActionButtonText()}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
