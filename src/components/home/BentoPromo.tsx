import { BentoItem } from "./BentoItem";
import { PromoBanner } from "./PromoBanner";

export function BentoPromo() {
    return (
        <BentoItem colSpan={1} rowSpan={1} className="p-0 overflow-hidden">
            <div className="w-full h-full">
                <PromoBanner />
            </div>
        </BentoItem>
    );
}
