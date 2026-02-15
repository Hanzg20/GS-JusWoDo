import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Award, ShieldCheck, MapPin } from "lucide-react";
import { ProviderProfile } from "@/types/domain";
import { useConfigStore } from "@/stores/configStore";

interface ProviderAboutTabProps {
    provider: ProviderProfile;
    yearsActive: number;
}

export function ProviderAboutTab({ provider, yearsActive }: ProviderAboutTabProps) {
    const { language } = useConfigStore();
    const t = {
        aboutTitle: language === 'zh' ? '关于此提供商' : 'About This Provider',
        experience: language === 'zh' ? '经验' : 'Experience',
        activeFor: language === 'zh' ? '从业' : 'Active for',
        years: language === 'zh' ? '年' : 'years',
        year: language === 'zh' ? '年' : 'year',
        certifications: language === 'zh' ? '认证资质' : 'Certifications',
        professionalVerification: language === 'zh' ? '专业认证详情' : 'Professional Verification',
        serviceArea: language === 'zh' ? '服务范围' : 'Service Area',
        bio: language === 'zh' ? '简介' : 'Bio',
        licenseNumber: language === 'zh' ? '证书编号: ' : 'License #: ',
        jurisdiction: language === 'zh' ? '注册地: ' : 'Jurisdiction: ',
        verifiedOn: language === 'zh' ? '验证于 ' : 'Verified on ',
    };

    const description = language === 'zh'
        ? (provider?.descriptionZh || provider?.descriptionEn)
        : (provider?.descriptionEn || provider?.descriptionZh);

    return (
        <Card className="p-8">
            <h3 className="text-xl font-bold mb-6">
                {t.aboutTitle}
            </h3>

            <div className="space-y-6">
                <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" />
                        {t.experience}
                    </h4>
                    <p className="text-muted-foreground">
                        {t.activeFor} {yearsActive} {yearsActive > 1 ? t.years : t.year}
                    </p>
                </div>

                {provider.licenseInfo && (
                    <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <Award className="w-4 h-4 text-primary" />
                            {t.certifications}
                        </h4>
                        <p className="text-muted-foreground">{provider.licenseInfo}</p>
                    </div>
                )}

                {provider.credentials && provider.credentials.length > 0 && (
                    <div className="pt-4 border-t">
                        <h4 className="font-semibold mb-4 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-primary" />
                            {t.professionalVerification}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {provider.credentials.map(c => (
                                <Card key={c.id} className="p-4 bg-muted/30 border-none">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-sm font-bold text-primary">{c.type.replace('_', ' ')}</span>
                                        <Badge variant={c.status === 'VERIFIED' ? 'default' : 'secondary'} className="text-[10px] h-5">
                                            {c.status}
                                        </Badge>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground">
                                            {t.licenseNumber}
                                            <span className="text-foreground font-mono">{c.licenseNumber}</span>
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {t.jurisdiction}
                                            <span className="text-foreground">{c.jurisdiction}</span>
                                        </p>
                                        {c.verifiedAt && (
                                            <p className="text-[10px] text-muted-foreground italic pt-1">
                                                {t.verifiedOn}
                                                {new Date(c.verifiedAt).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        {t.serviceArea}
                    </h4>
                    <p className="text-muted-foreground">
                        {provider.location?.address || 'Ottawa, ON'}
                    </p>
                </div>

                {description && (
                    <div>
                        <h4 className="font-semibold mb-2">
                            {t.bio}
                        </h4>
                        <p className="text-muted-foreground leading-relaxed">
                            {description}
                        </p>
                    </div>
                )}
            </div>
        </Card>
    );
}
