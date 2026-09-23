import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, MapPin, Send, Loader2, Edit2, Shield, Calendar, MapPinned } from "lucide-react";
import ImageUploader from "@/components/common/ImageUploader";
import { useAuthStore } from "@/stores/authStore";
import { useCommunityPostStore } from "@/stores/communityPostStore";
import { useConfigStore } from "@/stores/configStore";
import { toast } from "sonner";
import { CommunityPostType, FactType, FactData, FACT_TYPE_CONFIG } from "@/types/community";
import { MediaEmbed } from "./MediaEmbed";
import { RichTextEditor } from "./RichTextEditor";
import { checkMiniProgramContent, isWeChatMiniProgramWebview } from "@/lib/wechatShare";
import { checkGrokContentSafety, checkImageSafety } from "@/lib/grokContentModeration";
import { setPostLoginRedirect } from "@/utils/postLoginRedirect";
import { promptLogin } from "@/components/common/LoginRequired";

/** Strip HTML tags so moderation sees plain text */
function stripHtml(html: string): string {
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

interface LitePostProps {
    onSuccess?: () => void;
    trigger?: React.ReactNode;
    // Edit mode props
    postId?: string;
    initialData?: {
        title?: string;
        content: string;
        images: string[];
        mediaUrl?: string;
        price?: number;
        postType: CommunityPostType;
        nodeId?: string;
        // 真言相关
        isFact?: boolean;
        factData?: FactData;
    };
}

const LITE_CATEGORIES: { id: CommunityPostType; labelZh: string; labelEn: string; icon: string; tag: string }[] = [
    { id: 'MOMENT', labelZh: '邻里', labelEn: 'Neighbor', icon: '🏘️', tag: '#邻里' },
    { id: 'ACTION', labelZh: '参加', labelEn: 'Join', icon: '🤝', tag: '#活动' },
    { id: 'HELP', labelZh: '求助', labelEn: 'Help', icon: '🆘', tag: '#求助' },
    { id: 'NOTICE', labelZh: '公告', labelEn: 'Notice', icon: '📢', tag: '#公告' },
];

// 真言事件类型选项
const FACT_TYPE_OPTIONS: { id: FactType; labelZh: string; labelEn: string; icon: string }[] = [
    { id: 'SERVICE_EXPERIENCE', labelZh: '服务体验', labelEn: 'Service Experience', icon: '🛠️' },
    { id: 'PROPERTY_ISSUE', labelZh: '物业问题', labelEn: 'Property Issue', icon: '🏠' },
    { id: 'PRICE_CHANGE', labelZh: '价格变动', labelEn: 'Price Change', icon: '💰' },
    { id: 'SAFETY_ALERT', labelZh: '安全提醒', labelEn: 'Safety Alert', icon: '⚠️' },
    { id: 'RECOMMENDATION', labelZh: '真心推荐', labelEn: 'Recommendation', icon: '⭐' },
    { id: 'NEIGHBORHOOD_INFO', labelZh: '社区信息', labelEn: 'Neighborhood Info', icon: '📍' },
    { id: 'OTHER', labelZh: '其他', labelEn: 'Other', icon: '📝' },
];

export function LitePost({ onSuccess, trigger, postId, initialData }: LitePostProps) {
    const isEditMode = !!postId;
    const [open, setOpen] = useState(false);

    // Form State
    const [images, setImages] = useState<string[]>([]);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [mediaUrl, setMediaUrl] = useState(""); // Decoupled media link field for posters/clean content
    const [selectedCat, setSelectedCat] = useState(LITE_CATEGORIES[0]);
    const [price, setPrice] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showMediaInput, setShowMediaInput] = useState(false);

    // 真言模式状态
    const [isFact, setIsFact] = useState(false);
    const [factOccurredAt, setFactOccurredAt] = useState(""); // 发生时间
    const [factLocation, setFactLocation] = useState(""); // 发生地点
    const [factType, setFactType] = useState<FactType>("SERVICE_EXPERIENCE");
    const [factSubjectName, setFactSubjectName] = useState(""); // 涉及对象名称
    const [factEvidence, setFactEvidence] = useState<string[]>([]); // 证据图片

    const { currentUser } = useAuthStore();
    const { createPost, updatePost } = useCommunityPostStore();
    const { language } = useConfigStore();
    const navigate = useNavigate();
    const isZh = language === 'zh';

    // Initialize form when opening in edit mode
    useEffect(() => {
        if (open && initialData) {
            setImages(initialData.images || []);
            setTitle(initialData.title || "");
            setDescription(initialData.content || "");
            setMediaUrl(initialData.mediaUrl || "");
            if (initialData.mediaUrl) setShowMediaInput(true);

            if (initialData.price) {
                setPrice((initialData.price / 100).toString());
            }

            const category = LITE_CATEGORIES.find(c => c.id === initialData.postType) || LITE_CATEGORIES[0];
            setSelectedCat(category);

            // 初始化真言模式数据
            if (initialData.isFact && initialData.factData) {
                setIsFact(true);
                setFactOccurredAt(initialData.factData.occurredAt || "");
                setFactLocation(initialData.factData.location || "");
                setFactType(initialData.factData.factType || "SERVICE_EXPERIENCE");
                setFactSubjectName(initialData.factData.subject?.name || "");
                setFactEvidence(initialData.factData.evidence || []);
            }
        }
    }, [open, initialData]);

    const handlePost = async () => {
        if (!currentUser) {
            promptLogin(navigate, isZh, isZh ? "发布动态需要登录账号" : "Log in to post");
            return;
        }

        if (!description && images.length === 0) {
            toast.error(isZh ? "加点内容吧！图片或文字都行" : "Add something! A photo or a few words works");
            return;
        }

        // 真言模式验证
        if (isFact) {
            if (!factOccurredAt) {
                toast.error(isZh ? "真言模式需要填写发生时间" : "Fact mode requires the date it happened");
                return;
            }
            if (!factLocation) {
                toast.error(isZh ? "真言模式需要填写发生地点" : "Fact mode requires the location");
                return;
            }
        }

        setIsSubmitting(true);
        try {
            // Mini-Program-only content check (no-op everywhere else) —
            // see checkMiniProgramContent's comment for why this can't
            // cover the regular website too.
            // Strip HTML tags before sending to moderation (content is rich HTML now)
            const textToCheck = [title, stripHtml(description)].filter(Boolean).join('\n');
            if (textToCheck) {
                const textCheck = await checkGrokContentSafety(currentUser.id, textToCheck);
                if (textCheck.flagged) {
                    toast.error(textCheck.reason || (isZh ? "内容涉及敏感或违规信息，请修改后重试" : "This content violates platform rules — please revise and try again"));
                    setIsSubmitting(false);
                    return;
                }
            }
            for (const imageUrl of images) {
    if (isWeChatMiniProgramWebview()) {
        const imageCheck = await checkMiniProgramContent(currentUser.id, { type: 'image', imageUrl });
        if (imageCheck.flagged) {
            toast.error(isZh ? "图片涉及违规，请更换后重试" : "One of these images violates platform rules — please replace it and try again");
            setIsSubmitting(false);
            return;
        }
    } else {
        const imageCheck = await checkImageSafety(currentUser.id, imageUrl);
        if (imageCheck.flagged) {
            toast.error(isZh ? "图片涉及违规，请更换后重试" : "One of these images violates platform rules — please replace it and try again");
            setIsSubmitting(false);
            return;
        }
    }
}

            const finalTitle = title.trim() || description.slice(0, 30) || (isEditMode ? (isZh ? "编辑动态" : "Edited post") : (isZh ? "邻里分享" : "Neighbor share"));
            const priceInCents = price ? Math.floor(parseFloat(price) * 100) : undefined;
            const nodeId = currentUser.nodeId || 'NODE_LEES';

            // 构建真言数据
            const factData: FactData | undefined = isFact ? {
                occurredAt: factOccurredAt,
                location: factLocation,
                factType: factType,
                subject: factSubjectName ? {
                    type: 'other',
                    name: factSubjectName,
                } : undefined,
                evidence: factEvidence.length > 0 ? factEvidence : undefined,
            } : undefined;

            if (isEditMode && postId) {
                // UPDATE
                await updatePost(postId, {
                    postType: selectedCat.id,
                    title: finalTitle,
                    content: description,
                    images: images,
                    mediaUrl: mediaUrl,
                    priceHint: priceInCents,
                    locationText: "真言",
                    tags: [selectedCat.tag.replace('#', '')],
                    factData: factData,
                });
                toast.success(isZh ? "动态已更新" : "Post updated");
            } else {
                // CREATE
                await createPost(currentUser.id, {
                    postType: selectedCat.id,
                    title: finalTitle,
                    content: description,
                    images: images,
                    mediaUrl: mediaUrl,
                    priceHint: priceInCents,
                    priceNegotiable: true,
                    locationText: "真言",
                    nodeId: nodeId,
                    tags: [selectedCat.tag.replace('#', '')],
                    isFact: isFact,
                    factData: factData,
                });
                toast.success(
                    isFact
                        ? (isZh ? "真言发布成功！等待邻居验证" : "Fact posted! Waiting on neighbor verification")
                        : (isZh ? "发布成功！已在真言展示" : "Posted! It's now live in the feed")
                );
            }

            setOpen(false);
            if (!isEditMode) resetForm();
            onSuccess?.();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || (isZh ? "操作失败，请重试" : "Something went wrong, please try again"));
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setImages([]);
        setTitle("");
        setDescription("");
        setMediaUrl("");
        setShowMediaInput(false);
        setPrice("");
        setSelectedCat(LITE_CATEGORIES[0]);
        // 重置真言模式
        setIsFact(false);
        setFactOccurredAt("");
        setFactLocation("");
        setFactType("SERVICE_EXPERIENCE");
        setFactSubjectName("");
        setFactEvidence([]);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button className="rounded-full w-14 h-14 shadow-glow flex items-center justify-center p-0">
                        <Plus className="w-8 h-8" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden rounded-3xl border-none max-h-[90vh]">
                <DialogHeader className="p-6 bg-primary/5 pb-4 shrink-0">
                    <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-2">
                        {isEditMode ? (isZh ? '编辑动态' : 'Edit Post') : (isZh ? '发个动态' : 'New Post')} <span className="text-primary">Neighbor</span>
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        {isZh ? '快速发布社区动态，分享闲置、求助、活动等内容' : 'Quickly post to the community — share items, ask for help, or announce an event'}
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6 pt-2 space-y-6 overflow-y-auto max-h-[calc(90vh-100px)]">
                    {!currentUser && (
                        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-2 text-amber-900 dark:text-amber-200 text-xs animate-in fade-in">
                            <div className="flex items-center gap-1.5">
                                <span className="text-sm shrink-0">💡</span>
                                <span>{isZh ? '您当前未登录，可试写内容；发布需登录账号' : 'Browsing as guest. Log in when you are ready to post.'}</span>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                className="shrink-0 h-7 px-2.5 bg-white dark:bg-zinc-900 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 font-bold text-xs rounded-lg hover:bg-amber-100"
                                onClick={() => {
                                    setOpen(false);
                                    setPostLoginRedirect(window.location.pathname + window.location.search);
                                    navigate('/login');
                                }}
                            >
                                {isZh ? '去登录' : 'Log In'}
                            </Button>
                        </div>
                    )}

                    {/* Tag Selector */}
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {LITE_CATEGORIES.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCat(cat)}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap
                  ${selectedCat.id === cat.id
                                        ? 'bg-primary text-primary-foreground shadow-md scale-105'
                                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                    }`}
                            >
                                <span>{cat.icon}</span>
                                <span>{isZh ? cat.labelZh : cat.labelEn}</span>
                            </button>
                        ))}
                    </div>

                    {/* 真言模式开关 */}
                    <div className={`flex items-center justify-between p-4 rounded-2xl transition-all ${isFact ? 'bg-amber-500/10 border-2 border-amber-500/30' : 'bg-muted/20'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isFact ? 'bg-amber-500/20 text-amber-600' : 'bg-muted text-muted-foreground'}`}>
                                <Shield className="w-5 h-5" />
                            </div>
                            <div>
                                <Label htmlFor="fact-mode" className="font-bold text-base cursor-pointer">
                                    {isZh ? '真言模式' : 'Fact Mode'}
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    {isFact
                                        ? (isZh ? '需填写时间地点，邻居可验证' : 'Requires a date and location — neighbors can verify it')
                                        : (isZh ? '开启后可获得邻居共识认证' : 'Turn on to get neighbor-verified consensus')}
                                </p>
                            </div>
                        </div>
                        <Switch
                            id="fact-mode"
                            checked={isFact}
                            onCheckedChange={setIsFact}
                            className="data-[state=checked]:bg-amber-500"
                        />
                    </div>

                    {/* 真言额外字段 */}
                    {isFact && (
                        <div className="space-y-4 p-4 bg-amber-500/5 rounded-2xl border border-amber-500/20 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="flex items-center gap-2 text-amber-600 mb-2">
                                <Shield className="w-4 h-4" />
                                <span className="text-sm font-bold">{isZh ? '真言信息 (必填)' : 'Fact Details (required)'}</span>
                            </div>

                            {/* 发生时间 */}
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <Input
                                    type="date"
                                    placeholder={isZh ? "发生时间" : "Date it happened"}
                                    value={factOccurredAt}
                                    onChange={(e) => setFactOccurredAt(e.target.value)}
                                    className="bg-white/50 border-amber-500/20 focus-visible:ring-amber-500 rounded-xl"
                                />
                            </div>

                            {/* 发生地点 */}
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
                                    <MapPinned className="w-5 h-5" />
                                </div>
                                <Input
                                    placeholder={isZh ? "发生地点 (如: XX小区/XX店铺)" : "Location (e.g. XX condo / XX store)"}
                                    value={factLocation}
                                    onChange={(e) => setFactLocation(e.target.value)}
                                    className="bg-white/50 border-amber-500/20 focus-visible:ring-amber-500 rounded-xl"
                                />
                            </div>

                            {/* 事件类型 */}
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
                                    <span className="text-lg">{FACT_TYPE_OPTIONS.find(t => t.id === factType)?.icon || '📝'}</span>
                                </div>
                                <Select value={factType} onValueChange={(v) => setFactType(v as FactType)}>
                                    <SelectTrigger className="bg-white/50 border-amber-500/20 focus:ring-amber-500 rounded-xl">
                                        <SelectValue placeholder={isZh ? "选择事件类型" : "Select event type"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {FACT_TYPE_OPTIONS.map((type) => (
                                            <SelectItem key={type.id} value={type.id}>
                                                <span className="flex items-center gap-2">
                                                    <span>{type.icon}</span>
                                                    <span>{isZh ? type.labelZh : type.labelEn}</span>
                                                </span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* 涉及对象 (可选) */}
                            <Input
                                placeholder={isZh ? "涉及对象 (可选，如: XX家政/张师傅)" : "Involved party (optional, e.g. XX Cleaning / Mr. Zhang)"}
                                value={factSubjectName}
                                onChange={(e) => setFactSubjectName(e.target.value)}
                                className="bg-white/50 border-amber-500/20 focus-visible:ring-amber-500 rounded-xl"
                            />

                            {/* 证据图片 */}
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">{isZh ? '证据图片 (可选，最多3张)' : 'Evidence photos (optional, up to 3)'}</Label>
                                <ImageUploader
                                    bucketName="listing-media"
                                    onUpload={setFactEvidence}
                                    maxFiles={3}
                                    existingImages={factEvidence}
                                    folderPath={`community/${currentUser?.id || 'anonymous'}/evidence`}
                                />
                            </div>
                        </div>
                    )}

                    {/* Media Area */}
                    <div className="bg-muted/20 rounded-2xl p-4 border-2 border-dashed border-muted space-y-4">
                        <ImageUploader
                            bucketName="listing-media"
                            onUpload={setImages}
                            maxFiles={4}
                            existingImages={images}
                            folderPath={`community/${currentUser?.id || 'anonymous'}`}
                        />
                        {/* Media Preview: Now specifically looks at the mediaUrl field */}
                        <MediaEmbed content={mediaUrl} />
                    </div>

                    {/* Input Area */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowMediaInput(!showMediaInput)}
                                className={`rounded-full px-4 flex gap-2 font-bold ${showMediaInput ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}
                            >
                                <Plus className={`w-4 h-4 transition-transform ${showMediaInput ? 'rotate-45' : ''}`} />
                                {showMediaInput ? (isZh ? '移除链接' : 'Remove link') : (isZh ? '添加视频/音频链接' : 'Add video/audio link')}
                            </Button>
                        </div>

                        {showMediaInput && (
                            <Input
                                placeholder={isZh ? "粘贴 YouTube/B站/小红书/Spotify 链接..." : "Paste a YouTube/Bilibili/Xiaohongshu/Spotify link..."}
                                value={mediaUrl}
                                onChange={(e) => setMediaUrl(e.target.value)}
                                className="bg-primary/5 border-primary/20 focus-visible:ring-1 focus-visible:ring-primary rounded-2xl h-12 p-4 text-base"
                            />
                        )}

                        <Input
                            placeholder={isZh ? "写个标题 (可选)" : "Add a title (optional)"}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="bg-muted/10 border-none focus-visible:ring-1 focus-visible:ring-primary rounded-2xl h-12 p-4 text-base font-bold"
                        />
                        <RichTextEditor
                            value={description}
                            onChange={setDescription}
                            placeholder={isZh ? "分享点新鲜事..." : "Share what's new..."}
                            maxLength={2000}
                        />

                        {/* Price Row (Optional) */}
                        {(selectedCat.id === 'ACTION' || selectedCat.id === 'HELP') && (
                            <div className="flex items-center gap-3 bg-muted/10 p-4 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                    <span className="font-bold">$</span>
                                </div>
                                <Input
                                    type="number"
                                    placeholder={selectedCat.id === 'ACTION' ? (isZh ? "出个价 (CAD)" : "Set a price (CAD)") : (isZh ? "预算范围 (CAD)" : "Budget range (CAD)")}
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    className="bg-transparent border-none focus-visible:ring-0 text-lg font-bold p-0"
                                />
                            </div>
                        )}
                    </div>

                    {/* Location / Action Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <div className="p-2 rounded-full">
                                <MapPin className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-widest">{currentUser?.nodeId || 'Kanata Lakes'}</span>
                        </div>

                        <Button
                            onClick={handlePost}
                            disabled={isSubmitting}
                            className="btn-action px-8 rounded-full font-black flex gap-2 h-12"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <span>{isEditMode ? (isZh ? '保存修改' : 'Save Changes') : (isZh ? '立即发布' : 'Post Now')}</span>
                                    {isEditMode ? <Edit2 className="w-4 h-4 ml-1" /> : <Send className="w-4 h-4" />}
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
