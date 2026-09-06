import React from 'react';
import { CompletenessScore } from '@/types/listingFields';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';
import { useConfigStore } from '@/stores/configStore';

interface CompletenessIndicatorProps {
    score: CompletenessScore;
}

const CompletenessIndicator: React.FC<CompletenessIndicatorProps> = ({ score }) => {
    const { language } = useConfigStore();

    const getScoreColor = () => {
        if (score.score >= 90) return 'text-green-600';
        if (score.score >= 70) return 'text-yellow-600';
        return 'text-orange-600';
    };

    const getProgressColor = () => {
        if (score.score >= 90) return 'bg-green-600';
        if (score.score >= 70) return 'bg-yellow-600';
        return 'bg-orange-600';
    };

    return (
        <div className="bg-card border rounded-2xl p-5 space-y-4">
            {/* Score Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-sm text-muted-foreground">{language === 'zh' ? '📊 信息完整度' : '📊 Completeness'}</h3>
                    <p className={`text-3xl font-black ${getScoreColor()}`}>{score.score}%</p>
                </div>
                {score.score >= 90 && (
                    <Badge className="bg-green-100 text-green-700 border-green-200">
                        <Sparkles className="w-3 h-3 mr-1" />
                        {language === 'zh' ? '优质发布' : 'Great Listing'}
                    </Badge>
                )}
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
                <Progress value={score.score} className={`h-2 [&>div]:${getProgressColor()}`} />
                <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{language === 'zh' ? `✅ 必填 ${score.requiredFilled}/${score.requiredTotal}` : `✅ Required ${score.requiredFilled}/${score.requiredTotal}`}</span>
                    <span>{language === 'zh' ? `⭐ 建议 ${score.recommendedFilled}/${score.recommendedTotal}` : `⭐ Suggested ${score.recommendedFilled}/${score.recommendedTotal}`}</span>
                </div>
            </div>

            {/* Missing Fields */}
            {(score.missingRequired.length > 0 || score.missingRecommended.length > 0) && (
                <div className="space-y-2 pt-2 border-t">
                    {score.missingRequired.length > 0 && (
                        <div>
                            <p className="text-xs font-bold text-red-600 mb-1">
                                {language === 'zh' ? '❌ 还需填写（必填项）:' : '❌ Still needed (required):'}
                            </p>
                            <div className="flex flex-wrap gap-1">
                                {score.missingRequired.map(field => (
                                    <Badge key={field} variant="outline" className="text-xs border-red-200 text-red-700">
                                        {field}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {score.missingRecommended.length > 0 && score.recommendedTotal > 0 && (
                        <div>
                            <p className="text-xs font-bold text-yellow-600 mb-1">
                                {language === 'zh' ? '💡 建议填写（提升曝光）:' : '💡 Suggested (boosts visibility):'}
                            </p>
                            <div className="flex flex-wrap gap-1">
                                {score.missingRecommended.slice(0, 5).map(field => (
                                    <Badge key={field} variant="outline" className="text-xs border-yellow-200 text-yellow-700">
                                        {field}
                                    </Badge>
                                ))}
                                {score.missingRecommended.length > 5 && (
                                    <span className="text-xs text-muted-foreground">
                                        +{score.missingRecommended.length - 5}{language === 'zh' ? '项' : ' more'}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Incentive */}
            {score.score < 90 && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
                    <p className="text-xs font-bold text-primary flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        {language === 'zh' ? '完整度90%+ 获得 3倍曝光 + 推荐位展示' : '90%+ completeness gets 3x visibility + featured placement'}
                    </p>
                </div>
            )}

            {score.score >= 90 && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                    <p className="text-xs font-bold text-green-700">
                        {language === 'zh' ? '🎉 太棒了！您的发布将获得3倍曝光和推荐位展示！' : '🎉 Great! Your listing will get 3x visibility and featured placement!'}
                    </p>
                </div>
            )}
        </div>
    );
};

export default CompletenessIndicator;
