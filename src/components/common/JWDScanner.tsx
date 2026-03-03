import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useConfigStore } from '@/stores/configStore';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Loader2, X, Camera, ShieldCheck, UserPlus } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface JWDScannerProps {
    onClose: () => void;
}

export function JWDScanner({ onClose }: JWDScannerProps) {
    const { language } = useConfigStore();
    const { currentUser } = useAuthStore();
    const navigate = useNavigate();
    const [isScanning, setIsScanning] = useState(true);
    const [scannedResult, setScannedResult] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    useEffect(() => {
        // Initialize scanner
        const scanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            /* verbose= */ false
        );

        scanner.render(onScanSuccess, onScanFailure);
        scannerRef.current = scanner;

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(error => console.error("Failed to clear scanner", error));
            }
        };
    }, []);

    async function onScanSuccess(decodedText: string) {
        if (isProcessing) return;

        setIsScanning(false);
        setScannedResult(decodedText);
        setIsProcessing(true);

        try {
            // Pause scanner
            if (scannerRef.current) {
                await scannerRef.current.pause();
            }

            // Handle JWD URIs
            if (decodedText.startsWith('jwd://')) {
                const url = new URL(decodedText.replace('jwd://', 'https://jwd.app/'));
                const pathParts = url.pathname.split('/').filter(Boolean); // e.g. ["user", "uuid"] or ["event", "uuid"]

                if (pathParts[0] === 'user') {
                    const userId = pathParts[1];
                    toast.success(language === 'zh' ? '成功发现邻居！' : 'Neighbor discovered!');
                    navigate(`/user/${userId}`);
                    onClose();
                } else if (pathParts[0] === 'event') {
                    const eventId = pathParts[1];
                    // Handle event check-in
                    await handleEventCheckIn(eventId);
                } else {
                    toast.error(language === 'zh' ? '无效的渥帮码' : 'Invalid JWD code');
                    setIsScanning(true);
                }
            } else {
                toast.error(language === 'zh' ? '非渥帮专属码' : 'Not a JWD code');
                setIsScanning(true);
            }
        } catch (error) {
            console.error("Scan processing error:", error);
            toast.error(language === 'zh' ? '扫描处理出错' : 'Error processing scan');
            setIsScanning(true);
        } finally {
            setIsProcessing(false);
            if (scannerRef.current && isScanning) {
                scannerRef.current.resume();
            }
        }
    }

    function onScanFailure(error: any) {
        // Many failures are just "no QR code detected in frame", so we ignore them
    }

    async function handleEventCheckIn(eventId: string) {
        if (!currentUser) {
            toast.error(language === 'zh' ? '请先登录' : 'Please login first');
            return;
        }

        try {
            // Call the database function to check-in
            // We need to find the rsvp for this user and event first
            const { data: rsvp, error: rsvpError } = await supabase
                .from('event_rsvps')
                .select('id, status')
                .eq('event_id', eventId)
                .eq('user_id', currentUser.id)
                .single();

            if (rsvpError || !rsvp) {
                toast.error(language === 'zh' ? '您尚未报名此活动' : 'You have not RSVPed for this event');
                return;
            }

            if (rsvp.status === 'ATTENDED') {
                toast.info(language === 'zh' ? '您已过完成签到' : 'Already checked in');
                return;
            }

            // Call RPC
            const { error: checkInError } = await supabase.rpc('check_in_to_event', {
                p_rsvp_id: rsvp.id
            });

            if (checkInError) throw checkInError;

            toast.success(language === 'zh' ? '签到成功！承诺金已返还。' : 'Check-in successful! Commitment refunded.');
            onClose();
            navigate(`/event/${eventId}`);
        } catch (error: any) {
            console.error("Check-in error:", error);
            toast.error(language === 'zh' ? '签到失败' : 'Check-in failed');
        }
    }

    return (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center p-6 text-white overflow-hidden">
            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                        <Camera className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-black tracking-tight text-lg">JWD SCANNER</span>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Scanner Area */}
            <div className="w-full max-w-sm aspect-square relative rounded-[40px] overflow-hidden border-4 border-primary/30 bg-white/5 shadow-2xl shadow-primary/10">
                <div id="reader" className="w-full h-full"></div>

                {/* Overlay guides */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-64 h-64 border-2 border-primary rounded-3xl animate-pulse flex items-center justify-center">
                        <div className="w-4 h-4 bg-primary rounded-full animate-ping" />
                    </div>
                </div>

                {isProcessing && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300">
                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                        <p className="font-bold tracking-widest text-sm uppercase">Processing...</p>
                    </div>
                )}
            </div>

            {/* Bottom Info */}
            <div className="mt-12 text-center space-y-6 max-w-xs transition-all animate-in slide-in-from-bottom-4">
                <div>
                    <h3 className="text-xl font-black mb-2 uppercase italic tracking-tighter">
                        {language === 'zh' ? '扫描发现邻趣' : 'Scan for Neighborhood Fun'}
                    </h3>
                    <p className="text-white/60 text-sm leading-relaxed">
                        {language === 'zh'
                            ? '对准邻居个人主页二维码，或活动签到二维码'
                            : 'Align with a neighbor\'s passport or event check-in QR code'}
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-4 rounded-2xl flex flex-col items-center gap-2 border border-white/10">
                        <ShieldCheck className="w-6 h-6 text-primary" />
                        <span className="text-[10px] font-bold uppercase opacity-60">
                            {language === 'zh' ? '安全签到' : 'Secure RSVP'}
                        </span>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl flex flex-col items-center gap-2 border border-white/10">
                        <UserPlus className="w-6 h-6 text-primary" />
                        <span className="text-[10px] font-bold uppercase opacity-60">
                            {language === 'zh' ? '发现邻友' : 'Connect'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Decorative background atoms */}
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        </div>
    );
}
