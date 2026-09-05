import { supabase } from '@/lib/supabase';
import { UserAddress } from '@/types/domain';
import { UserContribution, getUserLevel } from '@/types/community';
import { IUserRepository } from '../interfaces';

export class SupabaseUserRepository implements IUserRepository {
    async getAddresses(userId: string): Promise<UserAddress[]> {
        const { data, error } = await supabase
            .from('user_addresses')
            .select('*')
            .eq('user_id', userId)
            .order('is_default', { ascending: false });

        if (error) throw error;
        return (data || []).map(this.mapAddressToDomain);
    }

    async addAddress(address: Omit<UserAddress, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserAddress> {
        const { data, error } = await supabase
            .from('user_addresses')
            .insert({
                user_id: address.userId,
                label: address.label,
                address_text: address.address.fullAddress,
                is_default: address.isDefault
            })
            .select()
            .single();

        if (error) throw error;
        return this.mapAddressToDomain(data);
    }

    async updateAddress(id: string, data: Partial<UserAddress>): Promise<UserAddress> {
        const updateData: any = {};
        if (data.label) updateData.label = data.label;
        if (data.address?.fullAddress) updateData.address_text = data.address.fullAddress;
        if (data.isDefault !== undefined) updateData.is_default = data.isDefault;

        const { error } = await supabase
            .from('user_addresses')
            .update(updateData)
            .eq('id', id);

        if (error) throw error;

        const { data: updated, error: fetchError } = await supabase
            .from('user_addresses')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;
        return this.mapAddressToDomain(updated);
    }

    async deleteAddress(id: string): Promise<void> {
        const { error } = await supabase
            .from('user_addresses')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    private mapAddressToDomain(dbAddr: any): UserAddress {
        return {
            id: dbAddr.id,
            userId: dbAddr.user_id,
            label: dbAddr.label,
            address: {
                fullAddress: dbAddr.address_text,
            },
            isDefault: dbAddr.is_default,
            createdAt: dbAddr.created_at,
            updatedAt: dbAddr.updated_at || dbAddr.created_at
        };
    }

    // ============================================
    // User Contribution & Level Methods
    // ============================================

    /**
     * Get user's contribution data
     */
    async getUserContribution(userId: string): Promise<UserContribution | null> {
        const { data, error } = await supabase
            .from('user_contributions')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // No record found - return default contribution
                return {
                    userId,
                    score: 0,
                    level: 1,
                    totalPosts: 0,
                    factPosts: 0,
                    totalComments: 0,
                    likesReceived: 0,
                    factVotesReceived: 0,
                    avgAgreeRate: 0,
                    votesGiven: 0,
                    updatedAt: new Date().toISOString()
                };
            }
            throw error;
        }

        return this.mapContributionToDomain(data);
    }

    /**
     * Get multiple users' contribution data (for batch operations)
     */
    async getUserContributions(userIds: string[]): Promise<Map<string, UserContribution>> {
        if (userIds.length === 0) return new Map();

        const { data, error } = await supabase
            .from('user_contributions')
            .select('*')
            .in('user_id', userIds);

        if (error) throw error;

        const result = new Map<string, UserContribution>();
        for (const record of data || []) {
            result.set(record.user_id, this.mapContributionToDomain(record));
        }

        // Fill in defaults for users without contribution records
        for (const userId of userIds) {
            if (!result.has(userId)) {
                result.set(userId, {
                    userId,
                    score: 0,
                    level: 1,
                    totalPosts: 0,
                    factPosts: 0,
                    totalComments: 0,
                    likesReceived: 0,
                    factVotesReceived: 0,
                    avgAgreeRate: 0,
                    votesGiven: 0,
                    updatedAt: new Date().toISOString()
                });
            }
        }

        return result;
    }

    /**
     * Get top contributors (leaderboard)
     */
    async getTopContributors(limit: number = 10): Promise<UserContribution[]> {
        const { data, error } = await supabase
            .from('user_contributions')
            .select('*')
            .order('score', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return (data || []).map(this.mapContributionToDomain);
    }

    /**
     * Manually refresh a user's contribution score
     * This calls the database function to recalculate the score
     */
    async refreshUserContribution(userId: string): Promise<void> {
        const { error } = await supabase.rpc('refresh_user_contribution', {
            p_user_id: userId
        });

        if (error) {
            console.warn('Failed to refresh user contribution:', error);
            // Non-critical, don't throw
        }
    }

    private mapContributionToDomain(db: any): UserContribution {
        const userLevel = getUserLevel(db.score || 0);
        return {
            userId: db.user_id,
            score: db.score || 0,
            level: userLevel.level,
            totalPosts: db.total_posts || 0,
            factPosts: db.fact_posts || 0,
            totalComments: db.total_comments || 0,
            likesReceived: db.likes_received || 0,
            factVotesReceived: db.fact_votes_received || 0,
            avgAgreeRate: db.avg_agree_rate || 0,
            votesGiven: db.votes_given || 0,
            updatedAt: db.updated_at
        };
    }

    // ============================================
    // User Follow Methods
    // ============================================

    /**
     * Follow a user
     */
    async followUser(followerId: string, followingId: string): Promise<void> {
        if (followerId === followingId) {
            throw new Error('Cannot follow yourself');
        }

        const { error } = await supabase
            .from('user_followers')
            .insert({
                follower_id: followerId,
                following_id: followingId
            });

        if (error) {
            if (error.code === '23505') {
                // Already following - ignore
                return;
            }
            throw error;
        }
    }

    /**
     * Unfollow a user
     */
    async unfollowUser(followerId: string, followingId: string): Promise<void> {
        const { error } = await supabase
            .from('user_followers')
            .delete()
            .eq('follower_id', followerId)
            .eq('following_id', followingId);

        if (error) throw error;
    }

    /**
     * Block a user — hides their messages from the blocker's chat list.
     */
    async blockUser(blockerId: string, blockedId: string): Promise<void> {
        if (blockerId === blockedId) {
            throw new Error('Cannot block yourself');
        }

        const { error } = await supabase
            .from('blocked_users')
            .insert({
                blocker_id: blockerId,
                blocked_id: blockedId
            });

        if (error) {
            if (error.code === '23505') {
                // Already blocked - ignore
                return;
            }
            throw error;
        }
    }

    async unblockUser(blockerId: string, blockedId: string): Promise<void> {
        const { error } = await supabase
            .from('blocked_users')
            .delete()
            .eq('blocker_id', blockerId)
            .eq('blocked_id', blockedId);

        if (error) throw error;
    }

    async isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
        const { data, error } = await supabase
            .from('blocked_users')
            .select('id')
            .eq('blocker_id', blockerId)
            .eq('blocked_id', blockedId)
            .maybeSingle();

        if (error) throw error;
        return !!data;
    }

    /** All user ids the given user has blocked — used to filter chat/listings. */
    async getBlockedUserIds(blockerId: string): Promise<string[]> {
        const { data, error } = await supabase
            .from('blocked_users')
            .select('blocked_id')
            .eq('blocker_id', blockerId);

        if (error) throw error;
        return (data || []).map(row => row.blocked_id);
    }

    /**
     * Check if user A is following user B
     */
    async isFollowing(followerId: string, followingId: string): Promise<boolean> {
        const { data, error } = await supabase
            .from('user_followers')
            .select('id')
            .eq('follower_id', followerId)
            .eq('following_id', followingId)
            .maybeSingle();

        if (error) throw error;
        return !!data;
    }

    /**
     * Get user's followers
     */
    async getFollowers(userId: string, limit: number = 20, offset: number = 0): Promise<{
        users: UserProfileSummary[];
        total: number;
    }> {
        // Get total count
        const { count } = await supabase
            .from('user_followers')
            .select('*', { count: 'exact', head: true })
            .eq('following_id', userId);

        // Get followers with profile info
        const { data, error } = await supabase
            .from('user_followers')
            .select(`
                follower:user_profiles!follower_id (
                    id, name, avatar, bio,
                    follower_count, following_count, post_count
                )
            `)
            .eq('following_id', userId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        return {
            users: (data || []).map((d: any) => this.mapProfileSummary(d.follower)),
            total: count || 0
        };
    }

    /**
     * Get users that this user is following
     */
    async getFollowing(userId: string, limit: number = 20, offset: number = 0): Promise<{
        users: UserProfileSummary[];
        total: number;
    }> {
        // Get total count
        const { count } = await supabase
            .from('user_followers')
            .select('*', { count: 'exact', head: true })
            .eq('follower_id', userId);

        // Get following with profile info
        const { data, error } = await supabase
            .from('user_followers')
            .select(`
                following:user_profiles!following_id (
                    id, name, avatar, bio,
                    follower_count, following_count, post_count
                )
            `)
            .eq('follower_id', userId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        return {
            users: (data || []).map((d: any) => this.mapProfileSummary(d.following)),
            total: count || 0
        };
    }

    /**
     * Get user profile by ID with follow stats
     */
    /**
     * Get user profile by ID with follow stats
     * Uses secure view for public access
     */
    async getUserProfile(userId: string): Promise<UserProfileSummary | null> {
        const { data, error } = await supabase
            .from('view_public_profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }

        return this.mapProfileSummary(data);
    }

    /**
     * Get user profile with follow status for current user
     */
    async getUserProfileWithFollowStatus(
        targetUserId: string,
        currentUserId?: string
    ): Promise<UserProfileWithFollowStatus | null> {
        const profile = await this.getUserProfile(targetUserId);
        if (!profile) return null;

        let isFollowedByMe = false;
        let isFollowingMe = false;

        if (currentUserId && currentUserId !== targetUserId) {
            const [followedByMe, followingMe] = await Promise.all([
                this.isFollowing(currentUserId, targetUserId),
                this.isFollowing(targetUserId, currentUserId)
            ]);
            isFollowedByMe = followedByMe;
            isFollowingMe = followingMe;
        }

        return {
            ...profile,
            isFollowedByMe,
            isFollowingMe
        };
    }

    private mapProfileSummary(db: any): UserProfileSummary {
        return {
            id: db.id,
            name: db.name,
            avatar: db.avatar,
            bio: db.bio,
            followerCount: db.follower_count || 0,
            followingCount: db.following_count || 0,
            postCount: db.post_count || 0
        };
    }
}

// Types for user profile
export interface UserProfileSummary {
    id: string;
    name: string;
    avatar?: string;
    bio?: string;
    followerCount: number;
    followingCount: number;
    postCount: number;
}

export interface UserProfileWithFollowStatus extends UserProfileSummary {
    isFollowedByMe: boolean;
    isFollowingMe: boolean;
}

// Export singleton instance
export const userRepository = new SupabaseUserRepository();
