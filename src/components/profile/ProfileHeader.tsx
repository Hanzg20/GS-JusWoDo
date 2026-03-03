import { useNavigate } from "react-router-dom";
import { UserCircle2, ChevronRight, Shield, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConfigStore } from "@/stores/configStore";
import {
    Dialog,
    DialogContent,
    DialogTrigger,
} from "@/components/ui/dialog";
import { JWDCodeQR } from "./JWDCodeQR";

interface ProfileHeaderProps {
    currentUser: any;
    isProvider: boolean;
}

export function ProfileHeader({ currentUser, isProvider }: ProfileHeaderProps) {
    const navigate = useNavigate();
    const { language } = useConfigStore();

    const t = {
        viewSocialProfile: language === 'zh' ? '查看社交主页' : 'My Public Profile',
        jwdCodeLabel: language === 'zh' ? '展示我的渥帮码' : 'My JWD Code'
    };

    return (
        <div className="bg-white/80 backdrop-blur-md rounded-[32px] p-6 shadow-sm border border-white/20 flex items-center justify-between relative overflow-hidden">
            {/* Decorative background accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-10 -mt-10 blur-3xl pointer-events-none" />

            <div className="flex items-center gap-4 relative z-10">
                <div className="relative">
                    <img
                        src={currentUser.avatar}
                        className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
                        alt=""
                    />
                    {isProvider && (
                        <div className="absolute -bottom-1 -right-1 bg-primary text-white p-1 rounded-full border-2 border-white shadow-sm">
                            <Shield className="w-3 h-3" />
                        </div>
                    )}
                </div>
                <div>
                    <h2 className="text-xl font-black tracking-tight">{currentUser.name}</h2>
                    <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground font-medium font-mono opacity-70">ID: {currentUser.id.slice(0, 8)}</p>
                        {currentUser.jwdCode && (
                            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold">
                                {currentUser.jwdCode}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-end gap-2 relative z-10">
                <Dialog>
                    <DialogTrigger asChild>
                        <Button
                            variant="outline"
                            size="icon"
                            className="w-10 h-10 rounded-2xl bg-white border-primary/10 text-primary shadow-sm hover:bg-primary hover:text-white transition-all group"
                        >
                            <QrCode className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-[340px] p-0 border-none bg-transparent shadow-none">
                        <JWDCodeQR
                            jwdCode={currentUser.jwdCode || 'JWD-AUTH-ERR'}
                            userId={currentUser.id}
                            userName={currentUser.name}
                        />
                    </DialogContent>
                </Dialog>

                <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-0 text-primary font-bold text-[10px] flex gap-1 items-center hover:bg-transparent p-0"
                    onClick={() => navigate(`/user/${currentUser.id}`)}
                >
                    <UserCircle2 className="w-3 h-3" />
                    {t.viewSocialProfile}
                    <ChevronRight className="w-3 h-3" />
                </Button>
            </div>
        </div>
    );
}
