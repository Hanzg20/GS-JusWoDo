import { useNavigate } from "react-router-dom";
import { ChevronLeft, Shield, Lock, Eye, FileText } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useConfigStore } from "@/stores/configStore";
import { Button } from "@/components/ui/button";

const Privacy = () => {
    const navigate = useNavigate();
    const { language } = useConfigStore();

    const t = {
        title: language === 'zh' ? '隐私政策' : 'Privacy Policy',
        lastUpdated: language === 'zh' ? '最后更新：2026年1月1日' : 'Last Updated: January 1, 2026',
        intro: language === 'zh'
            ? '渥帮 JWD（以下简称“我们”）非常重视您的隐私。本隐私政策说明了我们如何收集、使用、披露和保护您的个人信息。使用我们的服务即表示您同意本政策。'
            : 'JustWeDo (hereinafter referred to as "we") values your privacy. This Privacy Policy explains how we collect, use, disclose, and protect your personal information. By using our services, you agree to this policy.',

        sections: [
            {
                title: language === 'zh' ? '1. 我们收集的信息' : '1. Information We Collect',
                content: language === 'zh'
                    ? '我们需要收集某些信息以提供服务，包括：\n• 账户信息（姓名、邮箱、电话）\n• 交易信息（订单详情、支付记录 - 仅限必要的交易凭证，我们不存储完整信用卡号）\n• 用户生成内容（发布的帖子、评价、聊天消息）\n• 设备与使用数据（IP地址、浏览器类型、访问日志）'
                    : 'We collect certain information to provide our services, including:\n• Account Information (name, email, phone)\n• Transaction Information (order details, payment records - necessary proofs only, we do not store full credit card numbers)\n• User Generated Content (posts, reviews, chat messages)\n• Device & Usage Data (IP address, browser type, access logs)'
            },
            {
                title: language === 'zh' ? '2. 信息的使用' : '2. How We Use Information',
                content: language === 'zh'
                    ? '我们将收集的信息用于：\n• 提供和维护服务功能\n• 处理交易与订单\n• 改善用户体验和个性化推荐\n• 发送服务通知和安全警报\n• 防止欺诈和滥用行为'
                    : 'We use the collected information to:\n• Provide and maintain service functionality\n• Process transactions and orders\n• Improve user experience and personalized recommendations\n• Send service notifications and security alerts\n• Prevent fraud and abuse'
            },
            {
                title: language === 'zh' ? '3. 信息共享' : '3. Information Sharing',
                content: language === 'zh'
                    ? '我们不会出售您的个人信息。仅在以下情况共享信息：\n• 经您明确同意\n• 与服务商/买家进行必要的交易对接（如共享送货地址）\n• 遵守法律法规或响应法律程序\n• 保护我们或用户的权利与安全'
                    : 'We do not sell your personal information. We only share information when:\n• With your explicit consent\n• Facilitating necessary transactions with providers/buyers (e.g., sharing delivery addresses)\n• Complying with laws or legal processes\n• Protecting the rights and safety of us or our users'
            },
            {
                title: language === 'zh' ? '4. 数据安全' : '4. Data Security',
                content: language === 'zh'
                    ? '我们采取合理的技术和组织措施保护您的数据，包括加密传输、访问控制等。但请注意，互联网传输并非绝对安全，我们无法保证信息的绝对安全性。'
                    : 'We implement reasonable technical and organizational measures to protect your data, including encryption and access controls. However, please note that internet transmission is not absolutely secure, and we cannot guarantee absolute security.'
            },
            {
                title: language === 'zh' ? '5. 您的权利' : '5. Your Rights',
                content: language === 'zh'
                    ? '根据相关法律，您拥有访问、更正、删除个人信息的权利。您可以通过“设置”页面管理您的账户信息，或联系我们要注销账户。'
                    : 'Subject to applicable laws, you have the right to access, correct, and delete your personal information. You can manage your account info via "Settings" or contact us to delete your account.'
            },
            {
                title: language === 'zh' ? '6. 适用法律与管辖' : '6. Governing Law & Jurisdiction',
                content: language === 'zh'
                    ? '本政策受加拿大安大略省法律管辖。我们对个人信息的收集、使用和披露遵循《个人信息保护和电子文件法》（PIPEDA）及安大略省适用的隐私法规。如您对我们处理个人信息的方式有疑虑，可联系加拿大隐私专员公署（Office of the Privacy Commissioner of Canada）寻求进一步指导。'
                    : 'This policy is governed by the laws of the Province of Ontario, Canada. Our collection, use, and disclosure of personal information follows the Personal Information Protection and Electronic Documents Act (PIPEDA) and applicable Ontario privacy regulations. If you have concerns about how we handle your personal information, you may contact the Office of the Privacy Commissioner of Canada for further guidance.'
            }
        ]
    };

    return (
        <div className="min-h-screen bg-[#F8F9FA]">
            <Header />

            <div className="container max-w-4xl mx-auto py-8 px-4">
                <div className="mb-8">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="mb-4 pl-0 hover:bg-transparent text-muted-foreground hover:text-primary"
                        onClick={() => navigate(-1)}
                    >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        {language === 'zh' ? '返回' : 'Back'}
                    </Button>
                    <div className="flex items-center gap-3 mb-2">
                        <Shield className="w-8 h-8 text-primary" />
                        <h1 className="text-3xl font-black">{t.title}</h1>
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">{t.lastUpdated}</p>
                </div>

                <div className="bg-white rounded-[32px] p-8 shadow-sm border border-black/5 space-y-8">
                    <div className="prose prose-slate max-w-none">
                        <p className="text-base leading-relaxed text-slate-600 font-medium">
                            {t.intro}
                        </p>
                    </div>

                    <div className="grid gap-8">
                        {t.sections.map((section, idx) => (
                            <div key={idx} className="space-y-3">
                                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    {section.title}
                                </h3>
                                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">
                                        {section.content}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-8 border-t border-slate-100">
                        <p className="text-sm text-slate-500 text-center">
                            {language === 'zh'
                                ? '如果您对本政策有任何疑问，请通过 Contact Us 页面联系我们要。'
                                : 'If you have any questions about this policy, please contact us via the Contact Us page.'}
                        </p>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default Privacy;
