import { supabase } from '@/lib/supabase';
import { IAuthRepository } from '../interfaces';
import { User } from '@/types/domain';

export class SupabaseAuthRepository implements IAuthRepository {
    async login(email: string, password: string): Promise<User | null> {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            console.error('Login error:', error);
            return null;
        }

        if (!data.user) return null;

        // Fetch user profile
        return this.getUserProfile(data.user.id);
    }

    async signInWithOtp(email: string): Promise<void> {
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: window.location.origin,
            }
        });
        if (error) throw error;
    }

    async resetPasswordForEmail(email: string): Promise<void> {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
    }

    async updatePassword(newPassword: string): Promise<void> {
        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });
        if (error) throw error;
    }

    async logout(): Promise<void> {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    }

    async getCurrentUser(): Promise<User | null> {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return null;

        return this.getUserProfile(user.id);
    }

    async signInWithGoogle(): Promise<void> {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                }
            }
        });
        if (error) throw error;
    }

    async signInWithApple(): Promise<void> {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'apple',
            options: {
                redirectTo: window.location.origin
            }
        });
        if (error) throw error;
    }

    async register(email: string, password: string, name: string, nodeId?: string): Promise<User | null> {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name,
                    node_id: nodeId
                }
            }
        });

        if (error) {
            console.error('Registration error:', error);
            return null;
        }

        if (!data.user) return null;

        // Create user profile
        const profile = await this.createUserProfile(data.user.id, email, name, nodeId);
        return profile;
    }

    async updateProfile(userId: string, data: Partial<User>): Promise<User> {
        const updateData: any = {};
        if (data.name) updateData.name = data.name;
        if (data.avatar) updateData.avatar = data.avatar;
        if (data.phone) updateData.phone = data.phone;
        if (data.bio) updateData.bio = data.bio;
        if (data.settings) updateData.settings = data.settings;
        if (data.nodeId) updateData.node_id = data.nodeId;

        const { error, count } = await supabase
            .from('user_profiles')
            .update(updateData, { count: 'exact' })
            .eq('id', userId);

        if (error) {
            throw error;
        }

        const updatedUser = await this.getUserProfile(userId);
        if (!updatedUser) throw new Error('User not found after update');
        return updatedUser;
    }

    async uploadAvatar(userId: string, file: File): Promise<string> {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, file, {
                upsert: true
            });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);

        return data.publicUrl;
    }

    private async getUserProfile(userId: string): Promise<User | null> {
        const { data, error } = await supabase
            .from('user_profiles')
            .select(`
        *,
        user_roles (
          role:roles (
            name
          )
        )
      `)
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error fetching user profile:', error);
            return null;
        }

        if (!data) return null;

        // Map roles
        const roles = data.user_roles?.map((ur: any) => ur.role.name) || ['BUYER'];

        return {
            id: data.id,
            email: data.email,
            name: data.name,
            avatar: data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.id}`,
            phone: data.phone,
            bio: data.bio,
            settings: data.settings,
            roles: roles,
            permissions: data.permissions || [],
            joinedDate: data.created_at,
            beansBalance: data.beans_balance || 0,
            nodeId: data.node_id,
            isVerifiedProvider: roles.includes('PROVIDER'),
            providerProfileId: data.provider_profile_id,
        };
    }

    private async createUserProfile(userId: string, email: string, name: string, nodeId?: string): Promise<User> {
        const { data, error } = await supabase
            .from('user_profiles')
            .insert({
                id: userId,
                email,
                name: name,
                node_id: nodeId,
                beans_balance: 100 // Welcome bonus
            })
            .select()
            .single();

        if (error) throw error;

        // Assign default BUYER role
        await supabase
            .from('user_roles')
            .insert({
                user_id: userId,
                role_id: 1 // Assuming BUYER role has id 1
            });

        return {
            id: userId,
            email,
            name,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
            roles: ['BUYER'],
            permissions: ['VIEW_LISTINGS', 'POST_REVIEW'],
            joinedDate: data.created_at,
            beansBalance: 100,
            nodeId,
            isVerifiedProvider: false,
        };
    }
}
