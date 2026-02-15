import { useState } from "react";
import { ArrowLeft, ChefHat, Sparkles, Package, Camera, MapPin, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

type Category = "food" | "service" | "task";

interface PriceItem {
  id: number;
  name: string;
  price: string;
  unit: string;
}

const Post = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState<Category | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceItems, setPriceItems] = useState<PriceItem[]>([
    { id: 1, name: "标准套餐", price: "", unit: "份" },
  ]);

  const categories = [
    { id: "food" as Category, icon: <ChefHat className="w-8 h-8" />, label: "邻里美食", desc: "私房菜、盒饭、甜点" },
    { id: "service" as Category, icon: <Sparkles className="w-8 h-8" />, label: "上门服务", desc: "保洁、维修、搬家" },
    { id: "task" as Category, icon: <Package className="w-8 h-8" />, label: "跑腿任务", desc: "代取、代买、帮忙" },
  ];

  const addPriceItem = () => {
    setPriceItems([
      ...priceItems,
      { id: Date.now(), name: "", price: "", unit: "份" },
    ]);
  };

  const removePriceItem = (id: number) => {
    if (priceItems.length > 1) {
      setPriceItems(priceItems.filter((item) => item.id !== id));
    }
  };

  const updatePriceItem = (id: number, field: keyof PriceItem, value: string) => {
    setPriceItems(
      priceItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-lg border-b border-border/50">
        <div className="container flex items-center justify-between h-14">
          <button onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)} className="p-2 -ml-2">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">发布服务</h1>
          <div className="w-9" />
        </div>
        {/* Progress Bar */}
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </header>

      <div className="container py-6">
        {/* Step 1: Category Selection */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">选择分类</h2>
              <p className="text-muted-foreground text-sm">选择您要发布的服务类型</p>
            </div>

            <div className="space-y-3">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setCategory(cat.id);
                    setStep(2);
                  }}
                  className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all ${category === cat.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                    }`}
                >
                  <div className="text-primary">{cat.icon}</div>
                  <div className="text-left flex-1">
                    <p className="font-bold text-foreground">{cat.label}</p>
                    <p className="text-sm text-muted-foreground">{cat.desc}</p>
                  </div>
                  <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Basic Info */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">基本信息</h2>
              <p className="text-muted-foreground text-sm">填写标题和描述</p>
            </div>

            <div className="space-y-4">
              {/* Image Upload */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">上传图片 *</label>
                <button className="w-full h-40 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <Camera className="w-8 h-8" />
                  <span className="text-sm">点击上传封面图</span>
                </button>
              </div>

              {/* Title */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">标题 *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="例如：阿姨家常菜"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">描述</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="详细描述您的服务..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none resize-none"
                />
              </div>

              {/* Location */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">位置</label>
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors">
                  <MapPin className="w-5 h-5 text-primary" />
                  <span className="text-foreground">Kanata Lakes, Ottawa</span>
                  <span className="text-xs text-muted-foreground ml-auto">自动定位</span>
                </button>
              </div>
            </div>

            <button
              onClick={() => setStep(3)}
              disabled={!title}
              className="w-full btn-action py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一步
            </button>
          </div>
        )}

        {/* Step 3: Pricing */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">规格定价</h2>
              <p className="text-muted-foreground text-sm">设置服务规格和价格</p>
            </div>

            <div className="space-y-3">
              {priceItems.map((item, index) => (
                <div key={item.id} className="p-4 rounded-2xl bg-card border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-foreground">规格 {index + 1}</span>
                    {priceItems.length > 1 && (
                      <button
                        onClick={() => removePriceItem(item.id)}
                        className="p-1 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updatePriceItem(item.id, "name", e.target.value)}
                      placeholder="规格名称（如：标准套餐）"
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none text-sm"
                    />
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => updatePriceItem(item.id, "price", e.target.value)}
                          placeholder="价格"
                          className="w-full pl-8 pr-3 py-2 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none text-sm"
                        />
                      </div>
                      <select
                        value={item.unit}
                        onChange={(e) => updatePriceItem(item.id, "unit", e.target.value)}
                        className="px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:border-primary focus:outline-none"
                      >
                        <option value="份">/ 份</option>
                        <option value="次">/ 次</option>
                        <option value="小时">/ 小时</option>
                        <option value="天">/ 天</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}

              {priceItems.length < 3 && (
                <button
                  onClick={addPriceItem}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span>添加规格</span>
                </button>
              )}
            </div>

            <button
              onClick={() => setStep(4)}
              disabled={!priceItems.some((item) => item.name && item.price)}
              className="w-full btn-action py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一步
            </button>
          </div>
        )}

        {/* Step 4: Preview & Publish */}
        {step === 4 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">预览发布</h2>
              <p className="text-muted-foreground text-sm">确认信息后发布</p>
            </div>

            {/* Preview Card */}
            <div className="card-warm p-5 space-y-4">
              <div className="h-40 rounded-xl bg-muted flex items-center justify-center">
                <Camera className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    {category === "food" ? "美食" : category === "service" ? "服务" : "任务"}
                  </span>
                </div>
                <h3 className="font-bold text-lg text-foreground">{title || "服务标题"}</h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {description || "服务描述..."}
                </p>
              </div>
              <div className="pt-3 border-t border-border">
                <p className="text-sm text-muted-foreground mb-2">价格规格</p>
                <div className="flex flex-wrap gap-2">
                  {priceItems.filter(item => item.name && item.price).map((item) => (
                    <span key={item.id} className="px-3 py-1 rounded-full bg-muted text-sm">
                      {item.name}: ${item.price}/{item.unit}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button className="flex-1 py-4 rounded-2xl border-2 border-border text-foreground font-semibold hover:bg-muted transition-colors">
                保存草稿
              </button>
              <button className="flex-1 btn-action py-4">
                立即发布
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Post;
