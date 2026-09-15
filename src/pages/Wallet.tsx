import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, CreditCard, History, PlusCircle, ArrowUpRight, ArrowDownLeft, Loader2, Wallet as WalletIcon, Banknote, Landmark } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuthStore } from "@/stores/authStore";
import { useConfigStore } from "@/stores/configStore";
import { repositoryFactory } from "@/services/repositories/factory";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Wallet = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { currentUser } = useAuthStore();
    const { language } = useConfigStore();
    const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [withdrawEmail, setWithdrawEmail] = useState("");

    const beanRepository = repositoryFactory.getBeanRepository();
    const payoutRepository = repositoryFactory.getPayoutRepository();

    const isProvider = currentUser?.roles?.includes('PROVIDER');

    // JinBean Queries
    const { data: transactions, isLoading: isLoadingTx } = useQuery({
        queryKey: ['wallet-transactions', currentUser?.id],
        queryFn: () => currentUser ? beanRepository.getTransactions(currentUser.id) : Promise.resolve([]),
        enabled: !!currentUser,
    });

    const { data: balance, isLoading: isLoadingBalance } = useQuery({
        queryKey: ['wallet-balance', currentUser?.id],
        queryFn: () => currentUser ? beanRepository.getBalance(currentUser.id) : Promise.resolve(0),
        enabled: !!currentUser,
    });

    // Earnings Queries
    const { data: earnings, isLoading: isLoadingEarnings } = useQuery({
        queryKey: ['provider-earnings', currentUser?.providerProfileId],
        queryFn: () => currentUser?.providerProfileId ? payoutRepository.getProviderEarnings(currentUser.providerProfileId || '') : null,
        enabled: !!isProvider && !!currentUser?.providerProfileId,
    });

    const { data: payoutRequests, isLoading: isLoadingPayouts } = useQuery({
        queryKey: ['payout-requests', currentUser?.providerProfileId],
        queryFn: () => currentUser?.providerProfileId ? payoutRepository.getRequests(currentUser.providerProfileId || '') : Promise.resolve([]),
        enabled: !!isProvider && !!currentUser?.providerProfileId,
    });

    // Withdraw Mutation
    const withdrawMutation = useMutation({
        mutationFn: async (data: { amountCents: number, method: string, details: any }) => {
            if (!currentUser?.providerProfileId) throw new Error("Not a provider");
            return payoutRepository.createRequest({
                providerId: currentUser.providerProfileId || '',
                amountCents: data.amountCents,
                currency: 'CAD',
                method: data.method,
                details: data.details
            });
        },
        onSuccess: () => {
            toast.success(language === 'zh' ? '提现申请已提交' : 'Withdrawal request submitted');
            setIsWithdrawOpen(false);
            setWithdrawAmount("");
            queryClient.invalidateQueries({ queryKey: ['provider-earnings'] });
            queryClient.invalidateQueries({ queryKey: ['payout-requests'] });
        },
        onError: (err) => {
            toast.error(language === 'zh' ? '申请失败' : 'Withdrawal failed');
            console.error(err);
        }
    });

    const handleWithdraw = () => {
        const amount = parseFloat(withdrawAmount);
        if (isNaN(amount) || amount <= 0) {
            toast.error(language === 'zh' ? '请输入有效金额' : 'Please enter a valid amount');
            return;
        }

        if (earnings && amount > earnings.availableBalance / 100) {
            toast.error(language === 'zh' ? '余额不足' : 'Insufficient balance');
            return;
        }

        withdrawMutation.mutate({
            amountCents: Math.round(amount * 100),
            method: 'INTERAC_ETRANSFER',
            details: { email: withdrawEmail || currentUser?.email }
        });
    };

    const t = {
        title: language === 'zh' ? '我的钱包' : 'My Wallet',
        consumerTab: language === 'zh' ? '金豆 (Consumer)' : 'JinBeans (Consumer)',
        providerTab: language === 'zh' ? '收益 (Provider)' : 'Earnings (Provider)',
        balance: language === 'zh' ? '当前余额' : 'Current Balance',
        available: language === 'zh' ? '可提现余额' : 'Available Balance',
        topUp: language === 'zh' ? '立即充值' : 'Top Up Now',
        withdraw: language === 'zh' ? '申请提现' : 'Withdraw',
        history: language === 'zh' ? '收支明细' : 'History',
        noHistory: language === 'zh' ? '暂无记录' : 'No recent records',
        beanUnit: language === 'zh' ? '个' : 'Beans',
        loading: language === 'zh' ? '加载中...' : 'Loading...',
        payoutPending: language === 'zh' ? '处理中' : 'Pending',
        payoutCompleted: language === 'zh' ? '已完成' : 'Completed',
        payoutRejected: language === 'zh' ? '未通过' : 'Rejected',
        amount: language === 'zh' ? '提现金额' : 'Withdraw Amount',
        email: language === 'zh' ? '收款邮箱 (Interac)' : 'Interac Email',
        confirmWithdraw: language === 'zh' ? '确认提现' : 'Confirm Withdrawal',
        processing: language === 'zh' ? '处理中...' : 'Processing...',
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            <Header />

            <div className="container max-w-2xl py-8 px-4">
                <div className="flex items-center gap-4 mb-8">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate('/profile')}
                        className="rounded-full h-10 w-10"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </Button>
                    <h1 className="text-2xl font-black">{t.title}</h1>
                </div>

                <Tabs defaultValue="consumer" className="w-full">
                    {isProvider && (
                        <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted/50 p-1 rounded-2xl h-14">
                            <TabsTrigger value="consumer" className="rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                <WalletIcon className="w-4 h-4 mr-2" />
                                {t.consumerTab}
                            </TabsTrigger>
                            <TabsTrigger value="provider" className="rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                <Banknote className="w-4 h-4 mr-2" />
                                {t.providerTab}
                            </TabsTrigger>
                        </TabsList>
                    )}

                    <TabsContent value="consumer" className="mt-0 focus-visible:ring-0">
                        {/* Balance Card - Beans */}
                        <div className="relative overflow-hidden p-8 rounded-[40px] bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 text-white shadow-2xl shadow-orange-500/20 mb-10">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl" />
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-4 opacity-80">
                                    <CreditCard className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-[0.2em]">{t.balance}</span>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    {isLoadingBalance ? (
                                        <Loader2 className="w-10 h-10 animate-spin opacity-50" />
                                    ) : (
                                        <>
                                            <span className="text-6xl font-black tabular-nums">{balance ?? currentUser?.beansBalance}</span>
                                            <span className="text-xl font-bold opacity-80">🫘</span>
                                        </>
                                    )}
                                </div>

                                <div className="mt-10 flex gap-4">
                                    <Button className="flex-1 h-14 bg-white text-orange-600 hover:bg-white/90 rounded-2xl font-black shadow-lg shadow-black/5 transition-all active:scale-95 flex items-center gap-2">
                                        <PlusCircle className="w-5 h-5" />
                                        {t.topUp}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-14 h-14 border-white/30 bg-white/10 text-white hover:bg-white/20 rounded-2xl flex items-center justify-center transition-all active:scale-95"
                                    >
                                        <History className="w-6 h-6" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* History Section - Beans */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2 px-2">
                                <History className="w-4 h-4" />
                                {t.history}
                            </h3>

                            <div className="space-y-3">
                                {isLoadingTx ? (
                                    <div className="flex flex-col items-center justify-center py-12 opacity-50">
                                        <Loader2 className="w-8 h-8 animate-spin mb-2" />
                                        <p className="text-xs font-bold uppercase tracking-widest">{t.loading}</p>
                                    </div>
                                ) : transactions && transactions.length > 0 ? (
                                    transactions.map((tx) => (
                                        <motion.div
                                            key={tx.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="p-5 rounded-3xl bg-card border border-muted-foreground/5 hover:border-primary/20 transition-all flex items-center justify-between group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${tx.amount > 0 ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
                                                    }`}>
                                                    {tx.amount > 0 ? <ArrowDownLeft className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm leading-tight mb-1">{language === 'zh' ? tx.descriptionZh : (tx.descriptionEn || tx.descriptionZh)}</p>
                                                    <p className="text-[10px] text-muted-foreground font-bold tracking-widest">{new Date(tx.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <p className={`text-lg font-black tabular-nums ${tx.amount > 0 ? 'text-green-600' : 'text-foreground'
                                                }`}>
                                                {tx.amount > 0 ? '+' : ''}{tx.amount}
                                            </p>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="text-center py-12 bg-muted/20 rounded-[40px] border border-dashed border-muted-foreground/20">
                                        <p className="text-sm text-muted-foreground font-medium">{t.noHistory}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="provider" className="mt-0 focus-visible:ring-0">
                        {/* Balance Card - Earnings */}
                        <div className="relative overflow-hidden p-8 rounded-[40px] bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-2xl shadow-emerald-500/20 mb-10">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl" />
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-4 opacity-80">
                                    <Landmark className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-[0.2em]">{t.available}</span>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    {isLoadingEarnings ? (
                                        <Loader2 className="w-10 h-10 animate-spin opacity-50" />
                                    ) : (
                                        <>
                                            <span className="text-6xl font-black tabular-nums">
                                                ${((earnings?.availableBalance || 0) / 100).toFixed(2)}
                                            </span>
                                            <span className="text-xl font-bold opacity-80 uppercase tracking-widest">CAD</span>
                                        </>
                                    )}
                                </div>

                                <div className="mt-10 flex gap-4">
                                    <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
                                        <DialogTrigger asChild>
                                            <Button className="flex-1 h-14 bg-white text-emerald-600 hover:bg-white/90 rounded-2xl font-black shadow-lg shadow-black/5 transition-all active:scale-95 flex items-center gap-2">
                                                <ArrowUpRight className="w-5 h-5" />
                                                {t.withdraw}
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="rounded-[32px] max-w-sm border-none shadow-2xl">
                                            <DialogHeader className="pt-4">
                                                <DialogTitle className="text-2xl font-black tracking-tight">{t.withdraw}</DialogTitle>
                                                <DialogDescription className="font-medium">
                                                    Funds will be sent via Interac e-Transfer.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-6 py-6 font-bold">
                                                <div className="space-y-3">
                                                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground px-1">{t.amount}</Label>
                                                    <div className="relative">
                                                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-muted-foreground">$</span>
                                                        <Input
                                                            type="number"
                                                            placeholder="0.00"
                                                            className="h-20 pl-12 pr-6 rounded-3xl border-none bg-muted/50 text-3xl font-black shadow-inner focus-visible:ring-emerald-500"
                                                            value={withdrawAmount}
                                                            onChange={(e) => setWithdrawAmount(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-3">
                                                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground px-1">{t.email}</Label>
                                                    <Input
                                                        placeholder={currentUser?.email}
                                                        className="h-14 px-6 rounded-2xl border-none bg-muted/50 font-bold shadow-inner focus-visible:ring-emerald-500"
                                                        value={withdrawEmail}
                                                        onChange={(e) => setWithdrawEmail(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <DialogFooter className="pb-4">
                                                <Button
                                                    className="w-full h-16 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                                                    onClick={handleWithdraw}
                                                    disabled={withdrawMutation.isPending}
                                                >
                                                    {withdrawMutation.isPending ? t.processing : t.confirmWithdraw}
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>

                                    <div className="w-14 h-14 border-white/30 bg-white/10 text-white rounded-2xl flex items-center justify-center">
                                        <History className="w-6 h-6" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payout History */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2 px-2">
                                <History className="w-4 h-4" />
                                {t.history}
                            </h3>

                            <div className="space-y-3">
                                {isLoadingPayouts ? (
                                    <div className="flex flex-col items-center justify-center py-12 opacity-50">
                                        <Loader2 className="w-8 h-8 animate-spin mb-2" />
                                        <p className="text-xs font-bold uppercase tracking-widest">{t.loading}</p>
                                    </div>
                                ) : payoutRequests && payoutRequests.length > 0 ? (
                                    payoutRequests.map((p) => (
                                        <motion.div
                                            key={p.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="p-5 rounded-3xl bg-card border border-muted-foreground/5 flex items-center justify-between group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                                    <ArrowUpRight className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm leading-tight mb-1">
                                                        {t.withdraw} - {p.method}
                                                    </p>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-[10px] text-muted-foreground font-bold tracking-widest">{new Date(p.createdAt).toLocaleDateString()}</p>
                                                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${p.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                                                p.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                                            }`}>
                                                            {p.status === 'COMPLETED' ? t.payoutCompleted : p.status === 'REJECTED' ? t.payoutRejected : t.payoutPending}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-lg font-black tabular-nums">
                                                -${(p.amountCents / 100).toFixed(2)}
                                            </p>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="text-center py-12 bg-muted/20 rounded-[40px] border border-dashed border-muted-foreground/20">
                                        <p className="text-sm text-muted-foreground font-medium">{t.noHistory}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            <Footer />
        </div>
    );
};

export default Wallet;
