import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ChevronLeft, Search, HelpCircle, Book,
    Shield, CreditCard, MessageCircle,
    Mail, ExternalLink, ChevronRight,
    LifeBuoy
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useConfigStore } from "@/stores/configStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const HelpCenter = () => {
    const navigate = useNavigate();
    const { language } = useConfigStore();
    const [searchQuery, setSearchQuery] = useState("");

    const t = {
        title: language === 'zh' ? '帮助中心' : 'Help Center',
        searchPlaceholder: language === 'zh' ? '搜索问题...' : 'Search for help...',
        categories: language === 'zh' ? '常见问题' : 'FAQ Categories',
        supportTitle: language === 'zh' ? '联系支持' : 'Contact Support',
        supportDesc: language === 'zh' ? '无法找到答案？我们的团队随时为您提供帮助。' : 'Can\'t find what you\'re looking for? Our team is here to help.',
        chatSupport: language === 'zh' ? '在线联系' : 'Live Chat',
        emailSupport: language === 'zh' ? '邮件反馈' : 'Email Us',
    };

    const faqCategories = [
        {
            id: 'buying',
            title: language === 'zh' ? '购买与订单' : 'Orders & Buying',
            icon: ShoppingBagIcon,
            questions: [
                {
                    q: language === 'zh' ? '如何发布交易指令？' : 'How do I place an order?',
                    a: language === 'zh' ? '浏览您感兴趣的服务或商品，点击“立即下单”或“联系邻居”即可开始交易流程。' : 'Browse the services or goods you are interested in, click "Order Now" or "Chat" to start the process.'
                },
                {
                    q: language === 'zh' ? '订单可以取消吗？' : 'Can I cancel an order?',
                    a: language === 'zh' ? '在卖家确认前可以随时取消。如果已开始服务，请与卖家沟通协商。' : 'You can cancel anytime before the provider confirms. If the service has started, please coordinate with the provider.'
                }
            ]
        },
        {
            id: 'wallet',
            title: language === 'zh' ? '钱包与金豆' : 'Wallet & JinBeans',
            icon: CreditCard,
            questions: [
                {
                    q: language === 'zh' ? '什么是金豆？' : 'What are JinBeans?',
                    a: language === 'zh' ? '金豆是平台通用积分，可用于支付服务费用、兑换礼品或抵扣手续费。' : 'JinBeans are platform points used for paying services, redeeming gifts, or covering fees.'
                },
                {
                    q: language === 'zh' ? '金豆可以退款吗？' : 'Are JinBeans refundable?',
                    a: language === 'zh' ? '充值的金豆通常不支持原路退回，但您可以用于后续交易。' : 'Purchased JinBeans are generally non-refundable but can be used for any future transactions.'
                }
            ]
        },
        {
            id: 'safety',
            title: language === 'zh' ? '安全与认证' : 'Safety & Trust',
            icon: Shield,
            questions: [
                {
                    q: language === 'zh' ? '平台如何保证交易安全？' : 'How is transaction safety guaranteed?',
                    a: language === 'zh' ? '我们实行金豆托管机制、实名认证体系和邻友评价制度，全方位保障您的权益。' : 'We use JinBean escrow, real-name verification, and neighbor reviews to protect your interests.'
                }
            ]
        }
    ];

    function ShoppingBagIcon(props: any) { return <Book {...props} /> }

    return (
        <div className="min-h-screen bg-[#F8F9FA]">
            <Header />

            <div className="container max-w-2xl py-8 px-4">
                <div className="flex items-center gap-4 mb-8">
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

                {/* Search Bar */}
                <div className="relative mb-8">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                        placeholder={t.searchPlaceholder}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-14 pl-12 rounded-[28px] border-none shadow-sm focus:ring-primary/20 bg-white font-bold"
                    />
                </div>

                {/* FAQ Content */}
                <div className="space-y-8 mb-12">
                    <h3 className="text-[12px] font-black text-muted-foreground uppercase tracking-[0.2em] px-4">
                        {t.categories}
                    </h3>

                    <div className="space-y-4">
                        {faqCategories.map((cat) => (
                            <div key={cat.id} className="bg-white rounded-[32px] overflow-hidden border border-black/5 shadow-sm">
                                <div className="p-6 pb-2 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                        <cat.icon className="w-4 h-4" />
                                    </div>
                                    <h4 className="font-black text-slate-800">{cat.title}</h4>
                                </div>
                                <Accordion type="single" collapsible className="w-full">
                                    {cat.questions.map((faq, idx) => (
                                        <AccordionItem key={idx} value={`${cat.id}-${idx}`} className="border-none px-6 last:mb-2">
                                            <AccordionTrigger className="hover:no-underline py-4 text-left font-bold text-sm text-slate-600">
                                                {faq.q}
                                            </AccordionTrigger>
                                            <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                                                {faq.a}
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Support CTA */}
                <div className="bg-primary rounded-[32px] p-8 text-white shadow-xl shadow-primary/20 mb-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-1/3 -translate-y-1/3" />
                    <div className="relative z-10">
                        <LifeBuoy className="w-10 h-10 mb-4 opacity-80" />
                        <h3 className="text-2xl font-black mb-2">{t.supportTitle}</h3>
                        <p className="text-sm font-medium opacity-80 mb-6 max-w-xs">{t.supportDesc}</p>

                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                onClick={() => navigate('/chat')}
                                className="bg-white text-primary hover:bg-white/90 rounded-xl font-black h-12 gap-2"
                            >
                                <MessageCircle className="w-4 h-4" />
                                {t.chatSupport}
                            </Button>
                            <Button
                                variant="outline"
                                className="bg-transparent border-white/30 text-white hover:bg-white/10 rounded-xl font-black h-12 gap-2"
                            >
                                <Mail className="w-4 h-4" />
                                {t.emailSupport}
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="flex justify-center gap-6 text-muted-foreground opacity-50 font-bold text-[10px] uppercase tracking-widest">
                    <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
                    <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default HelpCenter;
