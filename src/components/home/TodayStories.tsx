import React, { useEffect } from 'react';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from '@/components/ui/carousel';
import { StoryCard } from '@/components/ui/StoryCard';
import { useCommunityStore } from '@/stores/communityStore';
import { useConfigStore } from '@/stores/configStore';
import { Skeleton } from '@/components/ui/skeleton';

export const TodayStories = () => {
    const { language } = useConfigStore();
    const { stories, fetchStories, isLoading } = useCommunityStore();

    const t = {
        label: language === 'zh' ? '社区精神' : 'COMMUNITY SPIRIT',
        title: language === 'zh' ? '邻里故事' : 'Neighbor Stories',
        desc: language === 'zh' ? '不仅是交易，更是邻里互助的温暖传递。' : 'More than just transactions, we record the warmth of neighbors helping neighbors.',
        empty: language === 'zh' ? '暂时没有更多故事。来分享你的第一个邻里互助经历吧！' : 'No stories shared yet. Be the first to share your neighborly experience!',
        neighborSupport: language === 'zh' ? '邻里互助' : 'Neighborly Support',
    };

    useEffect(() => {
        fetchStories(6);
    }, [fetchStories]);

    return (
        <section className="py-4 sm:py-12 bg-gradient-to-b from-transparent to-muted/10">
            <div className="container px-4">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-4 sm:mb-8 gap-1 sm:gap-4">
                    <div>
                        <div className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">
                            {t.label}
                        </div>
                        <h2 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight">
                            {t.title}
                        </h2>
                    </div>
                    <p className="hidden sm:block text-slate-500 max-w-sm text-sm font-medium">
                        {t.desc}
                    </p>
                </div>

                <Carousel
                    opts={{
                        align: 'start',
                        loop: true,
                    }}
                    className="w-full"
                >
                    <CarouselContent className="-ml-4">
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, idx) => (
                                <CarouselItem key={idx} className="pl-4 md:basis-1/2 lg:basis-1/3">
                                    <div className="p-1">
                                        <Skeleton className="h-[400px] w-full rounded-3xl" />
                                    </div>
                                </CarouselItem>
                            ))
                        ) : stories.length > 0 ? (
                            stories.map((story) => (
                                <CarouselItem key={story.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                                    <div className="p-1">
                                        <StoryCard
                                            title={story.content.slice(0, 40) + (story.content.length > 40 ? '...' : '')}
                                            content={story.content}
                                            image={story.media?.[0]}
                                            authorName={story.buyerName}
                                            authorAvatar={story.buyerAvatar}
                                            likes={story.reactions?.length || 0}
                                            isFeatured={true}
                                            categoryName={t.neighborSupport}
                                        />
                                    </div>
                                </CarouselItem>
                            ))
                        ) : (
                            <div className="w-full text-center py-10 text-muted-foreground">
                                {t.empty}
                            </div>
                        )}
                    </CarouselContent>
                    {stories.length > 3 && (
                        <div className="hidden md:block">
                            <CarouselPrevious className="-left-12 hover:bg-white hover:text-primary border-slate-200 shadow-sm" />
                            <CarouselNext className="-right-12 hover:bg-white hover:text-primary border-slate-200 shadow-sm" />
                        </div>
                    )}
                </Carousel>
            </div>
        </section>
    );
};

