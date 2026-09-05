import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useConfigStore } from "@/stores/configStore";
import { useCommunityPostStore } from "@/stores/communityPostStore";
import { userRepository, UserProfileWithFollowStatus } from "@/services/repositories/supabase/UserRepository";
import { CommunityPost } from "@/types/community";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft, Settings, Grid3X3, Bookmark, UserPlus,
    UserMinus, MessageCircle, Heart, Share2, Layout, Shield,
    MoreVertical, Flag, Ban, ShieldCheck
} from "lucide-react";
import { toast } from "sonner";
import { UserLevelBadge } from "@/components/Community/UserLevelBadge";
import { ReportDialog } from "@/components/common/ReportDialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const UserProfile = () => {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const { currentUser } = useAuthStore();
    const { language } = useConfigStore();
    const { userPosts, likedPosts, savedPosts, fetchUserActivity } = useCommunityPostStore();

    const [profile, setProfile] = useState<UserProfileWithFollowStatus | null>(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [isFollowLoading, setIsFollowLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'notes' | 'collected' | 'liked'>('notes');
    const [isBlocked, setIsBlocked] = useState(false);
    const [isBlockLoading, setIsBlockLoading] = useState(false);

    const isOwnProfile = currentUser?.id === userId;

    // Fetch profile data
    useEffect(() => {
        const fetchProfile = async () => {
            if (!userId) return;
            setIsLoadingProfile(true);
            try {
                const data = await userRepository.getUserProfileWithFollowStatus(userId, currentUser?.id);
                setProfile(data);
                // Fetch the social content for this user
                await fetchUserActivity(userId);
                if (currentUser?.id && currentUser.id !== userId) {
                    setIsBlocked(await userRepository.isBlocked(currentUser.id, userId));
                }
            } catch (error) {
                console.error('Failed to fetch profile:', error);
            } finally {
                setIsLoadingProfile(false);
            }
        };
        fetchProfile();
    }, [userId, currentUser?.id, fetchUserActivity]);

    const handleToggleBlock = async () => {
        if (!currentUser || !profile) return;
        setIsBlockLoading(true);
        try {
            if (isBlocked) {
                await userRepository.unblockUser(currentUser.id, profile.id);
                setIsBlocked(false);
                toast.success(language === 'zh' ? '已取消拉黑' : 'Unblocked');
            } else {
                await userRepository.blockUser(currentUser.id, profile.id);
                setIsBlocked(true);
                toast.success(language === 'zh' ? '已拉黑，你将不再收到对方消息' : "Blocked — you won't see their messages anymore");
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Action failed');
        } finally {
            setIsBlockLoading(false);
        }
    };

    const handleFollow = async () => {
        if (!currentUser) {
            toast.error(language === 'zh' ? '请先登录' : 'Please login first');
            return;
        }
        if (!profile) return;

        setIsFollowLoading(true);
        try {
            if (profile.isFollowedByMe) {
                await userRepository.unfollowUser(currentUser.id, profile.id);
                setProfile(prev => prev ? { ...prev, isFollowedByMe: false, followerCount: prev.followerCount - 1 } : null);
            } else {
                await userRepository.followUser(currentUser.id, profile.id);
                setProfile(prev => prev ? { ...prev, isFollowedByMe: true, followerCount: prev.followerCount + 1 } : null);
            }
        } catch (error: any) {
            toast.error(error.message || 'Action failed');
        } finally {
            setIsFollowLoading(false);
        }
    };

    const renderPostGrid = (posts: CommunityPost[]) => {
        if (posts.length === 0) return (
            <div className="py-20 text-center opacity-30">
                <Layout className="w-12 h-12 mx-auto mb-4" />
                <p className="text-sm font-bold">{language === 'zh' ? '这里空空如也' : 'Nothing here yet'}</p>
            </div>
        );
        return (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-0.5">
                {posts.map(post => (
                    <Link
                        key={post.id}
                        to={`/community/${post.id}`}
                        className="aspect-[3/4] relative overflow-hidden bg-muted group"
                    >
                        {post.images?.[0] ? (
                            <img src={post.images[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt="" />
                        ) : (
                            <div className="p-4 flex items-center justify-center h-full text-center text-[10px] font-bold text-muted-foreground bg-muted/50 leading-snug">
                                <p className="line-clamp-4">{post.content}</p>
                            </div>
                        )}
                        <div className="absolute bottom-2 left-2 flex items-center gap-1.5 text-white drop-shadow-md">
                            <Heart className="w-3 h-3 fill-red-500 text-red-500" />
                            <span className="text-[10px] font-black">{post.likeCount || 0}</span>
                        </div>
                    </Link>
                ))}
            </div>
        );
    };

    if (isLoadingProfile) return (
        <div className="min-h-screen bg-background pb-20">
            <Header />
            <div className="max-w-xl mx-auto p-8 space-y-4">
                <Skeleton className="w-20 h-20 rounded-full" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-full" />
            </div>
        </div>
    );

    if (!profile) return <div className="p-20 text-center">User not found</div>;

    const t = {
        notes: language === 'zh' ? '说真言' : 'Talks',
        collected: language === 'zh' ? '收藏' : 'Collected',
        liked: language === 'zh' ? '赞过' : 'Liked',
        following: language === 'zh' ? '关注' : 'Following',
        followers: language === 'zh' ? '粉丝' : 'Followers',
        totalLikes: language === 'zh' ? '获赞与收藏' : 'Total Likes',
        edit: language === 'zh' ? '编辑资料' : 'Edit Profile'
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            <Header />

            {/* Sticky Action Bar */}
            <div className="sticky top-14 z-20 bg-background/80 backdrop-blur-md px-4 h-12 flex items-center justify-between border-b border-border/5">
                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate(-1)}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <span className="text-xs font-black uppercase tracking-widest">{profile.name}</span>
                {isOwnProfile ? (
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <Share2 className="w-5 h-5" />
                    </Button>
                ) : (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <MoreVertical className="w-5 h-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-2xl border-border/10">
                            <ReportDialog
                                targetType="USER"
                                targetId={profile.id}
                                trigger={
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="gap-2 cursor-pointer font-bold text-sm">
                                        <Flag className="w-4 h-4" /> {language === 'zh' ? '举报用户' : 'Report User'}
                                    </DropdownMenuItem>
                                }
                            />
                            <DropdownMenuItem
                                onClick={handleToggleBlock}
                                disabled={isBlockLoading}
                                className="gap-2 cursor-pointer font-bold text-sm text-destructive focus:text-destructive"
                            >
                                {isBlocked ? <ShieldCheck className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                                {isBlocked
                                    ? (language === 'zh' ? '取消拉黑' : 'Unblock User')
                                    : (language === 'zh' ? '拉黑用户' : 'Block User')}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>

            <div className="max-w-xl mx-auto">
                {/* RED Style Header */}
                <div className="px-5 py-6 space-y-6">
                    <div className="flex items-start gap-5">
                        <div className="relative">
                            <Avatar className="w-24 h-24 border-4 border-white shadow-xl">
                                <AvatarImage src={profile.avatar} />
                                <AvatarFallback className="text-2xl font-black">{profile.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary rounded-full flex items-center justify-center border-2 border-white shadow-lg text-white">
                                <Shield className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="flex-1 space-y-1 pt-1">
                            <h1 className="text-2xl font-black">{profile.name}</h1>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">ID: {profile.id.slice(0, 8)}</p>
                            <div className="flex gap-2 pt-2">
                                <Badge variant="secondary" className="bg-primary/5 text-primary border-none text-[9px] font-black px-2 py-0.5">Lv.1 Explorer</Badge>
                                <Badge variant="secondary" className="bg-amber-500/5 text-amber-600 border-none text-[9px] font-black px-2 py-0.5">Pro Helper</Badge>
                            </div>
                        </div>
                    </div>

                    <p className="text-sm font-medium leading-relaxed text-foreground/80">
                        {profile.bio || (language === 'zh' ? '这家伙很懒，什么都没留下...' : 'No bio yet')}
                    </p>

                    {/* Interaction Stats */}
                    <div className="flex items-center gap-8 py-2">
                        <div className="flex flex-col">
                            <span className="text-lg font-black leading-none">{profile.followingCount}</span>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase mt-1.5">{t.following}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-lg font-black leading-none">{profile.followerCount}</span>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase mt-1.5">{t.followers}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-lg font-black leading-none">32.1k</span>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase mt-1.5">{t.totalLikes}</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        {isOwnProfile ? (
                            <Button
                                variant="outline"
                                className="flex-1 rounded-full h-10 text-xs font-black bg-muted/20 border-border/50"
                                onClick={() => navigate('/settings/profile')}
                            >
                                {t.edit}
                            </Button>
                        ) : (
                            <>
                                <Button
                                    className={`flex-1 rounded-full h-10 text-xs font-black shadow-lg shadow-primary/20 transition-all active:scale-95 ${profile.isFollowedByMe ? 'bg-muted text-foreground' : 'bg-primary text-white'}`}
                                    onClick={handleFollow}
                                    disabled={isFollowLoading}
                                >
                                    {profile.isFollowedByMe ? (language === 'zh' ? '已关注' : 'Following') : (language === 'zh' ? '关注' : 'Follow')}
                                </Button>
                                <Button
                                    variant="outline"
                                    className="rounded-full h-10 w-10 p-0 border-border/50"
                                    onClick={() => navigate(`/messages?user=${profile.id}`)}
                                >
                                    <MessageCircle className="w-4 h-4" />
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {/* Social Tabs (The RED experience) */}
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                    <TabsList className="w-full h-12 bg-transparent border-t border-b border-border/5 rounded-none p-0">
                        <TabsTrigger value="notes" className="flex-1 h-full rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-foreground text-muted-foreground group relative">
                            <span className="text-[13px] font-black">{t.notes}</span>
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-1 bg-primary rounded-full opacity-0 group-data-[state=active]:opacity-100 transition-opacity" />
                        </TabsTrigger>
                        <TabsTrigger value="collected" className="flex-1 h-full rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-foreground text-muted-foreground group relative">
                            <span className="text-[13px] font-black">{t.collected}</span>
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-1 bg-primary rounded-full opacity-0 group-data-[state=active]:opacity-100 transition-opacity" />
                        </TabsTrigger>
                        <TabsTrigger value="liked" className="flex-1 h-full rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-foreground text-muted-foreground group relative">
                            <span className="text-[13px] font-black">{t.liked}</span>
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-1 bg-primary rounded-full opacity-0 group-data-[state=active]:opacity-100 transition-opacity" />
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="notes" className="mt-0">
                        {renderPostGrid(userPosts)}
                    </TabsContent>
                    <TabsContent value="collected" className="mt-0">
                        {renderPostGrid(savedPosts)}
                    </TabsContent>
                    <TabsContent value="liked" className="mt-0">
                        {renderPostGrid(likedPosts)}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default UserProfile;
