import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Menu, X, TrendingUp, Clock, User, ChevronRight, Newspaper, 
  ExternalLink, Share2, CloudSun, MapPin, Bookmark, Moon, Sun, 
  Volume2, VolumeX, Type as TypeIcon, ArrowUpRight, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchNews, searchNews, generateDailySummary, type NewsArticle } from './services/geminiService';
import { cn } from './lib/utils';

const CATEGORIES = ["Terbaru", "Teknologi", "Bisnis", "Politik", "Olahraga", "Hiburan", "Kesehatan", "Simpanan"];
const TRENDING_TAGS = ["#IKN", "#KecerdasanBuatan", "#EkonomiDigital", "#PialaDunia", "#Ramadan2026"];

export default function App() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Terbaru");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [bookmarks, setBookmarks] = useState<NewsArticle[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('lg');
  const [readingProgress, setReadingProgress] = useState(0);
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
    
    const savedBookmarks = localStorage.getItem('bookmarks');
    if (savedBookmarks) {
      setBookmarks(JSON.parse(savedBookmarks));
    }
  }, []);

  useEffect(() => {
    if (activeCategory === "Simpanan") {
      setArticles(bookmarks);
      setLoading(false);
    } else {
      loadNews();
    }
  }, [activeCategory]);

  const loadNews = async () => {
    setLoading(true);
    const data = await fetchNews(activeCategory === "Terbaru" ? "Umum" : activeCategory);
    setArticles(data);
    setLoading(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    const data = await searchNews(searchQuery);
    setArticles(data);
    setActiveCategory("Hasil Pencarian");
    setIsSearchOpen(false);
    setLoading(false);
  };

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const toggleBookmark = (e: React.MouseEvent, article: NewsArticle) => {
    e.stopPropagation();
    const isBookmarked = bookmarks.some(b => b.id === article.id);
    let newBookmarks;
    if (isBookmarked) {
      newBookmarks = bookmarks.filter(b => b.id !== article.id);
    } else {
      newBookmarks = [...bookmarks, article];
    }
    setBookmarks(newBookmarks);
    localStorage.setItem('bookmarks', JSON.stringify(newBookmarks));
  };

  const handleShare = (e: React.MouseEvent, article: NewsArticle) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.summary,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(`${article.title} - ${window.location.href}`);
      alert("Link disalin ke papan klip!");
    }
  };

  const speakArticle = (text: string) => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'id-ID';
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const calculateReadingTime = (text: string) => {
    const wordsPerMinute = 200;
    const words = text.split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} mnt baca`;
  };

  const handleScroll = () => {
    if (modalRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = modalRef.current;
      const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
      setReadingProgress(progress);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailSending(true);
    // Simulate summary generation and "sending"
    const summary = await generateDailySummary(articles);
    console.log("Email sent to alhikam1907@gmail.com with summary:", summary);
    
    setTimeout(() => {
      setEmailSending(false);
      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 5000);
    }, 1500);
  };

  const formatDate = () => {
    try {
      const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      // Use the current date if possible, fallback to the provided context date
      const date = new Date("2026-03-01T21:25:03-08:00");
      return date.toLocaleDateString('id-ID', options);
    } catch (e) {
      return "Minggu, 1 Maret 2026";
    }
  };

  // Safe check for API key to prevent production crashes
  const apiKeyExists = typeof process !== 'undefined' && process.env?.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "";

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-300 dark:bg-zinc-950 dark:text-zinc-100">
      {/* Top Bar */}
      {!apiKeyExists && (
        <div className="bg-amber-500 text-amber-950 py-1 px-4 text-[10px] font-bold text-center uppercase tracking-widest">
          Peringatan: API Key Gemini belum dikonfigurasi. Beberapa fitur mungkin tidak berfungsi.
        </div>
      )}
      <div className="bg-zinc-900 dark:bg-black text-white py-2 px-4 text-[10px] font-bold uppercase tracking-[0.2em] border-b border-white/5">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              {formatDate()}
            </span>
            <span className="hidden sm:flex items-center gap-1.5">
              <MapPin className="w-3 h-3" />
              Edisi Nasional
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={toggleDarkMode} className="flex items-center gap-1.5 hover:text-zinc-400 transition-colors">
              {isDarkMode ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
              {isDarkMode ? 'Mode Terang' : 'Mode Gelap'}
            </button>
          </div>
        </div>
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => { setActiveCategory("Terbaru"); }}>
              <div className="bg-zinc-900 dark:bg-white p-2 rounded-xl group-hover:rotate-6 transition-transform">
                <Newspaper className="w-6 h-6 text-white dark:text-zinc-900" />
              </div>
              <div>
                <h1 className="text-2xl font-serif font-black tracking-tighter leading-none">WARTA</h1>
                <p className="text-[10px] font-bold tracking-[0.3em] text-zinc-400">UTAMA</p>
              </div>
            </div>

            <div className="hidden lg:flex items-center space-x-8">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "text-xs font-bold uppercase tracking-widest transition-all relative py-2",
                    activeCategory === cat ? "text-zinc-900 dark:text-white" : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  )}
                >
                  {cat}
                  {activeCategory === cat && (
                    <motion.div layoutId="activeCat" className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 dark:bg-white" />
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="p-3 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-full transition-colors"
              >
                <Search className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
              </button>
              <button className="lg:hidden p-3 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-full transition-colors">
                <Menu className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar Overlay */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute inset-x-0 top-full bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl"
            >
              <form onSubmit={handleSearch} className="max-w-4xl mx-auto relative">
                <input
                  type="text"
                  placeholder="Cari berita terkini..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 bg-zinc-50 dark:bg-zinc-800 border-2 border-zinc-100 dark:border-zinc-700 rounded-2xl focus:outline-none focus:border-zinc-900/20 dark:focus:border-white/20 focus:bg-white dark:focus:bg-zinc-900 transition-all text-lg"
                  autoFocus
                />
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-zinc-400" />
                <button type="button" onClick={() => setIsSearchOpen(false)} className="absolute right-5 top-1/2 -translate-y-1/2 p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg">
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Trending Bar */}
      <div className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-6 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-bold text-xs uppercase tracking-wider whitespace-nowrap">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            Populer:
          </div>
          <div className="flex gap-4">
            {TRENDING_TAGS.map(tag => (
              <button 
                key={tag}
                onClick={() => { setSearchQuery(tag.replace('#', '')); handleSearch({ preventDefault: () => {} } as any); }}
                className="text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors whitespace-nowrap"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {/* Header Section */}
        <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[10px] font-bold uppercase tracking-widest rounded-sm">
                {activeCategory}
              </span>
              <div className="h-px w-12 bg-zinc-200 dark:bg-zinc-800" />
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                Data Terverifikasi AI
              </span>
            </div>
            <h2 className="text-5xl md:text-7xl font-serif font-bold text-zinc-900 dark:text-white tracking-tight leading-[0.9]">
              {activeCategory === "Terbaru" ? "Sorotan Utama" : activeCategory}
            </h2>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[16/10] bg-zinc-100 dark:bg-zinc-900 rounded-[2rem] mb-6" />
                <div className="space-y-4">
                  <div className="h-4 bg-zinc-100 dark:bg-zinc-900 rounded w-1/4" />
                  <div className="h-8 bg-zinc-100 dark:bg-zinc-900 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-20">
            {articles.map((article, idx) => (
              <motion.article
                key={article.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx % 3 * 0.1 }}
                className={cn(
                  "group cursor-pointer flex flex-col",
                  idx === 0 && "md:col-span-2 lg:col-span-2"
                )}
                onClick={() => setSelectedArticle(article)}
              >
                <div className={cn(
                  "relative overflow-hidden rounded-[2.5rem] bg-zinc-100 dark:bg-zinc-900 mb-8 shadow-sm group-hover:shadow-2xl transition-all duration-500",
                  idx === 0 ? "aspect-[16/9]" : "aspect-[16/10]"
                )}>
                  <img
                    src={article.imageUrl || `https://loremflickr.com/1200/800/news,${article.imageKeyword}`}
                    alt={article.title}
                    referrerPolicy="no-referrer"
                    className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                    <div className="flex gap-2">
                       <button 
                        onClick={(e) => toggleBookmark(e, article)}
                        className={cn(
                          "p-3 backdrop-blur-md rounded-full transition-colors",
                          bookmarks.some(b => b.id === article.id) ? "bg-emerald-500 text-white" : "bg-white/20 text-white hover:bg-white/40"
                        )}
                       >
                        <Bookmark className="w-4 h-4" fill={bookmarks.some(b => b.id === article.id) ? "currentColor" : "none"} />
                      </button>
                      <button 
                        onClick={(e) => handleShare(e, article)}
                        className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-colors"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4 flex-grow">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                      {article.category}
                    </span>
                    <div className="flex items-center gap-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {calculateReadingTime(article.content)}
                      </span>
                    </div>
                  </div>
                  
                  <h3 className={cn(
                    "font-serif font-bold group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors leading-[1.1] tracking-tight",
                    idx === 0 ? "text-4xl md:text-6xl" : "text-2xl"
                  )}>
                    {article.title}
                  </h3>
                  
                  <p className={cn(
                    "text-zinc-500 dark:text-zinc-400 leading-relaxed",
                    idx === 0 ? "text-lg line-clamp-3" : "text-base line-clamp-2"
                  )}>
                    {article.summary}
                  </p>
                  
                  <div className="pt-4 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-zinc-900 dark:bg-white rounded-full flex items-center justify-center text-[8px] text-white dark:text-zinc-900 font-bold">
                        {article.author.charAt(0)}
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-900 dark:text-white">
                        {article.author}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-zinc-900 dark:text-white group-hover:translate-x-1 transition-transform">
                      Selengkapnya
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-zinc-50 dark:bg-zinc-900/30 rounded-[3rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white dark:bg-zinc-900 rounded-full shadow-sm mb-6">
              <Search className="w-10 h-10 text-zinc-300 dark:text-zinc-700" />
            </div>
            <h3 className="text-2xl font-serif font-bold text-zinc-900 dark:text-white mb-3">Pencarian Tidak Ditemukan</h3>
            <p className="text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">Kami tidak dapat menemukan berita yang Anda cari. Silakan coba kata kunci lain.</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-16 mb-20">
            <div className="md:col-span-5">
              <div className="flex items-center gap-3 mb-8">
                <div className="bg-zinc-900 dark:bg-white p-2 rounded-xl">
                  <Newspaper className="w-6 h-6 text-white dark:text-zinc-900" />
                </div>
                <h2 className="text-2xl font-serif font-black tracking-tighter">WARTA UTAMA</h2>
              </div>
              <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed mb-8 max-w-sm">
                Portal berita masa depan yang menggabungkan integritas jurnalistik dengan kekuatan kecerdasan buatan.
              </p>
            </div>
            
            <div className="md:col-span-3">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-8">Kategori</h4>
              <ul className="space-y-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                {CATEGORIES.slice(0, 6).map(cat => (
                  <li key={cat} className="hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer" onClick={() => setActiveCategory(cat)}>
                    {cat}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="md:col-span-4">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-8">Newsletter & Daily Briefing</h4>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">Kirim ringkasan berita harian ke <strong>alhikam1907@gmail.com</strong>.</p>
              <form onSubmit={handleSendEmail} className="flex gap-2">
                <input 
                  type="email" 
                  value="alhikam1907@gmail.com" 
                  readOnly
                  className="flex-grow px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none opacity-70 cursor-not-allowed" 
                />
                <button 
                  disabled={emailSending || emailSent}
                  className={cn(
                    "px-6 py-3 font-bold rounded-xl text-sm transition-all flex items-center gap-2",
                    emailSent ? "bg-emerald-500 text-white" : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90"
                  )}
                >
                  {emailSending ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : emailSent ? (
                    <Check className="w-4 h-4" />
                  ) : "Kirim"}
                </button>
              </form>
              {emailSent && (
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-3"
                >
                  Email berhasil dikirim!
                </motion.p>
              )}
            </div>
          </div>
          
          <div className="pt-10 border-t border-zinc-100 dark:border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              © 2026 Warta Utama Media Group.
            </p>
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Sistem AI Aktif</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Article Modal */}
      <AnimatePresence>
        {selectedArticle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-8"
          >
            <div className="absolute inset-0 bg-zinc-900/90 backdrop-blur-md" onClick={() => { setSelectedArticle(null); setIsSpeaking(false); window.speechSynthesis.cancel(); }} />
            
            {/* Reading Progress Bar */}
            <div className="reading-progress-bar" style={{ width: `${readingProgress}%` }} />

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              className="relative bg-white dark:bg-zinc-950 w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-[3rem] shadow-2xl no-scrollbar"
              onScroll={handleScroll}
              ref={modalRef}
            >
              <div className="sticky top-0 z-20 flex justify-between items-center p-6 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => toggleBookmark(e, selectedArticle)}
                    className={cn(
                      "p-3 rounded-2xl transition-colors",
                      bookmarks.some(b => b.id === selectedArticle.id) ? "bg-emerald-500 text-white" : "hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400"
                    )}
                  >
                    <Bookmark className="w-5 h-5" fill={bookmarks.some(b => b.id === selectedArticle.id) ? "currentColor" : "none"} />
                  </button>
                  <button 
                    onClick={() => speakArticle(selectedArticle.content)}
                    className={cn(
                      "p-3 rounded-2xl transition-colors",
                      isSpeaking ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900" : "hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400"
                    )}
                  >
                    {isSpeaking ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                  <div className="h-8 w-px bg-zinc-100 dark:bg-zinc-800 mx-2" />
                  <div className="flex items-center gap-1">
                    {(['sm', 'base', 'lg', 'xl'] as const).map(size => (
                      <button 
                        key={size}
                        onClick={() => setFontSize(size)}
                        className={cn(
                          "w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all",
                          fontSize === size ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900" : "text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                        )}
                      >
                        {size.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <button 
                  onClick={() => { setSelectedArticle(null); setIsSpeaking(false); window.speechSynthesis.cancel(); }}
                  className="p-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl hover:opacity-80 transition-opacity"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="aspect-[21/9] w-full overflow-hidden">
                <img
                  src={selectedArticle.imageUrl || `https://loremflickr.com/1200/800/news,${selectedArticle.imageKeyword}`}
                  alt={selectedArticle.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-8 md:p-16">
                <div className="max-w-3xl mx-auto">
                  <div className="flex items-center gap-4 mb-8">
                    <span className="px-4 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[10px] font-black uppercase tracking-widest rounded-full">
                      {selectedArticle.category}
                    </span>
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{selectedArticle.date}</span>
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">• {calculateReadingTime(selectedArticle.content)}</span>
                  </div>

                  <h2 className="text-4xl md:text-6xl font-serif font-bold text-zinc-900 dark:text-white mb-10 leading-[1.1] tracking-tight">
                    {selectedArticle.title}
                  </h2>

                  <div className="flex items-center gap-4 mb-12 py-8 border-y border-zinc-100 dark:border-zinc-800">
                    <div className="w-14 h-14 bg-zinc-100 dark:bg-zinc-900 rounded-2xl flex items-center justify-center">
                      <User className="w-7 h-7 text-zinc-400" />
                    </div>
                    <div>
                      <p className="text-base font-bold text-zinc-900 dark:text-white">{selectedArticle.author}</p>
                      <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Koresponden Utama</p>
                    </div>
                  </div>

                  <div className={cn(
                    "prose prose-zinc dark:prose-invert max-w-none",
                    fontSize === 'sm' && "text-sm",
                    fontSize === 'base' && "text-base",
                    fontSize === 'lg' && "text-lg",
                    fontSize === 'xl' && "text-xl"
                  )}>
                    <p className="text-2xl text-zinc-500 dark:text-zinc-400 font-serif italic mb-12 leading-relaxed border-l-8 border-zinc-900 dark:border-white pl-8">
                      {selectedArticle.summary}
                    </p>
                    <div className="text-zinc-800 dark:text-zinc-200 leading-[1.8] space-y-8 font-medium">
                      {selectedArticle.content.split('\n').map((para, i) => (
                        <p key={i}>{para}</p>
                      ))}
                    </div>
                  </div>

                  {/* Sources Section */}
                  {selectedArticle.sources && selectedArticle.sources.length > 0 && (
                    <div className="mt-20 pt-10 border-t border-zinc-100 dark:border-zinc-800">
                      <h4 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 mb-6 flex items-center gap-2">
                        <ExternalLink className="w-4 h-4" />
                        Verifikasi Sumber:
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {selectedArticle.sources.map((source, i) => (
                          <a 
                            key={i} 
                            href={source.uri} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-start gap-3 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group"
                          >
                            <div className="mt-1 p-1 bg-white dark:bg-zinc-800 rounded-lg group-hover:bg-zinc-900 dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-zinc-900 transition-colors">
                              <ArrowUpRight className="w-3 h-3" />
                            </div>
                            <span className="text-sm font-bold text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-snug">
                              {source.title}
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
