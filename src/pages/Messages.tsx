import { useState } from "react";
import { Search, Bell, ChevronRight, Image, MapPin } from "lucide-react";
import { useConfigStore } from "@/stores/configStore";

interface Conversation {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  serviceTitle?: string;
  isSystem?: boolean;
}

const getMockConversations = (language: 'zh' | 'en'): Conversation[] => [
  {
    id: "1",
    name: language === 'zh' ? "李阿姨" : "Auntie Li",
    avatar: "https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=100&h=100&fit=crop&crop=face",
    lastMessage: language === 'zh' ? "好的，下午3点到您家" : "Sure, I'll be at your place at 3pm",
    time: language === 'zh' ? "刚刚" : "Just now",
    unread: 2,
    serviceTitle: language === 'zh' ? "深度保洁订单" : "Deep Cleaning Order",
  },
  {
    id: "2",
    name: language === 'zh' ? "王大厨" : "Chef Wang",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    lastMessage: language === 'zh' ? "今天的菜已经准备好了" : "Today's meal is ready",
    time: language === 'zh' ? "10分钟前" : "10 min ago",
    unread: 0,
    serviceTitle: language === 'zh' ? "家常菜套餐" : "Home-Style Meal Package",
  },
  {
    id: "3",
    name: language === 'zh' ? "小张" : "Xiao Zhang",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop&crop=face",
    lastMessage: language === 'zh' ? "[图片]" : "[Image]",
    time: language === 'zh' ? "1小时前" : "1 hour ago",
    unread: 0,
    serviceTitle: language === 'zh' ? "代取快递" : "Package Pickup",
  },
  {
    id: "system",
    name: language === 'zh' ? "系统通知" : "System Notice",
    avatar: "",
    lastMessage: language === 'zh' ? "您的订单已完成，请评价~" : "Your order is complete — please leave a review~",
    time: language === 'zh' ? "昨天" : "Yesterday",
    unread: 1,
    isSystem: true,
  },
];

const getQuickReplies = (language: 'zh' | 'en') =>
  language === 'zh'
    ? ["我在路上", "已到楼下", "服务完成", "请稍等"]
    : ["On my way", "Downstairs", "Service done", "One moment"];

const Messages = () => {
  const { language } = useConfigStore();
  const [activeTab, setActiveTab] = useState<"all" | "trade" | "system">("all");
  const [selectedChat, setSelectedChat] = useState<string | null>(null);

  const t = {
    title: language === 'zh' ? '消息中心' : 'Messages',
    searchPlaceholder: language === 'zh' ? '搜索联系人...' : 'Search contacts...',
    relatedOrder: language === 'zh' ? '关联订单:' : 'Related order:',
    messagePlaceholder: language === 'zh' ? '输入消息...' : 'Type a message...',
    send: language === 'zh' ? '发送' : 'Send',
    sampleMsg1: language === 'zh' ? '您好，下午3点可以吗？' : 'Hi, is 3pm okay?',
    sampleMsg2: language === 'zh' ? '可以，B栋3单元302' : 'Sure, Building B, Unit 3, #302',
    justNow: language === 'zh' ? '刚刚' : 'Just now',
  };

  const mockConversations = getMockConversations(language);
  const quickReplies = getQuickReplies(language);

  const tabs = [
    { id: "all" as const, label: language === 'zh' ? "全部" : "All" },
    { id: "trade" as const, label: language === 'zh' ? "交易沟通" : "Order Chats" },
    { id: "system" as const, label: language === 'zh' ? "系统通知" : "System" },
  ];

  const filteredConversations = mockConversations.filter((conv) => {
    if (activeTab === "all") return true;
    if (activeTab === "system") return conv.isSystem;
    return !conv.isSystem;
  });

  if (selectedChat) {
    const chat = mockConversations.find((c) => c.id === selectedChat);
    if (!chat) return null;

    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Chat Header */}
        <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-lg border-b border-border/50">
          <div className="container flex items-center gap-3 h-14">
            <button onClick={() => setSelectedChat(null)} className="p-2 -ml-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <img src={chat.avatar} alt={chat.name} className="w-9 h-9 rounded-full" />
            <div className="flex-1">
              <p className="font-bold text-foreground">{chat.name}</p>
              <p className="text-xs text-muted-foreground">{chat.serviceTitle}</p>
            </div>
          </div>

          {/* Service Context Card */}
          {chat.serviceTitle && (
            <div className="px-4 py-2 bg-muted/50 border-b border-border/50">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">{t.relatedOrder}</span>
                <span className="font-medium text-foreground">{chat.serviceTitle}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
              </div>
            </div>
          )}
        </header>

        {/* Chat Messages */}
        <div className="flex-1 container py-4 space-y-4">
          {/* Sample messages */}
          <div className="flex justify-start">
            <div className="max-w-[75%]">
              <div className="bg-card rounded-2xl rounded-tl-md px-4 py-2.5 shadow-sm">
                <p className="text-foreground">{t.sampleMsg1}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1 ml-1">14:30</p>
            </div>
          </div>

          <div className="flex justify-end">
            <div className="max-w-[75%]">
              <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-md px-4 py-2.5">
                <p>{t.sampleMsg2}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1 mr-1 text-right">14:31</p>
            </div>
          </div>

          <div className="flex justify-start">
            <div className="max-w-[75%]">
              <div className="bg-card rounded-2xl rounded-tl-md px-4 py-2.5 shadow-sm">
                <p className="text-foreground">{chat.lastMessage}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1 ml-1">{t.justNow}</p>
            </div>
          </div>
        </div>

        {/* Quick Replies */}
        <div className="px-4 py-2 border-t border-border/50 bg-card/50">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {quickReplies.map((reply) => (
              <button
                key={reply}
                className="px-3 py-1.5 rounded-full bg-muted text-sm text-muted-foreground whitespace-nowrap hover:bg-muted/80 transition-colors"
              >
                {reply}
              </button>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="sticky bottom-0 bg-card border-t border-border/50 p-4 pb-safe">
          <div className="flex items-center gap-3">
            <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
              <Image className="w-6 h-6" />
            </button>
            <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
              <MapPin className="w-6 h-6" />
            </button>
            <input
              type="text"
              placeholder={t.messagePlaceholder}
              className="flex-1 px-4 py-2.5 rounded-2xl bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            <button className="px-5 py-2.5 rounded-2xl bg-primary text-primary-foreground font-medium">
              {t.send}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-lg border-b border-border/50">
        <div className="container py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-foreground">{t.title}</h1>
            <button className="p-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors">
              <Bell className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Conversation List */}
      <div className="container py-4">
        <div className="space-y-2">
          {filteredConversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => !conv.isSystem && setSelectedChat(conv.id)}
              className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-muted/50 transition-colors"
            >
              {/* Avatar */}
              {conv.isSystem ? (
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bell className="w-6 h-6 text-primary" />
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={conv.avatar}
                    alt={conv.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  {conv.unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-accent rounded-full text-[10px] font-bold text-accent-foreground flex items-center justify-center">
                      {conv.unread}
                    </span>
                  )}
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between mb-0.5">
                  <p className={`font-semibold ${conv.unread > 0 ? "text-foreground" : "text-foreground/80"}`}>
                    {conv.name}
                  </p>
                  <span className="text-xs text-muted-foreground">{conv.time}</span>
                </div>
                {conv.serviceTitle && (
                  <p className="text-xs text-primary mb-0.5">{conv.serviceTitle}</p>
                )}
                <p className={`text-sm truncate ${conv.unread > 0 ? "text-foreground" : "text-muted-foreground"}`}>
                  {conv.lastMessage}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Messages;
