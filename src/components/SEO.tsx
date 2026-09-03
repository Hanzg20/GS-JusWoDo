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
    const siteName = language === 'zh' ? '渥帮 JWD' : 'JustWeDo Ottawa & Kanata';
    const defaultTitle = language === 'zh' 
        ? '渥帮 JWD - Ottawa & Kanata 本地极简社区服务平台' 
        : 'JustWeDo - Ottawa & Kanata Community Services Marketplace';
    const defaultDescription = language === 'zh'
        ? '渥帮 (JustWeDo) 专注于 Ottawa 及 Kanata (Kanata Lakes, Stittsville, Nepean 等) 本地社区。轻松查找与快速发布家政清洁、房屋维修、铲雪除草、宠物照顾、接送协助与邻里闲置互助。'
        : 'Connecting Ottawa & Kanata neighborhoods (Kanata Lakes, Stittsville, Barrhaven) with trusted local services including house cleaning, handyman, snow removal, pet care, and neighborly help.';
    const defaultImage = 'https://www.justwedo.com/pwa-icons/icon-512x512.png';
    const siteUrl = 'https://www.justwedo.com';

    const defaultKeywords = [
        'Ottawa local services', 'Kanata handyman', 'Kanata Lakes cleaning',
        '渥太华本地服务', 'Kanata 邻里互助', '渥太华清洁', '渥太华维修',
        '渥太华铲雪', 'Ottawa community help', 'JustWeDo', '渥帮'
    ];

    const allKeywords = Array.from(new Set([...defaultKeywords, ...keywords]));
    const fullTitle = title ? `${title} | ${siteName}` : defaultTitle;
    const fullDescription = description || defaultDescription;
    const fullImage = image || defaultImage;
    const fullUrl = `${siteUrl}${location.pathname}`;

    // Schema.org LocalBusiness / Community Organization
    const jsonLdSchema = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": "渥帮 JWD (JustWeDo)",
        "url": siteUrl,
        "logo": `${siteUrl}/logo.png`,
        "image": fullImage,
        "description": fullDescription,
        "address": {
            "@type": "PostalAddress",
            "addressLocality": "Ottawa",
            "addressRegion": "ON",
            "addressCountry": "CA"
        },
        "areaServed": [
            { "@type": "AdministrativeArea", "name": "Ottawa" },
            { "@type": "AdministrativeArea", "name": "Kanata" },
            { "@type": "AdministrativeArea", "name": "Kanata Lakes" },
            { "@type": "AdministrativeArea", "name": "Stittsville" },
            { "@type": "AdministrativeArea", "name": "Barrhaven" },
            { "@type": "AdministrativeArea", "name": "Nepean" }
        ],
        "knowsLanguage": ["zh-CN", "en-CA"]
    };

    return (
        <Helmet>
            {/* Standard Metadata */}
            <title>{fullTitle}</title>
            <meta name="description" content={fullDescription} />
            <meta name="keywords" content={allKeywords.join(', ')} />
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

            {/* JSON-LD Local Business Schema */}
            <script type="application/ld+json">
                {JSON.stringify(jsonLdSchema)}
            </script>
        </Helmet>
    );
};

export default SEO;
