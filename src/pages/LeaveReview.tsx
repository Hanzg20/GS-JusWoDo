import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ArrowLeft, Star, Heart, Loader2, LogIn, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { repositoryFactory } from "@/services/repositories/factory";
import { useAuthStore } from "@/stores/authStore";
import { useConfigStore } from "@/stores/configStore";
import { getTranslation } from "@/stores/listingStore";
import { setPostLoginRedirect } from "@/utils/postLoginRedirect";
import { ListingMaster, ProviderProfile, Review } from "@/types/domain";
import { toast } from "sonner";
import ImageUploader from "@/components/common/ImageUploader";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";

// Reached by scanning a provider's "get reviews" QR code (see
// ReviewQrDialog.tsx / MyListings.tsx) — deliberately NOT gated on a real
// `orders` row like ReviewSubmission.tsx is, because JWD has no platform
// checkout for most listings (browse+chat, deal off-platform — see
// jwd_launch_skips_escrow). This mirrors Google's own "get more reviews"
// link: anyone with the link can leave a review, on the honor system.
const LeaveReview = () => {
    const { listingId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser } = useAuthStore();
    const { language } = useConfigStore();
    const isZh = language === 'zh';

    const [master, setMaster] = useState<ListingMaster | null>(null);
    const [provider, setProvider] = useState<ProviderProfile | null>(null);
    const [existingReview, setExistingReview] = useState<Review | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [rating, setRating] = useState(5);
    const [dimensions, setDimensions] = useState<Record<string, number>>({
        Quality: 5,
        Communication: 5,
        Value: 5,
    });
    const [uploadedImages, setUploadedImages] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [content, setContent] = useState("");
    const [isNeighborStory, setIsNeighborStory] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            if (!listingId) return;
            try {
                const listingRepo = repositoryFactory.getListingRepository();
                const foundMaster = await listingRepo.getById(listingId);
                if (!foundMaster) {
                    setIsLoading(false);
                    return;
                }
                setMaster(foundMaster);

                const providerRepo = repositoryFactory.getProviderRepository();
                const foundProvider = await providerRepo.getById(foundMaster.providerId);
                setProvider(foundProvider);

                if (currentUser) {
                    const reviewRepo = repositoryFactory.getReviewRepository();
                    const reviews = await reviewRepo.getByListing(listingId);
                    const mine = reviews.find(r => r.buyerId === currentUser.id) || null;
                    setExistingReview(mine);
                }
            } catch (error) {
                console.error("Failed to load listing for review:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [listingId, currentUser]);

    const handleLoginRedirect = () => {
        setPostLoginRedirect(location.pathname);
        navigate('/login');
    };

    const handleSubmit = async () => {
        if (!currentUser || !master) return;
        setIsSubmitting(true);
        try {
            const reviewRepo = repositoryFactory.getReviewRepository();
            await reviewRepo.submitReview({
                listingId: master.id,
                buyerId: currentUser.id,
                providerId: master.providerId,
                rating,
                ratingDimensions: dimensions,
                content,
                media: uploadedImages,
                isNeighborStory,
            });

            if (isNeighborStory) {
                try {
                    const beanRepo = repositoryFactory.getBeanRepository();
                    await beanRepo.addTransaction({
                        userId: currentUser.id,
                        amount: 50,
                        type: 'STORY_BONUS',
                        descriptionZh: '评价故事奖励',
                        descriptionEn: 'Review story bonus'
                    });
                } catch (beanError) {
                    console.error("Failed to reward beans:", beanError);
                }
            }

            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#FFD700', '#FFA500', '#FF4500', '#4CAF50']
            });

            toast.success(isZh ? '评价提交成功，谢谢您！🎉' : 'Review submitted — thank you! 🎉');

            setTimeout(() => {
                navigate(`/service/${master.id}`);
            }, 2000);
        } catch (error) {
            console.error("Submission failed:", error);
            toast.error(isZh ? '提交失败，请重试' : 'Failed to submit review. Please try again.');
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>;
    }

    if (!master) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-8 text-center">
                <p className="text-muted-foreground font-medium">{isZh ? '未找到该服务，可能已下架。' : 'This listing could not be found — it may have been removed.'}</p>
            </div>
        );
    }

    const listingTitle = getTranslation(master, 'title', isZh ? 'Zh' : 'En');
    const businessName = provider
        ? (isZh
            ? (provider.businessNameZh || provider.businessNameEn)
            : (provider.businessNameEn || provider.businessNameZh))
        : '';

    return (
        <div className="min-h-screen bg-background pb-20">
            <div className="container max-w-xl py-8 px-4">
                <button onClick={() => navigate(`/service/${master.id}`)} className="flex items-center text-muted-foreground hover:text-foreground mb-8 group transition-colors">
                    <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                    <span className="font-black uppercase tracking-widest text-xs">{isZh ? '返回服务详情' : 'Back to Listing'}</span>
                </button>

                <motion.div
                    className="space-y-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="text-center md:text-left">
                        <h1 className="text-4xl font-black tracking-tighter mb-3 leading-none">
                            {isZh ? '留下您的评价' : 'Leave a Review'}
                        </h1>
                        <p className="text-muted-foreground font-medium text-lg leading-tight">
                            {isZh ? '您的反馈能帮到更多邻居！' : 'Your feedback helps other neighbors decide!'}
                        </p>
                    </div>

                    <Card className="p-6 border-none shadow-sm card-warm overflow-hidden relative group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/10 transition-colors" />
                        <div className="flex gap-4 items-center relative z-10">
                            <img src={master.images?.[0]} className="w-16 h-16 rounded-2xl object-cover shadow-card bg-muted" alt={listingTitle} />
                            <div className="flex-1 min-w-0">
                                <h2 className="font-black text-lg tracking-tight leading-none mb-1 truncate">{listingTitle}</h2>
                                {businessName && (
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-50 truncate">{businessName}</p>
                                )}
                            </div>
                        </div>
                    </Card>

                    {!currentUser ? (
                        <Card className="p-8 text-center rounded-[32px] border-none shadow-sm space-y-4">
                            <LogIn className="w-10 h-10 text-primary mx-auto" />
                            <p className="text-sm font-bold text-foreground">
                                {isZh ? '请先登录，才能为这个服务留下评价' : 'Log in first to leave a review for this service'}
                            </p>
                            <Button onClick={handleLoginRedirect} className="rounded-2xl h-12 px-8 font-black">
                                {isZh ? '登录 / 注册' : 'Log In / Sign Up'}
                            </Button>
                        </Card>
                    ) : provider && currentUser.id === provider.userId ? (
                        <Card className="p-8 text-center rounded-[32px] border-none shadow-sm space-y-2">
                            <p className="text-sm font-bold text-foreground">
                                {isZh ? '这是您自己发布的服务，无法给自己留评价。' : "This is your own listing — you can't review yourself."}
                            </p>
                        </Card>
                    ) : existingReview ? (
                        <Card className="p-8 text-center rounded-[32px] border-none shadow-sm space-y-3">
                            <CheckCircle2 className="w-10 h-10 text-primary mx-auto" />
                            <p className="text-sm font-bold text-foreground">
                                {isZh ? '您已经评价过这个服务了，感谢您的反馈！' : "You've already reviewed this service — thanks for your feedback!"}
                            </p>
                            <div className="flex items-center justify-center gap-1 pt-1">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <Star key={s} className={`w-5 h-5 ${s <= existingReview.rating ? 'fill-secondary text-secondary' : 'text-muted/30'}`} />
                                ))}
                            </div>
                            <Button variant="outline" onClick={() => navigate(`/service/${master.id}`)} className="rounded-2xl h-11 px-6 font-bold mt-2">
                                {isZh ? '查看服务详情' : 'View Listing'}
                            </Button>
                        </Card>
                    ) : (
                        <section className="space-y-8">
                            {/* Overall Rating */}
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-4 block leading-none text-center md:text-left">
                                    {isZh ? '整体体验' : 'Overall Experience'}
                                </label>
                                <div className="flex gap-3 justify-center md:justify-start">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <button key={s} onClick={() => setRating(s)} className="group relative focus:outline-none">
                                            <Star className={`w-12 h-12 transition-all duration-300 ${s <= rating ? 'fill-secondary text-secondary scale-110 drop-shadow-sm' : 'text-muted/20 group-hover:text-muted/40 hover:scale-105'}`} />
                                        </button>
                                    ))}
                                </div>
                            </motion.div>

                            {/* Dimensions */}
                            <motion.div
                                className="grid gap-6 bg-muted/20 p-8 rounded-[40px] border border-muted/30 shadow-inner"
                                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
                            >
                                {Object.keys(dimensions).map((dim) => (
                                    <div key={dim} className="flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-foreground/50">{dim}</span>
                                        <div className="flex gap-1.5">
                                            {[1, 2, 3, 4, 5].map((s) => (
                                                <button key={s} onClick={() => setDimensions({ ...dimensions, [dim]: s })} className="hover:scale-110 transition-transform focus:outline-none">
                                                    <Star className={`w-5 h-5 ${s <= dimensions[dim] ? 'fill-secondary text-secondary' : 'text-muted/20'}`} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </motion.div>

                            {/* Image Upload */}
                            <motion.div className="space-y-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground block leading-none">
                                    {isZh ? '添加照片（可选）' : 'Add Photos (Optional)'}
                                </label>
                                <div className="bg-white rounded-3xl border border-dashed border-muted-foreground/20 p-6 hover:bg-muted/5 transition-colors">
                                    <ImageUploader
                                        bucketName="review-media"
                                        onUpload={setUploadedImages}
                                        onUploadingChange={setIsUploading}
                                        maxFiles={3}
                                    />
                                </div>
                            </motion.div>

                            {/* Text Content */}
                            <motion.div className="space-y-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground block leading-none">
                                    {isZh ? '说说您的体验' : 'Tell the story'}
                                </label>
                                <Textarea
                                    placeholder={isZh ? '哪些地方做得好？有什么值得推荐给邻居的？' : 'What made this experience worth telling your neighbors about?'}
                                    className="min-h-[160px] rounded-[32px] border-none bg-muted/30 p-6 font-medium text-foreground focus-visible:ring-2 focus-visible:ring-primary/20 shadow-inner resize-none text-lg transition-all focus:bg-white"
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                />
                            </motion.div>

                            {/* Neighbor Story Toggle */}
                            <motion.div
                                className="flex items-center justify-between p-6 bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-[32px] border border-orange-100/50 group hover:shadow-sm transition-all"
                                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }}
                            >
                                <div className="flex gap-4 items-center">
                                    <div className="w-12 h-12 rounded-[20px] bg-white flex items-center justify-center shadow-sm text-orange-500">
                                        <Heart className="w-6 h-6 fill-orange-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-orange-950 tracking-tight">{isZh ? '升级为邻里故事' : 'Promote to Neighbor Stories'}</p>
                                        <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mt-0.5">{isZh ? '获得 50 金豆奖励 🎁' : 'Earn 50 JinBeans Reward 🎁'}</p>
                                    </div>
                                </div>
                                <Switch checked={isNeighborStory} onCheckedChange={setIsNeighborStory} className="data-[state=checked]:bg-orange-500" />
                            </motion.div>

                            {/* Submit Button */}
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
                                <Button
                                    onClick={handleSubmit}
                                    className="w-full h-20 rounded-[40px] text-lg font-black uppercase tracking-[0.2em] shadow-glow hover:shadow-glow-lg transition-all active:scale-95 disabled:opacity-50"
                                    disabled={isSubmitting || isUploading || !content || content.length < 5}
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" /> :
                                        isUploading ? (isZh ? '图片上传中...' : 'Uploading Images...') : (isZh ? '提交评价' : 'Submit Review')}
                                </Button>
                            </motion.div>
                        </section>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default LeaveReview;
