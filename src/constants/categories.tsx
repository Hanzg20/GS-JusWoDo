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
    { icon: <ChefHat className="w-6 h-6" />, label: "Food", id: "1040600", color: "#f59e0b" },
    { icon: <Truck className="w-6 h-6" />, label: "Moving", id: "1010500", color: "#10b981" },
    { icon: <Baby className="w-6 h-6" />, label: "Kids", id: "1030000", color: "#8b5cf6" },
    { icon: <Car className="w-6 h-6" />, label: "Carpool", id: "1050600", color: "#3b82f6" },
    { icon: <Home className="w-6 h-6" />, label: "Real Estate", id: "1010000", color: "#dc2626" }, // General Home
    { icon: <Scissors className="w-6 h-6" />, label: "Beauty", id: "1020000", color: "#ec4899" },
    { icon: <Sparkle className="w-6 h-6" />, label: "Cleaning", id: "1010100", color: "#10b981" },
    { icon: <PlaneTakeoff className="w-6 h-6" />, label: "Airport", id: "1050000", color: "#3b82f6" },
    { icon: <Hammer className="w-6 h-6" />, label: "Assembly", id: "1010400", color: "#f59e0b" }, // Using Repairs for Assembly
    { icon: <MoreHorizontal className="w-6 h-6" />, label: "More", id: "service", color: "#6b7280" },
];
