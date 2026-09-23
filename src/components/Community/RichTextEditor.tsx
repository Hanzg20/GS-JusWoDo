import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { useEffect } from 'react';
import {
    Bold, Italic, List, ListOrdered, Quote, Minus,
    Heading2, Undo, Redo, Type
} from 'lucide-react';
import './rich-text-editor.css';

interface RichTextEditorProps {
    value: string;           // HTML string
    onChange: (html: string) => void;
    placeholder?: string;
    maxLength?: number;
    className?: string;
}

const ToolbarButton = ({
    onClick, active = false, disabled = false, title, children,
}: {
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    title: string;
    children: React.ReactNode;
}) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        title={title}
        className={`
            flex items-center justify-center w-8 h-8 rounded-lg text-sm transition-all
            ${active
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }
            ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
        `}
    >
        {children}
    </button>
);

export function RichTextEditor({
    value,
    onChange,
    placeholder,
    maxLength = 2000,
    className = '',
}: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [2, 3] },
                bulletList: { keepMarks: true, keepAttributes: true },
                orderedList: { keepMarks: true, keepAttributes: true },
            }),
            Placeholder.configure({
                placeholder: placeholder || '分享点新鲜事...',
                emptyEditorClass: 'is-editor-empty',
            }),
            CharacterCount.configure({
                limit: maxLength,
            }),
        ],
        content: value,
        onUpdate: ({ editor }) => {
            const isEmpty = editor.isEmpty;
            onChange(isEmpty ? '' : editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'rich-editor-content',
            },
        },
    });

    // Sync external value changes (e.g., edit mode init)
    useEffect(() => {
        if (!editor) return;
        const current = editor.getHTML();
        if (value !== current) {
            editor.commands.setContent(value || '', { emitUpdate: false });
        }
    }, [value, editor]);

    if (!editor) return null;

    const charCount = editor.storage.characterCount?.characters() ?? 0;
    const isNearLimit = charCount > maxLength * 0.85;

    return (
        <div className={`rich-text-editor-wrapper ${className}`}>
            {/* Toolbar */}
            <div className="rich-editor-toolbar">
                <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="粗体 Bold">
                    <Bold className="w-3.5 h-3.5" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="斜体 Italic">
                    <Italic className="w-3.5 h-3.5" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="标题 Heading">
                    <Heading2 className="w-3.5 h-3.5" />
                </ToolbarButton>

                <div className="rich-editor-divider" />

                <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="无序列表 Bullet list">
                    <List className="w-3.5 h-3.5" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="有序列表 Numbered list">
                    <ListOrdered className="w-3.5 h-3.5" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="引用 Quote">
                    <Quote className="w-3.5 h-3.5" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="分隔线 Divider">
                    <Minus className="w-3.5 h-3.5" />
                </ToolbarButton>

                <div className="rich-editor-divider" />

                <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="撤销 Undo">
                    <Undo className="w-3.5 h-3.5" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="重做 Redo">
                    <Redo className="w-3.5 h-3.5" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} title="清除格式 Clear formatting">
                    <Type className="w-3.5 h-3.5" />
                </ToolbarButton>

                <div className="ml-auto flex items-center">
                    <span className={`text-[10px] font-mono tabular-nums ${isNearLimit ? 'text-orange-500' : 'text-muted-foreground/50'}`}>
                        {charCount}/{maxLength}
                    </span>
                </div>
            </div>

            {/* Editor Area */}
            <EditorContent editor={editor} />
        </div>
    );
}
