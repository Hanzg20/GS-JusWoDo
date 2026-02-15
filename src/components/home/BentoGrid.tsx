
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface BentoGridProps {
    children: ReactNode;
    className?: string;
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1
        }
    }
};

/**
 * BentoGrid Container
 * 
 * A responsive grid container that stacks vertically on mobile 
 * and forms a 4-column bento grid on desktop (lg+).
 * Adds staggered entrance animation for children.
 */
export function BentoGrid({ children, className }: BentoGridProps) {
    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className={cn(
                "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-7xl mx-auto px-4",
                className
            )}
        >
            {children}
        </motion.div>
    );
}

