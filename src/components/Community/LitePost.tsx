import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, MapPin, Send, Loader2, Edit2, Shield, Calendar, MapPinned } from "lucide-react";
import ImageUploader from "@/components/common/ImageUploader";
import { useAuthStore } from "@/stores/authStore";
import { useCommunityPostStore } from "@/stores/communityPostStore";
import { toast } from "sonner";
import { CommunityPostType, FactType, FactData, FACT_TYPE_CONFIG } from "@/types/community";
import { MediaEmbed } from "./MediaEmbed";

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

const LITE_CATEGORIES: { id: CommunityPostType; label: string; icon: string; tag: string }[] = [
    { id: 'MOMENT', label: '邻里', icon: '🏘️', tag: '#邻里' },
    { id: 'ACTION', label: '参加', icon: '🤝', tag: '#活动' },
    { id: 'HELP', label: '求助', icon: '🆘', tag: '#求助' },
    { id: 'NOTICE', label: '公告', icon: '📢', tag: '#公告' },
];

// 真言事件类型选项
const FACT_TYPE_OPTIONS: { id: FactType; label: string; icon: string }[] = [
    { id: 'SERVICE_EXPERIENCE', label: '服务体验', icon: '🛠️' },
    { id: 'PROPERTY_ISSUE', label: '物业问题', icon: '🏠' },
    { id: 'PRICE_CHANGE', label: '价格变动', icon: '💰' },
    { id: 'SAFETY_ALERT', label: '安全提醒', icon: '⚠️' },
    { id: 'RECOMMENDATION', label: '真心推荐', icon: '⭐' },
    { id: 'NEIGHBORHOOD_INFO', label: '社区信息', icon: '📍' },
    { id: 'OTHER', label: '其他', icon: '📝' },
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
            toast.error("请先登录");
            return;
        }

        if (!description && images.length === 0) {
            toast.error("加点内容吧！图片或文字都行");
            return;
        }

        // 真言模式验证
        if (isFact) {
            if (!factOccurredAt) {
                toast.error("真言模式需要填写发生时间");
                return;
            }
            if (!factLocation) {
                toast.error("真言模式需要填写发生地点");
                return;
            }
        }

        setIsSubmitting(true);
        try {
            const finalTitle = title.trim() || description.slice(0, 30) || (isEditMode ? "编辑动态" : "邻里分享");
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
                toast.success("动态已更新");
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
                toast.success(isFact ? "真言发布成功！等待邻居验证" : "发布成功！已在真言展示");
            }

            setOpen(false);
            if (!isEditMode) resetForm();
            onSuccess?.();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "操作失败，请重试");
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
                        {isEditMode ? '编辑动态' : '发个动态'} <span className="text-primary">Neighbor</span>
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        快速发布社区动态，分享闲置、求助、活动等内容
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6 pt-2 space-y-6 overflow-y-auto max-h-[calc(90vh-100px)]">
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
                                <span>{cat.label}</span>
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
                                    真言模式
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    {isFact ? '需填写时间地点，邻居可验证' : '开启后可获得邻居共识认证'}
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
                                <span className="text-sm font-bold">真言信息 (必填)</span>
                            </div>

                            {/* 发生时间 */}
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <Input
                                    type="date"
                                    placeholder="发生时间"
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
                                    placeholder="发生地点 (如: XX小区/XX店铺)"
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
                                        <SelectValue placeholder="选择事件类型" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {FACT_TYPE_OPTIONS.map((type) => (
                                            <SelectItem key={type.id} value={type.id}>
                                                <span className="flex items-center gap-2">
                                                    <span>{type.icon}</span>
                                                    <span>{type.label}</span>
                                                </span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* 涉及对象 (可选) */}
                            <Input
                                placeholder="涉及对象 (可选，如: XX家政/张师傅)"
                                value={factSubjectName}
                                onChange={(e) => setFactSubjectName(e.target.value)}
                                className="bg-white/50 border-amber-500/20 focus-visible:ring-amber-500 rounded-xl"
                            />

                            {/* 证据图片 */}
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">证据图片 (可选，最多3张)</Label>
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
                                {showMediaInput ? '移除链接' : '添加视频/音频链接'}
                            </Button>
                        </div>

                        {showMediaInput && (
                            <Input
                                placeholder="粘贴 YouTube/B站/小红书/Spotify 链接..."
                                value={mediaUrl}
                                onChange={(e) => setMediaUrl(e.target.value)}
                                className="bg-primary/5 border-primary/20 focus-visible:ring-1 focus-visible:ring-primary rounded-2xl h-12 p-4 text-base"
                            />
                        )}

                        <Input
                            placeholder="写个标题 (可选)"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="bg-muted/10 border-none focus-visible:ring-1 focus-visible:ring-primary rounded-2xl h-12 p-4 text-base font-bold"
                        />
                        <Textarea
                            placeholder="分享点新鲜事..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="min-h-[120px] bg-muted/10 border-none focus-visible:ring-1 focus-visible:ring-primary rounded-2xl p-4 text-base resize-none"
                        />

                        {/* Price Row (Optional) */}
                        {(selectedCat.id === 'ACTION' || selectedCat.id === 'HELP') && (
                            <div className="flex items-center gap-3 bg-muted/10 p-4 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                    <span className="font-bold">$</span>
                                </div>
                                <Input
                                    type="number"
                                    placeholder={selectedCat.id === 'ACTION' ? "出个价 (CAD)" : "预算范围 (CAD)"}
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
                                    <span>{isEditMode ? '保存修改' : '立即发布'}</span>
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
