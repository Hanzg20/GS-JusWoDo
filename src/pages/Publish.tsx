import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { ArrowLeft, Check, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useListingStore } from "@/stores/listingStore";
import { useCommunity } from "@/context/CommunityContext";
import { toast } from "sonner";
import DynamicListingForm from "@/components/listing/DynamicListingForm";
import { getFieldsForType } from "@/config/listingFields";
import { FormData, ListingType } from "@/types/listingFields";
import { communityPostRepository } from "@/services/repositories/supabase/CommunityPostRepository";
import { CommunityPostType } from "@/types/community";

const Publish = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { currentUser } = useAuthStore();
    const { createListing, updateListing, fetchListings, listings, listingItems } = useListingStore();
    const { activeNodeId } = useCommunity();

    const editId = searchParams.get('id');
    const fromPostId = searchParams.get('from_post');
    const [isEditMode, setIsEditMode] = useState(!!editId);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [initialData, setInitialData] = useState<FormData>({});

    // Steps: 1 = Category, 2 = Form, 3: Preview
    const [step, setStep] = useState(1);

    // Category State
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [skippedCategory, setSkippedCategory] = useState(false);
    const [previewData, setPreviewData] = useState<FormData | null>(null);

    const isProvider = currentUser?.roles?.includes('PROVIDER');

    useEffect(() => {
        if (editId) {
            loadExistingListing(editId);
        } else if (fromPostId) {
            loadFromCommunityPost(fromPostId);
        }
    }, [editId, fromPostId]);

    const loadFromCommunityPost = async (postId: string) => {
        setIsLoadingData(true);
        try {
            const post = await communityPostRepository.getById(postId);
            if (!post) {
                toast.error("未找到对应帖子");
                return;
            }

            // Map post type to likely listing category
            let suggestedCategory = 'SERVICE';
            const postType = post.postType as any;
            if (postType === 'SECOND_HAND' || postType === 'GIVEAWAY') suggestedCategory = 'GOODS';
            if (postType === 'WANTED' || postType === 'HELP') suggestedCategory = 'TASK';

            setInitialData({
                title: post.title || post.content.slice(0, 20),
                description: post.content,
                images: post.images,
                price: post.priceHint ? (post.priceHint / 100).toString() : undefined,
                pickupLocation: post.locationText
            });

            // Optional: Auto-select category or let user choose
            // setSelectedCategory(suggestedCategory);
            // setStep(2); 

            toast.info("已加载帖子内容，请选择发布类型");
        } catch (error) {
            console.error(error);
            toast.error("加载帖子失败");
        } finally {
            setIsLoadingData(false);
        }
    };

    const loadExistingListing = async (id: string) => {
        setIsLoadingData(true);
        try {
            // Ensure listings are loaded
            if (listings.length === 0) {
                await fetchListings();
            }

            const master = useListingStore.getState().listings.find(l => l.id === id);
            if (!master) {
                toast.error("未找到对应记录");
                navigate('/publish');
                return;
            }

            // Fetch items for this master
            const { repositoryFactory } = await import('@/services/repositories/factory');
            const itemRepo = repositoryFactory.getListingItemRepository();
            const items = await itemRepo.getByMaster(id);
            const firstItem = items[0];

            // 🛠️ Map Items to SKU format for the editor
            const skus = items.map(item => ({
                id: item.id,
                name: item.nameZh || item.nameEn,
                price: item.pricing.price.amount / 100,
                stock: item.attributes?.stock || 0, // Read from attributes
                description: item.descriptionZh || item.descriptionEn
            }));

            setSelectedCategory(master.type);
            setInitialData({
                title: master.titleZh || master.titleEn,
                description: master.descriptionZh || master.descriptionEn,
                images: master.images,
                price: firstItem ? (firstItem.pricing.price.amount / 100).toString() : "0",
                stock: firstItem ? (firstItem.attributes?.stock || 0).toString() : "0",
                pickupLocation: master.location?.fullAddress || "",
                skus: skus, // Pass the full list to the SKU editor if the field exists in config
                // Flatten other attributes if any
                ...firstItem?.attributes
            });
            setStep(2);
        } catch (err) {
            console.error("Failed to load listing for edit:", err);
            toast.error("加载失败");
        } finally {
            setIsLoadingData(false);
        }
    };

    // Category definitions with role-based visibility — trimmed to launch
    // scope only (buyer: Task + Goods; provider: Service + Goods). GOODS is
    // deliberately ALL — buyers selling/giving away secondhand items is the
    // 二手闲置 pillar and shouldn't require becoming a "provider" any more
    // than posting a Task does (createListing() auto-provisions the
    // underlying provider_profiles row either way — see listingStore.ts).
    // EVENT and RENTAL stay supported in the data model (EventDetailView,
    // deposit pricing, etc. all still work) but aren't offered as creation
    // options yet; add them back to this list when there's a reason to.
    const categories = [
        { id: 'SERVICE', label: '💼 提供专业服务', visible: 'PROVIDER_ONLY', subtitle: '咨询/上门/代办 (含SKU与底价)' },
        { id: 'GOODS', label: '🛍️ 出售商品', visible: 'ALL', subtitle: '闲置转让 / 批量供货 (含库存管理)' },
        { id: 'TASK', label: '🙋 发布需求任务', visible: 'BUYER_ONLY', subtitle: '寻求邻居帮忙 (含预算与截止日期)' },
    ].filter(cat =>
        cat.visible === 'ALL' ||
        (cat.visible === 'PROVIDER_ONLY' && isProvider) ||
        (cat.visible === 'BUYER_ONLY' && !isProvider)
    );

    const handleCategorySelect = (categoryId: string) => {
        setSelectedCategory(categoryId);
        setStep(2);
        window.scrollTo(0, 0);
    };

    const handleSkipCategory = () => {
        setSkippedCategory(true);
        setSelectedCategory('OTHER');
        setStep(2);
        window.scrollTo(0, 0);
    };

    const handleBack = () => {
        if (step === 3) {
            // If in preview, go back to form (Step 2)
            // Restore data from previewData to initialData so edits aren't lost
            if (previewData) {
                setInitialData(prev => ({
                    ...prev,
                    ...previewData
                }));
            }
            setStep(2);
        } else if (step === 2) {
            setStep(1);
            setSelectedCategory(null);
        } else {
            navigate(-1);
        }
    };

    const handleFormNext = (formData: FormData) => {
        setPreviewData(formData);
        setStep(3);
        window.scrollTo(0, 0);
    };

    const handleFinalSubmit = async () => {
        if (!currentUser || !previewData) {
            toast.error("错误：缺少预览数据");
            return;
        }

        setIsLoadingData(true);
        try {
            const formData = previewData;
            const title = formData.title as string;
            const description = formData.description as string;
            const images = formData.images as string[];

            const masterData = {
                titleZh: title,
                titleEn: title,
                descriptionZh: description,
                descriptionEn: description,
                images: images || [],
                mediaUrl: formData.mediaUrl as string || undefined,
                type: selectedCategory as any,
                categoryId: null, // Set to null to avoid FK constraint; type field is sufficient
                nodeId: activeNodeId || 'NODE_LEES',
                status: 'PUBLISHED',
                location: {
                    fullAddress: formData.pickupLocation || formData.location || '',
                },
                tags: formData.tags || [],
                rating: 5,
                reviewCount: 0,
                attributes: {
                    ...(initialData?.attributes || {}),
                    pricingMode: formData.pricingMode || 'FIXED',
                    stock: parseInt(formData.stock as string) || 1
                },
                metadata: {
                    ...formData,
                    _formVersion: 'v2',
                    _submittedAt: new Date().toISOString()
                }
            } as any;

            let finalItems: any[] = [];

            if (formData.skus && Array.isArray(formData.skus) && formData.skus.length > 0) {
                finalItems = formData.skus.map((sku: any) => ({
                    masterId: '',
                    nameZh: sku.name || '默认规格',
                    nameEn: sku.name || 'Default',
                    descriptionZh: sku.description || description,
                    descriptionEn: sku.description || description,
                    status: 'AVAILABLE' as const,
                    pricing: {
                        model: 'FIXED' as const,
                        price: {
                            amount: Math.round((sku.price || 0) * 100),
                            currency: 'CAD',
                            formatted: `$${(sku.price || 0).toFixed(2)}`
                        },
                        unit: 'item'
                    },
                    attributes: { stock: parseInt(sku.stock) || 0 },
                    images: images || []
                }));
            } else {
                const price = selectedCategory === 'FREE_GIVEAWAY' ? 0 : (parseFloat(formData.price as string) || 0);
                finalItems = [{
                    masterId: '',
                    nameZh: '基本款',
                    nameEn: 'Basic',
                    descriptionZh: description,
                    descriptionEn: description,
                    status: 'AVAILABLE' as const,
                    pricing: {
                        model: 'FIXED' as const,
                        price: {
                            amount: Math.round(price * 100),
                            currency: 'CAD',
                            formatted: `$${price.toFixed(2)}`
                        },
                        unit: 'item'
                    },
                    attributes: { stock: parseInt(formData.stock as string) || 1 },
                    images: images || []
                }];
            }

            const metadata = {
                ...formData,
                _formVersion: 'v2',
                _submittedAt: new Date().toISOString()
            };
            (masterData as any).metadata = metadata;

            if (isEditMode && editId) {
                await updateListing(editId, masterData, finalItems);
                toast.success("修改成功！");
            } else {
                const newListing = await createListing(masterData, finalItems);
                if (fromPostId) {
                    await communityPostRepository.convertToListing(fromPostId, newListing.id);
                }
                toast.success("发布成功！");
            }

            navigate('/my-listings');
        } catch (error: any) {
            console.error("Submission error:", error);
            toast.error(error.message || "发布失败，请重试");
        } finally {
            setIsLoadingData(false);
        }
    };

    const renderCategorySelection = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2 mb-8">
                <h2 className="text-2xl font-black tracking-tight">选择发布类型</h2>
                <p className="text-muted-foreground">选择合适的分类让邻居更容易找到</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => handleCategorySelect(cat.id)}
                        className={`
                            relative group p-6 text-left rounded-3xl border-2 transition-all duration-300 hover:shadow-warm
                            ${selectedCategory === cat.id
                                ? 'border-primary bg-primary/5 ring-4 ring-primary/10'
                                : 'border-border/50 bg-card hover:border-primary/50'
                            }
                        `}
                    >
                        <div className="flex items-start gap-4">
                            <div className={`
                                w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm transition-transform group-hover:scale-110
                                ${selectedCategory === cat.id ? 'bg-primary text-primary-foreground' : 'bg-muted'}
                            `}>
                                {cat.label.split(' ')[0]}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
                                    {cat.label.split(' ').slice(1).join(' ')}
                                    {selectedCategory === cat.id && <Check className="w-5 h-5 text-primary" />}
                                </h3>
                                <p className="text-sm text-muted-foreground font-medium">{cat.subtitle}</p>
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            <div className="mt-12 p-6 rounded-3xl bg-muted/50 border border-dashed text-center space-y-4">
                <div className="flex justify-center flex-wrap gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    <span>邻里二手</span>
                    <span>•</span>
                    <span>求购信息</span>
                    <span>•</span>
                    <span>免费物品</span>
                    <span>•</span>
                    <span>社区活动</span>
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                    以上内容属于“邻里生活”，建议通过社区发帖发布，流程更轻快。
                </p>
                <Button
                    variant="link"
                    className="font-black text-primary"
                    onClick={() => navigate('/community')}
                >
                    前往真言发帖 &rarr;
                </Button>
            </div>
        </div>
    );

    const renderDynamicForm = () => {
        if (!selectedCategory) return null;

        const config = getFieldsForType(selectedCategory as ListingType, !!isProvider);

        return (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="mb-6">
                    <h2 className="text-xl font-black mb-2">填写详细信息</h2>
                    <p className="text-sm text-muted-foreground">
                        当前分类: <span className="font-bold text-primary">{categories.find(c => c.id === selectedCategory)?.label || '其他'}</span>
                    </p>
                </div>

                <DynamicListingForm
                    config={config}
                    onSubmit={handleFormNext}
                    onCancel={handleBack}
                    initialData={initialData || {}}
                    submitLabel="下一步：预览详情"
                />
            </div>
        );
    };

    const renderPreview = () => {
        if (!previewData) return null;

        return (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-500 space-y-6 pb-20">
                <div className="text-center space-y-2 mb-8">
                    <h2 className="text-2xl font-black">预览您的发布</h2>
                    <p className="text-muted-foreground">检查信息无误后即可正式发布</p>
                </div>

                {/* Main Info Card */}
                <div className="bg-card border rounded-3xl overflow-hidden shadow-sm">
                    {previewData.images && (previewData.images as string[]).length > 0 && (
                        <div className="aspect-square bg-muted relative">
                            <img
                                src={(previewData.images as string[])[0]}
                                alt="Preview"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold">
                                +{(previewData.images as string[]).length} 张图片
                            </div>
                        </div>
                    )}
                    <div className="p-6 space-y-4">
                        <h3 className="text-2xl font-black">{previewData.title as string}</h3>
                        <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                            {previewData.description as string}
                        </p>

                        <div className="flex items-center gap-4 pt-4 border-t">
                            <div className="flex-1">
                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">价格</p>
                                <p className="text-2xl font-black text-primary">
                                    {selectedCategory === 'FREE_GIVEAWAY' ? 'FREE 🎁' : `$${previewData.price || 0}`}
                                </p>
                            </div>
                            <div className="flex-1 text-right">
                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">地点</p>
                                <p className="text-sm font-bold truncate">
                                    {previewData.pickupLocation as string || previewData.location as string || "Ottawa, ON"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SKU List Preview */}
                {previewData.skus && Array.isArray(previewData.skus) && previewData.skus.length > 0 && (
                    <div className="bg-card border rounded-3xl p-6 space-y-4">
                        <h4 className="font-black text-sm uppercase tracking-widest text-muted-foreground">包含规格 ({previewData.skus.length})</h4>
                        <div className="space-y-3">
                            {previewData.skus.map((sku: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center bg-muted/30 p-3 rounded-2xl">
                                    <div>
                                        <p className="font-bold">{sku.name}</p>
                                        {sku.description && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{sku.description}</p>}
                                    </div>
                                    <p className="font-black text-primary text-sm">${sku.price}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Final Actions */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t z-50">
                    <div className="max-w-2xl mx-auto flex gap-4">
                        <Button
                            variant="outline"
                            className="flex-1 h-14 rounded-2xl font-bold"
                            onClick={() => setStep(2)}
                            disabled={isLoadingData}
                        >
                            返回修改
                        </Button>
                        <Button
                            className="flex-[2] h-14 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 transition-all hover:scale-[1.02]"
                            onClick={handleFinalSubmit}
                            disabled={isLoadingData}
                        >
                            {isLoadingData ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                isEditMode ? "确认保存修改" : "正式发布"
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            <Header />

            <main className="container max-w-2xl mx-auto pt-8 px-4">
                {/* Progress Header */}
                <div className="mb-8 flex items-center justify-between">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleBack}
                        className="rounded-full hover:bg-muted"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>

                    <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                        <span className={step === 1 ? "text-primary scale-110" : ""}>1. 分类</span>
                        <span>/</span>
                        <span className={step === 2 ? "text-primary scale-110" : ""}>2. 详情</span>
                        <span>/</span>
                        <span className={step === 3 ? "text-primary scale-110" : ""}>3. 预览</span>
                    </div>

                    <div className="w-10" /> {/* Spacer */}
                </div>

                {isLoadingData && step !== 3 ? (
                    <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                        <p className="text-muted-foreground font-bold">正在提取数据...</p>
                    </div>
                ) : (
                    <>
                        {step === 1 && renderCategorySelection()}
                        {step === 2 && renderDynamicForm()}
                        {step === 3 && renderPreview()}
                    </>
                )}
            </main>
        </div>
    );
};

export default Publish;
