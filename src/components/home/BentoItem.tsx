import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface BentoItemProps {
    children: ReactNode;
    className?: string;
    colSpan?: 1 | 2 | 3 | 4;
    rowSpan?: 1 | 2;
    title?: string;
    subtitle?: string;
}

/**
 * BentoItem Component
 * 
 * A single cell in the BentoGrid.
 * Supports configurable column and row spans for desktop layouts.
 * Includes a subtle hover effect and glassmorphism styling.
 */
export function BentoItem({
    children,
    className,
    colSpan = 1,
    rowSpan = 1,
    title,
    subtitle
}: BentoItemProps) {
    // Map span values to Tailwind classes
    const colSpanClass = {
        1: "lg:col-span-1",
        2: "lg:col-span-2",
        3: "lg:col-span-3",
        4: "lg:col-span-4",
    }[colSpan];

    const rowSpanClass = {
        1: "lg:row-span-1",
        2: "lg:row-span-2",
    }[rowSpan];

    const itemVariants = {
        hidden: { opacity: 0, y: 20, scale: 0.95 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { duration: 0.5, ease: "easeOut" }
        }
    };

    return (
        <motion.div
            variants={itemVariants}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            whileTap={{ scale: 0.98 }}
            className={cn(
                "group relative overflow-hidden rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-shadow duration-300",
                colSpanClass,
                rowSpanClass,
                className
            )}
        >
            {(title || subtitle) && (
                <div className="absolute top-4 left-4 z-10 pointer-events-none">
                    {subtitle && (
                        <p className="text-xs font-medium text-muted-foreground mb-0.5 uppercase tracking-wider">
                            {subtitle}
                        </p>
                    )}
                    {title && (
                        <h3 className="text-lg font-bold text-foreground leading-tight">
                            {title}
                        </h3>
                    )}
                </div>
            )}

            <div className="h-full w-full">
                {children}
            </div>
        </motion.div>
    );
}
