import { useState } from "react";
import Header from "@/components/Header";
import { ArrowLeft, Check, Upload, Banknote, Tag, MapPin, ArrowRight, Sparkles, ShoppingBag, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import CategorySelector from "@/components/Post/CategorySelector";
import { RefCode } from "@/types/domain";
import { useEffect } from "react";
import ImageUploader from "../../components/common/ImageUploader";
import { useAuthStore } from "@/stores/authStore";
import { useListingStore } from "@/stores/listingStore";
import { useCommunity } from "@/context/CommunityContext";
import { toast } from "sonner";
import { PricingModel } from "@/types/domain";
import { Switch } from "@/components/ui/switch";
import LocationPicker from "@/components/LocationPicker";

type ServiceType = 'SERVICE' | 'CONSULTATION' | 'RENTAL';

const PublishService = () => {
    const navigate = useNavigate();
    const { activeNodeId } = useCommunity();
    const [step, setStep] = useState(1);
    const [selectedType, setSelectedType] = useState<ServiceType | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<RefCode | null>(null);

    // Form State
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [images, setImages] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [location, setLocation] = useState<{ lat: number; lng: number; address?: string; serviceRadiusKm?: number } | null>(null);

    // Pricing state
    const [pricingModel, setPricingModel] = useState<PricingModel>('HOURLY');
    const [price, setPrice] = useState("");
    const [unit, setUnit] = useState("hour");
    const [deposit, setDeposit] = useState("");
    const [visitFee, setVisitFee] = useState("");
    const [isPresenceOnly, setIsPresenceOnly] = useState(false);

    const { currentUser } = useAuthStore();
    const { createListing } = useListingStore();

    const steps = [
        { id: 1, title: "选择类型" },
        { id: 2, title: "选择分类" },
        { id: 3, title: "基本信息" },
        { id: 4, title: "价格与策略" },
    ];

    const handleTypeSelect = (type: ServiceType) => {
        setSelectedType(type);
        setStep(2);
    };

    const handleCategorySelect = (category: RefCode) => {
        setSelectedCategory(category);
        setStep(3);
    };

    const handleSubmit = async () => {
        if (!currentUser) {
            toast.error("请先登录");
            return;
        }

        try {
            const masterData = {
                providerId: currentUser.id,
                titleZh: title,
                titleEn: title,
                descriptionZh: description,
                descriptionEn: description,
                images,
                type: selectedType || 'SERVICE' as any,
                categoryId: selectedCategory?.codeId || 'GENERAL',
                nodeId: activeNodeId, // 使用当前活动的社区节点
                status: 'PUBLISHED' as const,
                tags: [],
                location: location ? {
                    coordinates: { lat: location.lat, lng: location.lng },
                    fullAddress: location.address || `${location.lat}, ${location.lng}`
                } : { fullAddress: "Ottawa, ON" },
                latitude: location?.lat,
                longitude: location?.lng,
                rating: 5,
                reviewCount: 0,
                isPromoted: false,
                metadata: {
                    serviceRadiusKm: location?.serviceRadiusKm || 10
                }
            };

            const itemData = {
                masterId: '',
                nameZh: '基本款',
                nameEn: 'Basic',
                descriptionZh: description,
                descriptionEn: description,
                status: 'AVAILABLE' as const,
                pricing: {
                    model: isPresenceOnly ? 'NEGOTIABLE' : pricingModel,
                    price: {
                        amount: (isPresenceOnly || pricingModel === 'QUOTE') ? 0 : parseFloat(price || "0") * 100,
                        currency: 'CAD',
                        formatted: ''
                    },
                    unit: unit,
                    deposit: pricingModel === 'DEPOSIT_REQUIRED' ? {
                        amount: parseFloat(deposit || "0") * 100,
                        currency: 'CAD',
                        formatted: ''
                    } : undefined
                },
                images: images.slice(0, 1),
                attributes: {}
            };

            await createListing(masterData, [itemData]);
            toast.success("发布成功！");
            navigate('/my-listings');
        } catch (err: any) {
            toast.error("发布失败: " + err.message);
        }
    };

    const renderStep1 = () => (
        <div className="space-y-6 animate-fade-in py-4">
            <h2 className="text-2xl font-black tracking-tight mb-8 text-center">选择服务类型</h2>
            <div className="flex flex-col gap-4">
                {[
                    { id: 'SERVICE', emoji: '🔧', title: '专业服务', desc: '维修、清洁、上门服务...', color: 'from-blue-400 to-indigo-500', shadow: 'shadow-blue-200' },
                    { id: 'CONSULTATION', emoji: '💼', title: '专业咨询', desc: '法律、财务、设计咨询...', color: 'from-purple-400 to-pink-500', shadow: 'shadow-purple-200' },
                    { id: 'RENTAL', emoji: '🏠', title: '商业出租', desc: '场地、设备长期出租...', color: 'from-green-400 to-emerald-500', shadow: 'shadow-green-200' },
                ].map(item => (
                    <button
                        key={item.id}
                        onClick={() => handleTypeSelect(item.id as ServiceType)}
                        className={`p-6 rounded-[2rem] border-2 border-transparent bg-white shadow-xl ${item.shadow} hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 text-left group relative overflow-hidden flex items-center gap-6`}
                    >
                        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${item.color} opacity-10 group-hover:opacity-20 transition-opacity rounded-bl-[4rem]`} />
                        <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform">
                            {item.emoji}
                        </div>
                        <div>
                            <h3 className="font-black text-2xl tracking-tight mb-1">{item.title}</h3>
                            <p className="text-sm font-bold text-muted-foreground leading-tight">{item.desc}</p>
                        </div>
                        <div className="ml-auto bg-muted/20 p-2 rounded-full group-hover:bg-primary/20 transition-colors">
                            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold mb-6">描述您的服务</h2>

            {selectedCategory && (
                <div className="bg-primary/5 p-3 rounded-lg flex items-center gap-2 mb-4 text-sm text-primary font-medium">
                    <span className="bg-primary/20 px-2 py-0.5 rounded text-xs">已选分类</span>
                    {selectedCategory.zhName}
                </div>
            )}

            <div className="space-y-3">
                <label className="text-sm font-semibold flex items-center gap-2">
                    <Tag className="w-4 h-4" /> 服务标题
                </label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="例如：专业家电维修服务"
                    className="w-full p-4 rounded-xl border bg-muted/30 focus:bg-background focus:border-primary outline-none transition-all"
                />
            </div>

            <div className="space-y-3">
                <label className="text-sm font-semibold flex items-center gap-2">
                    <Upload className="w-4 h-4" /> 上传照片
                </label>
                <div className="bg-card border-none p-4 rounded-3xl">
                    <ImageUploader
                        bucketName="listing-media"
                        onUpload={(urls) => setImages(urls)}
                        onUploadingChange={setIsUploading}
                        maxFiles={6}
                        existingImages={images}
                        folderPath={`listings/${currentUser?.id || 'anonymous'}`}
                    />
                </div>
            </div>

            <div className="space-y-3">
                <label className="text-sm font-semibold flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> 服务位置与范围
                </label>
                <LocationPicker
                    value={location || undefined}
                    onChange={setLocation}
                    showRadiusSelector={true}
                    defaultRadius={10}
                />
            </div>

            <div className="space-y-3">
                <label className="text-sm font-semibold flex items-center gap-2">
                    详细描述
                </label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="详细介绍您的专业服务..."
                    className="w-full p-4 rounded-xl border bg-muted/30 focus:bg-background focus:border-primary outline-none transition-all min-h-[120px]"
                />
            </div>

            <Button
                onClick={() => setStep(4)}
                className="w-full py-6 font-bold text-lg rounded-xl"
                disabled={!title || isUploading}
            >
                {isUploading ? '正在上传图片...' : '下一步'}
            </Button>
        </div>
    );

    const renderStep4 = () => (
        <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold mb-6">设置价格与策略</h2>

            {/* Strategy Selection */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                    { id: 'FIXED', label: '一口价', icon: <Banknote className="w-4 h-4" /> },
                    { id: 'HOURLY', label: '按时计费', icon: <Clock className="w-4 h-4" /> },
                    { id: 'QUOTE', label: '询价报价', icon: <Sparkles className="w-4 h-4" /> },
                    { id: 'DEPOSIT_REQUIRED', label: '需交押金', icon: <ShoppingBag className="w-4 h-4" /> },
                ].map((strat) => (
                    <button
                        key={strat.id}
                        onClick={() => {
                            setPricingModel(strat.id as PricingModel);
                            if (strat.id === 'HOURLY') setUnit('hour');
                            else if (strat.id === 'FIXED') setUnit('item');
                        }}
                        className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${pricingModel === strat.id && !isPresenceOnly ? 'border-primary bg-primary/5 text-primary' : 'bg-background hover:bg-muted/30'}`}
                    >
                        {strat.icon}
                        <span className="text-xs font-bold">{strat.label}</span>
                    </button>
                ))}
            </div>

            {/* Special Presence Option */}
            <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/20 mb-6">
                <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-primary" />
                    <div>
                        <p className="text-sm font-bold">行业名片模式</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-black">只展示信息，不直接下单</p>
                    </div>
                </div>
                <Switch
                    checked={isPresenceOnly}
                    onCheckedChange={setIsPresenceOnly}
                />
            </div>

            {!isPresenceOnly && pricingModel !== 'QUOTE' && (
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold flex items-center gap-2">
                            {pricingModel === 'DEPOSIT_REQUIRED' ? '租金' : '价格'} (CAD)
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-lg">$</span>
                            <input
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                placeholder="0.00"
                                className="w-full p-4 pl-10 rounded-xl border bg-muted/30 focus:bg-background focus:border-primary outline-none transition-all font-mono text-lg"
                            />
                        </div>
                    </div>

                    {pricingModel === 'HOURLY' && (
                        <div className="flex gap-2 p-1 bg-muted rounded-xl">
                            {['hour', 'day', 'session'].map(u => (
                                <button
                                    key={u}
                                    onClick={() => setUnit(u)}
                                    className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${unit === u ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground'}`}
                                >
                                    {u === 'hour' ? '每小时' : u === 'day' ? '每天' : '每次'}
                                </button>
                            ))}
                        </div>
                    )}

                    {pricingModel === 'DEPOSIT_REQUIRED' && (
                        <div className="space-y-2 animate-slide-in">
                            <label className="text-sm font-semibold">押金 (CAD)</label>
                            <input
                                type="number"
                                value={deposit}
                                onChange={(e) => setDeposit(e.target.value)}
                                placeholder="推荐金额"
                                className="w-full p-4 rounded-xl border bg-muted/30 outline-none"
                            />
                        </div>
                    )}
                </div>
            )}

            <Button
                onClick={handleSubmit}
                className="w-full py-6 font-bold text-lg rounded-xl btn-action"
                disabled={!isPresenceOnly && pricingModel !== 'QUOTE' && !price}
            >
                <span className="mr-2">✨</span> 确认发布
            </Button>
        </div>
    );

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <div className="container max-w-xl py-8">
                {/* Progress Bar */}
                <div className="flex items-center justify-between mb-8 px-2">
                    {steps.map((s, i) => (
                        <div key={s.id} className="flex flex-col items-center gap-2 relative z-10">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${step >= s.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                {step > s.id ? <Check className="w-4 h-4" /> : s.id}
                            </div>
                            <span className={`text-xs font-medium ${step >= s.id ? 'text-primary' : 'text-muted-foreground'}`}>{s.title}</span>
                        </div>
                    ))}
                    {/* Progress Line */}
                    <div className="absolute left-0 right-0 top-4 h-[2px] bg-muted -z-0 mx-8">
                        <div
                            className="h-full bg-primary transition-all duration-500"
                            style={{ width: `${((step - 1) / 3) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Form Area */}
                <div className="bg-card shadow-lg rounded-3xl p-6 md:p-8 border border-border/50 relative overflow-hidden min-h-[400px]">
                    <div className="mt-4">
                        {/* Step Back */}
                        {step > 1 && step < 3 && (
                            <button onClick={() => setStep(step - 1)} className="absolute top-6 left-6 text-muted-foreground hover:text-foreground z-20">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                        )}

                        {step === 1 && renderStep1()}
                        {step === 2 && (
                            <CategorySelector
                                onSelect={handleCategorySelect}
                                onBack={() => setStep(1)}
                                majorOnly={true}
                            />
                        )}
                        {step === 3 && renderStep3()}
                        {step === 4 && renderStep4()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PublishService;
