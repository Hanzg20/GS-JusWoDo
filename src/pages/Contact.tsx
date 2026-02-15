import { useNavigate } from "react-router-dom";
import { ChevronLeft, Mail, MessageCircle, MapPin, Send, Instagram, Facebook } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useConfigStore } from "@/stores/configStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useState } from "react";

const Contact = () => {
    const navigate = useNavigate();
    const { language } = useConfigStore();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const t = {
        title: language === 'zh' ? '联系我们' : 'Contact Us',
        subtitle: language === 'zh'
            ? '无论是寻求帮助、商务合作还是反馈建议，我们随时乐意倾听。'
            : 'Whether you need help, partnership, or want to give feedback, we are here to listen.',

        form: {
            name: language === 'zh' ? '您的称呼' : 'Your Name',
            email: language === 'zh' ? '电子邮箱' : 'Email Address',
            subject: language === 'zh' ? '主题' : 'Subject',
            message: language === 'zh' ? '留言内容' : 'Message',
            send: language === 'zh' ? '发送留言' : 'Send Message',
            sending: language === 'zh' ? '发送中...' : 'Sending...',
            success: language === 'zh' ? '留言已发送，我们会尽快联系您！' : 'Message sent! We will get back to you soon.'
        },

        contactInfo: {
            title: language === 'zh' ? '联系方式' : 'Get in Touch',
            emailLabel: language === 'zh' ? '客服邮箱' : 'Support Email',
            socialLabel: language === 'zh' ? '关注我们' : 'Follow Us',
            locationLabel: language === 'zh' ? '公司地址' : 'Location',
            location: 'Kanata, Ottawa, ON, Canada'
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        // Simulate API call
        setTimeout(() => {
            setIsSubmitting(false);
            toast.success(t.form.success);
            (e.target as HTMLFormElement).reset();
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-[#F8F9FA]">
            <Header />

            <div className="container max-w-5xl mx-auto py-8 px-4">
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
                    <h1 className="text-3xl font-black mb-2">{t.title}</h1>
                    <p className="text-muted-foreground font-medium max-w-xl">{t.subtitle}</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Contact Info Card */}
                    <div className="md:col-span-1 bg-primary text-primary-foreground rounded-[32px] p-8 shadow-xl shadow-primary/20 flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                        <div className="relative z-10 space-y-8">
                            <div>
                                <h3 className="text-lg font-black uppercase tracking-widest opacity-80 mb-6">{t.contactInfo.title}</h3>

                                <div className="space-y-6">
                                    <div className="flex items-start gap-4">
                                        <div className="p-2 bg-white/20 rounded-lg">
                                            <Mail className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold uppercase opacity-70 mb-0.5">{t.contactInfo.emailLabel}</p>
                                            <a href="mailto:support@justwedo.ca" className="font-bold hover:underline">support@justwedo.ca</a>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="p-2 bg-white/20 rounded-lg">
                                            <MapPin className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold uppercase opacity-70 mb-0.5">{t.contactInfo.locationLabel}</p>
                                            <p className="font-bold">{t.contactInfo.location}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <p className="text-xs font-bold uppercase opacity-70 mb-3">{t.contactInfo.socialLabel}</p>
                                <div className="flex gap-3">
                                    <a href="#" className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                                        <Instagram className="w-5 h-5" />
                                    </a>
                                    <a href="#" className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                                        <Facebook className="w-5 h-5" />
                                    </a>
                                    <a href="#" className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                                        <MessageCircle className="w-5 h-5" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="md:col-span-2 bg-white rounded-[32px] p-8 shadow-sm border border-black/5">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-muted-foreground ml-1">{t.form.name}</label>
                                    <Input required className="h-12 rounded-xl border-muted-foreground/20 bg-muted/20" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-muted-foreground ml-1">{t.form.email}</label>
                                    <Input required type="email" className="h-12 rounded-xl border-muted-foreground/20 bg-muted/20" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">{t.form.subject}</label>
                                <Input required className="h-12 rounded-xl border-muted-foreground/20 bg-muted/20" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">{t.form.message}</label>
                                <Textarea required className="min-h-[150px] rounded-xl border-muted-foreground/20 bg-muted/20 resize-none" />
                            </div>

                            <div className="flex justify-end">
                                <Button
                                    type="submit"
                                    className="h-12 px-8 rounded-xl font-bold shadow-lg shadow-primary/20"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>{t.form.sending}</>
                                    ) : (
                                        <>
                                            {t.form.send}
                                            <Send className="w-4 h-4 ml-2" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default Contact;
