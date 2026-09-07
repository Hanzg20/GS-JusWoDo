import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { ArrowLeft, Check, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useListingStore } from "@/stores/listingStore";
import { useCommunity } from "@/context/CommunityContext";
import { useConfigStore, writeNodeId } from "@/stores/configStore";
import { toast } from "sonner";
import DynamicListingForm from "@/components/listing/DynamicListingForm";
import { getFieldsForType, getProviderGoodsFields } from "@/config/listingFields";
import { FormData, ListingType } from "@/types/listingFields";
import { communityPostRepository } from "@/services/repositories/supabase/CommunityPostRepository";
import { CommunityPostType } from "@/types/community";
import { supabase } from "@/lib/supabase";

// Every config's 'location' field type (LocationPicker) stores an object
// ({lat, lng, address, ...}), not a plain string — under different field
// names depending on category (pickupLocation/location/serviceArea).
// Rendering it directly crashes React ("Objects are not valid as a React
// child"), so every read of one of these fields needs to go through this.
const getLocationDisplayText = (loc: unknown): string => {
    if (loc && typeof loc === 'object') return (loc as { address?: string }).address || '';
    return (loc as string) || '';
};

const Publish = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { currentUser, isLoading: isAuthLoading } = useAuthStore();
    const { createListing, updateListing, fetchListings, listings, listingItems } = useListingStore();
    const { activeNodeId } = useCommunity();
    const { language } = useConfigStore();

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

    const t = {
        postNotFound: language === 'zh' ? '未找到对应帖子' : 'Post not found',
        postLoaded: language === 'zh' ? '已加载帖子内容，请选择发布类型' : 'Post content loaded — please choose a listing type',
        postLoadFailed: language === 'zh' ? '加载帖子失败' : 'Failed to load post',
        listingNotFound: language === 'zh' ? '未找到对应记录' : 'Listing not found',
        loadFailed: language === 'zh' ? '加载失败' : 'Failed to load',
        loadingData: language === 'zh' ? '正在提取数据...' : 'Loading data...',
        missingPreviewData: language === 'zh' ? '错误：缺少预览数据' : 'Error: missing preview data',
        loginRequired: language === 'zh' ? '请先登录或注册后再发布' : 'Please log in or sign up to post a listing',
        editSuccess: language === 'zh' ? '修改成功！' : 'Changes saved!',
        publishSuccess: language === 'zh' ? '发布成功！' : 'Published!',
        publishFailed: language === 'zh' ? '发布失败，请重试' : 'Publish failed, please try again',
        selectListingType: language === 'zh' ? '选择发布类型' : 'Choose a Listing Type',
        selectCategoryHint: language === 'zh' ? '选择合适的分类让邻居更容易找到' : 'Pick the right category so neighbors can find it easily',
        // "Secondhand" dropped — Sell Items above already covers it directly,
        // so listing it here as a "go post it elsewhere" case contradicted
        // the picker right above. Recommendations/Safety Alerts added — both
        // already exist as FactType values (RECOMMENDATION/SAFETY_ALERT) and
        // are common Nextdoor-style content, but weren't surfaced anywhere
        // near this picker so people didn't know they could post them.
        neighborLifeTags: language === 'zh'
            ? ['求购信息', '免费物品', '社区活动', '求推荐', '安全提醒']
            : ['Wanted', 'Free Items', 'Community Events', 'Recommendations', 'Safety Alerts'],
        neighborLifeHint: language === 'zh'
            ? '以上内容属于"邻里生活"，建议通过社区发帖发布，流程更轻快。'
            : 'These belong under "Neighbor Life" — posting to the community feed is quicker for this kind of content.',
        goToCommunityPost: language === 'zh' ? '前往真言发帖 →' : 'Post to Community →',
        other: language === 'zh' ? '其他' : 'Other',
        serviceCategoryLabel: language === 'zh' ? '💼 服务' : '💼 Service',
        rentalCategoryLabel: language === 'zh' ? '🏠 租赁' : '🏠 Rental',
        proGoodsCategoryLabel: language === 'zh' ? '🛍️ 商品' : '🛍️ Goods',
        fillDetails: language === 'zh' ? '填写详细信息' : 'Fill in the Details',
        currentCategory: language === 'zh' ? '当前分类:' : 'Category:',
        nextPreview: language === 'zh' ? '下一步：预览详情' : 'Next: Preview',
        previewYourPost: language === 'zh' ? '预览您的发布' : 'Preview Your Listing',
        previewHint: language === 'zh' ? '检查信息无误后即可正式发布' : "Check everything looks right, then you're ready to publish",
        photosCount: language === 'zh' ? '张图片' : 'photos',
        price: language === 'zh' ? '价格' : 'Price',
        location: language === 'zh' ? '地点' : 'Location',
        includedOptions: language === 'zh' ? '包含规格' : 'Included Options',
        backToEdit: language === 'zh' ? '返回修改' : 'Back to Edit',
        confirmSave: language === 'zh' ? '确认保存修改' : 'Save Changes',
        publishNow: language === 'zh' ? '正式发布' : 'Publish',
        stepCategory: language === 'zh' ? '1. 分类' : '1. Category',
        stepDetails: language === 'zh' ? '2. 详情' : '2. Details',
        stepPreview: language === 'zh' ? '3. 预览' : '3. Preview',
    };

    // Posting requires an account (storage RLS alone already blocks an
    // anonymous image upload, and createListing/updateListing need a real
    // user id) — send them to log in before they sink effort into a form
    // they can't submit, rather than only discovering this at the very end.
    useEffect(() => {
        if (isAuthLoading) return;
        if (!currentUser) {
            toast.error(t.loginRequired);
            navigate('/login');
        }
    }, [currentUser, isAuthLoading, navigate]);

    useEffect(() => {
        if (editId) {
            loadExistingListing(editId);
        } else if (fromPostId) {
            loadFromCommunityPost(fromPostId);
        }
    }, [editId, fromPostId]);

    // Pro hub (MyListings/ProviderDashboard) is a separate, professional-only
    // surface from this page's own category picker (see 2026-09-05
    // clarification) — it links straight here with ?type=SERVICE|GOODS|RENTAL
    // (?pro=1 on GOODS selects the fuller provider field set instead of the
    // simplified one the picker below always uses), skipping the picker
    // entirely rather than re-adding a role branch to it.
    useEffect(() => {
        const presetType = searchParams.get('type');
        if (!isProvider || editId || fromPostId) return;
        if (presetType === 'SERVICE' || presetType === 'GOODS' || presetType === 'RENTAL') {
            setSelectedCategory(presetType);
            setStep(2);
        }
    }, [searchParams, isProvider, editId, fromPostId]);

    const loadFromCommunityPost = async (postId: string) => {
        setIsLoadingData(true);
        try {
            const post = await communityPostRepository.getById(postId);
            if (!post) {
                toast.error(t.postNotFound);
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

            toast.info(t.postLoaded);
        } catch (error) {
            console.error(error);
            toast.error(t.postLoadFailed);
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
                toast.error(t.listingNotFound);
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
                _originalNodeId: master.nodeId,
                skus: skus, // Pass the full list to the SKU editor if the field exists in config
                // Flatten other attributes if any
                ...firstItem?.attributes
            });
            setStep(2);
        } catch (err) {
            console.error("Failed to load listing for edit:", err);
            toast.error(t.loadFailed);
        } finally {
            setIsLoadingData(false);
        }
    };

    // Category definitions — same two options for everyone regardless of
    // role (buyer or provider): Sell Items and Post a Task. Offering a
    // professional Service is no longer part of this picker at all (see
    // 2026-09-05 decision); createListing() auto-provisions the underlying
    // provider_profiles row either way — see listingStore.ts. EVENT and
    // RENTAL stay supported in the data model (EventDetailView, deposit
    // pricing, etc. all still work) but aren't offered as creation options
    // yet; add them back to this list when there's a reason to.
    const categories = [
        {
            id: 'GOODS',
            label: language === 'zh' ? '🛍️ 出售商品' : '🛍️ Sell Items',
            subtitle: language === 'zh' ? '闲置转让 / 批量供货 (含库存管理)' : 'Secondhand or bulk supply (with inventory)'
        },
        {
            id: 'TASK',
            label: language === 'zh' ? '🙋 发布需求任务' : '🙋 Post a Task',
            subtitle: language === 'zh' ? '寻求邻居帮忙 (含预算与截止日期)' : 'Ask neighbors for help (with budget & deadline)'
        },
    ];

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
        // The page-entry redirect above handles the normal case; this covers
        // a session expiring mid-form, so the error actually says why instead
        // of the unrelated "missing preview data" message.
        if (!currentUser) {
            toast.error(t.loginRequired);
            navigate('/login');
            return;
        }
        if (!previewData) {
            toast.error(t.missingPreviewData);
            return;
        }

        setIsLoadingData(true);
        try {
            const formData = previewData;
            const title = formData.title as string;
            const description = formData.description as string;
            const images = formData.images as string[];

            // See getLocationDisplayText above — same object-vs-string shape
            // applies here when building the record to save, not just when
            // rendering the preview. Field name varies by category:
            // pickupLocation (GOODS/RENTAL/giveaway), location (TASK/EVENT),
            // serviceArea (SERVICE).
            const rawLocation = formData.pickupLocation ?? formData.location ?? formData.serviceArea;
            const locationAddress = getLocationDisplayText(rawLocation);
            const locationCoords = rawLocation && typeof rawLocation === 'object' && rawLocation.lat != null && rawLocation.lng != null
                ? { lat: rawLocation.lat, lng: rawLocation.lng }
                : undefined;

            // Which GOODS form this went through, not who posted it — a
            // merchant can still post a personal secondhand item through the
            // homepage's simple flow, so goodsTier can't be inferred from
            // provider identity (see 2026-09-06 clarification). Drives the
            // "产品/Products" vs "闲置市场/Secondhand" split on the homepage.
            const isProGoods = selectedCategory === 'GOODS' && searchParams.get('pro') === '1';

            const masterData = {
                // The form collects one language only (no separate zh/en
                // inputs, by design — like FB Marketplace/Craigslist, UGC
                // displays as-authored regardless of site language). Both
                // columns get the same text on purpose; don't "fix" this by
                // adding a translation step without a product decision first.
                titleZh: title,
                titleEn: title,
                descriptionZh: description,
                descriptionEn: description,
                images: images || [],
                mediaUrl: formData.mediaUrl as string || undefined,
                type: selectedCategory as any,
                categoryId: null, // Set to null to avoid FK constraint; type field is sufficient
                // On edit, keep the listing's existing node rather than
                // whatever community the editor's browser happens to be
                // viewing right now — activeNodeId is only the right choice
                // for a brand-new listing. Without this, re-saving a listing
                // silently reassigns it to a different neighborhood (and its
                // stale lat/lng no longer matches), breaking distance display.
                nodeId: (isEditMode && formData._originalNodeId) || writeNodeId(activeNodeId),
                status: 'PUBLISHED',
                location: {
                    fullAddress: locationAddress,
                    ...(locationCoords ? { coordinates: locationCoords } : {}),
                },
                tags: formData.tags || [],
                rating: 5,
                reviewCount: 0,
                attributes: {
                    ...(initialData?.attributes || {}),
                    pricingMode: formData.pricingMode || 'FIXED',
                    stock: parseInt(formData.stock as string) || 1,
                    ...(selectedCategory === 'GOODS' ? { goodsTier: isProGoods ? 'PRODUCT' : 'SECONDHAND' } : {})
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
                        model: (formData.pricingMode as any) || 'FIXED',
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
                        model: (formData.pricingMode as any) || 'FIXED',
                        price: {
                            amount: Math.round(price * 100),
                            currency: 'CAD',
                            formatted: `$${price.toFixed(2)}`
                        },
                        unit: 'item'
                    },
                    attributes: {
                        stock: parseInt(formData.stock as string) || 1,
                        // Collected by the buyer GOODS form's "成色/Condition"
                        // select but never saved anywhere before — GoodsDetailView
                        // and ListingCard both read it from here.
                        ...(formData.condition ? { condition: formData.condition } : {})
                    },
                    images: images || []
                }];
            }

            const metadata = {
                ...formData,
                _formVersion: 'v2',
                _submittedAt: new Date().toISOString()
            };
            (masterData as any).metadata = metadata;

            let publishedId = editId;
            if (isEditMode && editId) {
                await updateListing(editId, masterData, finalItems);
                toast.success(t.editSuccess);
            } else {
                const newListing = await createListing(masterData, finalItems);
                publishedId = newListing.id;
                if (fromPostId) {
                    await communityPostRepository.convertToListing(fromPostId, newListing.id);
                }
                toast.success(t.publishSuccess);
            }

            // Fire-and-forget: backfill the other language via translate-listing.
            // Never block/fail the publish flow on this — see Publish.tsx's
            // titleZh/titleEn comment above for why translation is needed at all.
            if (publishedId) {
                supabase.functions.invoke('translate-listing', { body: { masterId: publishedId } })
                    .catch(err => console.warn('translate-listing invoke failed:', err));
            }

            navigate('/my-listings');
        } catch (error: any) {
            console.error("Submission error:", error);
            toast.error(error.message || t.publishFailed);
        } finally {
            setIsLoadingData(false);
        }
    };

    const renderCategorySelection = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2 mb-8">
                <h2 className="text-2xl font-black tracking-tight">{t.selectListingType}</h2>
                <p className="text-muted-foreground">{t.selectCategoryHint}</p>
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
                    {t.neighborLifeTags.map((tag, idx) => (
                        <span key={tag}>
                            {idx > 0 && <span className="mr-2">•</span>}
                            {tag}
                        </span>
                    ))}
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                    {t.neighborLifeHint}
                </p>
                <Button
                    variant="link"
                    className="font-black text-primary"
                    onClick={() => navigate('/community')}
                >
                    {t.goToCommunityPost}
                </Button>
            </div>
        </div>
    );

    const renderDynamicForm = () => {
        if (!selectedCategory) return null;

        // Pro hub's "Professional Goods" (?type=GOODS&pro=1) wants the fuller
        // provider field set (bulk supply/inventory), not the simplified one
        // getFieldsForType always returns for GOODS now that the picker below
        // never distinguishes buyer/provider for it.
        const isProGoods = selectedCategory === 'GOODS' && searchParams.get('pro') === '1' && isProvider;
        const config = isProGoods
            ? getProviderGoodsFields(language)
            : getFieldsForType(selectedCategory as ListingType, !!isProvider, language);

        return (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="mb-6">
                    <h2 className="text-xl font-black mb-2">{t.fillDetails}</h2>
                    <p className="text-sm text-muted-foreground">
                        {t.currentCategory} <span className="font-bold text-primary">
                            {isProGoods
                                ? t.proGoodsCategoryLabel
                                : categories.find(c => c.id === selectedCategory)?.label
                                    // Not offered as a fresh pick in the grid above
                                    // (SERVICE/RENTAL come from pro hub via ?type=,
                                    // and an existing SERVICE listing can also reach
                                    // this step through edit mode).
                                    || (selectedCategory === 'SERVICE' ? t.serviceCategoryLabel
                                        : selectedCategory === 'RENTAL' ? t.rentalCategoryLabel
                                            : t.other)}
                        </span>
                    </p>
                </div>

                <DynamicListingForm
                    config={config}
                    onSubmit={handleFormNext}
                    onCancel={handleBack}
                    initialData={initialData || {}}
                    submitLabel={t.nextPreview}
                />
            </div>
        );
    };

    const renderPreview = () => {
        if (!previewData) return null;

        return (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-500 space-y-6 pb-20">
                <div className="text-center space-y-2 mb-8">
                    <h2 className="text-2xl font-black">{t.previewYourPost}</h2>
                    <p className="text-muted-foreground">{t.previewHint}</p>
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
                                +{(previewData.images as string[]).length} {t.photosCount}
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
                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{t.price}</p>
                                <p className="text-2xl font-black text-primary">
                                    {selectedCategory === 'FREE_GIVEAWAY' ? 'FREE 🎁' : `$${previewData.price || 0}`}
                                </p>
                            </div>
                            <div className="flex-1 text-right">
                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{t.location}</p>
                                <p className="text-sm font-bold truncate">
                                    {getLocationDisplayText(previewData.pickupLocation) || getLocationDisplayText(previewData.location) || getLocationDisplayText(previewData.serviceArea) || "Ottawa, ON"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SKU List Preview */}
                {previewData.skus && Array.isArray(previewData.skus) && previewData.skus.length > 0 && (
                    <div className="bg-card border rounded-3xl p-6 space-y-4">
                        <h4 className="font-black text-sm uppercase tracking-widest text-muted-foreground">{t.includedOptions} ({previewData.skus.length})</h4>
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
                            {t.backToEdit}
                        </Button>
                        <Button
                            className="flex-[2] h-14 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 transition-all hover:scale-[1.02]"
                            onClick={handleFinalSubmit}
                            disabled={isLoadingData}
                        >
                            {isLoadingData ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                isEditMode ? t.confirmSave : t.publishNow
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
                        <span className={step === 1 ? "text-primary scale-110" : ""}>{t.stepCategory}</span>
                        <span>/</span>
                        <span className={step === 2 ? "text-primary scale-110" : ""}>{t.stepDetails}</span>
                        <span>/</span>
                        <span className={step === 3 ? "text-primary scale-110" : ""}>{t.stepPreview}</span>
                    </div>

                    <div className="w-10" /> {/* Spacer */}
                </div>

                {isLoadingData && step !== 3 ? (
                    <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                        <p className="text-muted-foreground font-bold">{t.loadingData}</p>
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
