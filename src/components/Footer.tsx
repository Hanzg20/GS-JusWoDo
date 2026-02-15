import { Heart, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { useConfigStore } from "@/stores/configStore";

const Footer = () => {
  const { language } = useConfigStore();

  const t = {
    explore: language === 'zh' ? '发现' : 'Explore',
    services: language === 'zh' ? '生活服务' : 'Services',
    market: language === 'zh' ? '集市租赁' : 'Market & Rentals',
    community: language === 'zh' ? '邻里社区' : 'Community',

    company: language === 'zh' ? '公司' : 'Company',
    aboutUs: language === 'zh' ? '关于我们' : 'About Us',
    becomePro: language === 'zh' ? '成为能人' : 'Become a Pro',

    support: language === 'zh' ? '支持' : 'Support',
    helpCenter: language === 'zh' ? '帮助中心' : 'Help Center',
    contactUs: language === 'zh' ? '联系我们' : 'Contact Us',

    legal: language === 'zh' ? '法律' : 'Legal',
    userAgreement: language === 'zh' ? '用户协议' : 'Agreement',
    privacy: language === 'zh' ? '隐私政策' : 'Privacy',
    terms: language === 'zh' ? '服务条款' : 'Terms',

    slogan: language === 'zh' ? '连接邻里，发现专业，让生活更轻松' : 'Connecting neighbors, surfacing pros, making life easier.',
    brandName: language === 'zh' ? '渥帮 JWD' : 'JustWeDo',
    copyright: language === 'zh' ? '© 2026 金麟科技. 版权所有' : '© 2026 GoldSky Tech. All rights reserved.',
  };

  return (
    <footer className="relative bg-white border-t border-slate-100 overflow-hidden">
      {/* Background decoration - very subtle */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      <div className="container max-w-7xl mx-auto px-4 sm:px-6">
        <div className="py-8 sm:py-16 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 sm:gap-12">

          {/* Brand Info - Hidden on smallest mobile to save space, or shown prominently on desktop */}
          <div className="col-span-2 lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4 group">
              <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-xl object-cover shadow-sm group-hover:scale-105 transition-transform" />
              <h3 className="text-lg font-black tracking-tighter text-slate-800">{t.brandName}</h3>
            </Link>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xs mb-6 sm:mb-8 font-medium">
              {t.slogan}
            </p>
            {/* Social / Certs Placeholder */}
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-primary transition-colors cursor-pointer">
                <Globe className="w-4 h-4" />
              </div>
              <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-primary transition-colors cursor-pointer text-[10px] font-black">
                CA
              </div>
            </div>
          </div>

          {/* Links Sections - 2 column grid on mobile */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{t.explore}</h4>
            <ul className="space-y-2.5">
              <li><Link to="/category/service" className="text-sm font-bold text-slate-600 hover:text-primary transition-colors">{t.services}</Link></li>
              <li><Link to="/category/goods" className="text-sm font-bold text-slate-600 hover:text-primary transition-colors">{t.market}</Link></li>
              <li><Link to="/community" className="text-sm font-bold text-slate-600 hover:text-primary transition-colors">{t.community}</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{t.company}</h4>
            <ul className="space-y-2.5">
              <li><Link to="/about" className="text-sm font-bold text-slate-600 hover:text-primary transition-colors">{t.aboutUs}</Link></li>
              <li><Link to="/become-provider" className="text-sm font-bold text-slate-600 hover:text-primary transition-colors">{t.becomePro}</Link></li>
              <li><Link to="/help" className="text-sm font-bold text-slate-600 hover:text-primary transition-colors">{t.helpCenter}</Link></li>
            </ul>
          </div>

          {/* Combined Legal & Support for Mobile to save a row */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{t.legal}</h4>
            <div className="grid grid-cols-2 md:grid-cols-1 gap-2.5">
              <Link to="/legal/privacy" className="text-sm font-bold text-slate-600 hover:text-primary transition-colors">{t.privacy}</Link>
              <Link to="/legal/terms" className="text-sm font-bold text-slate-600 hover:text-primary transition-colors">{t.terms}</Link>
              <Link to="/contact" className="text-sm font-bold text-slate-600 hover:text-primary transition-colors md:mt-2 block">{t.contactUs}</Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar - Ultra clean */}
        <div className="py-8 border-t border-slate-50 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest text-center md:text-left">
              {t.copyright}
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{language === 'zh' ? '全域 v5.0' : 'Global v5.0'}</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Built with <Heart className="w-2.5 h-2.5 text-red-400 fill-red-400" /> in Canada
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
