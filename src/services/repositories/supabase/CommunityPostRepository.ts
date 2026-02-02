import { supabase } from '@/lib/supabase';
import {
    CommunityPost,
    CommunityComment,
    CommunityPostType,
    CreateCommunityPostInput,
    UpdateCommunityPostInput,
    CreateCommentInput,
    ConsensusVoteType,
    Consensus,
    FactData,
    FactVoteRecord
} from '@/types/community';

/**
 * Supabase Repository for Community Posts
 */
export class SupabaseCommunityPostRepository {

    // ==========================================
    // POSTS
    // ==========================================

    private mapPostFromDb(row: any): CommunityPost {
        return {
            id: row.id,
            authorId: row.author_id,
            postType: row.post_type as CommunityPostType,
            title: row.title,
            content: row.content,
            images: row.images || [],
            mediaUrl: row.media_url,

            // 真言相关字段
            isFact: row.is_fact || false,
            factData: row.fact_data as FactData | undefined,
            consensus: row.consensus as Consensus | undefined,
            saveCount: row.save_count || 0,

            priceHint: row.price_hint,
            priceNegotiable: row.price_negotiable,
            locationText: row.location_text,
            nodeId: row.node_id,
            tags: row.tags || [],
            likeCount: row.like_count || 0,
            commentCount: row.comment_count || 0,
            viewCount: row.view_count || 0,
            status: row.status,
            isPinned: row.is_pinned,
            isResolved: row.is_resolved,
            author: row.author ? {
                id: row.author.id,
                name: row.author.name,
                avatar: row.author.avatar,
                // Level will be fetched separately when needed
            } : undefined,
            isLikedByMe: row.is_liked_by_me || false,
            isSavedByMe: row.is_saved_by_me || false,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }

    private mapPostToDb(input: CreateCommunityPostInput | UpdateCommunityPostInput): any {
        const dbRow: any = {};

        if ('postType' in input && input.postType) dbRow.post_type = input.postType;
        if (input.title !== undefined) dbRow.title = input.title;
        if ('content' in input && input.content) dbRow.content = input.content;
        if (input.images !== undefined) dbRow.images = input.images;
        if (input.mediaUrl !== undefined) dbRow.media_url = input.mediaUrl;
        if (input.priceHint !== undefined) dbRow.price_hint = input.priceHint;
        if (input.priceNegotiable !== undefined) dbRow.price_negotiable = input.priceNegotiable;
        if (input.locationText !== undefined) dbRow.location_text = input.locationText;
        if ('nodeId' in input && input.nodeId) dbRow.node_id = input.nodeId;
        if (input.tags !== undefined) dbRow.tags = input.tags;
        if ('status' in input && input.status) dbRow.status = input.status;
        if ('isResolved' in input && input.isResolved !== undefined) dbRow.is_resolved = input.isResolved;

        // 真言相关字段
        if ('isFact' in input && input.isFact !== undefined) dbRow.is_fact = input.isFact;
        if (input.factData !== undefined) dbRow.fact_data = input.factData;

        return dbRow;
    }

    async getFeed(options: {
        nodeId?: string;
        postType?: CommunityPostType;
        query?: string;
        scope?: 'nearby' | 'city';
        limit?: number;
        offset?: number;
    } = {}): Promise<CommunityPost[]> {
        let query = supabase
            .from('community_posts')
            .select(`
                *,
                author:user_profiles!author_id (id, name, avatar)
            `)
            .in('status', ['ACTIVE', 'RESOLVED'])
            .order('is_pinned', { ascending: false })
            .order('created_at', { ascending: false });

        // Handle "Nearby" vs "City" scope
        if (options.scope === 'city') {
            // "City" = Show EVERYTHING (All nodes + Global)
            // No strict node_id filter applied
        } else if (options.nodeId) {
            // "Nearby" (default) = Strictly same node + Global posts
            query = query.or(`node_id.eq.${options.nodeId},node_id.is.null`);
        }

        if (options.postType && options.postType !== 'LATEST') {
            query = query.eq('post_type', options.postType);
        }

        if (options.query) {
            query = query.or(`title.ilike.%${options.query}%,content.ilike.%${options.query}%`);
        }
        if (options.limit) query = query.limit(options.limit);
        if (options.offset) query = query.range(options.offset, options.offset + (options.limit || 20) - 1);

        const { data, error } = await query;
        if (error) throw error;

        return (data || []).map(row => this.mapPostFromDb(row));
    }

    async getById(id: string): Promise<CommunityPost | null> {
        const { data, error } = await supabase
            .from('community_posts')
            .select(`
                *,
                author:user_profiles!author_id (id, name, avatar)
            `)
            .eq('id', id)
            .maybeSingle();

        if (error) return null;
        return this.mapPostFromDb(data);
    }

    async getByAuthor(authorId: string): Promise<CommunityPost[]> {
        const { data, error } = await supabase
            .from('community_posts')
            .select(`
                *,
                author:user_profiles!author_id (id, name, avatar)
            `)
            .eq('author_id', authorId)
            .neq('status', 'DELETED')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []).map(row => this.mapPostFromDb(row));
    }

    async create(authorId: string, input: CreateCommunityPostInput): Promise<CommunityPost> {
        const dbRow = this.mapPostToDb(input);
        dbRow.author_id = authorId;

        const { data, error } = await supabase
            .from('community_posts')
            .insert(dbRow)
            .select(`
                *,
                author:user_profiles!author_id (id, name, avatar)
            `)
            .single();

        if (error) throw error;
        return this.mapPostFromDb(data);
    }

    async update(id: string, input: UpdateCommunityPostInput): Promise<CommunityPost> {
        const dbRow = this.mapPostToDb(input);

        const { data, error } = await supabase
            .from('community_posts')
            .update(dbRow)
            .eq('id', id)
            .select(`
                *,
                author:user_profiles!author_id (id, name, avatar)
            `)
            .single();

        if (error) throw error;
        return this.mapPostFromDb(data);
    }

    async delete(id: string): Promise<void> {
        // Soft delete by setting status to DELETED
        const { error } = await supabase
            .from('community_posts')
            .update({ status: 'DELETED' })
            .eq('id', id);

        if (error) throw error;
    }

    async hardDelete(id: string): Promise<void> {
        const { error } = await supabase
            .from('community_posts')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    async incrementViewCount(id: string): Promise<void> {
        const { error } = await supabase.rpc('increment_post_view_count', { post_id: id });
        if (error) {
            // Fallback if RPC doesn't exist
            console.warn('View count increment failed:', error);
        }
    }

    // ==========================================
    // LIKES
    // ==========================================

    async likePost(postId: string, userId: string): Promise<void> {
        const { error } = await supabase
            .from('community_post_likes')
            .insert({ post_id: postId, user_id: userId });

        if (error && !error.message.includes('duplicate')) throw error;
    }

    async unlikePost(postId: string, userId: string): Promise<void> {
        const { error } = await supabase
            .from('community_post_likes')
            .delete()
            .eq('post_id', postId)
            .eq('user_id', userId);

        if (error) throw error;
    }

    async isLikedByUser(postId: string, userId: string): Promise<boolean> {
        const { data, error } = await supabase
            .from('community_post_likes')
            .select('post_id')
            .eq('post_id', postId)
            .eq('user_id', userId)
            .maybeSingle();

        return !!data && !error;
    }

    async getLikedPostIds(userId: string, postIds: string[]): Promise<Set<string>> {
        if (postIds.length === 0) return new Set();

        const { data, error } = await supabase
            .from('community_post_likes')
            .select('post_id')
            .eq('user_id', userId)
            .in('post_id', postIds);

        if (error) return new Set();
        return new Set((data || []).map(row => row.post_id));
    }

    // ==========================================
    // COMMENTS
    // ==========================================

    private mapCommentFromDb(row: any): CommunityComment {
        return {
            id: row.id,
            postId: row.post_id,
            authorId: row.author_id,
            content: row.content,
            parentCommentId: row.parent_comment_id,
            likeCount: row.like_count || 0,
            author: row.author ? {
                id: row.author.id,
                name: row.author.name,
                avatar: row.author.avatar,
                // Level will be fetched separately when needed
            } : undefined,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }

    async getComments(postId: string): Promise<CommunityComment[]> {
        const { data, error } = await supabase
            .from('community_comments')
            .select(`
                *,
                author:user_profiles!author_id (id, name, avatar)
            `)
            .eq('post_id', postId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return (data || []).map(row => this.mapCommentFromDb(row));
    }

    async createComment(authorId: string, input: CreateCommentInput): Promise<CommunityComment> {
        const { data, error } = await supabase
            .from('community_comments')
            .insert({
                post_id: input.postId,
                author_id: authorId,
                content: input.content,
                parent_comment_id: input.parentCommentId
            })
            .select(`
                *,
                author:user_profiles!author_id (id, name, avatar)
            `)
            .single();

        if (error) throw error;
        return this.mapCommentFromDb(data);
    }

    async deleteComment(id: string): Promise<void> {
        const { error } = await supabase
            .from('community_comments')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    /**
     * 获取帖子的评论（包含嵌套结构）
     */
    async getCommentsWithReplies(postId: string): Promise<CommunityComment[]> {
        const { data, error } = await supabase
            .from('community_comments')
            .select(`
                *,
                author:user_profiles!author_id (id, name, avatar)
            `)
            .eq('post_id', postId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        const comments = (data || []).map(row => this.mapCommentFromDb(row));

        // Build tree structure
        const commentMap = new Map<string, CommunityComment>();
        const rootComments: CommunityComment[] = [];

        // First pass: create map of all comments
        for (const comment of comments) {
            comment.replies = [];
            commentMap.set(comment.id, comment);
        }

        // Second pass: build tree
        for (const comment of comments) {
            if (comment.parentCommentId && commentMap.has(comment.parentCommentId)) {
                const parent = commentMap.get(comment.parentCommentId)!;
                parent.replies = parent.replies || [];
                parent.replies.push(comment);
            } else {
                rootComments.push(comment);
            }
        }

        return rootComments;
    }

    /**
     * 点赞评论
     */
    async likeComment(commentId: string, userId: string): Promise<void> {
        const { error } = await supabase
            .from('community_comment_likes')
            .insert({
                comment_id: commentId,
                user_id: userId
            });

        if (error && error.code !== '23505') {
            // Ignore duplicate key error
            throw error;
        }

        // Update like count
        await supabase.rpc('increment_comment_likes', { p_comment_id: commentId });
    }

    /**
     * 取消点赞评论
     */
    async unlikeComment(commentId: string, userId: string): Promise<void> {
        const { error } = await supabase
            .from('community_comment_likes')
            .delete()
            .eq('comment_id', commentId)
            .eq('user_id', userId);

        if (error) throw error;

        // Decrement like count
        await supabase.rpc('decrement_comment_likes', { p_comment_id: commentId });
    }

    /**
     * 检查用户是否点赞了评论
     */
    async isCommentLikedByUser(commentId: string, userId: string): Promise<boolean> {
        const { data, error } = await supabase
            .from('community_comment_likes')
            .select('comment_id')
            .eq('comment_id', commentId)
            .eq('user_id', userId)
            .maybeSingle();

        if (error) return false;
        return !!data;
    }

    /**
     * 批量检查用户点赞的评论
     */
    async getUserLikedCommentIds(userId: string, commentIds: string[]): Promise<Set<string>> {
        if (commentIds.length === 0) return new Set();

        const { data, error } = await supabase
            .from('community_comment_likes')
            .select('comment_id')
            .eq('user_id', userId)
            .in('comment_id', commentIds);

        if (error) return new Set();
        return new Set((data || []).map(row => row.comment_id));
    }

    // ==========================================
    // POST-TO-SERVICE CONVERSION
    // ==========================================

    async convertToListing(postId: string, listingId: string): Promise<void> {
        const { error } = await supabase
            .from('community_post_conversions')
            .insert({
                post_id: postId,
                listing_id: listingId
            });

        if (error) throw error;

        // Mark post as resolved
        await this.update(postId, { status: 'RESOLVED', isResolved: true });
    }

    async getConvertedListingId(postId: string): Promise<string | null> {
        const { data, error } = await supabase
            .from('community_post_conversions')
            .select('listing_id')
            .eq('post_id', postId)
            .maybeSingle();

        if (error) return null;
        return data?.listing_id;
    }

    // ==========================================
    // FACT VOTING (真言投票)
    // ==========================================

    /**
     * 获取用户对帖子的投票
     */
    async getUserVote(postId: string, userId: string): Promise<ConsensusVoteType | null> {
        const { data, error } = await supabase
            .from('fact_votes')
            .select('vote_type')
            .eq('post_id', postId)
            .eq('user_id', userId)
            .maybeSingle();

        if (error || !data) return null;
        return data.vote_type as ConsensusVoteType;
    }

    /**
     * 获取多个帖子的用户投票
     */
    async getUserVotes(postIds: string[], userId: string): Promise<Map<string, ConsensusVoteType>> {
        if (postIds.length === 0) return new Map();

        const { data, error } = await supabase
            .from('fact_votes')
            .select('post_id, vote_type')
            .eq('user_id', userId)
            .in('post_id', postIds);

        const voteMap = new Map<string, ConsensusVoteType>();
        if (!error && data) {
            data.forEach(row => {
                voteMap.set(row.post_id, row.vote_type as ConsensusVoteType);
            });
        }
        return voteMap;
    }

    /**
     * 投票或更新投票
     * 注意: consensus 的更新由数据库触发器自动处理
     */
    async voteOnFact(postId: string, userId: string, voteType: ConsensusVoteType): Promise<void> {
        const { error } = await supabase
            .from('fact_votes')
            .upsert({
                post_id: postId,
                user_id: userId,
                vote_type: voteType,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'post_id,user_id'
            });

        if (error) throw error;
    }

    /**
     * 删除投票
     */
    async removeVote(postId: string, userId: string): Promise<void> {
        const { error } = await supabase
            .from('fact_votes')
            .delete()
            .eq('post_id', postId)
            .eq('user_id', userId);

        if (error) throw error;
    }

    /**
     * 获取帖子的所有投票记录
     */
    async getVoteRecords(postId: string): Promise<FactVoteRecord[]> {
        const { data, error } = await supabase
            .from('fact_votes')
            .select('*')
            .eq('post_id', postId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return (data || []).map(row => ({
            id: row.id,
            postId: row.post_id,
            userId: row.user_id,
            voteType: row.vote_type as ConsensusVoteType,
            createdAt: row.created_at
        }));
    }

    // ==========================================
    // POST SAVES (收藏)
    // ==========================================

    /**
     * 收藏帖子
     */
    async savePost(postId: string, userId: string): Promise<void> {
        const { error } = await supabase
            .from('post_saves')
            .insert({ post_id: postId, user_id: userId });

        if (error && !error.message.includes('duplicate')) throw error;
    }

    /**
     * 取消收藏
     */
    async unsavePost(postId: string, userId: string): Promise<void> {
        const { error } = await supabase
            .from('post_saves')
            .delete()
            .eq('post_id', postId)
            .eq('user_id', userId);

        if (error) throw error;
    }

    /**
     * 检查是否已收藏
     */
    async isSavedByUser(postId: string, userId: string): Promise<boolean> {
        const { data, error } = await supabase
            .from('post_saves')
            .select('post_id')
            .eq('post_id', postId)
            .eq('user_id', userId)
            .maybeSingle();

        return !!data && !error;
    }

    /**
     * 获取用户收藏的帖子ID列表
     */
    async getSavedPostIds(userId: string, postIds: string[]): Promise<Set<string>> {
        if (postIds.length === 0) return new Set();

        const { data, error } = await supabase
            .from('post_saves')
            .select('post_id')
            .eq('user_id', userId)
            .in('post_id', postIds);

        if (error) return new Set();
        return new Set((data || []).map(row => row.post_id));
    }

    /**
     * 获取用户收藏的所有帖子
     */
    async getSavedPosts(userId: string, limit = 20, offset = 0): Promise<CommunityPost[]> {
        const { data, error } = await supabase
            .from('post_saves')
            .select(`
                post:community_posts (
                    *,
                    author:user_profiles!author_id (id, name, avatar)
                )
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        return (data || [])
            .filter(row => row.post)
            .map(row => this.mapPostFromDb(row.post));
    }

    /**
     * 获取用户点赞的所有帖子
     */
    async getLikedPosts(userId: string, limit = 20, offset = 0): Promise<CommunityPost[]> {
        const { data, error } = await supabase
            .from('community_post_likes')
            .select(`
                post:community_posts (
                    *,
                    author:user_profiles!author_id (id, name, avatar)
                )
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        return (data || [])
            .filter(row => row.post)
            .map(row => this.mapPostFromDb(row.post));
    }

    async getTrendingTags(limit: number = 10): Promise<{ tag: string; count: number; trending?: boolean }[]> {
        // In a real app, this would be a materialized view or a complex query.
        // For now, we'll fetch recent posts and count tags manually or use a simple RPC if available.
        // Let's assume we have a 'get_trending_tags' RPC.
        const { data, error } = await supabase.rpc('get_trending_tags', { p_limit: limit });

        if (error) {
            console.warn('RPC get_trending_tags failed, falling back to basic count:', error);
            // Fallback: Fetch all tags from active posts
            const { data: posts, error: fetchError } = await supabase
                .from('community_posts')
                .select('tags')
                .in('status', ['ACTIVE', 'RESOLVED'])
                .order('created_at', { ascending: false })
                .limit(100);

            if (fetchError) return [];

            const tagCounts: Record<string, number> = {};
            posts?.forEach(p => {
                p.tags?.forEach((tag: string) => {
                    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                });
            });

            return Object.entries(tagCounts)
                .map(([tag, count]) => ({ tag, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, limit);
        }

        return (data || []).map((row: any) => ({
            tag: row.tag,
            count: row.count,
            trending: row.is_trending
        }));
    }
}

// Export singleton instance
export const communityPostRepository = new SupabaseCommunityPostRepository();
