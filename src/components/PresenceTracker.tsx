import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { usePresenceStore } from "@/stores/presenceStore";

// No UI — just keeps this browser tracked on the shared presence channel
// for as long as the user is logged in, mounted once at the app root so
// online status is accurate everywhere, not only while the Chat page is open.
export function PresenceTracker() {
    const { currentUser } = useAuthStore();
    const { joinPresence, leavePresence } = usePresenceStore();

    useEffect(() => {
        if (currentUser?.id) {
            joinPresence(currentUser.id);
        } else {
            leavePresence();
        }
        return () => leavePresence();
    }, [currentUser?.id]);

    return null;
}
