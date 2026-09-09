import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, ShieldAlert, Trash2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface KnowledgeRow {
    id: string;
    category: string;
    content: string;
    is_active: boolean;
    sort_order: number;
}

// Minimal CRUD for ai_knowledge_base — the facts ai-support-reply grounds
// its replies in (see supabase/functions/ai-support-reply/index.ts). RLS
// on the table already restricts this to SUPER_ADMIN rows, this page just
// gates the UI the same way so a non-admin gets redirected before ever
// seeing an empty/broken screen instead of a confusing RLS-filtered one.
const AdminKnowledgeBase = () => {
    const navigate = useNavigate();
    const { currentUser, isLoading: authLoading } = useAuthStore();
    const isAdmin = !!currentUser?.roles?.includes('SUPER_ADMIN');

    const [rows, setRows] = useState<KnowledgeRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newCategory, setNewCategory] = useState("");
    const [newContent, setNewContent] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (authLoading) return;
        if (!currentUser || !isAdmin) {
            navigate('/');
        }
    }, [authLoading, currentUser, isAdmin, navigate]);

    const loadRows = () => {
        setIsLoading(true);
        supabase
            .from('ai_knowledge_base')
            .select('id, category, content, is_active, sort_order')
            .order('sort_order', { ascending: true })
            .then(({ data, error }) => {
                if (error) console.error(error);
                setRows(data || []);
                setIsLoading(false);
            });
    };

    useEffect(() => {
        if (!isAdmin) return;
        loadRows();
    }, [isAdmin]);

    const handleToggleActive = async (row: KnowledgeRow) => {
        const { error } = await supabase
            .from('ai_knowledge_base')
            .update({ is_active: !row.is_active })
            .eq('id', row.id);
        if (error) {
            toast.error("Failed to update");
            return;
        }
        setRows(prev => prev.map(r => r.id === row.id ? { ...r, is_active: !r.is_active } : r));
    };

    const handleContentBlur = async (row: KnowledgeRow, newText: string) => {
        if (newText === row.content) return;
        const { error } = await supabase
            .from('ai_knowledge_base')
            .update({ content: newText, updated_at: new Date().toISOString() })
            .eq('id', row.id);
        if (error) {
            toast.error("Failed to save");
            return;
        }
        setRows(prev => prev.map(r => r.id === row.id ? { ...r, content: newText } : r));
        toast.success("Saved");
    };

    const handleDelete = async (id: string) => {
        const { error } = await supabase.from('ai_knowledge_base').delete().eq('id', id);
        if (error) {
            toast.error("Failed to delete");
            return;
        }
        setRows(prev => prev.filter(r => r.id !== id));
    };

    const handleAdd = async () => {
        if (!newCategory.trim() || !newContent.trim()) {
            toast.error("Category and content are both required");
            return;
        }
        setIsSaving(true);
        const maxSortOrder = rows.reduce((max, r) => Math.max(max, r.sort_order), 0);
        const { data, error } = await supabase
            .from('ai_knowledge_base')
            .insert({ category: newCategory.trim(), content: newContent.trim(), sort_order: maxSortOrder + 1 })
            .select('id, category, content, is_active, sort_order')
            .single();
        setIsSaving(false);
        if (error || !data) {
            toast.error("Failed to add");
            return;
        }
        setRows(prev => [...prev, data]);
        setNewCategory("");
        setNewContent("");
    };

    if (authLoading || !currentUser || !isAdmin) return null;

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />
            <div className="flex-1 container max-w-3xl py-6">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 mb-4">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Admin — AI knowledge base (grounds ai-support-reply's replies)
                </div>

                {isLoading ? (
                    <div className="text-center py-8 text-xs text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
                        Loading...
                    </div>
                ) : (
                    <div className="space-y-3">
                        {rows.map(row => (
                            <div key={row.id} className={cn(
                                "border rounded-xl p-3 space-y-2",
                                !row.is_active && "opacity-50"
                            )}>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground">{row.category}</span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleToggleActive(row)}
                                            className="text-[10px] font-bold underline text-muted-foreground"
                                        >
                                            {row.is_active ? 'Active' : 'Inactive'}
                                        </button>
                                        <button onClick={() => handleDelete(row.id)} className="text-red-500">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                                <textarea
                                    defaultValue={row.content}
                                    onBlur={(e) => handleContentBlur(row, e.target.value)}
                                    className="w-full text-sm p-2 rounded-lg border bg-muted/20 resize-y min-h-[60px]"
                                />
                            </div>
                        ))}

                        <div className="border-2 border-dashed rounded-xl p-3 space-y-2">
                            <input
                                type="text"
                                placeholder="Category (e.g. payment_policy)"
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                                className="w-full text-xs p-2 rounded-lg border bg-background"
                            />
                            <textarea
                                placeholder="New fact content..."
                                value={newContent}
                                onChange={(e) => setNewContent(e.target.value)}
                                className="w-full text-sm p-2 rounded-lg border bg-background resize-y min-h-[60px]"
                            />
                            <Button size="sm" onClick={handleAdd} disabled={isSaving} className="gap-1.5">
                                <Plus className="w-3.5 h-3.5" /> Add fact
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminKnowledgeBase;
