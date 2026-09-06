import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { useConfigStore } from '@/stores/configStore';

interface ImageUploaderProps {
    bucketName: string;
    onUpload: (urls: string[]) => void;
    onUploadingChange?: (isUploading: boolean) => void;
    maxFiles?: number;
    existingImages?: string[];
    folderPath?: string;
}

const ImageUploader = ({
    bucketName,
    onUpload,
    onUploadingChange,
    maxFiles = 6,
    existingImages = [],
    folderPath = 'uploads'
}: ImageUploaderProps) => {
    const { currentUser } = useAuthStore();
    const { language } = useConfigStore();
    const [uploading, setUploading] = useState(false);
    const [previews, setPreviews] = useState<string[]>(existingImages);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());

    // Sync external existingImages if they change and we haven't touched previews
    // This handles the case where parent component updates images
    if (JSON.stringify(existingImages) !== JSON.stringify(previews) && !uploading) {
        setPreviews(existingImages);
    }

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        // Storage RLS requires an authenticated role — without this check the
        // upload silently fails with a generic "row-level security policy"
        // error that gives the visitor no idea logging in would fix it.
        if (!currentUser) {
            toast.error(language === 'zh' ? '请先登录后再上传图片' : 'Please log in to upload images');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        if (previews.length + files.length > maxFiles) {
            toast.error(`You can only upload up to ${maxFiles} images.`);
            return;
        }

        setUploading(true);
        onUploadingChange?.(true);
        const newUrls: string[] = [];

        try {
            for (const file of files) {
                if (file.size > 5 * 1024 * 1024) { // Increased to 5MB
                    toast.error(`${file.name} is too large. Max size is 5MB.`);
                    continue;
                }

                // Create local preview immediately for better UX
                const localUrl = URL.createObjectURL(file);
                // newUrls.push(localUrl); // We could use local URLs, but for now let's stick to Supabase URLs to avoid complexity

                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
                const filePath = `${folderPath}/${fileName}`;

                // Debug: Check auth session before upload
                const { data: { session } } = await supabase.auth.getSession();
                console.log('📤 Upload attempt:', {
                    bucket: bucketName,
                    path: filePath,
                    isAuthenticated: !!session,
                    userId: session?.user?.id
                });

                const { error: uploadError } = await supabase.storage
                    .from(bucketName)
                    .upload(filePath, file);

                if (uploadError) {
                    console.error('Upload error:', uploadError);
                    console.error('Upload error details:', JSON.stringify(uploadError, null, 2));
                    toast.error(`Failed to upload ${file.name}`);
                    continue;
                }

                const { data: publicUrlData } = supabase.storage
                    .from(bucketName)
                    .getPublicUrl(filePath);

                if (publicUrlData) {
                    newUrls.push(publicUrlData.publicUrl);
                }
            }

            // Only report success (and only commit the new URLs) for files that
            // actually made it — every failure already got its own error toast
            // above; claiming success on top of that when newUrls is empty is
            // exactly the "reports success, nothing actually uploaded" bug.
            if (newUrls.length > 0) {
                const updatedPreviews = [...previews, ...newUrls];
                setPreviews(updatedPreviews);
                onUpload(updatedPreviews);
                toast.success(
                    newUrls.length === files.length
                        ? 'Images uploaded successfully!'
                        : `${newUrls.length} of ${files.length} images uploaded.`
                );
            }
        } catch (error) {
            console.error('Upload process error:', error);
            toast.error('An unexpected error occurred during upload.');
        } finally {
            setUploading(false);
            onUploadingChange?.(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const removeImage = (index: number) => {
        const updatedPreviews = previews.filter((_, i) => i !== index);
        setPreviews(updatedPreviews);
        onUpload(updatedPreviews);
    };

    // Drag and Drop Handlers
    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", index.toString()); // For firefox compatibility
        // e.dataTransfer.setDragImage(e.currentTarget, 20, 20); 
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault(); // Necessary to allow dropping
        e.dataTransfer.dropEffect = "move";

        if (draggedIndex === null || draggedIndex === index) return;

        // Debounce or check threshold if needed, but for now direct swap is reactive
        // We only update visual state here, commit to parent on Drop to avoid props churn
        const newPreviews = [...previews];
        const draggedItem = newPreviews[draggedIndex];
        newPreviews.splice(draggedIndex, 1);
        newPreviews.splice(index, 0, draggedItem);

        setPreviews(newPreviews);
        setDraggedIndex(index);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setDraggedIndex(null);
        onUpload(previews); // Commit the new order finally
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        // Ensure we sync if drop happened outside or cancelled, 
        // though previews state is our source of truth during drag
        onUpload(previews);
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
                {previews.map((url, idx) => (
                    <div
                        key={`${url}-${idx}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, idx)}
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onDrop={handleDrop}
                        onDragEnd={handleDragEnd}
                        className={`relative group aspect-square rounded-2xl overflow-hidden border-2 bg-muted/30 shadow-sm transition-all duration-200 cursor-move
                            ${idx === 0 ? 'border-primary ring-2 ring-primary/20' : 'border-transparent'}
                            ${draggedIndex === idx ? 'opacity-40 scale-95 ring-2 ring-primary border-primary border-dashed' : 'opacity-100'}
                        `}
                    >
                        <img src={url} alt={`Upload ${idx}`} className="w-full h-full object-cover pointer-events-none" />

                        {/* Cover Badge */}
                        {idx === 0 && (
                            <div className="absolute top-2 left-2 px-2 py-0.5 bg-primary text-white text-[10px] font-bold rounded-full shadow-md z-10">
                                Cover
                            </div>
                        )}

                        {uploadingFiles.has(url) && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                                <Loader2 className="w-8 h-8 text-white animate-spin" />
                            </div>
                        )}

                        <button
                            type="button" // Prevent form submission
                            onClick={(e) => {
                                e.stopPropagation();
                                removeImage(idx);
                            }}
                            className="absolute top-1.5 right-1.5 w-7 h-7 bg-red-500/90 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 duration-200"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}

                {previews.length < maxFiles && (
                    <div
                        onClick={() => !uploading && fileInputRef.current?.click()}
                        className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group
                            ${uploading
                                ? 'bg-muted/50 border-muted cursor-wait'
                                : 'bg-primary/5 border-primary/20 hover:border-primary hover:bg-primary/10 hover:shadow-warm'
                            }`}
                    >
                        {uploading ? (
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        ) : (
                            <>
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Upload className="w-5 h-5 text-primary" />
                                </div>
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Upload</span>
                            </>
                        )}
                    </div>
                )}

                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    disabled={uploading}
                />
            </div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest text-center">
                Supported: JPG, PNG • Max 5MB • Drag to reorder
            </p>
        </div>
    );
};

export default ImageUploader;
