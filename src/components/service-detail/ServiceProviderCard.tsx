import { Link } from "react-router-dom";
import { Shield, Award, MapPin, Star, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import NavigationButton from "@/components/NavigationButton";
import { cn } from "@/lib/utils";
import { getTranslation } from "@/stores/listingStore";
import { useConfigStore } from "@/stores/configStore";

interface ServiceProviderCardProps {
    provider: any; // Using any for simplicity as it can be Provider or User
    master: any; // ListingMaster
    distance: number | null;
    isInArea: boolean;
    onChat: () => void;
}

export function ServiceProviderCard({ provider, master, distance, isInArea, onChat }: ServiceProviderCardProps) {
    const { language } = useConfigStore();

    if (!provider) return null;

    const t = {
        merchant: language === 'zh' ? '商家' : 'Merchant',
        neighbor: language === 'zh' ? '邻居' : 'Neighbor',
        vouched: language === 'zh' ? '人担保' : 'Vouched',
        verifiedInsurance: language === 'zh' ? '保险已验证' : 'Verified Insurance',
        professionalLicense: language === 'zh' ? '专业执照' : 'Professional License',
        inArea: language === 'zh' ? '您在服务范围内' : 'In Service Area',
        outArea: language === 'zh' ? '超出服务范围' : 'Outside Service Area',
    };

    return (
        <div className="card-warm p-6 mb-6 shadow-glow border-none relative overflow-hidden">
            {/* Decorative Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />

            {/* Provider Profile (Neighbor Trust Section) */}
            <div className="flex items-center gap-4 mb-6">
                <Link to={`/provider/${provider.id}`} className="relative group cursor-pointer block">
                    <div className="w-16 h-16 rounded-3xl overflow-hidden border-2 border-white shadow-card group-hover:shadow-lg transition-all">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${provider.id}`} alt="Provider" className="w-full h-full object-cover bg-muted" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-xl flex items-center justify-center border-2 border-white shadow-sm">
                        <Shield className="w-3 h-3 text-white" />
                    </div>
                </Link>
                <div className="flex-1">
                    <Link to={`/provider/${provider.id}`} className="block group cursor-pointer">
                        <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-xl font-black text-foreground tracking-tight group-hover:text-primary transition-colors">
                                {provider.businessNameEn || provider.businessNameZh || provider.name || t.neighbor}
                            </h2>
                            <Badge className="bg-primary/10 text-primary border-none text-[10px] font-black tracking-tighter uppercase px-2 py-0">
                                {provider.identity === 'MERCHANT' ? t.merchant : t.neighbor}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 px-2 py-1 bg-secondary/10 rounded-lg">
                                <Star className="w-3 h-3 fill-secondary text-secondary" />
                                <span className="text-xs font-black text-foreground">{provider.stats.averageRating}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground">
                                <Award className="w-3 h-3 text-primary" />
                                <span>{provider.stats.reviewCount} {t.vouched}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground">
                                <MapPin className="w-3 h-3" />
                                <span>{provider.location.address?.split(',')[0]}</span>
                            </div>

                            {/* Distance Badge */}
                            {distance !== null && (
                                <div className={cn(
                                    "flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight w-fit ml-auto sm:ml-0 sm:mt-0 mt-2",
                                    isInArea ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-orange-50 text-orange-600 border border-orange-100"
                                )}>
                                    <MapPin className="w-3 h-3" />
                                    <span>
                                        {isInArea ? t.inArea : t.outArea}
                                        · {distance > 1000 ? `${(distance / 1000).toFixed(1)}km` : `${Math.round(distance)}m`}
                                    </span>
                                </div>
                            )}
                        </div>
                    </Link>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <NavigationButton
                            latitude={master?.location?.coordinates?.lat || 0}
                            longitude={master?.location?.coordinates?.lng || 0}
                            address={master?.location?.fullAddress}
                            label={getTranslation(master, 'title')}
                            variant="outline"
                            size="icon"
                            className="w-10 h-10 rounded-2xl border-primary/10 bg-primary/5 hover:bg-primary/10"
                        />
                        <button
                            onClick={onChat}
                            className="w-10 h-10 rounded-2xl bg-primary/5 flex items-center justify-center hover:bg-primary/10 transition-colors border border-primary/10"
                        >
                            <MessageCircle className="w-5 h-5 text-primary" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Trust Indicators */}
            {(provider?.insuranceSummaryEn || provider?.licenseInfo) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                    {provider?.insuranceSummaryEn && (
                        <div className="flex items-start gap-3 p-4 rounded-3xl bg-emerald-50/40 border border-emerald-100/50 group hover:bg-emerald-50 transition-all duration-300">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0 shadow-sm shadow-emerald-200/50">
                                <Shield className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-0.5">{t.verifiedInsurance}</p>
                                <p className="text-sm font-bold text-emerald-900/80 leading-tight">{provider.insuranceSummaryEn}</p>
                            </div>
                        </div>
                    )}
                    {provider?.licenseInfo && (
                        <div className="flex items-start gap-3 p-4 rounded-3xl bg-blue-50/40 border border-blue-100/50 group hover:bg-blue-50 transition-all duration-300">
                            <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center shrink-0 shadow-sm shadow-blue-200/50">
                                <Award className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-0.5">{t.professionalLicense}</p>
                                <p className="text-sm font-bold text-blue-900/80 leading-tight">{provider.licenseInfo}</p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
