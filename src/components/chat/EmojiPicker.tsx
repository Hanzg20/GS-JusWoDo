import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Smile } from "lucide-react";

interface EmojiPickerProps {
    onEmojiSelect: (emoji: string) => void;
}

const EMOJI_CATEGORIES = {
    '表情': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴'],
    '手势': ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '🦿', '🦵', '🦶'],
    '心情': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '❤️‍🔥', '❤️‍🩹', '💋', '💯', '💢', '💥', '💫', '💦', '💨', '🕳️', '💬', '👁️‍🗨️', '🗨️', '🗯️', '💭'],
    '生活': ['🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '⛳', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '⛸️', '🛷', '🥌', '🎿', '⛷️', '🏂'],
    '食物': ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🌽', '🥕', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🥞', '🥓', '🥩', '🍗', '🍖', '🌭', '🍔', '🍟', '🍕', '🥪'],
    '符号': ['✅', '❌', '⭐', '🌟', '💫', '🔥', '💧', '⚡', '☀️', '⛅', '☁️', '🌈', '🌙', '⭐', '✨', '⚠️', '🚫', '🔞', '📵', '🚭', '❗', '❓', '💯', '🔔', '🔕', '📢', '📣'],
};

export function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
    const [selectedCategory, setSelectedCategory] = useState('表情');

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-6 px-2 rounded-full border-muted text-[9px] font-bold opacity-80 hover:opacity-100">
                    <Smile className="w-3 h-3 mr-1" /> 表情
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 rounded-2xl" align="start">
                <div className="flex flex-col h-80">
                    {/* Category Tabs */}
                    <div className="flex gap-1 p-2 border-b border-border/50 overflow-x-auto no-scrollbar">
                        {Object.keys(EMOJI_CATEGORIES).map((category) => (
                            <Button
                                key={category}
                                variant={selectedCategory === category ? "default" : "ghost"}
                                size="sm"
                                className="h-7 px-3 text-[10px] rounded-full flex-shrink-0"
                                onClick={() => setSelectedCategory(category)}
                            >
                                {category}
                            </Button>
                        ))}
                    </div>

                    {/* Emoji Grid */}
                    <div className="flex-1 overflow-y-auto p-3 grid grid-cols-8 gap-2 content-start">
                        {EMOJI_CATEGORIES[selectedCategory as keyof typeof EMOJI_CATEGORIES].map((emoji, idx) => (
                            <button
                                key={`${emoji}-${idx}`}
                                className="text-2xl hover:bg-muted rounded-lg p-2 transition-colors active:scale-95"
                                onClick={() => onEmojiSelect(emoji)}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
