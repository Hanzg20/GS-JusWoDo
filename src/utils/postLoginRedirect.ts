const STORAGE_KEY = 'jwd_post_login_redirect';

// Most pages that gate on login just call navigate('/login') with no way
// back — acceptable when the destination is trivial to return to (a tab,
// a modal). It isn't for a QR-scanned link like /leave-review/:listingId:
// that's often a one-time visit from a phone camera, so dumping the visitor
// at the homepage after login would silently kill the whole flow. This is a
// narrow, additive fix for that one case, not a site-wide redirect system.
export const setPostLoginRedirect = (path: string) => {
    try {
        sessionStorage.setItem(STORAGE_KEY, path);
    } catch {
        // sessionStorage unavailable (private mode, etc.) — the visitor just
        // lands on '/' after login instead, same as every other page today.
    }
};

export const consumePostLoginRedirect = (): string | null => {
    try {
        const path = sessionStorage.getItem(STORAGE_KEY);
        if (path) sessionStorage.removeItem(STORAGE_KEY);
        return path;
    } catch {
        return null;
    }
};
