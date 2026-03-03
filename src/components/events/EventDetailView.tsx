import React, { useState, useEffect } from 'react';
import { ListingMaster, ListingItem, User } from '@/types/domain';
import { useConfigStore } from '@/stores/configStore';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, Phone, ArrowLeft, Share2, Heart, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { QRCodeSVG } from 'qrcode.react';

interface EventDetailViewProps {
    master: ListingMaster;
    item: ListingItem;
    provider: any;
    onChat: () => void;
}

export function EventDetailView({ master, item, provider, onChat }: EventDetailViewProps) {
    const navigate = useNavigate();
    const { language } = useConfigStore();
    const { currentUser } = useAuthStore();
    const [isRSVPing, setIsRSVPing] = useState(false);
    const [rsvpStatus, setRsvpStatus] = useState<'NONE' | 'PENDING' | 'ATTENDED' | 'CANCELLED'>('NONE');
    const [rsvpCount, setRsvpCount] = useState(0);

    const eventMetadata = master.metadata || {};
    const beanCommitment = parseInt(eventMetadata.beanCommitment) || 0;
    const maxParticipants = parseInt(eventMetadata.maxParticipants) || 0;
    const eventTime = eventMetadata.eventTime ? new Date(eventMetadata.eventTime) : null;

    useEffect(() => {
        if (currentUser) {
            checkRSVPStatus();
        }
        fetchRSVPCount();
    }, [master.id, currentUser?.id]);

    const checkRSVPStatus = async () => {
        const { data, error } = await supabase
            .from('event_rsvps')
            .select('status')
            .eq('event_id', master.id)
            .eq('user_id', currentUser?.id)
            .maybeSingle();

        if (data) {
            setRsvpStatus(data.status as any);
        }
    };

    const fetchRSVPCount = async () => {
        const { count } = await supabase
            .from('event_rsvps')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', master.id);

        setRsvpCount(count || 0);
    };

    const handleRSVP = async () => {
        if (!currentUser) {
            toast.error(language === 'zh' ? '请先登录' : 'Please login first');
            navigate('/login');
            return;
        }

        if (currentUser.beansBalance < beanCommitment) {
            toast.error(language === 'zh' ? '金豆不足以参与承诺' : 'Insufficient JinBeans for commitment');
            return;
        }

        setIsRSVPing(true);
        try {
            const { error } = await supabase
                .from('event_rsvps')
                .insert({
                    event_id: master.id,
                    user_id: currentUser.id,
                    commitment_amount: beanCommitment,
                    status: 'PENDING'
                });

            if (error) throw error;

            toast.success(language === 'zh' ? '报名成功！承诺金已锁定。' : 'RSVP successful! Commitment locked.');
            setRsvpStatus('PENDING');
            fetchRSVPCount();
            // Refresh balance in auth store
            if (useAuthStore.getState().refreshBalance) {
                await useAuthStore.getState().refreshBalance();
            }
        } catch (error: any) {
            console.error("RSVP error:", error);
            toast.error(language === 'zh' ? '报名失败' : 'Failed to RSVP');
        } finally {
            setIsRSVPing(false);
        }
    };

    const t = {
        join: language === 'zh' ? '立即报名' : 'Join Event',
        joined: language === 'zh' ? '已报名' : 'RSVPed',
        full: language === 'zh' ? '报名已满' : 'Event Full',
        commitment: language === 'zh' ? `承诺金: ${beanCommitment} 豆` : `Commitment: ${beanCommitment} Beans`,
        commitmentDesc: language === 'zh' ? '如约参加后全额退还' : 'Fully refunded upon attendance',
        host: language === 'zh' ? '活动组织者' : 'Event Host',
        details: language === 'zh' ? '活动详情' : 'Event Details',
        location: language === 'zh' ? '地点' : 'Location',
        time: language === 'zh' ? '时间' : 'Time',
        participants: language === 'zh' ? '参与者' : 'Participants',
        showQR: language === 'zh' ? '出示签到码' : 'Show Check-in QR'
    };

    return (
        <div className="bg-[#F8F9FA] min-h-screen">
            {/* Header / Hero */}
            <div className="relative h-72 w-full overflow-hidden">
                <img
                    src={master.images[0]}
                    className="w-full h-full object-cover"
                    alt={master.titleZh}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/40"
                        onClick={() => navigate(-1)}
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="rounded-full bg-white/20 backdrop-blur-md text-white">
                            <Share2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="rounded-full bg-white/20 backdrop-blur-md text-white">
                            <Heart className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <div className="absolute bottom-6 left-6 right-6 text-white">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-lg">
                            {eventMetadata.eventType || 'EVENT'}
                        </span>
                        {beanCommitment > 0 && (
                            <span className="bg-amber-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-lg flex items-center gap-1">
                                <Sparkles className="w-3 h-3" /> {beanCommitment} BEANS
                            </span>
                        )}
                    </div>
                    <h1 className="text-3xl font-black tracking-tight drop-shadow-md">
                        {language === 'zh' ? master.titleZh : master.titleEn || master.titleZh}
                    </h1>
                </div>
            </div>

            {/* Content Area */}
            <div className="container max-w-2xl px-4 -mt-6 relative z-10 pb-32">
                {/* Status Card */}
                {rsvpStatus !== 'NONE' && (
                    <div className="bg-primary text-white p-4 rounded-3xl shadow-xl flex items-center justify-between mb-6 animate-in zoom-in duration-300">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-2xl">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="font-black text-lg leading-none">{t.joined}</p>
                                <p className="text-[10px] opacity-80 uppercase font-bold tracking-widest mt-1">Status: {rsvpStatus}</p>
                            </div>
                        </div>
                        {rsvpStatus === 'PENDING' && (
                            <div className="p-1 bg-white rounded-xl shadow-inner">
                                <QRCodeSVG
                                    value={`jwd://event/${master.id}?user=${currentUser?.id}`}
                                    size={48}
                                    level="L"
                                />
                            </div>
                        )}
                    </div>
                )}

                <div className="space-y-6">
                    {/* Event Quick Info */}
                    <div className="bg-white rounded-[32px] p-6 shadow-sm border border-border/5 space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-red-50 text-red-500 rounded-2xl">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{t.time}</p>
                                <p className="font-black">
                                    {eventTime?.toLocaleString(language === 'zh' ? 'zh-CN' : 'en-CA', {
                                        weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                    })}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl">
                                <MapPin className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{t.location}</p>
                                <p className="font-black">{master.location?.fullAddress}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-50 text-green-500 rounded-2xl">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{t.participants}</p>
                                <p className="font-black">
                                    {rsvpCount} {maxParticipants > 0 ? `/ ${maxParticipants}` : ''}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="bg-white rounded-[32px] p-6 shadow-sm border border-border/5">
                        <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-4">{t.details}</h2>
                        <div className="prose prose-sm max-w-none">
                            <p className="whitespace-pre-wrap leading-relaxed text-slate-700">
                                {language === 'zh' ? master.descriptionZh : master.descriptionEn || master.descriptionZh}
                            </p>
                        </div>
                    </div>

                    {/* Host Card */}
                    <div className="bg-white rounded-[32px] p-6 shadow-sm border border-border/5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <img
                                src={provider?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${provider?.id}`}
                                className="w-12 h-12 rounded-2xl object-cover shadow-sm"
                                alt=""
                            />
                            <div>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{t.host}</p>
                                <p className="font-black text-lg">{provider?.name || provider?.businessNameZh || 'Neighbor'}</p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full font-bold border-primary/10 text-primary hover:bg-primary/5"
                            onClick={onChat}
                        >
                            <Phone className="w-4 h-4 mr-2" />
                            {language === 'zh' ? '私聊' : 'Chat'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Sticky Action Footer */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-border/10 z-50">
                <div className="max-w-2xl mx-auto flex items-center gap-4">
                    <div className="flex-1">
                        {rsvpStatus === 'NONE' ? (
                            <>
                                <p className="text-2xl font-black text-primary">${item.pricing.price.amount / 100}</p>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                                    {beanCommitment > 0 ? t.commitment : (language === 'zh' ? '免费活动' : 'Free Event')}
                                </p>
                            </>
                        ) : (
                            <>
                                <p className="text-lg font-black text-green-600 flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5" /> {t.joined}
                                </p>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{t.commitmentDesc}</p>
                            </>
                        )}
                    </div>

                    <Button
                        onClick={handleRSVP}
                        disabled={isRSVPing || rsvpStatus !== 'NONE' || (maxParticipants > 0 && rsvpCount >= maxParticipants)}
                        className={`h-14 px-8 rounded-2xl font-black text-lg transition-all shadow-xl ${rsvpStatus !== 'NONE' ? 'bg-green-100 text-green-600 hover:bg-green-100 shadow-none' : 'shadow-primary/20 hover:scale-[1.02]'
                            }`}
                    >
                        {isRSVPing ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : rsvpStatus !== 'NONE' ? (
                            t.joined
                        ) : (maxParticipants > 0 && rsvpCount >= maxParticipants) ? (
                            t.full
                        ) : (
                            t.join
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
