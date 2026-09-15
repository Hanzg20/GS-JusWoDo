// The "小海狸" support system account — every new user gets a pre-seeded
// conversation with this account the first time they open Chat (see
// Chat.tsx). Created once via a temp Edge Function (deploy-run-delete
// pattern, see repo conversation history 2026-09-08) — this id doesn't
// change unless the account is recreated. Renamed from "渥帮客服" 2026-09-14
// (user_profiles.name/avatar updated directly, this id is unaffected).
export const SUPPORT_USER_ID = 'b364c065-6143-4c11-b3ca-74c8494a526a';
