import { ListingMaster, ListingItem, User, ProviderProfile } from "@/types/domain";
import { Link } from "react-router-dom";
import { ArrowLeft, Calendar, MapPin, MessageCircle, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useConfigStore } from "@/stores/configStore";
import { getTranslation } from "@/stores/listingStore";

interface TaskDetailViewProps {
    master: ListingMaster;
    item: ListingItem;
    author: User | ProviderProfile;
    onQuote: () => void;
    onChat: () => void;
}

export const TaskDetailView = ({ master, item, author, onQuote, onChat }: TaskDetailViewProps) => {
    const { language } = useConfigStore();

    const t = {
        budget: language === 'zh' ? '预算' : 'Budget',
        postedBy: language === 'zh' ? '发布者' : 'Posted by',
        deadline: language === 'zh' ? '截止日期' : 'Deadline',
        location: language === 'zh' ? '地点' : 'Location',
        chat: language === 'zh' ? '私信' : 'Chat',
        submitQuote: language === 'zh' ? '提交报价' : 'Submit Quote',
        taskDetails: language === 'zh' ? '任务详情' : 'Task Details',
    };

    return (
        <div className="min-h-screen bg-background pb-32">
            <div className="container max-w-lg pt-6">
                <Link to="/" className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-muted mb-6">
                    <ArrowLeft className="w-5 h-5 text-foreground" />
                </Link>

                <div className="mb-6">
                    <Badge variant="outline" className="mb-2 border-primary text-primary font-black uppercase tracking-widest">
                        Task
                    </Badge>
                    <h1 className="text-3xl font-black text-foreground leading-tight mb-2">
                        {getTranslation(master, 'title')}
                    </h1>
                    <div className="flex items-center gap-2 text-2xl font-black text-green-600">
                        <span>${item.pricing.price.amount / 100}</span>
                        <span className="text-sm text-muted-foreground font-bold uppercase tracking-wider">{t.budget}</span>
                    </div>
                </div>

                <div className="card-warm p-6 mb-6 shadow-sm border border-border/50">
                    <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-4">{t.taskDetails}</h3>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="flex items-start gap-3">
                            <Calendar className="w-5 h-5 text-primary mt-0.5" />
                            <div>
                                <p className="text-[10px] uppercase font-bold text-muted-foreground">{t.deadline}</p>
                                <p className="font-bold">Flexible</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-primary mt-0.5" />
                            <div>
                                <p className="text-[10px] uppercase font-bold text-muted-foreground">{t.location}</p>
                                <p className="font-bold">{master.location.fullAddress?.split(',')[0] || 'Remote'}</p>
                            </div>
                        </div>
                    </div>

                    <p className="text-sm font-medium text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {getTranslation(master, 'description')}
                    </p>
                </div>

                <Link to={`/provider/${author?.id}`} className="flex items-center gap-4 p-4 bg-muted/30 rounded-3xl mb-8 hover:bg-muted/50 transition-colors cursor-pointer block">
                    <img src={author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${author?.id}`} className="w-12 h-12 rounded-2xl bg-white shadow-sm object-cover" />
                    <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase">{t.postedBy}</p>
                        <p className="font-black text-lg">
                            {(author && 'businessNameEn' in author)
                                ? (author.businessNameEn || author.businessNameZh || 'Neighbor')
                                : ((author as any)?.name || 'Neighbor')}
                        </p>
                    </div>
                </Link>
            </div>

            {/* Fixed Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-4 glass-sticky-bar border-t border-border/10 z-50">
                <div className="container max-w-lg flex gap-3">
                    <Button variant="outline" size="lg" className="flex-1 rounded-2xl font-bold gap-2" onClick={onChat}>
                        <MessageCircle className="w-5 h-5 text-primary" />
                        {t.chat}
                    </Button>
                    <Button size="lg" className="flex-[2] rounded-2xl font-black shadow-warm bg-primary hover:bg-primary/90 border-none" onClick={onQuote}>
                        <FileText className="w-5 h-5 mr-2" />
                        {t.submitQuote}
                    </Button>
                </div>
            </div>
        </div>
    );
};
