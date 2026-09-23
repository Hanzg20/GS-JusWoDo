import { useNavigate, type NavigateFunction } from "react-router-dom";
import { LogIn } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useConfigStore } from "@/stores/configStore";
import { setPostLoginRedirect } from "@/utils/postLoginRedirect";

// WeChat Mini Program review rejects forced-login jumps: a logged-out
// visitor must be able to look around, and the login page should only open
// when they tap a login button themselves. These two helpers are the only
// ways a page should gate on login — never navigate('/login') on its own.

const goLogin = (navigate: NavigateFunction, redirectTo?: string) => {
    setPostLoginRedirect(redirectTo || window.location.pathname + window.location.search);
    navigate('/login');
};

/** For actions (tap 举报/发布/报名…): explain, and offer a 去登录 button in the toast. */
export const promptLogin = (navigate: NavigateFunction, isZh: boolean, message?: string, redirectTo?: string) => {
    toast(message || (isZh ? '登录后才能使用这个功能' : 'Log in to use this feature'), {
        action: {
            label: isZh ? '去登录' : 'Log In',
            onClick: () => goLogin(navigate, redirectTo),
        },
    });
};

/** For private pages (my orders, cart…): render in place of the page instead of redirecting. */
export const LoginRequired = ({ message }: { message?: string }) => {
    const navigate = useNavigate();
    const isZh = useConfigStore(s => s.language) === 'zh';

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="text-center max-w-xs">
                    <LogIn className="w-14 h-14 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground mb-5 font-medium">
                        {message || (isZh ? '登录后即可查看' : 'Log in to view this page')}
                    </p>
                    <div className="flex gap-3 justify-center">
                        <Button variant="outline" className="rounded-2xl h-11 px-5" onClick={() => navigate('/')}>
                            {isZh ? '先逛逛' : 'Browse'}
                        </Button>
                        <Button className="rounded-2xl font-bold h-11 px-6" onClick={() => goLogin(navigate)}>
                            {isZh ? '去登录' : 'Log In'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
