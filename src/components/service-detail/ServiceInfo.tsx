import { Badge } from "@/components/ui/badge";
import { Sparkles, Check, Video } from "lucide-react";
import { MediaEmbed } from "@/components/Community/MediaEmbed";
import { ListingMaster } from "@/types/domain";
import { getTranslation } from "@/stores/listingStore";
import { useConfigStore } from "@/stores/configStore";

interface ServiceInfoProps {
    master: ListingMaster;
    categoryName?: string;
}

export function ServiceInfo({ master, categoryName }: ServiceInfoProps) {
    const { language } = useConfigStore();

    return (
        <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-black text-foreground tracking-tight leading-none">
                    {getTranslation(master, 'title')}
                </h1>
            </div>

            {categoryName && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest rounded-full mb-4">
                    <Sparkles className="w-3 h-3" />
                    {categoryName}
                </div>
            )}

            <p className="text-sm font-medium text-muted-foreground leading-relaxed mb-6">
                {getTranslation(master, 'description')}
            </p>

            <div className="flex flex-wrap gap-2 mb-8">
                {master.tags.map(tag => (
                    <span key={tag} className="px-3 py-1.5 bg-muted/50 rounded-xl text-[10px] font-black text-muted-foreground flex items-center gap-1 uppercase tracking-tighter hover:bg-muted transition-colors">
                        <Check className="w-3 h-3 text-primary" /> {tag}
                    </span>
                ))}
            </div>

            {/* Video Embed */}
            {master.mediaUrl && (
                <div className="mb-8">
                    <h3 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2 mb-4">
                        <div className="w-1.5 h-4 bg-primary rounded-full" />
                        {language === 'zh' ? '视频介绍' : 'Video Introduction'}
                    </h3>
                    <MediaEmbed content={master.mediaUrl} />
                </div>
            )}
        </div>
    );
}
