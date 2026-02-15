import { BentoItem } from "./BentoItem";
import { Plus } from "lucide-react";

/**
 * Mock Stories Data
 * TODO: Integrate with backend (community_posts)
 */
const MOCK_STORIES = [
    { id: 1, name: "Jessica", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica", image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=200&h=300&fit=crop", hasUnseen: true },
    { id: 2, name: "David", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David", image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=300&fit=crop", hasUnseen: true },
    { id: 3, name: "Sarah", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah", image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=200&h=300&fit=crop", hasUnseen: false },
    { id: 4, name: "Mike", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mike", image: "https://images.unsplash.com/photo-1540331547168-8b63109225b7?w=200&h=300&fit=crop", hasUnseen: false },
];

export function StoriesSection() {
    return (
        <BentoItem colSpan={4} className="bg-gradient-to-r from-gray-50 to-white">
            <div className="flex gap-4 p-4 overflow-x-auto scrollbar-hide items-center h-full">
                {/* Add Story Button */}
                <button className="flex-shrink-0 flex flex-col items-center gap-1 group">
                    <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 group-hover:border-primary group-hover:text-primary transition-colors bg-white">
                        <Plus className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-medium text-gray-500">Add Story</span>
                </button>

                {/* Story Items */}
                {MOCK_STORIES.map((story) => (
                    <button key={story.id} className="flex-shrink-0 flex flex-col items-center gap-1 group relative">
                        <div className={`relative w-16 h-16 rounded-2xl overflow-hidden border-2 transition-all ${story.hasUnseen ? 'border-primary p-0.5' : 'border-transparent'}`}>
                            <img
                                src={story.image}
                                alt={story.name}
                                className="w-full h-full object-cover rounded-xl group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full border border-white bg-white overflow-hidden">
                                <img src={story.avatar} alt="" className="w-full h-full" />
                            </div>
                        </div>
                        <span className="text-xs font-medium text-gray-600 group-hover:text-primary transition-colors">
                            {story.name}
                        </span>
                    </button>
                ))}
            </div>
        </BentoItem>
    );
}
