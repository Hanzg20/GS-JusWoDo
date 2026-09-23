/**
 * FactVoteButtons - 真言投票按钮组件
 * 用于详情页底部，让用户对真言帖进行共识投票
 */
import { useState } from "react";
import { ConsensusVoteType } from "@/types/community";
import { useConfigStore } from "@/stores/configStore";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Check, CheckCheck, X, HelpCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { promptLogin } from "@/components/common/LoginRequired";

interface FactVoteButtonsProps {
    postId: string;
    currentVote?: ConsensusVoteType;
    onVote: (voteType: ConsensusVoteType) => Promise<void>;
    disabled?: boolean;
    className?: string;
}

// 投票选项配置
const VOTE_OPTIONS: {
    type: ConsensusVoteType;
    labelZh: string;
    labelEn: string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    hoverColor: string;
    activeColor: string;
}[] = [
    {
        type: 'agree',
        labelZh: '与我经历一致',
        labelEn: 'Matches my experience',
        icon: <CheckCheck className="w-4 h-4" />,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        hoverColor: 'hover:bg-green-100',
        activeColor: 'bg-green-500 text-white',
    },
    {
        type: 'partial',
        labelZh: '部分一致',
        labelEn: 'Partially matches',
        icon: <Check className="w-4 h-4" />,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        hoverColor: 'hover:bg-blue-100',
        activeColor: 'bg-blue-500 text-white',
    },
    {
        type: 'disagree',
        labelZh: '与我经历不符',
        labelEn: 'Doesn\'t match',
        icon: <X className="w-4 h-4" />,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        hoverColor: 'hover:bg-orange-100',
        activeColor: 'bg-orange-500 text-white',
    },
    {
        type: 'uncertain',
        labelZh: '不确定/没经历过',
        labelEn: 'Unsure / No experience',
        icon: <HelpCircle className="w-4 h-4" />,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        hoverColor: 'hover:bg-gray-100',
        activeColor: 'bg-gray-500 text-white',
    },
];

export function FactVoteButtons({
    postId,
    currentVote,
    onVote,
    disabled = false,
    className = '',
}: FactVoteButtonsProps) {
    const { language } = useConfigStore();
    const navigate = useNavigate();
    const { currentUser } = useAuthStore();
    const [isVoting, setIsVoting] = useState(false);
    const [hoveredType, setHoveredType] = useState<ConsensusVoteType | null>(null);

    const handleVote = async (voteType: ConsensusVoteType) => {
        if (!currentUser) {
            promptLogin(navigate, language === 'zh', language === 'zh' ? '请先登录后再投票' : 'Please login to vote');
            return;
        }

        if (disabled || isVoting) return;

        // 如果点击的是当前选中的，不做操作（或可以取消投票）
        if (currentVote === voteType) {
            return;
        }

        setIsVoting(true);
        try {
            await onVote(voteType);
            toast.success(language === 'zh' ? '感谢您的验证！' : 'Thanks for verifying!');
        } catch (error: any) {
            toast.error(error.message || (language === 'zh' ? '投票失败' : 'Vote failed'));
        } finally {
            setIsVoting(false);
        }
    };

    return (
        <div className={`space-y-3 ${className}`}>
            {/* 标题 */}
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-foreground">
                    {language === 'zh' ? '验证这条真言' : 'Verify this fact'}
                </h4>
                {currentVote && (
                    <span className="text-xs text-muted-foreground">
                        {language === 'zh' ? '已投票' : 'Voted'}
                    </span>
                )}
            </div>

            {/* 投票按钮网格 */}
            <div className="grid grid-cols-2 gap-2">
                {VOTE_OPTIONS.map((option) => {
                    const isSelected = currentVote === option.type;
                    const isHovered = hoveredType === option.type;

                    return (
                        <motion.button
                            key={option.type}
                            onClick={() => handleVote(option.type)}
                            onMouseEnter={() => setHoveredType(option.type)}
                            onMouseLeave={() => setHoveredType(null)}
                            disabled={disabled || isVoting}
                            className={`
                                relative flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium
                                transition-all duration-200 border
                                ${isSelected
                                    ? `${option.activeColor} border-transparent shadow-md`
                                    : `${option.bgColor} ${option.color} border-transparent ${option.hoverColor}`
                                }
                                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                            `}
                            whileTap={{ scale: 0.98 }}
                        >
                            {isVoting && hoveredType === option.type ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                option.icon
                            )}
                            <span className="text-xs leading-tight">
                                {language === 'zh' ? option.labelZh : option.labelEn}
                            </span>

                            {/* 选中指示器 */}
                            <AnimatePresence>
                                {isSelected && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        exit={{ scale: 0 }}
                                        className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full shadow-md flex items-center justify-center"
                                    >
                                        <Check className="w-3 h-3 text-green-600" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.button>
                    );
                })}
            </div>

            {/* 提示文字 */}
            <p className="text-[10px] text-muted-foreground text-center">
                {language === 'zh'
                    ? '您的投票将帮助其他邻居判断信息可信度'
                    : 'Your vote helps neighbors assess credibility'}
            </p>
        </div>
    );
}

/**
 * FactVoteButtonsCompact - 紧凑版投票按钮
 * 用于卡片底部或列表中的快速投票
 */
export function FactVoteButtonsCompact({
    postId,
    currentVote,
    onVote,
    disabled = false,
    className = '',
}: FactVoteButtonsProps) {
    const { language } = useConfigStore();
    const navigate = useNavigate();
    const { currentUser } = useAuthStore();
    const [isVoting, setIsVoting] = useState(false);

    const handleVote = async (voteType: ConsensusVoteType) => {
        if (!currentUser) {
            promptLogin(navigate, language === 'zh', language === 'zh' ? '请先登录' : 'Please login');
            return;
        }

        if (disabled || isVoting || currentVote === voteType) return;

        setIsVoting(true);
        try {
            await onVote(voteType);
        } catch (error: any) {
            toast.error(error.message || 'Vote failed');
        } finally {
            setIsVoting(false);
        }
    };

    return (
        <div className={`flex items-center gap-1 ${className}`}>
            {VOTE_OPTIONS.slice(0, 3).map((option) => {
                const isSelected = currentVote === option.type;
                return (
                    <button
                        key={option.type}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleVote(option.type);
                        }}
                        disabled={disabled || isVoting}
                        className={`
                            p-1.5 rounded-lg transition-all
                            ${isSelected
                                ? option.activeColor
                                : `${option.color} ${option.hoverColor} bg-transparent`
                            }
                        `}
                        title={language === 'zh' ? option.labelZh : option.labelEn}
                    >
                        {option.icon}
                    </button>
                );
            })}
        </div>
    );
}

export default FactVoteButtons;
