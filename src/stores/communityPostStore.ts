import { create } from 'zustand';
import {
    CommunityPost,
    CommunityComment,
    CommunityPostType,
    CreateCommunityPostInput,
    CreateCommentInput,
    ConsensusVoteType,
    Consensus
} from '@/types/community';
import { repositoryFactory } from '@/services/repositories/factory';
import { useAuthStore } from './authStore';

interface CommunityPostState {
    // Feed
    posts: CommunityPost[];
    isLoading: boolean;
    error: string | null;
    hasMore: boolean;
    page: number;
    pageSize: number;

    // Current post detail
    currentPost: CommunityPost | null;
    currentPostComments: CommunityComment[];
    isLoadingDetail: boolean;

    // Actions
    fetchFeed: (options?: { nodeId?: string; postType?: CommunityPostType; query?: string; scope?: 'nearby' | 'city'; refresh?: boolean }) => Promise<void>;
    loadMore: (options?: { nodeId?: string; postType?: CommunityPostType; query?: string; scope?: 'nearby' | 'city' }) => Promise<void>;
    fetchPostDetail: (id: string) => Promise<void>;

    createPost: (authorId: string, input: CreateCommunityPostInput) => Promise<CommunityPost>;
    updatePost: (id: string, input: Partial<CreateCommunityPostInput>) => Promise<void>;
    deletePost: (id: string) => Promise<void>;
    markAsResolved: (id: string) => Promise<void>;

    likePost: (postId: string, userId: string) => Promise<void>;
    unlikePost: (postId: string, userId: string) => Promise<void>;

    addComment: (authorId: string, input: CreateCommentInput) => Promise<CommunityComment>;
    deleteComment: (commentId: string) => Promise<void>;
    likeComment: (commentId: string, userId: string) => Promise<void>;
    unlikeComment: (commentId: string, userId: string) => Promise<void>;

    // Post-to-Service conversion
    convertToService: (postId: string, listingId: string) => Promise<void>;

    // 真言投票
    voteOnFact: (postId: string, userId: string, voteType: ConsensusVoteType) => Promise<void>;
    removeVote: (postId: string, userId: string) => Promise<void>;

    // 收藏
    savePost: (postId: string, userId: string) => Promise<void>;
    unsavePost: (postId: string, userId: string) => Promise<void>;

    trendingTags: { tag: string; count: number; trending?: boolean }[];
    fetchTrendingTags: (limit?: number) => Promise<void>;

    reset: () => void;

    // User Profile specific
    userPosts: CommunityPost[];
    likedPosts: CommunityPost[];
    savedPosts: CommunityPost[];
    fetchUserActivity: (userId: string) => Promise<void>;
}

export const useCommunityPostStore = create<CommunityPostState>((set, get) => ({
    posts: [],
    isLoading: false,
    error: null,
    hasMore: true,
    page: 1,
    pageSize: 20,
    currentPost: null,
    currentPostComments: [],
    isLoadingDetail: false,
    trendingTags: [],
    userPosts: [],
    likedPosts: [],
    savedPosts: [],

    fetchUserActivity: async (userId: string) => {
        set({ isLoading: true });
        try {
            const repo = repositoryFactory.getCommunityPostRepository();
            const [posts, liked, saved] = await Promise.all([
                repo.getByAuthor(userId),
                repo.getLikedPosts(userId),
                repo.getSavedPosts(userId)
            ]);
            set({
                userPosts: posts,
                likedPosts: liked,
                savedPosts: saved,
                isLoading: false
            });
        } catch (error) {
            console.error('Failed to fetch user activity:', error);
            set({ isLoading: false });
        }
    },

    fetchTrendingTags: async (limit = 12) => {
        try {
            const repo = repositoryFactory.getCommunityPostRepository();
            const tags = await repo.getTrendingTags(limit);
            set({ trendingTags: tags });
        } catch (error) {
            console.error('Failed to fetch trending tags:', error);
        }
    },

    fetchFeed: async (options = {}) => {
        const { refresh = true } = options;
        set({ isLoading: true, error: null });
        try {
            const repo = repositoryFactory.getCommunityPostRepository();
            const { pageSize } = get();
            const posts = await repo.getFeed({
                nodeId: options.nodeId,
                postType: options.postType,
                query: options.query,
                scope: options.scope,
                limit: pageSize,
                offset: 0
            });
            set({
                posts,
                isLoading: false,
                page: 1,
                hasMore: posts.length >= pageSize
            });
        } catch (error: any) {
            console.error('Failed to fetch community feed:', error);
            set({ error: error.message, isLoading: false });
        }
    },

    loadMore: async (options = {}) => {
        const { isLoading, hasMore, page, pageSize, posts: currentPosts } = get();

        // 防止重复加载
        if (isLoading || !hasMore) return;

        set({ isLoading: true });
        try {
            const repo = repositoryFactory.getCommunityPostRepository();
            const nextPage = page + 1;
            const offset = page * pageSize;

            const newPosts = await repo.getFeed({
                nodeId: options.nodeId,
                postType: options.postType,
                query: options.query,
                scope: options.scope,
                limit: pageSize,
                offset
            });

            set({
                posts: [...currentPosts, ...newPosts],
                isLoading: false,
                page: nextPage,
                hasMore: newPosts.length >= pageSize
            });
        } catch (error: any) {
            console.error('Failed to load more posts:', error);
            set({ error: error.message, isLoading: false });
        }
    },

    fetchPostDetail: async (id: string) => {
        set({ isLoadingDetail: true });
        try {
            const repo = repositoryFactory.getCommunityPostRepository();
            const currentUser = useAuthStore.getState().currentUser;
            const userId = currentUser?.id;

            const [post, comments] = await Promise.all([
                repo.getById(id),
                repo.getCommentsWithReplies(id)
            ]);

            if (post) {
                // Increment view count (fire and forget)
                repo.incrementViewCount(id);

                // Fetch user-specific states if logged in
                if (userId) {
                    const [isLiked, isSaved, myVote, likedCommentIds] = await Promise.all([
                        repo.isLikedByUser(post.id, userId),
                        repo.isSavedByUser(post.id, userId),
                        post.isFact ? repo.getUserVote(post.id, userId) : Promise.resolve(null),
                        repo.getUserLikedCommentIds(userId, comments.map(c => c.id))
                    ]);

                    post.isLikedByMe = isLiked;
                    post.isSavedByMe = isSaved;
                    post.myVote = myVote || undefined;

                    // Update comment like states
                    comments.forEach(comment => {
                        comment.isLikedByMe = likedCommentIds.has(comment.id);
                    });
                }
            }

            set({
                currentPost: post,
                currentPostComments: comments,
                isLoadingDetail: false
            });
        } catch (error: any) {
            console.error('Failed to fetch post detail:', error);
            set({ isLoadingDetail: false });
        }
    },

    createPost: async (authorId: string, input: CreateCommunityPostInput) => {
        const repo = repositoryFactory.getCommunityPostRepository();
        const newPost = await repo.create(authorId, input);
        set(state => ({ posts: [newPost, ...state.posts] }));
        return newPost;
    },

    updatePost: async (id: string, input: Partial<CreateCommunityPostInput>) => {
        const repo = repositoryFactory.getCommunityPostRepository();
        const updated = await repo.update(id, input);
        set(state => ({
            posts: state.posts.map(p => p.id === id ? updated : p),
            currentPost: state.currentPost?.id === id ? updated : state.currentPost
        }));
    },

    deletePost: async (id: string) => {
        const repo = repositoryFactory.getCommunityPostRepository();
        await repo.delete(id);
        set(state => ({
            posts: state.posts.filter(p => p.id !== id),
            currentPost: state.currentPost?.id === id ? null : state.currentPost
        }));
    },

    markAsResolved: async (id: string) => {
        const repo = repositoryFactory.getCommunityPostRepository();
        await repo.update(id, { isResolved: true, status: 'RESOLVED' });
        set(state => ({
            posts: state.posts.map(p => p.id === id ? { ...p, isResolved: true, status: 'RESOLVED' as const } : p),
            currentPost: state.currentPost?.id === id
                ? { ...state.currentPost, isResolved: true, status: 'RESOLVED' as const }
                : state.currentPost
        }));
    },

    likePost: async (postId: string, userId: string) => {
        const repo = repositoryFactory.getCommunityPostRepository();
        await repo.likePost(postId, userId);
        set(state => ({
            posts: state.posts.map(p =>
                p.id === postId
                    ? { ...p, likeCount: p.likeCount + 1, isLikedByMe: true }
                    : p
            ),
            currentPost: state.currentPost?.id === postId
                ? { ...state.currentPost, likeCount: state.currentPost.likeCount + 1, isLikedByMe: true }
                : state.currentPost
        }));
    },

    unlikePost: async (postId: string, userId: string) => {
        const repo = repositoryFactory.getCommunityPostRepository();
        await repo.unlikePost(postId, userId);
        set(state => ({
            posts: state.posts.map(p =>
                p.id === postId
                    ? { ...p, likeCount: Math.max(0, p.likeCount - 1), isLikedByMe: false }
                    : p
            ),
            currentPost: state.currentPost?.id === postId
                ? { ...state.currentPost, likeCount: Math.max(0, state.currentPost.likeCount - 1), isLikedByMe: false }
                : state.currentPost
        }));
    },

    addComment: async (authorId: string, input: CreateCommentInput) => {
        const repo = repositoryFactory.getCommunityPostRepository();
        const newComment = await repo.createComment(authorId, input);

        set(state => {
            let updatedComments = [...state.currentPostComments];

            if (input.parentCommentId) {
                // Find parent and add reply
                const addReplyToParent = (comments: CommunityComment[]): boolean => {
                    for (const comment of comments) {
                        if (comment.id === input.parentCommentId) {
                            comment.replies = [...(comment.replies || []), newComment];
                            return true;
                        }
                        if (comment.replies && comment.replies.length > 0) {
                            if (addReplyToParent(comment.replies)) return true;
                        }
                    }
                    return false;
                };
                addReplyToParent(updatedComments);
            } else {
                // Add as root comment
                updatedComments.push(newComment);
            }

            return {
                currentPostComments: updatedComments,
                // Update comment count in post
                posts: state.posts.map(p =>
                    p.id === input.postId
                        ? { ...p, commentCount: p.commentCount + 1 }
                        : p
                ),
                currentPost: state.currentPost?.id === input.postId
                    ? { ...state.currentPost, commentCount: state.currentPost.commentCount + 1 }
                    : state.currentPost
            };
        });
        return newComment;
    },

    deleteComment: async (commentId: string) => {
        // Find comment to get postId (needed for count update)
        const findComment = (comments: CommunityComment[]): CommunityComment | undefined => {
            for (const c of comments) {
                if (c.id === commentId) return c;
                if (c.replies) {
                    const found = findComment(c.replies);
                    if (found) return found;
                }
            }
        };
        const comment = findComment(get().currentPostComments);
        if (!comment) return;

        const repo = repositoryFactory.getCommunityPostRepository();
        await repo.deleteComment(commentId);

        set(state => {
            const removeComment = (comments: CommunityComment[]): CommunityComment[] => {
                return comments.filter(c => {
                    if (c.id === commentId) return false;
                    if (c.replies) {
                        c.replies = removeComment(c.replies);
                    }
                    return true;
                });
            };

            return {
                currentPostComments: removeComment([...state.currentPostComments]),
                // Update comment count in post
                posts: state.posts.map(p =>
                    p.id === comment.postId
                        ? { ...p, commentCount: Math.max(0, p.commentCount - 1) }
                        : p
                ),
                currentPost: state.currentPost?.id === comment.postId
                    ? { ...state.currentPost, commentCount: Math.max(0, state.currentPost.commentCount - 1) }
                    : state.currentPost
            };
        });
    },

    likeComment: async (commentId: string, userId: string) => {
        // Optimistic update
        set(state => ({
            currentPostComments: state.currentPostComments.map(c =>
                c.id === commentId
                    ? { ...c, likeCount: c.likeCount + 1, isLikedByMe: true }
                    : c
            )
        }));

        try {
            const repo = repositoryFactory.getCommunityPostRepository();
            await repo.likeComment(commentId, userId);
        } catch (error) {
            // Rollback on error
            set(state => ({
                currentPostComments: state.currentPostComments.map(c =>
                    c.id === commentId
                        ? { ...c, likeCount: Math.max(0, c.likeCount - 1), isLikedByMe: false }
                        : c
                )
            }));
            throw error;
        }
    },

    unlikeComment: async (commentId: string, userId: string) => {
        // Optimistic update
        set(state => ({
            currentPostComments: state.currentPostComments.map(c =>
                c.id === commentId
                    ? { ...c, likeCount: Math.max(0, c.likeCount - 1), isLikedByMe: false }
                    : c
            )
        }));

        try {
            const repo = repositoryFactory.getCommunityPostRepository();
            await repo.unlikeComment(commentId, userId);
        } catch (error) {
            // Rollback on error
            set(state => ({
                currentPostComments: state.currentPostComments.map(c =>
                    c.id === commentId
                        ? { ...c, likeCount: c.likeCount + 1, isLikedByMe: true }
                        : c
                )
            }));
            throw error;
        }
    },

    convertToService: async (postId: string, listingId: string) => {
        const repo = repositoryFactory.getCommunityPostRepository();
        await repo.convertToListing(postId, listingId);
        set(state => ({
            posts: state.posts.map(p =>
                p.id === postId
                    ? { ...p, isResolved: true, status: 'RESOLVED' as const }
                    : p
            )
        }));
    },

    // 真言投票
    voteOnFact: async (postId: string, userId: string, voteType: ConsensusVoteType) => {
        // 获取当前投票状态
        const { currentPost, posts } = get();
        const post = currentPost?.id === postId ? currentPost : posts.find(p => p.id === postId);
        const previousVote = post?.myVote;

        // 乐观更新
        const updateConsensus = (consensus: Consensus | undefined, oldVote: ConsensusVoteType | undefined, newVote: ConsensusVoteType): Consensus => {
            const updated: Consensus = consensus ? { ...consensus } : {
                agree: 0,
                partial: 0,
                disagree: 0,
                uncertain: 0,
                totalVotes: 0,
                level: 'PENDING'
            };

            // 移除旧投票
            if (oldVote) {
                updated[oldVote] = Math.max(0, updated[oldVote] - 1);
            } else {
                updated.totalVotes++;
            }

            // 添加新投票
            updated[newVote]++;

            return updated;
        };

        set(state => ({
            posts: state.posts.map(p =>
                p.id === postId
                    ? {
                        ...p,
                        myVote: voteType,
                        consensus: updateConsensus(p.consensus, previousVote, voteType)
                    }
                    : p
            ),
            currentPost: state.currentPost?.id === postId
                ? {
                    ...state.currentPost,
                    myVote: voteType,
                    consensus: updateConsensus(state.currentPost.consensus, previousVote, voteType)
                }
                : state.currentPost
        }));

        try {
            const repo = repositoryFactory.getCommunityPostRepository();
            await repo.voteOnFact(postId, userId, voteType);
        } catch (error) {
            // 回滚
            set(state => ({
                posts: state.posts.map(p =>
                    p.id === postId
                        ? { ...p, myVote: previousVote, consensus: post?.consensus }
                        : p
                ),
                currentPost: state.currentPost?.id === postId
                    ? { ...state.currentPost, myVote: previousVote, consensus: post?.consensus }
                    : state.currentPost
            }));
            throw error;
        }
    },

    removeVote: async (postId: string, userId: string) => {
        const { currentPost, posts } = get();
        const post = currentPost?.id === postId ? currentPost : posts.find(p => p.id === postId);
        const previousVote = post?.myVote;

        if (!previousVote) return;

        // 乐观更新
        set(state => ({
            posts: state.posts.map(p =>
                p.id === postId
                    ? {
                        ...p,
                        myVote: undefined,
                        consensus: p.consensus ? {
                            ...p.consensus,
                            [previousVote]: Math.max(0, p.consensus[previousVote] - 1),
                            totalVotes: Math.max(0, p.consensus.totalVotes - 1)
                        } : undefined
                    }
                    : p
            ),
            currentPost: state.currentPost?.id === postId && state.currentPost.consensus
                ? {
                    ...state.currentPost,
                    myVote: undefined,
                    consensus: {
                        ...state.currentPost.consensus,
                        [previousVote]: Math.max(0, state.currentPost.consensus[previousVote] - 1),
                        totalVotes: Math.max(0, state.currentPost.consensus.totalVotes - 1)
                    }
                }
                : state.currentPost
        }));

        try {
            const repo = repositoryFactory.getCommunityPostRepository();
            await repo.removeVote(postId, userId);
        } catch (error) {
            // 回滚
            set(state => ({
                posts: state.posts.map(p =>
                    p.id === postId
                        ? { ...p, myVote: previousVote, consensus: post?.consensus }
                        : p
                ),
                currentPost: state.currentPost?.id === postId
                    ? { ...state.currentPost, myVote: previousVote, consensus: post?.consensus }
                    : state.currentPost
            }));
            throw error;
        }
    },

    // 收藏
    savePost: async (postId: string, userId: string) => {
        // 乐观更新
        set(state => ({
            posts: state.posts.map(p =>
                p.id === postId
                    ? { ...p, isSavedByMe: true, saveCount: (p.saveCount || 0) + 1 }
                    : p
            ),
            currentPost: state.currentPost?.id === postId
                ? { ...state.currentPost, isSavedByMe: true, saveCount: (state.currentPost.saveCount || 0) + 1 }
                : state.currentPost
        }));

        try {
            const repo = repositoryFactory.getCommunityPostRepository();
            await repo.savePost(postId, userId);
        } catch (error) {
            // 回滚
            set(state => ({
                posts: state.posts.map(p =>
                    p.id === postId
                        ? { ...p, isSavedByMe: false, saveCount: Math.max(0, (p.saveCount || 1) - 1) }
                        : p
                ),
                currentPost: state.currentPost?.id === postId
                    ? { ...state.currentPost, isSavedByMe: false, saveCount: Math.max(0, (state.currentPost.saveCount || 1) - 1) }
                    : state.currentPost
            }));
            throw error;
        }
    },

    unsavePost: async (postId: string, userId: string) => {
        // 乐观更新
        set(state => ({
            posts: state.posts.map(p =>
                p.id === postId
                    ? { ...p, isSavedByMe: false, saveCount: Math.max(0, (p.saveCount || 1) - 1) }
                    : p
            ),
            currentPost: state.currentPost?.id === postId
                ? { ...state.currentPost, isSavedByMe: false, saveCount: Math.max(0, (state.currentPost.saveCount || 1) - 1) }
                : state.currentPost
        }));

        try {
            const repo = repositoryFactory.getCommunityPostRepository();
            await repo.unsavePost(postId, userId);
        } catch (error) {
            // 回滚
            set(state => ({
                posts: state.posts.map(p =>
                    p.id === postId
                        ? { ...p, isSavedByMe: true, saveCount: (p.saveCount || 0) + 1 }
                        : p
                ),
                currentPost: state.currentPost?.id === postId
                    ? { ...state.currentPost, isSavedByMe: true, saveCount: (state.currentPost.saveCount || 0) + 1 }
                    : state.currentPost
            }));
            throw error;
        }
    },

    reset: () => {
        set({
            posts: [],
            isLoading: false,
            error: null,
            currentPost: null,
            currentPostComments: [],
            isLoadingDetail: false
        });
    }
}));
