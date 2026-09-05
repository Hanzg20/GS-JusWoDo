import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, Flag } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useConfigStore } from "@/stores/configStore";
import { reportRepository, ReportTargetType } from "@/services/repositories/supabase/ReportRepository";

interface ReportDialogProps {
    targetType: ReportTargetType;
    targetId: string;
    trigger: React.ReactNode;
}

export function ReportDialog({ targetType, targetId, trigger }: ReportDialogProps) {
    const navigate = useNavigate();
    const { currentUser } = useAuthStore();
    const { language } = useConfigStore();
    const isZh = language === 'zh';

    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState("");
    const [details, setDetails] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const reasons = [
        { value: "SPAM", label: isZh ? "垃圾广告" : "Spam or advertising" },
        { value: "SCAM", label: isZh ? "虚假信息/诈骗" : "Scam or false information" },
        { value: "INAPPROPRIATE", label: isZh ? "不当内容" : "Inappropriate content" },
        { value: "HARASSMENT", label: isZh ? "骚扰辱骂" : "Harassment or abuse" },
        { value: "OTHER", label: isZh ? "其他" : "Other" },
    ];

    const handleOpenChange = (next: boolean) => {
        if (next && !currentUser) {
            toast.error(isZh ? "请先登录" : "Please login first");
            navigate("/login");
            return;
        }
        setOpen(next);
        if (!next) {
            setReason("");
            setDetails("");
            setIsSubmitted(false);
        }
    };

    const handleSubmit = async () => {
        if (!currentUser || !reason) return;
        setIsSubmitting(true);
        try {
            await reportRepository.submitReport({
                reporterId: currentUser.id,
                targetType,
                targetId,
                reason,
                details: details.trim() || undefined
            });
            setIsSubmitted(true);
        } catch (error) {
            console.error("Failed to submit report:", error);
            toast.error(isZh ? "提交失败，请重试" : "Failed to submit. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                {isSubmitted ? (
                    <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-xl font-black">{isZh ? "举报已提交" : "Report submitted"}</h3>
                        <p className="text-sm text-muted-foreground max-w-xs">
                            {isZh ? "感谢反馈，我们会尽快处理。" : "Thanks for letting us know — we'll look into it."}
                        </p>
                        <Button variant="outline" onClick={() => handleOpenChange(false)}>
                            {isZh ? "关闭" : "Close"}
                        </Button>
                    </div>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Flag className="w-4 h-4 text-destructive" />
                                {isZh ? "举报" : "Report"}
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-5">
                            <RadioGroup value={reason} onValueChange={setReason} className="space-y-2">
                                {reasons.map(r => (
                                    <div key={r.value} className="flex items-center space-x-2">
                                        <RadioGroupItem value={r.value} id={r.value} />
                                        <Label htmlFor={r.value} className="font-medium cursor-pointer">{r.label}</Label>
                                    </div>
                                ))}
                            </RadioGroup>

                            <div className="space-y-2">
                                <Label>{isZh ? "补充说明（可选）" : "Additional details (optional)"}</Label>
                                <Textarea
                                    value={details}
                                    onChange={(e) => setDetails(e.target.value)}
                                    placeholder={isZh ? "告诉我们发生了什么..." : "Tell us what happened..."}
                                    className="h-24 resize-none"
                                />
                            </div>

                            <Button
                                className="w-full h-12 font-bold"
                                disabled={!reason || isSubmitting}
                                onClick={handleSubmit}
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (isZh ? "提交举报" : "Submit Report")}
                            </Button>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
