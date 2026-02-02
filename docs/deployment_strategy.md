# Deployment Strategy: Multi-Environment Options

You asked for "Best Practices". In modern web development, there are two main approaches to handling multiple environments (Prod vs Test).

## Option 1: Runtime Configuration (Your Current Request)
**"One Build, Dynamic Switching"**

This is the approach we designed earlier. You build the app **once**. The code itself checks `window.location.hostname` when it runs in the user's browser, and decides which database to connect to.

*   **Pros**:
    *   **Simplicity**: Only one build step.
    *   **Portability**: The exact same set of files runs everywhere.
    *   **Cost**: Uses less storage/build minutes.
*   **Cons**:
    *   **Bundle Size**: Both Prod and Test configuration keys are included in the code. (Not a security risk for Anon keys, but slightly messy).
    *   **Complexity**: Code needs `if/else` logic to initialize Supabase.
*   **Best For**: Simple static hosting where you just want to point two domains to the exact same folder.

## Option 2: Build-Time Configuration (Industry Standard / Best Practice)
**"Two Builds, Separate Deployments"**

This is the standard "Best Practice" for professional teams. You use a CI/CD pipeline (like GitHub Actions) to run the build command **twice**, with different environment variables injected each time.

1.  **Build 1 (Production)**:
    *   Inject `VITE_SUPABASE_URL = prod_url`
    *   Deploy result to `/var/www/justwedo.com`
2.  **Build 2 (Test)**:
    *   Inject `VITE_SUPABASE_URL = test_url`
    *   Deploy result to `/var/www/hh.jinbean.com`

*   **Pros**:
    *   **Isolation**: The Test app knows *nothing* about the Prod app, and vice versa. Zero chance of accidental cross-connection.
    *   **Clean Code**: No `if (hostname)` checks. `import.meta.env.VITE_SUPABASE_URL` always holds the correct value.
    *   **feature Flags**: You can easily enable "experimental" features only in the Test build without hiding them behind runtime flags.
*   **Cons**:
    *   **Setup**: Requires configuring a CI/CD pipeline (e.g., GitHub Actions) to deploy to two different folders/buckets.
    *   **Storage**: Requires two separate folders on your web server.

---

## Comparison Summary

| Feature | Option 1: Runtime (Dynamic) | Option 2: Build-Time (Static) |
| :--- | :--- | :--- |
| **Codebase** | Single Repo | Single Repo |
| **Build Artifacts** | **1 Set of Files** (Universal) | **2 Sets of Files** (Specific) |
| **Server Setup** | Point both domains to `Folder A` | Point Domain 1 -> `Folder A`, Domain 2 -> `Folder B` |
| **Config Logic** | JavaScript `if` check inside App | CI/CD Injection (GitHub Secrets or .env files) |
| **Recommendation** | **Best for simplicity** if you manually upload files. | **Best for robustness** if you use automated deployment. |

## Recommendation

If you truly want **"One Web Release Area"** (physically one folder on the server), then **Option 1 (Runtime)** is your ONLY choice.

If "One Web Release Area" allows for **Two Sub-folders** (e.g., `release/prod` and `release/test`), then **Option 2 (Build-Time)** is safer and cleaner.

### Implementation for Option 1 (Runtime Config)
*(Already detailed in previous steps)*
1. Edit `.env` to have both keys.
2. Edit `src/lib/supabase.ts` to switch at runtime.

### Implementation for Option 2 (Building Separately)
1. **Local Development**: Just change your `.env` to point to Test DB.
2. **Production Build**: Run `VITE_SUPABASE_URL=... npm run build` (or set in CI).
3. **Test Build**: Run `VITE_SUPABASE_URL=... npm run build --mode testing`.
