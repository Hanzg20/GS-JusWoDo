import React from 'react';
import { Plus, Trash2, Tag, DollarSign, Package, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useConfigStore } from '@/stores/configStore';

interface SkuItem {
    id: string;
    name: string;
    price: number;
    stock: number;
    description?: string;
}

interface SkuListEditorProps {
    value: SkuItem[];
    onChange: (value: SkuItem[]) => void;
    placeholder?: string;
}

const SkuListEditor: React.FC<SkuListEditorProps> = ({ value = [], onChange }) => {
    const { language } = useConfigStore();

    const handleAdd = () => {
        const newItem: SkuItem = {
            id: Math.random().toString(36).substr(2, 9),
            name: '',
            price: 0,
            stock: 1,
            description: ''
        };
        onChange([...value, newItem]);
    };

    const handleRemove = (id: string) => {
        onChange(value.filter(item => item.id !== id));
    };

    const handleChange = (id: string, updates: Partial<SkuItem>) => {
        onChange(value.map(item => item.id === id ? { ...item, ...updates } : item));
    };

    return (
        <div className="space-y-4">
            {value.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed rounded-2xl bg-muted/30">
                    <p className="text-sm text-muted-foreground mb-4">{language === 'zh' ? '尚未添加任何规格/价格方案' : 'No options added yet'}</p>
                    <Button type="button" variant="outline" size="sm" onClick={handleAdd} className="gap-2">
                        <Plus className="w-4 h-4" /> {language === 'zh' ? '添加第一个规格' : 'Add First Option'}
                    </Button>
                </div>
            )}

            <div className="space-y-3">
                {value.map((item, index) => (
                    <div key={item.id} className="relative group bg-card border rounded-2xl p-4 transition-all hover:shadow-sm">
                        <div className="flex items-start justify-between mb-4">
                            <span className="text-xs font-black bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                {language === 'zh' ? `规格 #${index + 1}` : `Option #${index + 1}`}
                            </span>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemove(item.id)}
                                className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-full"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold flex items-center gap-1 text-muted-foreground">
                                    <Tag className="w-3 h-3" /> {language === 'zh' ? '规格名称' : 'Option Name'}
                                </label>
                                <Input
                                    value={item.name}
                                    onChange={(e) => handleChange(item.id, { name: e.target.value })}
                                    placeholder={language === 'zh' ? '如：基础套餐、VIP装' : 'e.g. Basic Plan, VIP Bundle'}
                                    className="bg-muted/30 border-none focus-visible:ring-1"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold flex items-center gap-1 text-muted-foreground">
                                        <DollarSign className="w-3 h-3" /> {language === 'zh' ? '价格 (CAD)' : 'Price (CAD)'}
                                    </label>
                                    <Input
                                        type="number"
                                        value={item.price || ''}
                                        onChange={(e) => handleChange(item.id, { price: parseFloat(e.target.value) || 0 })}
                                        placeholder="0.00"
                                        className="bg-muted/30 border-none focus-visible:ring-1"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold flex items-center gap-1 text-muted-foreground">
                                        <Package className="w-3 h-3" /> {language === 'zh' ? '库存/名额' : 'Stock/Slots'}
                                    </label>
                                    <Input
                                        type="number"
                                        value={item.stock || ''}
                                        onChange={(e) => handleChange(item.id, { stock: parseInt(e.target.value) || 0 })}
                                        placeholder="1"
                                        className="bg-muted/30 border-none focus-visible:ring-1"
                                    />
                                </div>
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <label className="text-xs font-bold flex items-center gap-1 text-muted-foreground">
                                    <FileText className="w-3 h-3" /> {language === 'zh' ? '额外补充 (可选)' : 'Additional Notes (optional)'}
                                </label>
                                <Textarea
                                    value={item.description}
                                    onChange={(e) => handleChange(item.id, { description: e.target.value })}
                                    placeholder={language === 'zh' ? '简要说明此规格的包含内容...' : "Briefly describe what's included in this option..."}
                                    rows={2}
                                    className="bg-muted/30 border-none focus-visible:ring-1 resize-none"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {value.length > 0 && (
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleAdd}
                    className="w-full border-dashed rounded-2xl py-6 hover:bg-primary/5 hover:border-primary/30 transition-all border-2"
                >
                    <Plus className="w-4 h-4 mr-2" /> {language === 'zh' ? '继续添加规格' : 'Add Another Option'}
                </Button>
            )}
        </div>
    );
};

export default SkuListEditor;
