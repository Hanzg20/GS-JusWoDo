import React from 'react';
import {
    Sparkle,
    Wrench,
    Truck,
    Scissors,
    Zap,
    Baby,
    Dog,
    ChefHat,
    Home,
    Utensils,
    PlaneTakeoff,
    Car,
    Snowflake,
    ShoppingBag,
    Construction,
    Hammer,
    Trash2,
    Footprints,
    Clock,
    Palette,
    BookOpen,
    Droplet,
    Wind,
    Heart,
    Soup,
    Leaf,
    Bug,
    MoreHorizontal
} from "lucide-react";

export interface Category {
    icon: React.ReactNode;
    label: string;
    id?: string; // Optional ID for routing/filtering
    color?: string;
    path?: string;
}

export const mainCategories: Category[] = [
    { icon: <ChefHat className="w-6 h-6" />, label: "Food", id: "food", color: "#f59e0b" },
    { icon: <Truck className="w-6 h-6" />, label: "Moving", id: "moving", color: "#10b981" },
    { icon: <Baby className="w-6 h-6" />, label: "Kids", id: "kids", color: "#8b5cf6" },
    { icon: <Car className="w-6 h-6" />, label: "Carpool", id: "carpool", color: "#3b82f6" },
    { icon: <Home className="w-6 h-6" />, label: "Real Estate", id: "real-estate", color: "#dc2626" },
    { icon: <Scissors className="w-6 h-6" />, label: "Beauty", id: "beauty", color: "#ec4899" },
    { icon: <Sparkle className="w-6 h-6" />, label: "Cleaning", id: "cleaning", color: "#10b981" },
    { icon: <PlaneTakeoff className="w-6 h-6" />, label: "Airport", id: "airport", color: "#3b82f6" },
    { icon: <Hammer className="w-6 h-6" />, label: "Assembly", id: "assembly", color: "#f59e0b" },
    { icon: <MoreHorizontal className="w-6 h-6" />, label: "More", id: "more", color: "#6b7280" },
];
