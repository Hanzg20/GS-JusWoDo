import { Search, X, TrendingUp, Sparkles, Loader2, Trash2, Clock, Grid, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useSemanticSearch } from "@/hooks/useSemanticSearch";
import { useConfigStore } from "@/stores/configStore";
import { useSearchHistory } from "@/stores/searchHistoryStore";
import { ListingMaster } from "@/types/domain";
import { CategoryMenu } from "@/components/search/CategoryMenu";

interface SmartSearchBarProps {
  isCompact?: boolean;
}

export function SmartSearchBar({ isCompact = false }: SmartSearchBarProps) {
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);
  const { language } = useConfigStore();
  const { history, addToHistory, removeFromHistory, clearHistory } = useSearchHistory();

  // AI 搜索集成
  const { results, loading, error, isAISearch } = useSemanticSearch(query, {
    enabled: query.length >= 2,
    threshold: 0.5,
    limit: 5
  });

  // 搜索建议 (热门搜索)
  const suggestions = language === 'zh'
    ? ["家政清洁", "除雪服务", "草坪护理", "工具租赁", "宠物看护", "家教辅导"]
    : ["House Cleaning", "Snow Removal", "Lawn Care", "Tool Rental", "Pet Sitting", "Tutoring"];

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
        setShowCategoryMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      addToHistory(searchQuery); // 保存到历史记录
      // Unified search results list (like a normal search page) — not the map.
      // Map is a separate, deliberate view via the map button next to Search.
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setShowResults(false);
      setShowCategoryMenu(false);
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    // Category picks go straight to that category's listing page.
    navigate(`/category/${categoryId}`);
    setShowCategoryMenu(false);
  };

  const t = {
    placeholder: language === 'zh'
      ? (isCompact ? '搜索服务、二手、邻里…' : '搜索家政清洁、铲雪、二手家具…')
      : (isCompact ? 'Search services, goods…' : 'Search cleaning, snow removal, used furniture…'),
    searchButton: language === 'zh' ? '搜索' : 'Search',
    aiRecommendations: language === 'zh' ? 'AI 智能推荐' : 'AI Recommendations',
    trendingSearches: language === 'zh' ? '热门搜索' : 'Trending Searches',
    recentSearches: language === 'zh' ? '最近搜索' : 'Recent Searches',
    clearHistory: language === 'zh' ? '清除历史' : 'Clear History',
    viewAll: language === 'zh' ? '查看全部' : 'View All',
    results: language === 'zh' ? '个结果' : 'Results',
    noResults: language === 'zh' ? '没有找到相关结果' : 'No results found',
    tryOther: language === 'zh' ? '试试其他关键词' : 'Try different keywords',
    highMatch: language === 'zh' ? '高度匹配' : 'High Match',
    categories: language === 'zh' ? '分类' : 'Categories',
  };

  return (
    <div className={`relative w-full ${isCompact ? '' : 'max-w-2xl'}`} ref={searchRef}>
      <div className={`relative group flex items-center gap-2 transition-all p-1 rounded-2xl ${isCompact ? '' : 'bg-white/10 backdrop-blur-sm border border-white/20 shadow-sm hover:bg-white/20 focus-within:bg-white/20 focus-within:border-white/40 focus-within:shadow-md'}`}>

        {/* Category Menu Toggle */}
        <div className="relative">
          <button
            onClick={() => setShowCategoryMenu(!showCategoryMenu)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/30 transition-all ${showCategoryMenu ? 'bg-white/30 text-foreground shadow-sm' : ''}`}
          >
            <Grid className="w-5 h-5" />
            {!isCompact && <ChevronDown className={`w-3 h-3 transition-transform ${showCategoryMenu ? 'rotate-180' : ''}`} />}
          </button>
          {showCategoryMenu && (
            <CategoryMenu onSelect={handleCategorySelect} onClose={() => setShowCategoryMenu(false)} />
          )}
        </div>

        <div className="w-px h-6 bg-white/20 mx-1 hidden sm:block" />

        <div className="flex-1 relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              setShowResults(true);
              setShowCategoryMenu(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch(query);
              }
            }}
            placeholder={t.placeholder}
            className="w-full bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground px-2 py-2 text-sm sm:text-base"
          />

          {/* AI 搜索加载指示器 */}
          {loading && (
            <div className="absolute right-8 top-1/2 -translate-y-1/2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            </div>
          )}

          {/* 清除按钮 */}
          {query && !loading && (
            <button
              onClick={() => {
                setQuery("");
                setShowResults(false);
              }}
              className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {!isCompact && (
          <Button
            onClick={() => handleSearch(query)}
            size="sm"
            className="rounded-xl px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-sm"
          >
            <Search className="w-4 h-4 mr-1.5" />
            {t.searchButton}
          </Button>
        )}
      </div>

      {/* 搜索结果下拉框 */}
      {showResults && (
        <div className={`absolute top-full mt-2 w-full glass-card !bg-white rounded-2xl p-3 shadow-elevated z-50 max-h-[500px] overflow-y-auto ${isCompact ? 'text-sm' : ''
          } animate-in fade-in slide-in-from-top-2 duration-200`}>
          {/* AI 搜索结果预览 */}
          {query && results.length > 0 && (
            <div className="space-y-2 mb-4">
              <div className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-primary animate-pulse" />
                {t.aiRecommendations}
                {isAISearch && (
                  <Badge variant="secondary" className="ml-auto text-[10px] bg-primary/10">
                    AI
                  </Badge>
                )}
              </div>

              {results.slice(0, 3).map((item, index) => (
                <SearchResultPreview
                  key={item.id}
                  item={item}
                  query={query}
                  language={language}
                  onSelect={() => setShowResults(false)}
                />
              ))}

              {results.length > 3 && (
                <Button
                  variant="ghost"
                  className="w-full text-primary hover:text-primary/80 h-9"
                  onClick={() => handleSearch(query)}
                >
                  {t.viewAll} {results.length} {t.results} →
                </Button>
              )}
            </div>
          )}

          {/* 无结果提示 */}
          {query && !loading && results.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              <p className="text-sm mb-2">{t.noResults}</p>
              <p className="text-xs">{t.tryOther}</p>
            </div>
          )}

          {/* 搜索历史 (仅在无查询且有历史时显示) */}
          {!query && history.length > 0 && (
            <div className="space-y-2 mb-4">
              <div className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                <span>{t.recentSearches}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearHistory();
                  }}
                  className="text-xs text-primary hover:text-primary/80 transition-colors normal-case flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  {t.clearHistory}
                </button>
              </div>
              {history.map((h, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setQuery(h);
                    handleSearch(h);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted/50 rounded-xl transition-colors flex items-center gap-2 group"
                >
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="flex-1">{h}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromHistory(h);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                  >
                    <X className="w-3 h-3 text-muted-foreground" />
                  </button>
                </button>
              ))}
            </div>
          )}

          {/* 热门搜索建议 (仅在无查询时显示) */}
          {!query && (
            <div className="space-y-2">
              <div className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {t.trendingSearches}
              </div>
              {suggestions.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setQuery(suggestion);
                    handleSearch(suggestion);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted/50 rounded-xl transition-colors flex items-center gap-2"
                >
                  <TrendingUp className="w-4 h-4 text-primary" />
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// 搜索结果预览卡片组件
interface SearchResultPreviewProps {
  item: ListingMaster & { similarity?: number };
  query: string;
  language: 'en' | 'zh';
  onSelect: () => void;
}

const SearchResultPreview = ({ item, query, language, onSelect }: SearchResultPreviewProps) => {
  const title = language === 'zh' ? item.titleZh : (item.titleEn || item.titleZh);
  const description = language === 'zh' ? item.descriptionZh : (item.descriptionEn || item.descriptionZh);

  return (
    <Link
      to={`/service/${item.id}`}
      onClick={onSelect}
      className="flex gap-3 p-3 hover:bg-muted rounded-xl transition-colors group"
    >
      {/* 缩略图 */}
      <div className="shrink-0">
        <img
          src={item.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=60'}
          alt={title}
          className="w-11 h-11 rounded-lg object-cover group-hover:scale-105 transition-transform"
        />
      </div>

      {/* 信息 */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate mb-1">
          {title}
        </div>
        <div className="text-xs text-muted-foreground line-clamp-2">
          {description}
        </div>
      </div>

      {/* 相似度徽章 */}
      {item.similarity && item.similarity > 0.75 && (
        <div className="shrink-0">
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
            <Sparkles className="w-3 h-3 mr-1" />
            {language === 'zh' ? '高度匹配' : 'High Match'}
          </Badge>
        </div>
      )}
    </Link>
  );
};
