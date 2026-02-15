import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import SEO from "@/components/SEO";
import { useListingStore, getTranslation } from "@/stores/listingStore";
import { useProviderStore } from "@/stores/providerStore";
import { useConfigStore } from "@/stores/configStore";
import { ListingMaster, ListingItem } from "@/types/domain";
import { repositoryFactory } from "@/services/repositories/factory";
import { useServiceAreaMonitor } from "@/hooks/useGeofencing";

// Sub-components
import { ServiceHero } from "@/components/service-detail/ServiceHero";
import { ServiceInfo } from "@/components/service-detail/ServiceInfo";
import { ServiceProviderCard } from "@/components/service-detail/ServiceProviderCard";
import { ServiceSkuPicker } from "@/components/service-detail/ServiceSkuPicker";
import { ServiceConfiguration } from "@/components/service-detail/ServiceConfiguration";
import { ServiceActions } from "@/components/service-detail/ServiceActions";

// Complex Views/Flows
import { InstantPayFlow } from "@/components/checkout/InstantPayFlow";
import { QuoteRequestFlow } from "@/components/checkout/QuoteRequestFlow";
import { GoodsDetailView } from "@/components/checkout/GoodsDetailView";
import { TaskDetailView } from "@/components/checkout/TaskDetailView";
import { EnhancedReviewList } from "@/components/reviews/EnhancedReviewList";

const ServiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { listings } = useListingStore();
  const { getProviderById } = useProviderStore();
  const { refCodes, language } = useConfigStore();

  const [master, setMaster] = useState<ListingMaster | null>(null);
  const [items, setItems] = useState<ListingItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<ListingItem | null>(null);
  const [provider, setProvider] = useState<any>(null);

  // Flow States
  const [isInstantPayOpen, setIsInstantPayOpen] = useState(false);
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  // Rental/Consultation States
  const [dateRange, setDateRange] = useState<{ from: Date; to?: Date } | undefined>(undefined);
  const [consultHours, setConsultHours] = useState(1);

  // Geofencing
  const { isInArea, distance } = useServiceAreaMonitor(
    master?.location?.coordinates?.lat || 0,
    master?.location?.coordinates?.lng || 0,
    master?.metadata?.serviceRadiusKm || 10,
    getTranslation(master || {}, 'title')
  );

  const t = {
    notFound: language === 'zh' ? '未找到服务...' : 'Listing not found...',
    shareTitle: language === 'zh' ? '分享' : 'Share',
  };

  useEffect(() => {
    // Logic to fetch Master, Items, and Provider
    // (Consolidated from original)
    const loadData = async () => {
      let foundMaster = listings.find(l => l.id === id);
      if (!foundMaster && id) {
        const repo = repositoryFactory.getListingRepository();
        foundMaster = await repo.getById(id);
      }

      if (foundMaster) {
        setMaster(foundMaster);

        // Fetch Items
        const itemRepo = repositoryFactory.getListingItemRepository();
        const loadedItems = await itemRepo.getByMaster(foundMaster.id);
        setItems(loadedItems);
        if (loadedItems.length > 0) setSelectedItem(loadedItems[0]);

        // Fetch Provider
        let foundProvider: any = getProviderById(foundMaster.providerId);
        if (!foundProvider) {
          const pRepo = repositoryFactory.getProviderRepository();
          foundProvider = await pRepo.getById(foundMaster.providerId);
          if (!foundProvider) {
            const uRepo = repositoryFactory.getUserRepository();
            foundProvider = await uRepo.getById(foundMaster.providerId);
          }
        }
        setProvider(foundProvider);
      }
    };

    loadData();
  }, [id, listings, getProviderById]);

  if (!master) return <div className="p-8 text-center text-muted-foreground">{t.notFound}</div>;

  // --- SPECIALIZED VIEWS ---
  if (master.type === 'GOODS' && selectedItem) {
    return (
      <>
        <SEO
          title={`${getTranslation(master, 'title')} | $${selectedItem.pricing.price.amount / 100}`}
          description={getTranslation(master, 'description').substring(0, 160)}
          image={master.images[0]}
          type="product"
        />
        <GoodsDetailView
          master={master}
          item={selectedItem}
          items={items}
          provider={provider}
          onBuy={() => navigate(`/checkout?item_id=${selectedItem.id}`)}
          onChat={() => navigate('/chat')}
          onSelect={setSelectedItem}
        />
      </>
    );
  }

  if (master.type === 'TASK' && selectedItem) {
    return (
      <>
        <SEO
          title={`${getTranslation(master, 'title')} | $${selectedItem.pricing.price.amount / 100}`}
          description={getTranslation(master, 'description').substring(0, 160)}
          image={master.images[0]}
        />
        <TaskDetailView
          master={master}
          item={selectedItem}
          author={provider}
          onQuote={() => setIsQuoteOpen(true)}
          onChat={() => navigate('/chat')}
        />
      </>
    );
  }

  // --- DEFAULT SERVICE VIEW ---

  const categoryInfo = refCodes.find(r => r.codeId === master.categoryId);

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <SEO
        title={`${getTranslation(master, 'title')} ${selectedItem ? `| $${selectedItem.pricing.price.amount / 100}` : ''}`}
        description={getTranslation(master, 'description').substring(0, 160)}
        image={master.images[0]}
        type="product"
      />

      <ServiceHero
        images={master.images}
        title={getTranslation(master, 'title')}
        description={getTranslation(master, 'description')}
        providerName={provider ? (provider.businessNameEn || provider.businessNameZh || provider.name) : undefined}
        providerId={provider?.id}
        isLiked={isLiked}
        onLikeToggle={() => setIsLiked(!isLiked)}
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="container max-w-4xl px-4 -mt-6 relative z-10"
      >
        <motion.div variants={itemVariants}>
          <ServiceProviderCard
            provider={provider}
            master={master}
            distance={distance}
            isInArea={isInArea}
            onChat={() => navigate('/chat')}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <ServiceInfo
            master={master}
            categoryName={categoryInfo ? getTranslation(categoryInfo, 'name') : undefined}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <ServiceSkuPicker
            items={items}
            selectedItem={selectedItem}
            onSelect={setSelectedItem}
          />
        </motion.div>

        {(master.type === 'RENTAL' || master.type === 'CONSULTATION') && (
          <motion.div variants={itemVariants} className="mt-6">
            <ServiceConfiguration
              master={master}
              dateRange={dateRange}
              setDateRange={setDateRange}
              consultHours={consultHours}
              setConsultHours={setConsultHours}
            />
          </motion.div>
        )}

        <motion.div variants={itemVariants} className="mt-8">
          {/* Enhanced Review List is internally loaded */}
          <EnhancedReviewList listingId={master.id} />
        </motion.div>
      </motion.div>

      <ServiceActions
        master={master}
        selectedItem={selectedItem}
        onChat={() => navigate('/chat')}
        onAction={() => {
          if (master.attributes?.pricingMode === 'QUOTE') {
            setIsQuoteOpen(true);
          } else {
            // Book Now / Rent Now
            if (master.type === 'RENTAL' || master.type === 'SERVICE' || master.type === 'CONSULTATION') {
              setIsInstantPayOpen(true);
            } else {
              // Fallback to URL nav if not using wizard
              const params = new URLSearchParams();
              params.append('item_id', selectedItem?.id || '');
              if (dateRange?.from) params.append('start', dateRange.from.toISOString());
              navigate(`/checkout?${params.toString()}`);
            }
          }
        }}
      />

      {/* Modals */}
      {selectedItem && (
        <InstantPayFlow
          isOpen={isInstantPayOpen}
          onClose={() => setIsInstantPayOpen(false)}
          master={master}
          item={selectedItem}
          dateRange={dateRange}
          consultHours={consultHours}
        />
      )}

      {selectedItem && (
        <QuoteRequestFlow
          isOpen={isQuoteOpen}
          onClose={() => setIsQuoteOpen(false)}
          master={master}
          item={selectedItem}
        />
      )}
    </div>
  );
};

export default ServiceDetail;
