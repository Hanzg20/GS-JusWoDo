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
    // Official brand copy, finalized 2026-09-15 — primary title + 品牌副标
    // + English brand slogan are the source of truth; don't drift from
    // this wording without the user revisiting it again.
    const defaultTitle = language === 'zh'
        ? '渥帮 · 首都地区便民社区平台 | 连接邻里 · 发现专业'
        : 'JWD · Ottawa–Gatineau Community Services Platform | Connect · Help · Grow';
    const defaultDescription = language === 'zh'
        ? '汇聚 Ottawa–Gatineau 的本地资源、专业服务与社区活动，让生活更简单。'
        : 'Gathering local resources, professional services, and community events across Ottawa–Gatineau — making everyday life simpler.';
    const defaultImage = 'https://www.justwedo.com/pwa-icons/icon-512x512.png';
    const siteUrl = 'https://www.justwedo.com';

    const defaultKeywords = [
        'Ottawa local services', 'Kanata handyman', 'Kanata Lakes cleaning',
        '渥太华本地服务', 'Kanata 邻里互助', '渥太华清洁', '渥太华维修',
        '渥太华铲雪', 'Ottawa community help', 'JustWeDo', '渥帮',
        'Gatineau community services', 'Ottawa-Gatineau', 'National Capital Region services',
        '加蒂诺', '首都地区便民'
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
            { "@type": "AdministrativeArea", "name": "Nepean" },
            // Forward-looking per the 2026-09-15 Ottawa–Gatineau brand
            // decision — real node coverage is still 1/37 as of this
            // writing, so this is aspirational positioning, not a claim
            // that Gatineau service coverage is already built out.
            { "@type": "AdministrativeArea", "name": "Gatineau" }
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
