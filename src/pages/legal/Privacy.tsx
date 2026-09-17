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
        lastUpdated: language === 'zh' ? '最后更新：2026年9月17日' : 'Last Updated: September 17, 2026',
        intro: language === 'zh'
            ? '渥帮 JWD（以下简称“我们”）非常重视您的隐私。本隐私政策说明了我们如何收集、使用、披露和保护您的个人信息。使用我们的服务即表示您同意本政策。'
            : 'JustWeDo (hereinafter referred to as "we") values your privacy. This Privacy Policy explains how we collect, use, disclose, and protect your personal information. By using our services, you agree to this policy.',

        sections: [
            {
                title: language === 'zh' ? '1. 我们收集的信息及收集目的' : '1. Information We Collect and Why',
                content: language === 'zh'
                    ? '我们按照"最小必要"原则收集信息，每类信息都有明确的使用目的：\n\n• 账户信息（姓名、邮箱、电话）—— 用于创建和管理您的账户、身份验证、登录与找回密码，以及在必要时与您就订单/服务进行联系。\n\n• 地理位置信息 —— 仅在您使用小程序时，为您自动匹配并选中所在的最近社区节点，以便优先展示附近的服务与邻居动态；该信息仅在启动时临时获取一次，不进行持续追踪，也不会永久保存您的实时位置轨迹。您可以随时通过设备的微信小程序权限设置关闭此项授权，关闭后可手动选择所在社区，不影响其他功能使用。\n\n• 交易信息（订单详情、支付记录）—— 用于处理和记录您的订单、开具必要的交易凭证、协助解决交易纠纷；我们仅保留必要的交易凭证，不存储完整信用卡号。\n\n• 用户生成内容（发布的帖子、评价、聊天消息、上传的图片）—— 用于向其他用户展示您发布的内容、提供社区互动与沟通功能，并在必要时进行内容安全审核以维护社区秩序。\n\n• 第三方登录信息（如通过微信登录时获取的 openid/昵称/头像）—— 仅用于账号身份识别与登录认证，不会用于本平台之外的其他用途。\n\n• 设备与使用数据（IP地址、浏览器类型、访问日志）—— 用于保障账户与平台安全、排查故障问题、改善产品体验。'
                    : 'We collect information on a "minimum necessary" basis, and every category has a clearly stated purpose:\n\n• Account Information (name, email, phone) — used to create and manage your account, verify your identity, sign in and recover your password, and contact you when necessary about an order or service.\n\n• Geolocation Information — used only while you\'re using the Mini Program, to automatically match and select the nearest community node so we can prioritize showing nearby services and neighborhood activity; this is fetched once at launch, not tracked continuously, and we do not permanently store your real-time location history. You can turn this off anytime via the Mini Program\'s permission settings — with it off, you can still pick your community manually, with no other loss of functionality.\n\n• Transaction Information (order details, payment records) — used to process and record your orders, issue necessary transaction proofs, and help resolve disputes; we retain only necessary proofs and never store full credit card numbers.\n\n• User Generated Content (posts, reviews, chat messages, uploaded images) — used to display your content to other users, provide community interaction and communication features, and, when necessary, run content-safety checks to maintain community order.\n\n• Third-Party Login Information (e.g. openid/nickname/avatar obtained via WeChat login) — used solely for account identification and authentication, never for any purpose outside this platform.\n\n• Device & Usage Data (IP address, browser type, access logs) — used to protect account and platform security, troubleshoot issues, and improve the product experience.'
            },
            {
                title: language === 'zh' ? '2. 信息共享' : '2. Information Sharing',
                content: language === 'zh'
                    ? '我们不会出售您的个人信息。仅在以下情况共享信息：\n• 经您明确同意\n• 与服务商/买家进行必要的交易对接（如共享送货地址）\n• 遵守法律法规或响应法律程序\n• 保护我们或用户的权利与安全'
                    : 'We do not sell your personal information. We only share information when:\n• With your explicit consent\n• Facilitating necessary transactions with providers/buyers (e.g., sharing delivery addresses)\n• Complying with laws or legal processes\n• Protecting the rights and safety of us or our users'
            },
            {
                title: language === 'zh' ? '3. 数据安全' : '3. Data Security',
                content: language === 'zh'
                    ? '我们采取合理的技术和组织措施保护您的数据，包括加密传输、访问控制等。但请注意，互联网传输并非绝对安全，我们无法保证信息的绝对安全性。'
                    : 'We implement reasonable technical and organizational measures to protect your data, including encryption and access controls. However, please note that internet transmission is not absolutely secure, and we cannot guarantee absolute security.'
            },
            {
                title: language === 'zh' ? '4. 您的权利' : '4. Your Rights',
                content: language === 'zh'
                    ? '根据相关法律，您拥有访问、更正、删除个人信息的权利。您可以通过“设置”页面管理您的账户信息，或联系我们要注销账户。'
                    : 'Subject to applicable laws, you have the right to access, correct, and delete your personal information. You can manage your account info via "Settings" or contact us to delete your account.'
            },
            {
                title: language === 'zh' ? '5. 适用法律与管辖' : '5. Governing Law & Jurisdiction',
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
