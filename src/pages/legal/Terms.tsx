import { useNavigate } from "react-router-dom";
import { ChevronLeft, FileText, AlertTriangle, Scale, UserCheck } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useConfigStore } from "@/stores/configStore";
import { Button } from "@/components/ui/button";

const Terms = () => {
    const navigate = useNavigate();
    const { language } = useConfigStore();

    const t = {
        title: language === 'zh' ? '服务条款' : 'Terms of Service',
        lastUpdated: language === 'zh' ? '最后更新：2026年1月1日' : 'Last Updated: January 1, 2026',
        intro: language === 'zh'
            ? '欢迎使用渥帮 JWD！请仔细阅读以下条款。访问或使用我们的平台，即表示您同意受这些条款的约束。'
            : 'Welcome to JustWeDo! Please read these terms carefully. By accessing or using our platform, you agree to be bound by these terms.',

        sections: [
            {
                title: language === 'zh' ? '1. 账户注册与使用' : '1. Account Registration',
                content: language === 'zh'
                    ? '您必须年满18岁才能注册账户。您有责任维护账户凭证的保密性，并对账户下的所有活动负责。您同意提供真实、准确、最新的个人信息。'
                    : 'You must be at least 18 years old to register. You are responsible for maintaining the confidentiality of your credentials and for all activities under your account. You agree to provide accurate and current personal information.'
            },
            {
                title: language === 'zh' ? '2. 用户行为规范' : '2. User Conduct',
                content: language === 'zh'
                    ? '您同意不进行以下行为：\n• 发布虚假、误导性或非法的服务/商品信息\n• 骚扰、辱骂或伤害其他用户\n• 试图绕过平台进行私下交易（脱媒）\n• 侵犯他人的知识产权或隐私权'
                    : 'You agree NOT to:\n• Post false, misleading, or illegal services/goods\n• Harass, abuse, or harm other users\n• Attempt to bypass the platform for transactions (disintermediation)\n• Infringe on others\' intellectual property or privacy'
            },
            {
                title: language === 'zh' ? '3. 服务商与独立承包商' : '3. Independent Contractors',
                content: language === 'zh'
                    ? '平台上的服务提供者（“专家”或“能人”）均为独立承包商，而非平台雇员。服务商自行决定服务内容、价格和时间，并自行承担税务申报及保险责任。平台仅作为信息中介，不保证服务质量。'
                    : 'Service providers on the platform ("Pros") are independent contractors, not employees. Providers determine their own services, prices, and schedules, and are responsible for their own taxes and insurance. The platform acts solely as an intermediary and does not guarantee service quality.'
            },
            {
                title: language === 'zh' ? '4. 费用与支付' : '4. Fees and Payments',
                content: language === 'zh'
                    ? '用户同意支付所购买服务/商品的费用。平台可能会收取一定的服务费或佣金。所有支付通过安全的第三方支付处理商进行。除非另有说明，否则支付后不予退款，具体以取消政策为准。'
                    : 'Users agree to pay for services/goods purchased. The platform may charge service fees or commissions. All payments are processed through secure third-party processors. Payments are non-refundable unless stated otherwise in the cancellation policy.'
            },
            {
                title: language === 'zh' ? '5. 责任限制与免责' : '5. Limitation of Liability',
                content: language === 'zh'
                    ? '在法律允许的最大范围内，渥帮 JWD 不对因使用服务而产生的任何直接、间接、附带或后果性损害负责（包括但不限于利润损失、数据丢失或人身伤害）。您同意自行承担使用风险。'
                    : 'To the fullest extent permitted by law, JustWeDo shall not be liable for any direct, indirect, incidental, or consequential damages (including lost profits, data loss, or personal injury) arising from use of the service. You agree to use the service at your own risk.'
            },
            {
                title: language === 'zh' ? '6. 条款修改' : '6. Changes to Terms',
                content: language === 'zh'
                    ? '我们保留随时修改条款的权利。修改后的条款将在发布时生效。继续使用服务即表示您接受修改后的条款。'
                    : 'We reserve the right to modify these terms at any time. Changes are effective upon posting. Continued use of the service constitutes acceptance of the modified terms.'
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
                        <FileText className="w-8 h-8 text-primary" />
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

                    <div className="mt-8 p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-800 font-bold leading-relaxed">
                            {language === 'zh'
                                ? '重要提示：本平台仅提供信息撮合服务，不直接参与线下服务交付或商品交易。用户之间发生的任何争议（如服务质量、商品瑕疵），建议优先友好协商解决。'
                                : 'IMPORTANT: The platform provides information matching services only and does not participate in offline service delivery. Any disputes between users should ideally be resolved through friendly negotiation.'}
                        </p>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default Terms;
