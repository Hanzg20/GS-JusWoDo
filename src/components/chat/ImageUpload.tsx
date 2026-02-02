import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, Loader2, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

interface ImageUploadProps {
    onImageUploaded: (imageUrl: string) => void;
    onCancel?: () => void;
}

export function ImageUpload({ onImageUploaded, onCancel }: ImageUploadProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image size should be less than 5MB');
            return;
        }

        setSelectedFile(file);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const compressImage = async (file: File): Promise<File> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    // Max dimensions
                    const MAX_WIDTH = 1200;
                    const MAX_HEIGHT = 1200;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);

                    canvas.toBlob(
                        (blob) => {
                            if (blob) {
                                const compressedFile = new File([blob], file.name, {
                                    type: 'image/jpeg',
                                    lastModified: Date.now(),
                                });
                                resolve(compressedFile);
                            } else {
                                resolve(file);
                            }
                        },
                        'image/jpeg',
                        0.85
                    );
                };
                img.src = e.target?.result as string;
            };
            reader.readAsDataURL(file);
        });
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setUploading(true);
        setUploadProgress(0);

        try {
            // Compress image
            setUploadProgress(20);
            const compressedFile = await compressImage(selectedFile);

            // Generate unique filename
            const fileExt = compressedFile.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
            const filePath = `chat-images/${fileName}`;

            setUploadProgress(40);

            // Upload to Supabase Storage
            const { data, error } = await supabase.storage
                .from('chat-media')
                .upload(filePath, compressedFile);

            if (error) throw error;

            setUploadProgress(80);

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('chat-media')
                .getPublicUrl(filePath);

            setUploadProgress(100);
            onImageUploaded(publicUrl);

            // Reset
            setSelectedFile(null);
            setPreview(null);
            setUploadProgress(0);
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Failed to upload image. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleCancel = () => {
        setSelectedFile(null);
        setPreview(null);
        setUploadProgress(0);
        if (onCancel) onCancel();
    };

    return (
        <div className="flex flex-col gap-2">
            {!preview ? (
                <Button
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 rounded-full border-muted text-[9px] font-bold opacity-80 hover:opacity-100"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <ImageIcon className="w-3 h-3 mr-1" /> 图片
                </Button>
            ) : (
                <div className="relative bg-muted/30 rounded-2xl p-2 border border-border/50">
                    {/* Preview */}
                    <div className="relative">
                        <img
                            src={preview}
                            alt="Preview"
                            className="w-full max-h-48 object-contain rounded-xl"
                        />
                        {!uploading && (
                            <Button
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2 h-6 w-6 rounded-full"
                                onClick={handleCancel}
                            >
                                <X className="w-3 h-3" />
                            </Button>
                        )}
                    </div>

                    {/* Upload Progress */}
                    {uploading && (
                        <div className="mt-2 space-y-1">
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary transition-all duration-300"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                            <p className="text-[10px] text-muted-foreground text-center">
                                上传中... {uploadProgress}%
                            </p>
                        </div>
                    )}

                    {/* Actions */}
                    {!uploading && (
                        <div className="mt-2 flex gap-2">
                            <Button
                                size="sm"
                                className="flex-1 h-7 text-xs rounded-xl"
                                onClick={handleUpload}
                            >
                                发送图片
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-3 text-xs rounded-xl"
                                onClick={handleCancel}
                            >
                                取消
                            </Button>
                        </div>
                    )}
                </div>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
            />
        </div>
    );
}
