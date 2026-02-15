import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { ListingCard } from "@/components/ListingCard";
import { ListingMaster } from "@/types/domain";
import { useConfigStore } from "@/stores/configStore";

interface ProviderServicesTabProps {
    listings: ListingMaster[];
}

export function ProviderServicesTab({ listings }: ProviderServicesTabProps) {
    const { language } = useConfigStore();
    const t = {
        noServices: language === 'zh' ? '暂无可用服务' : 'No services available yet',
    };

    if (listings.length === 0) {
        return (
            <Card className="p-12 text-center">
                <p className="text-muted-foreground">{t.noServices}</p>
            </Card>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing, index) => (
                <motion.div
                    key={listing.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                    <ListingCard item={listing} />
                </motion.div>
            ))}
        </div>
    );
}
