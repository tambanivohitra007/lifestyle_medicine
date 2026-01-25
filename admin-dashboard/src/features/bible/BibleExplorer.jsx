import { useState, useEffect } from 'react';
import {
  Search,
  BookOpen,
  HeartPulse,
  Copy,
  Check,
  Plus,
  ChevronRight,
  Sparkles,
  BookMarked,
  ArrowRight,
} from 'lucide-react';
import api, { apiEndpoints } from '../../lib/api';
import { toast } from '../../lib/swal';

// Theme images mapping (using Unsplash for high-quality free images)
const themeImages = {
  healing: 'https://images.unsplash.com/photo-1447452001602-7090c7ab2db3?w=800&q=80', // Sunrise/hope
  body_temple: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80', // Meditation/yoga
  diet_nutrition: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80', // Healthy food
  rest_sabbath: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80', // Peaceful rest
  peace_anxiety: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=800&q=80', // Calm water
  trust_faith: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80', // Hands reaching sky
  strength_endurance: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80', // Fitness/strength
  temperance: 'https://images.unsplash.com/photo-1506126279646-a697353d3166?w=800&q=80', // Balance/nature
};

// Fallback theme colors for badges and accents
const themeColors = {
  rose: 'bg-rose-100 text-rose-700 border-rose-200',
  purple: 'bg-purple-100 text-purple-700 border-purple-200',
  green: 'bg-green-100 text-green-700 border-green-200',
  indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  sky: 'bg-sky-100 text-sky-700 border-sky-200',
  amber: 'bg-amber-100 text-amber-700 border-amber-200',
  orange: 'bg-orange-100 text-orange-700 border-orange-200',
  teal: 'bg-teal-100 text-teal-700 border-teal-200',
};

const themeBgColors = {
  rose: 'bg-rose-50',
  purple: 'bg-purple-50',
  green: 'bg-green-50',
  indigo: 'bg-indigo-50',
  sky: 'bg-sky-50',
  amber: 'bg-amber-50',
  orange: 'bg-orange-50',
  teal: 'bg-teal-50',
};

// Helper function to highlight search terms in text
const highlightSearchTerm = (text, searchTerm) => {
  if (!searchTerm || searchTerm.length < 2) return text;

  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, index) =>
    regex.test(part) ? (
      <mark key={index} className="bg-yellow-200 text-yellow-900 px-0.5 rounded">
        {part}
      </mark>
    ) : (
      part
    )
  );
};

const BibleExplorer = () => {
  const [activeTab, setActiveTab] = useState('themes');
  const [searchQuery, setSearchQuery] = useState('');
  const [lookupQuery, setLookupQuery] = useState('');
  const [bibleId, setBibleId] = useState('de4e12af7f28f599-02'); // Default KJV
  const [translations, setTranslations] = useState([]);
  const [themes, setThemes] = useState([]);
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [themeVerses, setThemeVerses] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [lookupResult, setLookupResult] = useState(null);
  const [dailyVerse, setDailyVerse] = useState(null);
  const [books, setBooks] = useState({ old_testament: [], new_testament: [] });
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [chapterContent, setChapterContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copiedRef, setCopiedRef] = useState(null);
  const [searchMode, setSearchMode] = useState('bible'); // 'bible' or 'health'
  const [loadingTheme, setLoadingTheme] = useState(null); // Track which theme is loading

  // Fetch initial data
  useEffect(() => {
    fetchTranslations();
    fetchThemes();
    fetchBooks();
  }, []);

  // Fetch daily verse when translation changes
  useEffect(() => {
    fetchDailyVerse();
  }, [bibleId]);

  // Fetch translations
  const fetchTranslations = async () => {
    try {
      const response = await api.get(apiEndpoints.bibleTranslations);
      setTranslations(response.data.data || []);
    } catch (error) {
      console.error('Error fetching translations:', error);
    }
  };

  // Fetch health themes
  const fetchThemes = async () => {
    try {
      const response = await api.get(apiEndpoints.bibleHealthThemes);
      setThemes(response.data.data || []);
    } catch (error) {
      console.error('Error fetching themes:', error);
    }
  };

  // Fetch daily verse
  const fetchDailyVerse = async () => {
    try {
      const response = await api.get(apiEndpoints.bibleDailyVerse, {
        params: { bibleId },
      });
      setDailyVerse(response.data.data);
    } catch (error) {
      console.error('Error fetching daily verse:', error);
    }
  };

  // Fetch Bible books
  const fetchBooks = async () => {
    try {
      const response = await api.get(apiEndpoints.bibleBooks);
      setBooks(response.data.data || { old_testament: [], new_testament: [] });
    } catch (error) {
      console.error('Error fetching books:', error);
    }
  };

  // Fetch theme verses
  const fetchThemeVerses = async (themeKey) => {
    // Find theme info from local themes list for instant display
    const themeInfo = themes.find(t => t.key === themeKey);

    // Show loading on the card immediately
    setLoadingTheme(themeKey);

    // Small delay to show loading feedback on the card
    await new Promise(resolve => setTimeout(resolve, 150));

    // Immediately show the theme view with loading state
    setSelectedTheme({
      key: themeKey,
      theme: themeInfo?.name || 'Loading...',
      description: themeInfo?.description || '',
      color: themeInfo?.color,
    });
    setThemeVerses([]);
    setLoading(true);
    setLoadingTheme(null);

    try {
      const response = await api.get(apiEndpoints.bibleHealthTheme(themeKey), {
        params: { bibleId },
      });
      setThemeVerses(response.data.data?.verses || []);
      // Update with full theme data
      setSelectedTheme(response.data.data);
    } catch (error) {
      console.error('Error fetching theme verses:', error);
      toast.error('Failed to load verses');
      setSelectedTheme(null); // Go back on error
    } finally {
      setLoading(false);
    }
  };

  // Handle verse lookup
  const handleLookup = async (e) => {
    e.preventDefault();
    if (!lookupQuery.trim()) return;

    setLoading(true);
    try {
      const response = await api.get(apiEndpoints.bibleLookup, {
        params: { reference: lookupQuery, bibleId },
      });
      setLookupResult(response.data.data);
    } catch (error) {
      console.error('Error looking up verse:', error);
      toast.error(error.response?.data?.error || 'Verse not found');
      setLookupResult(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim() || searchQuery.length < 2) return;

    setLoading(true);
    try {
      if (searchMode === 'health') {
        // Search only health-themed verses
        const response = await api.get(apiEndpoints.bibleSearchHealth, {
          params: { query: searchQuery, bibleId },
        });
        setSearchResults(response.data.data?.results || []);
      } else {
        // Search entire Bible
        const response = await api.get(apiEndpoints.bibleSearch, {
          params: { query: searchQuery, bibleId, limit: 50 },
        });
        const results = response.data.data?.results || [];
        // Add search mode indicator to results
        setSearchResults(results.map(r => ({ ...r, fromBibleSearch: true })));
      }
    } catch (error) {
      console.error('Error searching:', error);
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  // Handle chapter fetch
  const handleChapterSelect = async (chapter) => {
    setSelectedChapter(chapter);
    setLoading(true);
    try {
      const response = await api.get(apiEndpoints.bibleChapter, {
        params: { bookId: selectedBook.id, chapter, bibleId },
      });
      setChapterContent(response.data.data);
    } catch (error) {
      console.error('Error fetching chapter:', error);
      toast.error('Failed to load chapter');
    } finally {
      setLoading(false);
    }
  };

  // Copy verse to clipboard
  const copyVerse = async (reference, text) => {
    const content = `"${text}" - ${reference}`;
    await navigator.clipboard.writeText(content);
    setCopiedRef(reference);
    setTimeout(() => setCopiedRef(null), 2000);
    toast.success('Copied to clipboard');
  };

  // Add to scriptures
  const addToScriptures = async (reference, text, theme = '') => {
    try {
      await api.post(apiEndpoints.scripturesAdmin, {
        reference,
        text,
        theme,
      });
      toast.success('Added to scriptures');
    } catch (error) {
      if (error.response?.status === 422) {
        toast.error('Scripture already exists');
      } else {
        toast.error('Failed to add scripture');
      }
    }
  };

  const tabs = [
    { id: 'themes', label: 'Health Themes', icon: HeartPulse },
    { id: 'lookup', label: 'Verse Lookup', icon: Search },
    { id: 'search', label: 'Search', icon: BookMarked },
    { id: 'browse', label: 'Browse', icon: BookOpen },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Bible Explorer</h1>
        <p className="text-gray-600 mt-1">
          Find and save scriptures related to health and wellness
        </p>
      </div>

      {/* Verse of the Day - Elegant Gradient Design */}
      {dailyVerse && (
        <div className="relative overflow-hidden rounded-2xl shadow-lg">
          {/* Subtle gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />

          {/* Accent gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary-900/40 via-transparent to-indigo-900/30" />

          {/* Subtle pattern/texture */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />

          {/* Soft glow effects */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl" />

          {/* Content */}
          <div className="relative px-5 sm:px-8 py-6 sm:py-8">
            {/* Header Row */}
            <div className="flex items-center justify-between mb-4 sm:mb-5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                  Verse of the Day
                </span>
              </div>
              <span className="text-xs text-white/50 bg-white/5 px-2.5 py-1 rounded-full">
                {dailyVerse.theme}
              </span>
            </div>

            {/* Verse Text */}
            <blockquote className="relative">
              <p className="text-base sm:text-lg text-white/90 leading-relaxed font-light italic">
                "{dailyVerse.text}"
              </p>
            </blockquote>

            {/* Footer Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-5 pt-4 border-t border-white/10">
              <div className="flex items-center gap-3">
                <p className="text-sm font-medium text-white">
                  {dailyVerse.reference}
                </p>
                <span className="text-xs text-white/40">
                  {dailyVerse.translation}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyVerse(dailyVerse.reference, dailyVerse.text)}
                  className="flex items-center gap-1.5 text-white/60 hover:text-white hover:bg-white/10 active:bg-white/15 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                >
                  {copiedRef === dailyVerse.reference ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => addToScriptures(dailyVerse.reference, dailyVerse.text, dailyVerse.theme)}
                  className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 active:bg-white/25 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Save</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Translation Selector */}
      <div className="card bg-gray-50">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-primary-600" />
            <label className="text-sm font-medium text-gray-700">Bible Translation:</label>
          </div>
          <select
            value={bibleId}
            onChange={(e) => setBibleId(e.target.value)}
            className="input-field flex-1 sm:max-w-md"
          >
            {translations.map((t) => (
              <option key={t.code} value={t.code}>
                {t.abbreviation} - {t.name}
              </option>
            ))}
          </select>
          {translations.find(t => t.code === bibleId)?.description && (
            <p className="text-xs text-gray-500 sm:hidden">
              {translations.find(t => t.code === bibleId)?.description}
            </p>
          )}
        </div>
        {translations.find(t => t.code === bibleId)?.description && (
          <p className="text-xs text-gray-500 mt-2 hidden sm:block">
            {translations.find(t => t.code === bibleId)?.description}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 -mx-4 px-4 sm:mx-0 sm:px-0">
        <nav className="flex gap-1 sm:gap-6 overflow-x-auto scrollbar-hide pb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSelectedTheme(null);
                setSelectedBook(null);
                setSelectedChapter(null);
              }}
              className={`flex items-center gap-1.5 sm:gap-2 py-3 px-3 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 active:text-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden xs:inline sm:inline">{tab.label}</span>
              <span className="xs:hidden sm:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {/* Health Themes Tab */}
        {activeTab === 'themes' && (
          <div className="space-y-6">
            {!selectedTheme ? (
              <>
                {/* Section Header */}
                <div className="text-center mb-6 sm:mb-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Health & Wellness Themes</h2>
                  <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto px-2">
                    Explore biblical wisdom organized by health topics. Each theme contains carefully selected verses to support your well-being.
                  </p>
                </div>

                {/* Theme Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                  {themes.map((theme) => {
                    const isLoading = loadingTheme === theme.key;
                    return (
                      <button
                        key={theme.key}
                        onClick={() => !isLoading && fetchThemeVerses(theme.key)}
                        disabled={isLoading}
                        className={`group relative overflow-hidden rounded-xl sm:rounded-2xl shadow-md hover:shadow-xl active:shadow-lg transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0 text-left h-44 sm:h-64 ${
                          isLoading ? 'cursor-wait' : ''
                        }`}
                      >
                        {/* Background Image */}
                        <div
                          className={`absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110 ${
                            isLoading ? 'scale-105' : ''
                          }`}
                          style={{
                            backgroundImage: `url(${themeImages[theme.key] || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80'})`,
                          }}
                        />

                        {/* Gradient Overlay */}
                        <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10 transition-opacity ${
                          isLoading ? 'opacity-90' : ''
                        }`} />

                        {/* Loading Overlay */}
                        {isLoading && (
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-10">
                            <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                              <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                            </div>
                          </div>
                        )}

                        {/* Content */}
                        <div className="relative h-full flex flex-col justify-end p-3 sm:p-5 text-white">
                          {/* Verse Count Badge */}
                          <div className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-white/20 backdrop-blur-sm px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">
                            <span className="text-[10px] sm:text-xs font-medium text-white flex items-center gap-1">
                              <BookOpen className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                              {theme.verse_count}
                            </span>
                          </div>

                          {/* Theme Name */}
                          <h3 className="text-sm sm:text-xl font-bold mb-1 sm:mb-2 group-hover:text-primary-200 transition-colors line-clamp-2">
                            {theme.name}
                          </h3>

                          {/* Description - Hidden on mobile */}
                          <p className="hidden sm:block text-sm text-gray-200 line-clamp-2 mb-3">
                            {theme.description}
                          </p>

                          {/* Explore Button */}
                          <div className="flex items-center text-xs sm:text-sm font-medium text-primary-300 group-hover:text-white transition-colors">
                            {isLoading ? (
                              <span>Loading...</span>
                            ) : (
                              <>
                                <span className="hidden sm:inline">Explore verses</span>
                                <span className="sm:hidden">View</span>
                                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2 transform group-hover:translate-x-1 transition-transform" />
                              </>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {/* Theme Header Banner */}
                <div className="relative overflow-hidden rounded-xl sm:rounded-2xl h-40 sm:h-56 -mx-4 sm:mx-0">
                  {/* Background Image */}
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                      backgroundImage: `url(${themeImages[selectedTheme.key] || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80'})`,
                    }}
                  />
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-black/80 via-black/60 to-black/40" />

                  {/* Content */}
                  <div className="relative h-full flex flex-col justify-between p-4 sm:p-6">
                    {/* Back Button */}
                    <button
                      onClick={() => setSelectedTheme(null)}
                      className="self-start flex items-center gap-1.5 sm:gap-2 text-white/90 hover:text-white active:text-white transition-colors bg-white/10 hover:bg-white/20 active:bg-white/30 backdrop-blur-sm px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm"
                    >
                      <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 rotate-180" />
                      Back
                    </button>

                    {/* Theme Info */}
                    <div>
                      <h2 className="text-xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">
                        {selectedTheme.theme}
                      </h2>
                      <p className="text-white/80 text-xs sm:text-base max-w-xl line-clamp-2 sm:line-clamp-none">
                        {selectedTheme.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2 sm:mt-3">
                        <span className="bg-white/20 backdrop-blur-sm px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs text-white flex items-center gap-1">
                          <BookOpen className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          {themeVerses.length} verses
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Verses */}
                {loading ? (
                  <div className="space-y-4">
                    {/* Skeleton loaders */}
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="card animate-pulse">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-3">
                            <div className="h-4 bg-gray-200 rounded w-full"></div>
                            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                            <div className="h-4 bg-gray-300 rounded w-32 mt-3"></div>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                            <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <p className="text-center text-sm text-gray-500 py-2">
                      Loading verses...
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {themeVerses.map((verse, index) => {
                      const displayRef = verse.displayRef || verse.reference;
                      return (
                        <div key={index} className="card hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <p className="text-gray-800 leading-relaxed text-sm sm:text-base">"{verse.text}"</p>
                              <p className="text-sm font-semibold text-primary-700 mt-2">
                                — {displayRef} ({verse.translation})
                              </p>
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                              <button
                                onClick={() => copyVerse(displayRef, verse.text)}
                                className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
                                title="Copy verse"
                              >
                                {copiedRef === displayRef ? (
                                  <Check className="w-5 h-5 sm:w-4 sm:h-4 text-green-600" />
                                ) : (
                                  <Copy className="w-5 h-5 sm:w-4 sm:h-4 text-gray-500" />
                                )}
                              </button>
                              <button
                                onClick={() => addToScriptures(displayRef, verse.text, selectedTheme.theme)}
                                className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
                                title="Add to scriptures"
                              >
                                <Plus className="w-5 h-5 sm:w-4 sm:h-4 text-gray-500" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Verse Lookup Tab */}
        {activeTab === 'lookup' && (
          <div className="space-y-4 sm:space-y-6">
            <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={lookupQuery}
                  onChange={(e) => setLookupQuery(e.target.value)}
                  placeholder="Enter reference (e.g., John 3:16)"
                  className="input-field w-full"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !lookupQuery.trim()}
                className="btn-primary flex items-center justify-center gap-2 py-2.5 sm:py-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Look Up
              </button>
            </form>

            {lookupResult && (
              <div className="card bg-blue-50 border-blue-200">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900 mb-2">
                      {lookupResult.reference}
                      <span className="ml-2 text-sm font-normal text-gray-500">
                        ({lookupResult.translation})
                      </span>
                    </h3>
                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {lookupResult.text}
                    </p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => copyVerse(lookupResult.reference, lookupResult.text)}
                      className="p-2 rounded-lg hover:bg-blue-100 transition-colors"
                      title="Copy verse"
                    >
                      {copiedRef === lookupResult.reference ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                    <button
                      onClick={() => addToScriptures(lookupResult.reference, lookupResult.text)}
                      className="p-2 rounded-lg hover:bg-blue-100 transition-colors"
                      title="Add to scriptures"
                    >
                      <Plus className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Reference Examples */}
            <div className="card bg-gray-50">
              <h4 className="font-medium text-gray-900 mb-3">Quick Reference Examples</h4>
              <div className="flex flex-wrap gap-2">
                {['John 3:16', 'Psalm 23:1-3', 'Romans 8:28', 'Philippians 4:13', 'Proverbs 3:5-6'].map((ref) => (
                  <button
                    key={ref}
                    onClick={() => {
                      setLookupQuery(ref);
                    }}
                    className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                  >
                    {ref}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Search Tab */}
        {activeTab === 'search' && (
          <div className="space-y-4 sm:space-y-6">
            {/* Search Mode Toggle */}
            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg w-full sm:w-fit overflow-x-auto">
              <button
                onClick={() => {
                  setSearchMode('bible');
                  setSearchResults([]);
                }}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                  searchMode === 'bible'
                    ? 'bg-white text-primary-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 active:text-gray-900'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1.5 sm:mr-2" />
                Entire Bible
              </button>
              <button
                onClick={() => {
                  setSearchMode('health');
                  setSearchResults([]);
                }}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                  searchMode === 'health'
                    ? 'bg-white text-primary-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 active:text-gray-900'
                }`}
              >
                <HeartPulse className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1.5 sm:mr-2" />
                Health Themes
              </button>
            </div>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    searchMode === 'bible'
                      ? 'Search Bible (e.g., love, faith)'
                      : 'Search health verses (e.g., healing)'
                  }
                  className="input-field w-full"
                />
              </div>
              <button
                type="submit"
                disabled={loading || searchQuery.length < 2}
                className="btn-primary flex items-center justify-center gap-2 py-2.5 sm:py-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Search
              </button>
            </form>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    Found {searchResults.length} verse{searchResults.length !== 1 ? 's' : ''}
                    {searchMode === 'bible' && ' (showing top 50)'}
                  </p>
                  <span className={`px-2 py-1 rounded text-xs ${
                    searchMode === 'bible'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {searchMode === 'bible' ? 'Full Bible Search' : 'Health Themes'}
                  </span>
                </div>

                {searchResults.map((result, index) => (
                  <div
                    key={index}
                    className={`card ${
                      result.fromBibleSearch
                        ? 'bg-white border border-gray-200'
                        : themeBgColors[result.themeColor] || 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        {/* Theme badge for health search results */}
                        {result.theme && (
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs ${themeColors[result.themeColor] || 'bg-gray-100 text-gray-700'}`}>
                              {result.theme}
                            </span>
                          </div>
                        )}

                        {/* Verse text with highlighted search term */}
                        <p className="text-gray-800 leading-relaxed">
                          "{highlightSearchTerm(result.text, searchQuery)}"
                        </p>

                        <p className="text-sm font-semibold text-primary-700 mt-2">
                          — {result.reference}
                          {result.translation && ` (${result.translation})`}
                        </p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => copyVerse(result.reference, result.text)}
                          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                          title="Copy verse"
                        >
                          {copiedRef === result.reference ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-500" />
                          )}
                        </button>
                        <button
                          onClick={() => addToScriptures(result.reference, result.text, result.theme || '')}
                          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                          title="Add to scriptures"
                        >
                          <Plus className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* No Results Message */}
            {searchResults.length === 0 && searchQuery.length >= 2 && !loading && (
              <div className="text-center py-8 text-gray-500">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No results found for "{searchQuery}"</p>
                <p className="text-sm mt-1">Try different keywords or switch search mode</p>
              </div>
            )}

            {/* Quick Search Suggestions */}
            <div className="card bg-gray-50">
              <h4 className="font-medium text-gray-900 mb-3">
                {searchMode === 'bible' ? 'Popular Bible Topics' : 'Popular Health Topics'}
              </h4>
              <div className="flex flex-wrap gap-2">
                {(searchMode === 'bible'
                  ? ['love', 'faith', 'hope', 'salvation', 'forgiveness', 'grace', 'prayer', 'wisdom', 'eternal life', 'Holy Spirit']
                  : ['healing', 'peace', 'strength', 'trust', 'rest', 'heart', 'body', 'faith', 'anxiety', 'fear']
                ).map((term) => (
                  <button
                    key={term}
                    onClick={() => setSearchQuery(term)}
                    className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Browse Tab */}
        {activeTab === 'browse' && (
          <div className="space-y-6">
            {!selectedBook ? (
              <div className="space-y-8">
                {/* Section Header */}
                <div className="text-center">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Browse the Bible</h2>
                  <p className="text-sm text-gray-500">Select a book to start reading</p>
                </div>

                {/* Old Testament */}
                <div className="relative">
                  {/* Section Header */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                        <BookOpen className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">Old Testament</h3>
                        <p className="text-xs text-gray-500">{books.old_testament.length} books</p>
                      </div>
                    </div>
                    <div className="flex-1 h-px bg-gradient-to-r from-amber-200 to-transparent" />
                  </div>

                  {/* Books Grid */}
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                    {books.old_testament.map((book, index) => (
                      <button
                        key={book.id}
                        onClick={() => setSelectedBook(book)}
                        className="group relative bg-white hover:bg-amber-50 border border-gray-200 hover:border-amber-300 rounded-xl p-2 sm:p-3 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                      >
                        <div className="text-[10px] sm:text-xs text-amber-600/60 font-medium mb-0.5">
                          {String(index + 1).padStart(2, '0')}
                        </div>
                        <div className="text-xs sm:text-sm font-medium text-gray-700 group-hover:text-amber-700 truncate">
                          {book.name.replace(/^\d\s/, '').substring(0, 8)}
                        </div>
                        <div className="text-[9px] sm:text-[10px] text-gray-400 mt-0.5">
                          {book.chapters} ch
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Divider */}
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-gray-50 px-4 text-xs text-gray-400 uppercase tracking-wider">Testament Divide</span>
                  </div>
                </div>

                {/* New Testament */}
                <div className="relative">
                  {/* Section Header */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <BookOpen className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">New Testament</h3>
                        <p className="text-xs text-gray-500">{books.new_testament.length} books</p>
                      </div>
                    </div>
                    <div className="flex-1 h-px bg-gradient-to-r from-blue-200 to-transparent" />
                  </div>

                  {/* Books Grid */}
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                    {books.new_testament.map((book, index) => (
                      <button
                        key={book.id}
                        onClick={() => setSelectedBook(book)}
                        className="group relative bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl p-2 sm:p-3 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                      >
                        <div className="text-[10px] sm:text-xs text-blue-600/60 font-medium mb-0.5">
                          {String(index + 1).padStart(2, '0')}
                        </div>
                        <div className="text-xs sm:text-sm font-medium text-gray-700 group-hover:text-blue-700 truncate">
                          {book.name.replace(/^\d\s/, '').substring(0, 8)}
                        </div>
                        <div className="text-[9px] sm:text-[10px] text-gray-400 mt-0.5">
                          {book.chapters} ch
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="flex justify-center gap-8 pt-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">66</div>
                    <div className="text-xs text-gray-500">Books</div>
                  </div>
                  <div className="w-px bg-gray-200" />
                  <div>
                    <div className="text-2xl font-bold text-gray-900">1,189</div>
                    <div className="text-xs text-gray-500">Chapters</div>
                  </div>
                  <div className="w-px bg-gray-200" />
                  <div>
                    <div className="text-2xl font-bold text-gray-900">31,102</div>
                    <div className="text-xs text-gray-500">Verses</div>
                  </div>
                </div>
              </div>
            ) : !selectedChapter ? (
              <div className="space-y-6">
                {/* Book Header */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-6 sm:p-8">
                  {/* Decorative elements */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12" />

                  <div className="relative">
                    <button
                      onClick={() => setSelectedBook(null)}
                      className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-4 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4 rotate-180" />
                      All Books
                    </button>

                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">{selectedBook.name}</h2>
                    <p className="text-white/60 text-sm">
                      {selectedBook.chapters} chapters
                    </p>
                  </div>
                </div>

                {/* Chapter Grid */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-4 text-sm sm:text-base">Select a Chapter</h3>
                  <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
                    {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map((chapter) => (
                      <button
                        key={chapter}
                        onClick={() => handleChapterSelect(chapter)}
                        className="group relative aspect-square flex items-center justify-center bg-white border border-gray-200 hover:border-primary-400 hover:bg-primary-50 rounded-xl transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                      >
                        <span className="text-sm sm:text-base font-semibold text-gray-600 group-hover:text-primary-700">
                          {chapter}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                  <button
                    onClick={() => setSelectedChapter(null)}
                    className="text-xs sm:text-sm text-primary-600 hover:text-primary-700 active:text-primary-800 flex items-center gap-1 bg-primary-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full"
                  >
                    <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 rotate-180" />
                    {selectedBook.name}
                  </button>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                    Chapter {selectedChapter}
                  </h2>
                </div>

                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                ) : chapterContent ? (
                  <div className="card p-3 sm:p-6">
                    {/* Chapter Header */}
                    <div className="flex items-start justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-gray-200">
                      <div>
                        <h3 className="font-semibold text-lg sm:text-xl text-gray-900">
                          {chapterContent.reference}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                          {chapterContent.translation} • {chapterContent.verseCount} verses
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          const fullText = chapterContent.verses
                            ?.map(v => `${v.number}. ${v.segments.map(s => s.text).join(' ')}`)
                            .join('\n') || '';
                          copyVerse(chapterContent.reference, fullText);
                        }}
                        className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
                        title="Copy chapter"
                      >
                        {copiedRef === chapterContent.reference ? (
                          <Check className="w-5 h-5 sm:w-4 sm:h-4 text-green-600" />
                        ) : (
                          <Copy className="w-5 h-5 sm:w-4 sm:h-4 text-gray-500" />
                        )}
                      </button>
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-4 mb-3 sm:mb-4 text-[10px] sm:text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-red-100 border border-red-200"></span>
                        Words of Jesus
                      </span>
                    </div>

                    {/* Verses */}
                    <div className="space-y-1 sm:space-y-3">
                      {chapterContent.verses?.map((verse) => (
                        <div
                          key={verse.number}
                          className={`group flex gap-2 sm:gap-3 p-2 -mx-2 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors ${
                            verse.hasWordsOfJesus ? 'bg-red-50/50' : ''
                          }`}
                        >
                          {/* Verse Number */}
                          <span className="flex-shrink-0 w-6 sm:w-8 text-right font-bold text-primary-600 text-xs sm:text-sm pt-0.5">
                            {verse.number}
                          </span>

                          {/* Verse Content */}
                          <div className="flex-1 leading-relaxed text-gray-800 text-sm sm:text-base">
                            {verse.segments.map((segment, idx) => (
                              <span
                                key={idx}
                                className={
                                  segment.type === 'jesus'
                                    ? 'text-red-700 font-medium'
                                    : ''
                                }
                              >
                                {segment.text}{' '}
                              </span>
                            ))}
                          </div>

                          {/* Copy Button - Always visible on mobile, hover on desktop */}
                          <button
                            onClick={() => {
                              const verseText = verse.segments.map(s => s.text).join(' ');
                              const verseRef = `${chapterContent.reference}:${verse.number}`;
                              copyVerse(verseRef, verseText);
                            }}
                            className="flex-shrink-0 p-1.5 sm:p-1 rounded opacity-60 sm:opacity-0 group-hover:opacity-100 hover:bg-gray-200 active:bg-gray-300 transition-all"
                            title="Copy verse"
                          >
                            {copiedRef === `${chapterContent.reference}:${verse.number}` ? (
                              <Check className="w-4 h-4 sm:w-3 sm:h-3 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4 sm:w-3 sm:h-3 text-gray-400" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* Chapter Navigation */}
                <div className="flex justify-between gap-3">
                  <button
                    onClick={() => handleChapterSelect(selectedChapter - 1)}
                    disabled={selectedChapter <= 1}
                    className="btn-outline flex-1 sm:flex-none disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base py-2.5 sm:py-2"
                  >
                    <ChevronRight className="w-4 h-4 rotate-180 inline mr-1 sm:hidden" />
                    <span className="hidden sm:inline">Previous Chapter</span>
                    <span className="sm:hidden">Previous</span>
                  </button>
                  <button
                    onClick={() => handleChapterSelect(selectedChapter + 1)}
                    disabled={selectedChapter >= selectedBook.chapters}
                    className="btn-outline flex-1 sm:flex-none disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base py-2.5 sm:py-2"
                  >
                    <span className="hidden sm:inline">Next Chapter</span>
                    <span className="sm:hidden">Next</span>
                    <ChevronRight className="w-4 h-4 inline ml-1 sm:hidden" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BibleExplorer;
