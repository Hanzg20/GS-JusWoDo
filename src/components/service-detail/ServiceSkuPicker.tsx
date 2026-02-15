import { Check, Sparkles } from "lucide-react";
import { ListingItem } from "@/types/domain";
import { getTranslation } from "@/stores/listingStore";
import { useConfigStore } from "@/stores/configStore";

interface ServiceSkuPickerProps {
    items: ListingItem[];
    selectedItem: ListingItem | null;
    onSelect: (item: ListingItem) => void;
}

export function ServiceSkuPicker({ items, selectedItem, onSelect }: ServiceSkuPickerProps) {
    const { language } = useConfigStore();

    if (!items || items.length === 0) return null;

    return (
        <div className="mt-8 border-t border-border/10 pt-8">
            <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-primary rounded-full" />
                    {language === 'zh' ? '选择选项' : 'Select Option'}
                </h3>
            </div>
            <div className="grid gap-3">
                {items.map(item => (
                    <div
                        key={item.id}
                        onClick={() => onSelect(item)}
                        className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer group relative overflow-hidden active:scale-[0.99] ${selectedItem?.id === item.id ? 'border-primary bg-primary/5 shadow-warm' : 'border-transparent bg-muted/30 hover:bg-muted/50'}`}
                    >
                        {selectedItem?.id === item.id && (
                            <div className="absolute top-0 right-0 w-8 h-8 bg-primary rounded-bl-2xl flex items-center justify-center animate-in fade-in zoom-in duration-300">
                                <Check className="w-4 h-4 text-white" />
                            </div>
                        )}
                        <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${selectedItem?.id === item.id ? 'bg-primary text-white shadow-warm' : 'bg-muted text-muted-foreground'}`}>
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <div>
                                <p className={`font-black text-sm transition-colors uppercase tracking-tight ${selectedItem?.id === item.id ? 'text-primary' : 'group-hover:text-primary'}`}>{getTranslation(item, 'name')}</p>
                                <p className="text-[11px] font-bold text-muted-foreground/80 lowercase leading-tight">{getTranslation(item, 'description')}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-black text-primary text-lg tracking-tighter">${item.pricing.price.amount / 100}</p>
                            <p className="text-[9px] font-black text-muted-foreground uppercase opacity-50">/{item.pricing.unit || 'hr'}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
