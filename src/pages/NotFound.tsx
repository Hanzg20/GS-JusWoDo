import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useConfigStore } from "@/stores/configStore";
import { MASCOT_BEAVER } from "@/config/mascots";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useConfigStore();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-6">
      <div className="text-center">
        <img src={MASCOT_BEAVER.avatar} alt={MASCOT_BEAVER.name} className="w-28 h-28 mx-auto mb-4" />
        <h1 className="mb-2 text-2xl font-black text-foreground">
          {language === 'zh' ? '小海狸也没找到这个页面' : "Even 小海狸 couldn't find this page"}
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          {language === 'zh' ? '这个链接可能已经失效，或者地址打错了。' : 'The link may be broken, or the address is wrong.'}
        </p>
        <button
          onClick={() => navigate('/')}
          className="text-primary font-bold underline hover:text-primary/90"
        >
          {language === 'zh' ? '回到首页' : 'Return to Home'}
        </button>
      </div>
    </div>
  );
};

export default NotFound;
