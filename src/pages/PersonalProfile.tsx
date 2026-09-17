import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ChevronLeft, Camera, ShieldCheck, Mail, Phone, UserRound } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuthStore } from "@/stores/authStore";
import { useConfigStore } from "@/stores/configStore";
import { repositoryFactory } from "@/services/repositories/factory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const PersonalProfile = () => {
    const navigate = useNavigate();
    const { currentUser, updateUser } = useAuthStore();
    const { language } = useConfigStore();
    const authRepository = repositoryFactory.getAuthRepository();

    // I'll keep the actual update logic for later, focusing on the UI/UX shell for now
    const [name, setName] = useState(currentUser?.name || "");
    const [bio, setBio] = useState(currentUser?.bio || "");
    const [phone, setPhone] = useState(currentUser?.phone || "");
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const t = {
        title: language === 'zh' ? '基本资料' : 'Personal Profile',
        save: language === 'zh' ? '保存修改' : 'Save Changes',
        saving: language === 'zh' ? '正在保存...' : 'Saving...',
        avatarLabel: language === 'zh' ? '修改头像' : 'Change Avatar',
        nameLabel: language === 'zh' ? '昵称' : 'Display Name',
        bioLabel: language === 'zh' ? '个人简介' : 'Short Bio',
        emailLabel: language === 'zh' ? '电子邮箱' : 'Email Address',
        phoneLabel: language === 'zh' ? '电话号码' : 'Phone Number',
        phoneConsentBefore: language === 'zh' ? '提交即表示同意《' : 'By submitting, you agree to how we collect and use contact info in our ',
        phoneConsentAfter: language === 'zh' ? '》中关于联系方式收集与使用的说明' : '',
        privacyPolicyLink: language === 'zh' ? '隐私政策' : 'Privacy Policy',
        placeholderBio: language === 'zh' ? '介绍一下你自己...' : 'Tell neighbors a bit about yourself...',
        success: language === 'zh' ? '基本资料已更新' : 'Profile updated successfully',
        error: language === 'zh' ? '更新失败，请稍后重试' : 'Failed to update profile. Please try again.',
    };

    const handleSave = async () => {
        if (!currentUser) return;

        setIsSaving(true);
        try {
            // Determine the avatar URL to save
            // If it's a Dicebear URL, we should save null/empty so the fallback remains active
            // OR if it's our storage URL, we strip the timestamp
            let avatarToSave = currentUser.avatar;
            if (avatarToSave?.includes('dicebear.com')) {
                avatarToSave = undefined; // Don't overwrite the NULL in DB with a static Dicebear URL
            } else if (avatarToSave) {
                avatarToSave = avatarToSave.split('?')[0];
            }

            console.log('--- Saving Profile ---');
            console.log('ID:', currentUser.id);
            console.log('Name:', name);
            console.log('Bio:', bio);
            console.log('Phone:', phone);
            console.log('Avatar to save:', avatarToSave);

            const updatedUser = await authRepository.updateProfile(currentUser.id, {
                name,
                bio,
                phone,
                avatar: avatarToSave
            });

            console.log('Update Success. Server returned avatar:', updatedUser.avatar);

            // Update local state with a fresh cache-busting timestamp for the UI
            const finalAvatarUrl = updatedUser.avatar
                ? (updatedUser.avatar.includes('dicebear.com') ? updatedUser.avatar : `${updatedUser.avatar}?t=${Date.now()}`)
                : updatedUser.avatar;

            updateUser({
                ...updatedUser,
                avatar: finalAvatarUrl
            });

            toast.success(t.success);
            setTimeout(() => navigate('/profile'), 1000);
        } catch (error) {
            console.error('Update profile error:', error);
            toast.error(t.error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !currentUser) return;

        // Basic size check (5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error(language === 'zh' ? '图片大小不能超过 5MB' : 'Image size cannot exceed 5MB');
            return;
        }

        setIsUploading(true);
        try {
            console.log('Starting avatar upload...');
            const publicUrl = await authRepository.uploadAvatar(currentUser.id, file);
            console.log('Upload successful. Public URL:', publicUrl);

            // Append timestamp to bust cache
            const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`;

            // Update profile with new avatar URL
            console.log('Updating user profile with new avatar URL...');
            const updatedUser = await authRepository.updateProfile(currentUser.id, {
                avatar: publicUrl // Keep clean URL in DB
            });
            console.log('Profile update successful. Server response avatar:', updatedUser.avatar);

            // Update local state with cache-busted URL for immediate UI feedback
            updateUser({ ...updatedUser, avatar: cacheBustedUrl });
            toast.success(language === 'zh' ? '头像已更新' : 'Avatar updated');
        } catch (error) {
            console.error('Avatar upload error:', error);
            toast.error(language === 'zh' ? '头像上传失败' : 'Failed to upload avatar');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <div className="container max-w-2xl py-8 px-4">
                <div className="flex items-center gap-4 mb-8">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate('/profile')}
                        className="rounded-full"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </Button>
                    <h1 className="text-2xl font-black">{t.title}</h1>
                </div>

                <div className="space-y-8">
                    {/* Avatar Section */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative group">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                            <div className="relative overflow-hidden w-32 h-32 rounded-3xl border-4 border-card shadow-2xl transition-transform group-hover:scale-[1.02]">
                                <img
                                    src={currentUser?.avatar}
                                    alt={currentUser?.name}
                                    className={`w-full h-full object-cover transition-opacity ${isUploading ? 'opacity-30' : 'opacity-100'}`}
                                />
                                {isUploading && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={handleAvatarClick}
                                disabled={isUploading}
                                className="absolute bottom-2 right-2 w-10 h-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform disabled:opacity-50 disabled:scale-100"
                            >
                                <Camera className="w-5 h-5" />
                            </button>
                        </div>
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t.avatarLabel}</span>
                    </div>

                    {/* Form Sections */}
                    <div className="card-warm p-6 space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                <UserRound className="w-3 h-3" />
                                {t.nameLabel}
                            </label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="h-12 rounded-xl border-muted-foreground/10 bg-muted/30 focus:bg-background transition-all font-semibold"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                <ShieldCheck className="w-3 h-3" />
                                {t.bioLabel}
                            </label>
                            <Textarea
                                placeholder={t.placeholderBio}
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                className="min-h-[120px] rounded-xl border-muted-foreground/10 bg-muted/30 focus:bg-background transition-all font-medium resize-none"
                            />
                        </div>

                        <div className="space-y-2 opacity-60">
                            <label className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                <Mail className="w-3 h-3" />
                                {t.emailLabel}
                            </label>
                            <div className="h-12 px-3 flex items-center rounded-xl bg-muted/50 border border-transparent font-semibold text-sm">
                                {currentUser?.email}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                <Phone className="w-3 h-3" />
                                {t.phoneLabel}
                            </label>
                            <Input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+1 (___) ___-____"
                                className="h-12 rounded-xl border-muted-foreground/10 bg-muted/30 focus:bg-background transition-all font-semibold"
                            />
                            <p className="text-[11px] text-muted-foreground px-1">
                                {t.phoneConsentBefore}
                                <Link to="/legal/privacy" className="underline hover:text-primary">{t.privacyPolicyLink}</Link>
                                {t.phoneConsentAfter}
                            </p>
                        </div>
                    </div>

                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
                    >
                        {isSaving ? t.saving : t.save}
                    </Button>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default PersonalProfile;
