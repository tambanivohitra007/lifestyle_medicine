import { useState, useEffect } from 'react';
import {
  Search,
  BookOpen,
  HeartPulse,
  Church,
  Apple,
  Moon,
  CloudSun,
  HandHeart,
  Dumbbell,
  Scale,
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

// Theme icon mapping
const themeIcons = {
  'heart-pulse': HeartPulse,
  'church': Church,
  'apple': Apple,
  'moon': Moon,
  'cloud-sun': CloudSun,
  'hand-heart': HandHeart,
  'dumbbell': Dumbbell,
  'scale': Scale,
};

// Theme color classes
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

  // Fetch initial data
  useEffect(() => {
    fetchTranslations();
    fetchThemes();
    fetchDailyVerse();
    fetchBooks();
  }, []);

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
    setLoading(true);
    try {
      const response = await api.get(apiEndpoints.bibleHealthTheme(themeKey), {
        params: { bibleId },
      });
      setThemeVerses(response.data.data?.verses || []);
      setSelectedTheme(response.data.data);
    } catch (error) {
      console.error('Error fetching theme verses:', error);
      toast.error('Failed to load verses');
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
      const response = await api.get(apiEndpoints.bibleSearchHealth, {
        params: { query: searchQuery, bibleId },
      });
      setSearchResults(response.data.data?.results || []);
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

      {/* Daily Verse Card */}
      {dailyVerse && (
        <div className={`card border-l-4 border-l-primary-500 ${themeBgColors[dailyVerse.themeColor] || 'bg-primary-50'}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary-600" />
                <span className="text-xs font-semibold text-primary-700 uppercase tracking-wide">
                  Verse of the Day
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${themeColors[dailyVerse.themeColor] || 'bg-gray-100 text-gray-700'}`}>
                  {dailyVerse.theme}
                </span>
              </div>
              <p className="text-gray-800 italic leading-relaxed">"{dailyVerse.text}"</p>
              <p className="text-sm font-semibold text-gray-900 mt-2">
                — {dailyVerse.reference} ({dailyVerse.translation})
              </p>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => copyVerse(dailyVerse.reference, dailyVerse.text)}
                className="p-2 rounded-lg hover:bg-white/50 transition-colors"
                title="Copy verse"
              >
                {copiedRef === dailyVerse.reference ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-500" />
                )}
              </button>
              <button
                onClick={() => addToScriptures(dailyVerse.reference, dailyVerse.text, dailyVerse.theme)}
                className="p-2 rounded-lg hover:bg-white/50 transition-colors"
                title="Add to scriptures"
              >
                <Plus className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Translation Selector */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">Translation:</label>
        <select
          value={bibleId}
          onChange={(e) => setBibleId(e.target.value)}
          className="input-field w-auto"
        >
          {translations.map((t) => (
            <option key={t.code} value={t.code}>
              {t.abbreviation} - {t.name}
            </option>
          ))}
        </select>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4 sm:gap-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSelectedTheme(null);
                setSelectedBook(null);
                setSelectedChapter(null);
              }}
              className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {themes.map((theme) => {
                  const Icon = themeIcons[theme.icon] || HeartPulse;
                  return (
                    <button
                      key={theme.key}
                      onClick={() => fetchThemeVerses(theme.key)}
                      className={`card hover:shadow-lg transition-all text-left ${themeBgColors[theme.color] || 'bg-gray-50'}`}
                    >
                      <div className={`inline-flex p-3 rounded-lg ${themeColors[theme.color] || 'bg-gray-100 text-gray-700'} mb-3`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">{theme.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{theme.description}</p>
                      <div className="flex items-center text-xs text-gray-500">
                        <BookOpen className="w-3 h-3 mr-1" />
                        {theme.verse_count} verses
                        <ArrowRight className="w-3 h-3 ml-auto" />
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Theme Header */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setSelectedTheme(null)}
                    className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                  >
                    <ChevronRight className="w-4 h-4 rotate-180" />
                    All Themes
                  </button>
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${themeColors[selectedTheme.color] || 'bg-gray-100'}`}>
                    {(() => {
                      const Icon = themeIcons[selectedTheme.icon] || HeartPulse;
                      return <Icon className="w-4 h-4" />;
                    })()}
                    <span className="font-medium">{selectedTheme.theme}</span>
                  </div>
                </div>

                {/* Theme Description */}
                <p className="text-gray-600">{selectedTheme.description}</p>

                {/* Verses */}
                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {themeVerses.map((verse, index) => {
                      const displayRef = verse.displayRef || verse.reference;
                      return (
                        <div key={index} className="card hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <p className="text-gray-800 leading-relaxed">"{verse.text}"</p>
                              <p className="text-sm font-semibold text-primary-700 mt-2">
                                — {displayRef} ({verse.translation})
                              </p>
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                              <button
                                onClick={() => copyVerse(displayRef, verse.text)}
                                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                title="Copy verse"
                              >
                                {copiedRef === displayRef ? (
                                  <Check className="w-4 h-4 text-green-600" />
                                ) : (
                                  <Copy className="w-4 h-4 text-gray-500" />
                                )}
                              </button>
                              <button
                                onClick={() => addToScriptures(displayRef, verse.text, selectedTheme.theme)}
                                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                title="Add to scriptures"
                              >
                                <Plus className="w-4 h-4 text-gray-500" />
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
          <div className="space-y-6">
            <form onSubmit={handleLookup} className="flex gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={lookupQuery}
                  onChange={(e) => setLookupQuery(e.target.value)}
                  placeholder="Enter reference (e.g., John 3:16, Psalm 23:1-3)"
                  className="input-field w-full"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !lookupQuery.trim()}
                className="btn-primary flex items-center gap-2"
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
          <div className="space-y-6">
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search health-themed verses (e.g., healing, peace, strength)"
                  className="input-field w-full"
                />
              </div>
              <button
                type="submit"
                disabled={loading || searchQuery.length < 2}
                className="btn-primary flex items-center gap-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Search
              </button>
            </form>

            {searchResults.length > 0 && (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  Found {searchResults.length} verse{searchResults.length !== 1 ? 's' : ''}
                </p>
                {searchResults.map((result, index) => (
                  <div key={index} className={`card ${themeBgColors[result.themeColor] || 'bg-gray-50'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${themeColors[result.themeColor] || 'bg-gray-100 text-gray-700'}`}>
                            {result.theme}
                          </span>
                        </div>
                        <p className="text-gray-800 leading-relaxed">"{result.text}"</p>
                        <p className="text-sm font-semibold text-gray-900 mt-2">
                          — {result.reference} ({result.translation})
                        </p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => copyVerse(result.reference, result.text)}
                          className="p-2 rounded-lg hover:bg-white/50 transition-colors"
                          title="Copy verse"
                        >
                          {copiedRef === result.reference ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-500" />
                          )}
                        </button>
                        <button
                          onClick={() => addToScriptures(result.reference, result.text, result.theme)}
                          className="p-2 rounded-lg hover:bg-white/50 transition-colors"
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

            {/* Popular Search Terms */}
            <div className="card bg-gray-50">
              <h4 className="font-medium text-gray-900 mb-3">Popular Health Topics</h4>
              <div className="flex flex-wrap gap-2">
                {['healing', 'peace', 'strength', 'trust', 'rest', 'heart', 'body', 'faith'].map((term) => (
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Old Testament */}
                <div className="card">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-amber-600" />
                    Old Testament
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {books.old_testament.map((book) => (
                      <button
                        key={book.id}
                        onClick={() => setSelectedBook(book)}
                        className="px-3 py-2 text-sm text-left bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors border border-amber-200"
                      >
                        {book.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* New Testament */}
                <div className="card">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    New Testament
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {books.new_testament.map((book) => (
                      <button
                        key={book.id}
                        onClick={() => setSelectedBook(book)}
                        className="px-3 py-2 text-sm text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                      >
                        {book.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : !selectedChapter ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setSelectedBook(null)}
                    className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                  >
                    <ChevronRight className="w-4 h-4 rotate-180" />
                    All Books
                  </button>
                  <h2 className="text-xl font-semibold text-gray-900">{selectedBook.name}</h2>
                </div>

                <div className="card">
                  <h3 className="font-medium text-gray-700 mb-4">Select Chapter</h3>
                  <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
                    {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map((chapter) => (
                      <button
                        key={chapter}
                        onClick={() => handleChapterSelect(chapter)}
                        className="px-3 py-2 text-sm bg-gray-100 hover:bg-primary-100 hover:text-primary-700 rounded-lg transition-colors"
                      >
                        {chapter}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setSelectedChapter(null)}
                    className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                  >
                    <ChevronRight className="w-4 h-4 rotate-180" />
                    {selectedBook.name}
                  </button>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {selectedBook.name} {selectedChapter}
                  </h2>
                </div>

                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                ) : chapterContent ? (
                  <div className="card">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <h3 className="font-semibold text-lg text-gray-900">
                        {chapterContent.reference}
                        <span className="ml-2 text-sm font-normal text-gray-500">
                          ({chapterContent.translation})
                        </span>
                      </h3>
                      <button
                        onClick={() => copyVerse(chapterContent.reference, chapterContent.text)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        title="Copy chapter"
                      >
                        {copiedRef === chapterContent.reference ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-500" />
                        )}
                      </button>
                    </div>
                    <div className="prose prose-sm max-w-none">
                      <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                        {chapterContent.text}
                      </p>
                    </div>
                  </div>
                ) : null}

                {/* Chapter Navigation */}
                <div className="flex justify-between">
                  <button
                    onClick={() => handleChapterSelect(selectedChapter - 1)}
                    disabled={selectedChapter <= 1}
                    className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous Chapter
                  </button>
                  <button
                    onClick={() => handleChapterSelect(selectedChapter + 1)}
                    disabled={selectedChapter >= selectedBook.chapters}
                    className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next Chapter
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
