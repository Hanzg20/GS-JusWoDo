import { Button } from "@/components/ui/button";
import { MessageCircle, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
    const navigate = useNavigate();
    const { language } = useConfigStore();
    const t = {
        home: language === 'zh' ? '首页' : 'Home',
        chat: language === 'zh' ? '聊一聊' : "Let's Chat",
        contactPrice: language === 'zh' ? '要个报价' : 'Get a Quote',
        requestQuote: language === 'zh' ? '要个报价' : 'Get a Quote',
        bookNow: language === 'zh' ? '发个预定' : 'Reserve It',
        rentNow: language === 'zh' ? '发个预定' : 'Reserve It',
        bookTime: language === 'zh' ? '发个预定' : 'Reserve It',
        deposit: language === 'zh' ? '押金 (可退)' : 'Ref. Deposit',
        free: language === 'zh' ? '免费' : 'Free',
        negotiable: language === 'zh' ? '面议' : 'Contact for Price',
        haveThis: language === 'zh' ? '我有这个' : 'I Have This',
        claimIt: language === 'zh' ? '免费拿走' : 'Grab It Free',
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
        // A $0 amount on a QUOTE/NEGOTIABLE item means "no price set yet",
        // not "this is free" — those need their own "Contact for Price"
        // copy instead of accidentally reading as a free giveaway.
        const isUnpriced = selectedItem.pricing.model === 'QUOTE' || selectedItem.pricing.model === 'NEGOTIABLE';
        const isFree = !isUnpriced && selectedItem.pricing.price.amount === 0;
        return (
            <div className="flex flex-col">
                {isUnpriced ? (
                    <span className="text-xl sm:text-2xl font-black text-primary tracking-tighter truncate">{t.negotiable}</span>
                ) : isFree ? (
                    <span className="text-xl sm:text-2xl font-black text-primary tracking-tighter truncate">{t.free}</span>
                ) : (
                    <div className="flex items-baseline gap-1">
                        <span className="text-xs font-bold text-muted-foreground">$</span>
                        <span className="text-xl sm:text-2xl font-black text-primary tracking-tighter">
                            {selectedItem.pricing.price.amount / 100}
                        </span>
                        <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase truncate">
                            /{selectedItem.pricing.unit || 'unit'}
                        </span>
                    </div>
                )}
                {selectedItem.pricing.deposit && selectedItem.pricing.deposit.amount > 0 && (
                    <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-md w-fit truncate">
                        {t.deposit}: ${selectedItem.pricing.deposit.amount / 100}
                    </span>
                )}
            </div>
        );
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 glass-sticky-bar px-4 py-3 sm:py-4 z-50 safe-area-bottom">
            <div className="container max-w-4xl flex items-center justify-between gap-3 sm:gap-6">
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <button
                        onClick={() => navigate('/')}
                        className="flex flex-col items-center gap-0.5 group min-w-[36px] active:scale-95 transition-transform"
                    >
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-muted/60 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                            <Home className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground group-hover:text-primary transition-colors">
                            {t.home}
                        </span>
                    </button>
                    <button
                        onClick={onChat}
                        className="flex flex-col items-center gap-0.5 group min-w-[36px] active:scale-95 transition-transform"
                    >
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-muted/60 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                            <MessageCircle className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground group-hover:text-primary transition-colors">
                            {t.chat}
                        </span>
                    </button>
                </div>
                <div className="flex-1 flex items-center justify-between gap-3 sm:gap-4 min-w-0">
                    {pricingNode || renderPricingCard()}

                    {/* Action Button */}
                    {master.attributes?.pricingMode === 'NEGOTIABLE' ? (
                        <Button
                            onClick={onAction}
                            className="btn-action h-11 sm:h-12 flex-1 max-w-[170px] sm:max-w-[200px] text-xs sm:text-sm font-black uppercase tracking-wider shadow-elevated rounded-2xl bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                        >
                            {t.contactPrice}
                        </Button>
                    ) : master.attributes?.pricingMode === 'QUOTE' ? (
                        <Button
                            onClick={onAction}
                            className="btn-action h-11 sm:h-12 flex-1 max-w-[170px] sm:max-w-[200px] text-xs sm:text-sm font-black uppercase tracking-wider shadow-elevated rounded-2xl bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {t.requestQuote}
                        </Button>
                    ) : (
                        <Button
                            onClick={onAction}
                            className="btn-action h-11 sm:h-12 flex-1 max-w-[170px] sm:max-w-[200px] text-xs sm:text-sm font-black uppercase tracking-wider shadow-elevated rounded-2xl text-white"
                        >
                            {getActionButtonText()}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
