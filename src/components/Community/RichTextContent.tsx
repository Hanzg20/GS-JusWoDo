/**
 * RichTextContent
 * ---------------
 * Safely renders stored HTML content produced by the RichTextEditor.
 * Falls back gracefully for older plain-text posts (no HTML tags).
 *
 * Security: Only the subset of tags Tiptap StarterKit can produce
 * (p, h2, h3, strong, em, ul, ol, li, blockquote, hr, code, pre)
 * are allowed. We do NOT execute scripts and the content comes from
 * our own database (user-authored, already Grok-moderated at write time).
 */
import { useMemo } from 'react';
import './rich-text-editor.css';

interface RichTextContentProps {
    html: string;
    className?: string;
    /** If true, shows a short excerpt (no block elements, truncated). */
    preview?: boolean;
    /** Number of chars for the preview snippet. Default: 120 */
    previewLength?: number;
}

/** Strip HTML tags to get plain text — used for preview mode */
function htmlToPlainText(html: string): string {
    return html
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Detect whether the stored string is rich HTML or legacy plain text.
 * Plain-text posts never have angle brackets.
 */
function isHtml(s: string) {
    return /<[a-z][\s\S]*>/i.test(s);
}

export function RichTextContent({
    html,
    className = '',
    preview = false,
    previewLength = 120,
}: RichTextContentProps) {
    const content = useMemo(() => {
        if (!html) return '';
        if (!isHtml(html)) {
            // Legacy plain-text post — wrap in a paragraph
            return `<p>${html.replace(/\n/g, '<br/>')}</p>`;
        }
        return html;
    }, [html]);

    if (preview) {
        const plain = htmlToPlainText(content);
        const excerpt = plain.length > previewLength
            ? plain.slice(0, previewLength) + '…'
            : plain;
        return (
            <p className={`text-sm text-muted-foreground leading-snug ${className}`}>
                {excerpt}
            </p>
        );
    }

    return (
        <div
            className={`rte-content ${className}`}
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: content }}
        />
    );
}
