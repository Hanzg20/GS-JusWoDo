// 邻里圈 post content is Tiptap HTML ("<p>…<strong>…</strong></p>"), but
// share cards, copied text, posters and listing prefills need plain text —
// a WeChat friend-share card was showing the raw <p>/<strong> tags.

/**
 * Rich-text HTML → plain text: tags removed, entities decoded, whitespace
 * collapsed. With keepLineBreaks, paragraphs/<br> become newlines (for a
 * multi-line field like a listing description); otherwise one line.
 */
export function htmlToPlainText(html: string | null | undefined, keepLineBreaks = false): string {
    if (!html) return '';
    // Block-level closings/line breaks become a separator so words from
    // adjacent paragraphs don't run together once the tags are gone.
    const spaced = html.replace(/<\/(p|div|li|h[1-6]|blockquote)>|<br\s*\/?>/gi, '\n');
    let text: string;
    if (typeof DOMParser !== 'undefined') {
        // Decodes &nbsp; &amp; &lt; etc. too; DOMParser doesn't run scripts
        // or load images, so this is safe for user content.
        text = new DOMParser().parseFromString(spaced, 'text/html').body.textContent || '';
    } else {
        text = spaced.replace(/<[^>]+>/g, ' ');
    }
    if (keepLineBreaks) {
        return text.split('\n').map((line) => line.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n');
    }
    return text.replace(/\s+/g, ' ').trim();
}

/** Plain-text excerpt of at most `max` characters, with "..." when cut. */
export function plainTextExcerpt(html: string | null | undefined, max: number): string {
    const text = htmlToPlainText(html);
    return text.length > max ? text.slice(0, max) + '...' : text;
}
