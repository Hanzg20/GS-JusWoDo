import { Helmet } from 'react-helmet-async';
import { useConfigStore } from '@/stores/configStore';
import { useLocation } from 'react-router-dom';

interface SEOProps {
    title?: string;
    description?: string;
    image?: string;
    type?: 'website' | 'article' | 'product' | 'profile';
    keywords?: string[];
    noindex?: boolean;
}

const SEO = ({
    title,
    description,
    image,
    type = 'website',
    keywords = [],
    noindex = false
}: SEOProps) => {
    const { language } = useConfigStore();
    const location = useLocation();

    // Defaults
    const siteName = language === 'zh' ? '渥帮 (JustWeDo)' : 'JustWeDo';
    const defaultTitle = language === 'zh' ? '渥帮 - 渥太华本地生活服务平台' : 'JustWeDo - Ottawa Local Services Marketplace';
    const defaultDescription = language === 'zh'
        ? '连接渥太华社区，提供家政、维修、美食、接送等便捷服务。'
        : 'Connecting Ottawa neighborhoods with trusted local services like cleaning, moving, food, and more.';
    const defaultImage = 'https://justwedo.ca/og-image.jpg'; // Replace with actual URL
    const siteUrl = 'https://justwedo.ca'; // Replace with actual URL

    const fullTitle = title ? `${title} | ${siteName}` : defaultTitle;
    const fullDescription = description || defaultDescription;
    const fullImage = image || defaultImage;
    const fullUrl = `${siteUrl}${location.pathname}`;

    return (
        <Helmet>
            {/* Standard Metadata */}
            <title>{fullTitle}</title>
            <meta name="description" content={fullDescription} />
            {keywords.length > 0 && <meta name="keywords" content={keywords.join(', ')} />}
            <link rel="canonical" href={fullUrl} />
            <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />

            {/* Robots */}
            {noindex && <meta name="robots" content="noindex, nofollow" />}

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:title" content={title || defaultTitle} />
            <meta property="og:description" content={fullDescription} />
            <meta property="og:image" content={fullImage} />
            <meta property="og:url" content={fullUrl} />
            <meta property="og:site_name" content={siteName} />
            <meta property="og:locale" content={language === 'zh' ? 'zh_CN' : 'en_CA'} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={title || defaultTitle} />
            <meta name="twitter:description" content={fullDescription} />
            <meta name="twitter:image" content={fullImage} />
        </Helmet>
    );
};

export default SEO;
