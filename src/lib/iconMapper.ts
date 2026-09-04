import * as Icons from "lucide-react";
import { LucideIcon } from "lucide-react";

/**
 * Maps icon name strings to Lucide React icon components
 * Used for dynamic icon rendering from ref_codes.extra_data.icon
 */
const iconMap: Record<string, LucideIcon> = {
  // Home & Life
  "Sparkle": Icons.Sparkles,
  "Sparkles": Icons.Sparkles, // Alias
  "HeartHandshake": Icons.HeartHandshake,
  "Trash2": Icons.Trash2,
  "Hammer": Icons.Hammer,
  "Wrench": Icons.Wrench,
  "Truck": Icons.Truck,
  "Footprints": Icons.Footprints,
  "ChefHat": Icons.ChefHat,
  
  // Pro & Beauty
  "Crown": Icons.Crown,
  "Zap": Icons.Zap,
  "Droplet": Icons.Droplet,
  "Wind": Icons.Wind,
  "Settings": Icons.Settings,
  "Home": Icons.Home,
  "Scissors": Icons.Scissors,
  
  // Kids & Wellness
  "Dog": Icons.Dog,
  "BookOpen": Icons.BookOpen,
  "Waves": Icons.Waves,
  "Dumbbell": Icons.Dumbbell,
  "Baby": Icons.Baby,
  "Clock": Icons.Clock,
  "Palette": Icons.Palette,
  
  // Food & Market
  "Heart": Icons.Heart,
  "ShoppingBag": Icons.ShoppingBag,
  "Construction": Icons.Construction,
  "Bike": Icons.Bike,
  "Utensils": Icons.Utensils,
  "Soup": Icons.Soup,
  
  // Travel & Outdoor
  "Snowflake": Icons.Snowflake,
  "Pipette": Icons.Pipette,
  "Bug": Icons.Bug,
  "Car": Icons.Car,
  "PlaneTakeoff": Icons.PlaneTakeoff,
  
  // Common
  "MoreHorizontal": Icons.MoreHorizontal,
  "MapPin": Icons.MapPin,
  "Star": Icons.Star,

  // Pillars (homepage top-level nav)
  "MessageSquareQuote": Icons.MessageSquareQuote,
  "Gift": Icons.Gift,
};

/**
 * Get icon component from icon name string
 * @param iconName - Icon name from extra_data.icon
 * @returns Lucide React icon component or default icon
 */
export function getIcon(iconName?: string): LucideIcon {
  if (!iconName) return Icons.Sparkles; // Default icon
  
  const Icon = iconMap[iconName];
  return Icon || Icons.Sparkles; // Fallback to Sparkles if not found
}

/**
 * Get icon component with size and className props
 * Note: This returns the component, not JSX. Use it like: const Icon = renderIcon('Sparkle'); <Icon className="..." />
 */
export function renderIcon(iconName?: string): LucideIcon {
  return getIcon(iconName);
}
