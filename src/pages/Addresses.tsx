import { useNavigate } from "react-router-dom";
import { ChevronLeft, MapPin, Plus, Home, Briefcase, Trash2, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuthStore } from "@/stores/authStore";
import { useConfigStore } from "@/stores/configStore";
import { repositoryFactory } from "@/services/repositories/factory";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";

const Addresses = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuthStore();
    const { language } = useConfigStore();
    const userRepository = repositoryFactory.getUserRepository();
    const queryClient = useQueryClient();

    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [newAddress, setNewAddress] = useState({
        label: "",
        fullAddress: "",
        city: "",
        zip: ""
    });

    const { data: addresses, isLoading } = useQuery({
        queryKey: ['user-addresses', currentUser?.id],
        queryFn: () => currentUser ? userRepository.getAddresses(currentUser.id) : Promise.resolve([]),
        enabled: !!currentUser,
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => userRepository.deleteAddress(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-addresses', currentUser?.id] });
            toast.success(language === 'zh' ? '地址已删除' : 'Address deleted');
        }
    });

    const setDefaultMutation = useMutation({
        mutationFn: (id: string) => userRepository.updateAddress(id, { isDefault: true }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-addresses', currentUser?.id] });
            toast.success(language === 'zh' ? '默认地址已更新' : 'Default address updated');
        }
    });

    const addMutation = useMutation({
        mutationFn: (data: any) => {
            if (!currentUser) throw new Error("No user");
            return userRepository.addAddress({
                userId: currentUser.id,
                label: data.label,
                address: {
                    fullAddress: data.fullAddress,
                    city: data.city,
                    zip: data.zip
                },
                isDefault: (addresses?.length || 0) === 0 // Set as default if it's the first address
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-addresses', currentUser?.id] });
            toast.success(language === 'zh' ? '地址已添加' : 'Address added');
            setIsAddDialogOpen(false);
            setNewAddress({ label: "", fullAddress: "", city: "", zip: "" });
        },
        onError: () => {
            toast.error(language === 'zh' ? '添加失败，请重试' : 'Failed to add address');
        }
    });

    const handleAddAddress = () => {
        if (!newAddress.label || !newAddress.fullAddress) {
            toast.error(language === 'zh' ? '请填写标签和地址' : 'Please fill in label and address');
            return;
        }
        addMutation.mutate(newAddress);
    };

    const t = {
        title: language === 'zh' ? '地址簿' : 'Address Book',
        add: language === 'zh' ? '新增地址' : 'Add New Address',
        default: language === 'zh' ? '默认地址' : 'Default',
        setDefault: language === 'zh' ? '设为默认' : 'Set as Default',
        noAddress: language === 'zh' ? '暂无保存地址' : 'No addresses saved yet',
        deleteConfirm: language === 'zh' ? '确定删除吗？' : 'Delete this address?',
        loading: language === 'zh' ? '加载中...' : 'Loading...',
        addressLabel: language === 'zh' ? '地址标签' : 'Address Label',
        labelPlaceholder: language === 'zh' ? '如：家、公司' : 'e.g. Home, Work',
        fullAddress: language === 'zh' ? '完整地址' : 'Full Address',
        addressPlaceholder: language === 'zh' ? '街道、门牌号' : 'Street and number',
        city: language === 'zh' ? '城市' : 'City',
        postalCode: language === 'zh' ? '邮政编码' : 'Postal Code',
        save: language === 'zh' ? '保存' : 'Save',
        cancel: language === 'zh' ? '取消' : 'Cancel',
        addDialogTitle: language === 'zh' ? '新增收货地址' : 'Add New Address',
        addDialogDesc: language === 'zh' ? '添加常用地址，下单更便捷' : 'Save your address for faster checkout'
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header />

            <div className="container max-w-2xl py-8 px-4">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate('/profile')}
                            className="rounded-full"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </Button>
                        <h1 className="text-2xl font-black">{t.title}</h1>
                    </div>
                </div>

                <div className="space-y-4">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 opacity-50">
                            <Loader2 className="w-10 h-10 animate-spin mb-4" />
                            <p className="text-xs font-black uppercase tracking-[0.2em]">{t.loading}</p>
                        </div>
                    ) : addresses && addresses.length > 0 ? (
                        <AnimatePresence mode="popLayout">
                            {addresses.map((addr) => (
                                <motion.div
                                    key={addr.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className={`p-6 rounded-[32px] border transition-all ${addr.isDefault
                                        ? 'bg-primary/5 border-primary shadow-sm'
                                        : 'bg-card border-muted-foreground/10'
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${addr.isDefault ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                                                }`}>
                                                {addr.label.includes('家') || addr.label.includes('Home') ? <Home className="w-6 h-6" /> : <Briefcase className="w-6 h-6" />}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-black text-base">{addr.label}</h3>
                                                    {addr.isDefault && (
                                                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider">
                                                            {t.default}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground font-medium mt-1">{addr.address.fullAddress}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-muted-foreground/5">
                                        {!addr.isDefault && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setDefaultMutation.mutate(addr.id)}
                                                className="h-10 px-4 rounded-xl text-xs font-bold hover:bg-primary/5 hover:text-primary transition-all"
                                            >
                                                {t.setDefault}
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => deleteMutation.mutate(addr.id)}
                                            className="h-10 w-10 p-0 rounded-xl text-muted-foreground hover:bg-destructive/5 hover:text-destructive transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    ) : (
                        <div className="text-center py-20 bg-muted/10 rounded-[40px] border-2 border-dashed border-muted-foreground/10">
                            <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <MapPin className="w-8 h-8 text-muted-foreground/30" />
                            </div>
                            <p className="text-muted-foreground font-bold">{t.noAddress}</p>
                        </div>
                    )}
                </div>

                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="w-full h-14 mt-10 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black shadow-xl shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                            <Plus className="w-5 h-5" />
                            {t.add}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-[32px] max-w-md border-none shadow-2xl">
                        <DialogHeader className="pt-4">
                            <DialogTitle className="text-2xl font-black tracking-tight">{t.addDialogTitle}</DialogTitle>
                            <DialogDescription className="font-medium">{t.addDialogDesc}</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6 py-6">
                            <div className="space-y-3">
                                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground px-1">{t.addressLabel}</Label>
                                <Input
                                    placeholder={t.labelPlaceholder}
                                    className="h-14 px-6 rounded-2xl border-none bg-muted/50 font-bold shadow-inner focus-visible:ring-primary"
                                    value={newAddress.label}
                                    onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground px-1">{t.fullAddress}</Label>
                                <Input
                                    placeholder={t.addressPlaceholder}
                                    className="h-14 px-6 rounded-2xl border-none bg-muted/50 font-bold shadow-inner focus-visible:ring-primary"
                                    value={newAddress.fullAddress}
                                    onChange={(e) => setNewAddress({ ...newAddress, fullAddress: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground px-1">{t.city}</Label>
                                    <Input
                                        placeholder="Ottawa"
                                        className="h-14 px-6 rounded-2xl border-none bg-muted/50 font-bold shadow-inner focus-visible:ring-primary"
                                        value={newAddress.city}
                                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground px-1">{t.postalCode}</Label>
                                    <Input
                                        placeholder="K1A 0B1"
                                        className="h-14 px-6 rounded-2xl border-none bg-muted/50 font-bold shadow-inner focus-visible:ring-primary"
                                        value={newAddress.zip}
                                        onChange={(e) => setNewAddress({ ...newAddress, zip: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="pb-4">
                            <Button
                                className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-sm shadow-lg shadow-primary/20 active:scale-95 transition-all"
                                onClick={handleAddAddress}
                                disabled={addMutation.isPending}
                            >
                                {addMutation.isPending ? t.loading : t.save}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Footer />
        </div>
    );
};

export default Addresses;
