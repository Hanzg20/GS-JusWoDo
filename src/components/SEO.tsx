import { Helmet } from 'react-helmet-async';
import { useConfigStore } from '@/stores/configStore';

interface SEOProps {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    type?: 'website' | 'article' | 'product';
}

const SEO = ({
    title,
    description,
    image,
    url,
    type = 'website'
}: SEOProps) => {
    const { language } = useConfigStore();

    // Default values
    const siteName = language === 'zh' ? '渥帮 JWD' : 'JustWeDo';
    const defaultTitle = language === 'zh' ? '渥帮 JWD - 渥太华本地互助社区' : 'JustWeDo - Ottawa Local Gig Community';
    const defaultDescription = language === 'zh'
        ? '连接邻里，发现专业。渥太华首选的生活服务与闲置交易平台。找家政、租工具、买二手，就在渥帮。'
        : 'Connecting neighbors, surfacing pros. Ottawa\'s premier platform for local services and rentals. Find help, rent tools, or buy neighborhood goods.';
    const defaultImage = 'https://justwedo.ca/og-image.jpg'; // Pending real deployment URL
    const siteUrl = 'https://justwedo.ca'; // Pending real deployment URL

    // Computed values
    const pageTitle = title ? `${title} | ${siteName}` : defaultTitle;
    const pageDescription = description || defaultDescription;
    const pageImage = image || defaultImage;
    const pageUrl = url || window.location.href;

    return (
        <Helmet>
            {/* Standard Meta Tags */}
            <title>{pageTitle}</title>
            <meta name="description" content={pageDescription} />
            <link rel="canonical" href={pageUrl} />

            {/* Open Graph (Facebook, LinkedIn, WeChat) */}
            <meta property="og:site_name" content={siteName} />
            <meta property="og:title" content={pageTitle} />
            <meta property="og:description" content={pageDescription} />
            <meta property="og:image" content={pageImage} />
            <meta property="og:url" content={pageUrl} />
            <meta property="og:type" content={type} />
            <meta property="og:locale" content={language === 'zh' ? 'zh_CN' : 'en_CA'} />

            {/* Twitter Card */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={pageTitle} />
            <meta name="twitter:description" content={pageDescription} />
            <meta name="twitter:image" content={pageImage} />
        </Helmet>
    );
};

export default SEO;
