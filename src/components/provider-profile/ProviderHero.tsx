import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShareSheet } from "@/components/common/ShareSheet";
import {
    CheckCircle2, Scale, Building2, Zap, ShieldCheck, Award,
    Star, TrendingUp, Clock, MapPin, MessageCircle, Share2
} from "lucide-react";
import { ProviderProfile } from "@/types/domain";
import { useConfigStore } from "@/stores/configStore";

interface ProviderHeroProps {
    provider: ProviderProfile;
    businessName: string;
    description: string;
    avatarUrl?: string;
    avgRating: number;
    reviewCount: number;
    listingCount: number;
    yearsActive: number;
    isOwner: boolean;
    onContact: () => void;
    onEdit: () => void;
}

export function ProviderHero({
    provider,
    businessName,
    description,
    avatarUrl,
    avgRating,
    reviewCount,
    listingCount,
    yearsActive,
    isOwner,
    onContact,
    onEdit
}: ProviderHeroProps) {
    const { language } = useConfigStore();

    const t = {
        verified: language === 'zh' ? '已认证' : 'Verified',
        elite: language === 'zh' ? '精英邻居' : 'Elite Neighbor',
        reviews: language === 'zh' ? '条评价' : 'reviews',
        services: language === 'zh' ? '个服务' : 'Services',
        years: language === 'zh' ? '年经验' : 'years exp',
        year: language === 'zh' ? '年经验' : 'year exp',
        contact: language === 'zh' ? '联系提供商' : 'Contact Provider',
        share: language === 'zh' ? '分享' : 'Share',
        settings: language === 'zh' ? '设置' : 'Settings',
        defaultBio: language === 'zh' ? '专业服务提供商' : 'Professional service provider',
    };

    return (
        <Card className="p-8 mb-8 bg-gradient-to-br from-white to-primary/5">
            <div className="flex flex-col md:flex-row gap-6">
                {/* Avatar */}
                <div className="shrink-0">
                    <Avatar className="w-32 h-32 border-4 border-white shadow-xl">
                        <AvatarImage src={avatarUrl} alt={businessName} />
                        <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-primary to-primary/60 text-white">
                            {businessName?.[0] || 'P'}
                        </AvatarFallback>
                    </Avatar>
                </div>

                {/* Provider Info */}
                <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h1 className="text-3xl font-black">{businessName}</h1>

                        {/* Badges */}
                        {provider.isVerified && (
                            <Badge variant="default" className="gap-1 bg-blue-600">
                                <CheckCircle2 className="w-3 h-3" />
                                {t.verified}
                            </Badge>
                        )}

                        {/* Professional Credentials Badges */}
                        {provider.credentials && provider.credentials.filter(c => c.status === 'VERIFIED').map(c => {
                            const config = {
                                'LAWYER': { icon: Scale, label: language === 'zh' ? '认证律师' : 'Verified Lawyer', color: 'bg-indigo-600' },
                                'REAL_ESTATE_AGENT': { icon: Building2, label: language === 'zh' ? 'RECO认证经纪' : 'RECO Verified', color: 'bg-emerald-600' },
                                'ELECTRICIAN': { icon: Zap, label: language === 'zh' ? 'ESA持证电工' : 'ESA Licensed', color: 'bg-amber-600' },
                                'HVAC': { icon: Zap, label: language === 'zh' ? 'TSSA认证' : 'TSSA Certified', color: 'bg-orange-600' },
                            }[c.type] || { icon: ShieldCheck, label: c.type, color: 'bg-slate-600' };

                            return (
                                <Badge key={c.id} className={`gap-1 ${config.color} text-white`}>
                                    <config.icon className="w-3 h-3" />
                                    {config.label}
                                </Badge>
                            );
                        })}

                        {avgRating >= 4.8 && reviewCount >= 20 && (
                            <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-800 border-amber-200">
                                <Award className="w-3 h-3" />
                                {t.elite}
                            </Badge>
                        )}
                    </div>

                    <p className="text-muted-foreground mb-4 max-w-2xl">
                        {description || t.defaultBio}
                    </p>

                    {/* Stats Row */}
                    <div className="flex flex-wrap gap-6 mb-6">
                        <div className="flex items-center gap-2">
                            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                            <span className="font-bold text-lg">{avgRating.toFixed(1)}</span>
                            <span className="text-sm text-muted-foreground">
                                ({reviewCount} {t.reviews})
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            <span className="font-semibold">
                                {listingCount} {t.services}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                                {yearsActive > 1 ? `${yearsActive} ${t.years}` : `1 ${t.year}`}
                            </span>
                        </div>

                        {provider.location?.address && (
                            <div className="flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                    {provider.location.address}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <Button onClick={onContact} className="gap-2">
                            <MessageCircle className="w-4 h-4" />
                            {t.contact}
                        </Button>
                        <ShareSheet
                            title={businessName || 'Provider Profile'}
                            content={description || t.defaultBio}
                            imageUrl={avatarUrl}
                            authorName={businessName || 'Gig Neighbor'}
                            authorAvatar={avatarUrl}
                            trigger={
                                <Button variant="outline" className="gap-2">
                                    <Share2 className="w-4 h-4" />
                                    {t.share}
                                </Button>
                            }
                        />

                        {/* Edit Button for Owner */}
                        {isOwner && (
                            <Button variant="secondary" onClick={onEdit} className="gap-2">
                                {t.settings}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
}
