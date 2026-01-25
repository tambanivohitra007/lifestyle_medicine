<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class BibleApiService
{
    protected string $baseUrl = 'https://api.scripture.api.bible/v1';
    protected ?string $apiKey = null;
    protected ?string $defaultBibleId = null;

    // Health-related themes with pre-selected verse IDs (API.Bible format)
    protected array $healthThemes = [
        'healing' => [
            'name' => 'Healing & Restoration',
            'description' => 'Verses about God\'s healing power and restoration',
            'icon' => 'heart-pulse',
            'color' => 'rose',
            'verses' => [
                ['id' => 'JER.17.14', 'ref' => 'Jeremiah 17:14'],
                ['id' => 'EXO.15.26', 'ref' => 'Exodus 15:26'],
                ['id' => 'PSA.103.2-PSA.103.3', 'ref' => 'Psalm 103:2-3'],
                ['id' => 'ISA.53.5', 'ref' => 'Isaiah 53:5'],
                ['id' => 'JAS.5.14-JAS.5.15', 'ref' => 'James 5:14-15'],
                ['id' => 'PRO.4.20-PRO.4.22', 'ref' => 'Proverbs 4:20-22'],
                ['id' => '3JN.1.2', 'ref' => '3 John 1:2'],
                ['id' => 'PSA.147.3', 'ref' => 'Psalm 147:3'],
            ]
        ],
        'body_temple' => [
            'name' => 'Body as Temple',
            'description' => 'Honoring God with our bodies',
            'icon' => 'church',
            'color' => 'purple',
            'verses' => [
                ['id' => '1CO.6.19-1CO.6.20', 'ref' => '1 Corinthians 6:19-20'],
                ['id' => '1CO.3.16-1CO.3.17', 'ref' => '1 Corinthians 3:16-17'],
                ['id' => 'ROM.12.1', 'ref' => 'Romans 12:1'],
                ['id' => '2CO.6.16', 'ref' => '2 Corinthians 6:16'],
                ['id' => '1CO.10.31', 'ref' => '1 Corinthians 10:31'],
            ]
        ],
        'diet_nutrition' => [
            'name' => 'Diet & Nutrition',
            'description' => 'Biblical guidance on food and eating',
            'icon' => 'apple',
            'color' => 'green',
            'verses' => [
                ['id' => 'GEN.1.29', 'ref' => 'Genesis 1:29'],
                ['id' => 'GEN.9.3', 'ref' => 'Genesis 9:3'],
                ['id' => 'DAN.1.12-DAN.1.15', 'ref' => 'Daniel 1:12-15'],
                ['id' => 'PRO.23.20-PRO.23.21', 'ref' => 'Proverbs 23:20-21'],
                ['id' => 'ECC.10.17', 'ref' => 'Ecclesiastes 10:17'],
                ['id' => 'ISA.55.2', 'ref' => 'Isaiah 55:2'],
            ]
        ],
        'rest_sabbath' => [
            'name' => 'Rest & Sabbath',
            'description' => 'The blessing of rest and Sabbath keeping',
            'icon' => 'moon',
            'color' => 'indigo',
            'verses' => [
                ['id' => 'EXO.20.8-EXO.20.11', 'ref' => 'Exodus 20:8-11'],
                ['id' => 'MRK.2.27', 'ref' => 'Mark 2:27'],
                ['id' => 'MAT.11.28-MAT.11.30', 'ref' => 'Matthew 11:28-30'],
                ['id' => 'PSA.23.2-PSA.23.3', 'ref' => 'Psalm 23:2-3'],
                ['id' => 'HEB.4.9-HEB.4.11', 'ref' => 'Hebrews 4:9-11'],
                ['id' => 'ISA.58.13-ISA.58.14', 'ref' => 'Isaiah 58:13-14'],
            ]
        ],
        'peace_anxiety' => [
            'name' => 'Peace & Anxiety',
            'description' => 'Finding peace and overcoming worry',
            'icon' => 'cloud-sun',
            'color' => 'sky',
            'verses' => [
                ['id' => 'PHP.4.6-PHP.4.7', 'ref' => 'Philippians 4:6-7'],
                ['id' => 'ISA.26.3', 'ref' => 'Isaiah 26:3'],
                ['id' => 'JHN.14.27', 'ref' => 'John 14:27'],
                ['id' => 'PSA.46.10', 'ref' => 'Psalm 46:10'],
                ['id' => '1PE.5.7', 'ref' => '1 Peter 5:7'],
                ['id' => 'MAT.6.25-MAT.6.27', 'ref' => 'Matthew 6:25-27'],
                ['id' => 'PRO.3.5-PRO.3.6', 'ref' => 'Proverbs 3:5-6'],
            ]
        ],
        'trust_faith' => [
            'name' => 'Trust & Faith',
            'description' => 'Trusting God in health challenges',
            'icon' => 'hand-heart',
            'color' => 'amber',
            'verses' => [
                ['id' => 'PRO.3.5-PRO.3.6', 'ref' => 'Proverbs 3:5-6'],
                ['id' => 'PSA.37.5', 'ref' => 'Psalm 37:5'],
                ['id' => 'ISA.41.10', 'ref' => 'Isaiah 41:10'],
                ['id' => 'ROM.8.28', 'ref' => 'Romans 8:28'],
                ['id' => 'HEB.11.1', 'ref' => 'Hebrews 11:1'],
                ['id' => 'MRK.11.24', 'ref' => 'Mark 11:24'],
            ]
        ],
        'strength_endurance' => [
            'name' => 'Strength & Endurance',
            'description' => 'God as our source of strength',
            'icon' => 'dumbbell',
            'color' => 'orange',
            'verses' => [
                ['id' => 'ISA.40.31', 'ref' => 'Isaiah 40:31'],
                ['id' => 'PHP.4.13', 'ref' => 'Philippians 4:13'],
                ['id' => 'PSA.28.7', 'ref' => 'Psalm 28:7'],
                ['id' => 'NEH.8.10', 'ref' => 'Nehemiah 8:10'],
                ['id' => '2CO.12.9-2CO.12.10', 'ref' => '2 Corinthians 12:9-10'],
                ['id' => 'DEU.31.6', 'ref' => 'Deuteronomy 31:6'],
            ]
        ],
        'temperance' => [
            'name' => 'Temperance & Self-Control',
            'description' => 'Biblical guidance on moderation',
            'icon' => 'scale',
            'color' => 'teal',
            'verses' => [
                ['id' => 'GAL.5.22-GAL.5.23', 'ref' => 'Galatians 5:22-23'],
                ['id' => '1CO.9.25-1CO.9.27', 'ref' => '1 Corinthians 9:25-27'],
                ['id' => 'PRO.25.28', 'ref' => 'Proverbs 25:28'],
                ['id' => '2PE.1.5-2PE.1.6', 'ref' => '2 Peter 1:5-6'],
                ['id' => 'TIT.2.11-TIT.2.12', 'ref' => 'Titus 2:11-12'],
                ['id' => 'PRO.23.1-PRO.23.3', 'ref' => 'Proverbs 23:1-3'],
            ]
        ],
    ];

    // Bible books for browsing
    protected array $bibleBooks = [
        'old_testament' => [
            ['name' => 'Genesis', 'id' => 'GEN', 'chapters' => 50],
            ['name' => 'Exodus', 'id' => 'EXO', 'chapters' => 40],
            ['name' => 'Leviticus', 'id' => 'LEV', 'chapters' => 27],
            ['name' => 'Numbers', 'id' => 'NUM', 'chapters' => 36],
            ['name' => 'Deuteronomy', 'id' => 'DEU', 'chapters' => 34],
            ['name' => 'Joshua', 'id' => 'JOS', 'chapters' => 24],
            ['name' => 'Judges', 'id' => 'JDG', 'chapters' => 21],
            ['name' => 'Ruth', 'id' => 'RUT', 'chapters' => 4],
            ['name' => '1 Samuel', 'id' => '1SA', 'chapters' => 31],
            ['name' => '2 Samuel', 'id' => '2SA', 'chapters' => 24],
            ['name' => '1 Kings', 'id' => '1KI', 'chapters' => 22],
            ['name' => '2 Kings', 'id' => '2KI', 'chapters' => 25],
            ['name' => '1 Chronicles', 'id' => '1CH', 'chapters' => 29],
            ['name' => '2 Chronicles', 'id' => '2CH', 'chapters' => 36],
            ['name' => 'Ezra', 'id' => 'EZR', 'chapters' => 10],
            ['name' => 'Nehemiah', 'id' => 'NEH', 'chapters' => 13],
            ['name' => 'Esther', 'id' => 'EST', 'chapters' => 10],
            ['name' => 'Job', 'id' => 'JOB', 'chapters' => 42],
            ['name' => 'Psalms', 'id' => 'PSA', 'chapters' => 150],
            ['name' => 'Proverbs', 'id' => 'PRO', 'chapters' => 31],
            ['name' => 'Ecclesiastes', 'id' => 'ECC', 'chapters' => 12],
            ['name' => 'Song of Solomon', 'id' => 'SNG', 'chapters' => 8],
            ['name' => 'Isaiah', 'id' => 'ISA', 'chapters' => 66],
            ['name' => 'Jeremiah', 'id' => 'JER', 'chapters' => 52],
            ['name' => 'Lamentations', 'id' => 'LAM', 'chapters' => 5],
            ['name' => 'Ezekiel', 'id' => 'EZK', 'chapters' => 48],
            ['name' => 'Daniel', 'id' => 'DAN', 'chapters' => 12],
            ['name' => 'Hosea', 'id' => 'HOS', 'chapters' => 14],
            ['name' => 'Joel', 'id' => 'JOL', 'chapters' => 3],
            ['name' => 'Amos', 'id' => 'AMO', 'chapters' => 9],
            ['name' => 'Obadiah', 'id' => 'OBA', 'chapters' => 1],
            ['name' => 'Jonah', 'id' => 'JON', 'chapters' => 4],
            ['name' => 'Micah', 'id' => 'MIC', 'chapters' => 7],
            ['name' => 'Nahum', 'id' => 'NAM', 'chapters' => 3],
            ['name' => 'Habakkuk', 'id' => 'HAB', 'chapters' => 3],
            ['name' => 'Zephaniah', 'id' => 'ZEP', 'chapters' => 3],
            ['name' => 'Haggai', 'id' => 'HAG', 'chapters' => 2],
            ['name' => 'Zechariah', 'id' => 'ZEC', 'chapters' => 14],
            ['name' => 'Malachi', 'id' => 'MAL', 'chapters' => 4],
        ],
        'new_testament' => [
            ['name' => 'Matthew', 'id' => 'MAT', 'chapters' => 28],
            ['name' => 'Mark', 'id' => 'MRK', 'chapters' => 16],
            ['name' => 'Luke', 'id' => 'LUK', 'chapters' => 24],
            ['name' => 'John', 'id' => 'JHN', 'chapters' => 21],
            ['name' => 'Acts', 'id' => 'ACT', 'chapters' => 28],
            ['name' => 'Romans', 'id' => 'ROM', 'chapters' => 16],
            ['name' => '1 Corinthians', 'id' => '1CO', 'chapters' => 16],
            ['name' => '2 Corinthians', 'id' => '2CO', 'chapters' => 13],
            ['name' => 'Galatians', 'id' => 'GAL', 'chapters' => 6],
            ['name' => 'Ephesians', 'id' => 'EPH', 'chapters' => 6],
            ['name' => 'Philippians', 'id' => 'PHP', 'chapters' => 4],
            ['name' => 'Colossians', 'id' => 'COL', 'chapters' => 4],
            ['name' => '1 Thessalonians', 'id' => '1TH', 'chapters' => 5],
            ['name' => '2 Thessalonians', 'id' => '2TH', 'chapters' => 3],
            ['name' => '1 Timothy', 'id' => '1TI', 'chapters' => 6],
            ['name' => '2 Timothy', 'id' => '2TI', 'chapters' => 4],
            ['name' => 'Titus', 'id' => 'TIT', 'chapters' => 3],
            ['name' => 'Philemon', 'id' => 'PHM', 'chapters' => 1],
            ['name' => 'Hebrews', 'id' => 'HEB', 'chapters' => 13],
            ['name' => 'James', 'id' => 'JAS', 'chapters' => 5],
            ['name' => '1 Peter', 'id' => '1PE', 'chapters' => 5],
            ['name' => '2 Peter', 'id' => '2PE', 'chapters' => 3],
            ['name' => '1 John', 'id' => '1JN', 'chapters' => 5],
            ['name' => '2 John', 'id' => '2JN', 'chapters' => 1],
            ['name' => '3 John', 'id' => '3JN', 'chapters' => 1],
            ['name' => 'Jude', 'id' => 'JUD', 'chapters' => 1],
            ['name' => 'Revelation', 'id' => 'REV', 'chapters' => 22],
        ]
    ];

    public function __construct()
    {
        $this->apiKey = config('services.bible_api.api_key');
        $this->defaultBibleId = config('services.bible_api.default_bible_id', 'de4e12af7f28f599-02');
    }

    /**
     * Check if the API is configured.
     */
    public function isConfigured(): bool
    {
        return $this->apiKey !== null && $this->apiKey !== '';
    }

    /**
     * Make an API request.
     */
    protected function request(string $endpoint, array $params = []): array
    {
        if (!$this->isConfigured()) {
            return ['error' => 'Bible API is not configured. Please add BIBLE_API_KEY to your .env file.'];
        }

        try {
            $httpClient = Http::withHeaders([
                'api-key' => $this->apiKey,
            ])->timeout(15);

            // Disable SSL verification in local development (Windows SSL cert issue)
            if (app()->environment('local')) {
                $httpClient = $httpClient->withoutVerifying();
            }

            $response = $httpClient->get($this->baseUrl . $endpoint, $params);

            if ($response->successful()) {
                return $response->json();
            }

            Log::error('Bible API error: ' . $response->body());
            return ['error' => 'Failed to fetch data from Bible API.'];
        } catch (\Exception $e) {
            Log::error('Bible API exception: ' . $e->getMessage());
            return ['error' => 'Failed to connect to Bible API.'];
        }
    }

    /**
     * Get available Bible versions.
     */
    public function getBibles(): array
    {
        $cacheKey = 'bible.versions';

        return Cache::remember($cacheKey, 86400, function () {
            $result = $this->request('/bibles', ['language' => 'eng']);

            if (isset($result['error'])) {
                return $result;
            }

            // Filter to most common English versions
            $commonVersions = ['de4e12af7f28f599-02', '01b29f4b342acc35-01', '9879dbb7cfe39e4d-04', 'f72b840c855f362c-04'];
            $bibles = collect($result['data'] ?? [])->filter(function ($bible) use ($commonVersions) {
                return in_array($bible['id'], $commonVersions) || str_contains(strtolower($bible['name']), 'king james');
            })->values()->all();

            return ['data' => $bibles];
        });
    }

    /**
     * Look up a verse or passage.
     */
    public function lookup(string $passageId, ?string $bibleId = null): array
    {
        $bibleId = $bibleId ?? $this->defaultBibleId;
        $cacheKey = "bible.passage.{$bibleId}." . md5($passageId);

        return Cache::remember($cacheKey, 86400, function () use ($passageId, $bibleId) {
            // Check if it's a single verse or passage
            $endpoint = str_contains($passageId, '-')
                ? "/bibles/{$bibleId}/passages/{$passageId}"
                : "/bibles/{$bibleId}/verses/{$passageId}";

            // API.Bible doesn't support query params for verses endpoint
            $result = $this->request($endpoint);

            if (isset($result['error'])) {
                return ['success' => false, 'error' => $result['error']];
            }

            $data = $result['data'] ?? [];

            // Strip HTML tags and clean up the text
            $text = $data['content'] ?? '';
            $text = preg_replace('/<[^>]*>/', ' ', $text); // Remove HTML tags
            $text = preg_replace('/\s+/', ' ', $text); // Normalize whitespace
            $text = trim($text);

            return [
                'success' => true,
                'reference' => $data['reference'] ?? $passageId,
                'text' => $text,
                'translation' => $this->getTranslationAbbreviation($bibleId),
                'bibleId' => $bibleId,
            ];
        });
    }

    /**
     * Search for verses.
     */
    public function search(string $query, ?string $bibleId = null, int $limit = 20): array
    {
        $bibleId = $bibleId ?? $this->defaultBibleId;
        $cacheKey = "bible.search.{$bibleId}." . md5($query) . ".{$limit}";

        return Cache::remember($cacheKey, 3600, function () use ($query, $bibleId, $limit) {
            $result = $this->request("/bibles/{$bibleId}/search", [
                'query' => $query,
                'limit' => $limit,
                'sort' => 'relevance',
            ]);

            if (isset($result['error'])) {
                return ['success' => false, 'error' => $result['error']];
            }

            $verses = [];
            foreach ($result['data']['verses'] ?? [] as $verse) {
                $verses[] = [
                    'reference' => $verse['reference'] ?? '',
                    'text' => trim(strip_tags($verse['text'] ?? '')),
                    'verseId' => $verse['id'] ?? '',
                ];
            }

            return [
                'success' => true,
                'query' => $query,
                'total' => $result['data']['total'] ?? count($verses),
                'results' => $verses,
            ];
        });
    }

    /**
     * Get a chapter.
     */
    public function getChapter(string $bookId, int $chapter, ?string $bibleId = null): array
    {
        $bibleId = $bibleId ?? $this->defaultBibleId;
        $chapterId = "{$bookId}.{$chapter}";
        $cacheKey = "bible.chapter.{$bibleId}.{$chapterId}";

        return Cache::remember($cacheKey, 86400, function () use ($chapterId, $bibleId) {
            $result = $this->request("/bibles/{$bibleId}/chapters/{$chapterId}");

            if (isset($result['error'])) {
                return ['success' => false, 'error' => $result['error']];
            }

            $data = $result['data'] ?? [];

            // Strip HTML tags and clean up the text
            $text = $data['content'] ?? '';
            $text = preg_replace('/<[^>]*>/', ' ', $text);
            $text = preg_replace('/\s+/', ' ', $text);
            $text = trim($text);

            return [
                'success' => true,
                'reference' => $data['reference'] ?? $chapterId,
                'text' => $text,
                'translation' => $this->getTranslationAbbreviation($bibleId),
                'bibleId' => $bibleId,
            ];
        });
    }

    /**
     * Get all health themes.
     */
    public function getHealthThemes(): array
    {
        return array_map(function ($key, $theme) {
            return [
                'key' => $key,
                'name' => $theme['name'],
                'description' => $theme['description'],
                'icon' => $theme['icon'],
                'color' => $theme['color'],
                'verse_count' => count($theme['verses']),
            ];
        }, array_keys($this->healthThemes), array_values($this->healthThemes));
    }

    /**
     * Get verses for a specific health theme.
     */
    public function getThemeVerses(string $themeKey, ?string $bibleId = null): array
    {
        if (!isset($this->healthThemes[$themeKey])) {
            return ['error' => 'Theme not found'];
        }

        $theme = $this->healthThemes[$themeKey];
        $verses = [];

        foreach ($theme['verses'] as $verseInfo) {
            $result = $this->lookup($verseInfo['id'], $bibleId);
            if ($result['success']) {
                $result['displayRef'] = $verseInfo['ref'];
                $verses[] = $result;
            }
        }

        return [
            'key' => $themeKey,
            'theme' => $theme['name'],
            'description' => $theme['description'],
            'icon' => $theme['icon'],
            'color' => $theme['color'],
            'verses' => $verses,
        ];
    }

    /**
     * Get list of Bible books for browsing.
     */
    public function getBooks(): array
    {
        return $this->bibleBooks;
    }

    /**
     * Get available translations.
     */
    public function getTranslations(): array
    {
        // Return a curated list of popular translations
        return [
            ['code' => 'de4e12af7f28f599-02', 'name' => 'King James Version', 'abbreviation' => 'KJV', 'description' => 'Classic English translation from 1611'],
            ['code' => '06125adad2d5898a-01', 'name' => 'American Standard Version', 'abbreviation' => 'ASV', 'description' => 'Literal English translation from 1901'],
            ['code' => 'bba9f40183526463-01', 'name' => 'Berean Standard Bible', 'abbreviation' => 'BSB', 'description' => 'Modern literal translation'],
            ['code' => '9879dbb7cfe39e4d-04', 'name' => 'World English Bible', 'abbreviation' => 'WEB', 'description' => 'Modern public domain translation'],
            ['code' => '01b29f4b342acc35-01', 'name' => 'Literal Standard Version', 'abbreviation' => 'LSV', 'description' => 'Modern literal translation'],
            ['code' => '65eec8e0b60e656b-01', 'name' => 'Free Bible Version', 'abbreviation' => 'FBV', 'description' => 'Clear and accurate modern translation'],
            ['code' => 'c315fa9f71d4af3a-01', 'name' => 'Geneva Bible', 'abbreviation' => 'GNV', 'description' => 'Historic Protestant Bible from 1599'],
            ['code' => '179568874c45066f-01', 'name' => 'Douay-Rheims', 'abbreviation' => 'DRA', 'description' => 'Catholic translation from Latin Vulgate'],
            ['code' => '66c22495370cdfc0-01', 'name' => 'Translation for Translators', 'abbreviation' => 'T4T', 'description' => 'Meaning-based translation'],
            ['code' => 'f72b840c855f362c-04', 'name' => 'World Messianic Bible', 'abbreviation' => 'WMB', 'description' => 'Messianic Jewish perspective'],
        ];
    }

    /**
     * Get translation abbreviation by Bible ID.
     */
    protected function getTranslationAbbreviation(string $bibleId): string
    {
        $translations = $this->getTranslations();
        foreach ($translations as $translation) {
            if ($translation['code'] === $bibleId) {
                return $translation['abbreviation'];
            }
        }
        return 'KJV'; // Default fallback
    }

    /**
     * Search health-themed verses by keyword.
     */
    public function searchHealthVerses(string $query, ?string $bibleId = null): array
    {
        $query = strtolower(trim($query));
        if (strlen($query) < 2) {
            return ['error' => 'Search query must be at least 2 characters'];
        }

        $results = [];

        // Search through all theme verses
        foreach ($this->healthThemes as $themeKey => $theme) {
            foreach ($theme['verses'] as $verseInfo) {
                $verse = $this->lookup($verseInfo['id'], $bibleId);
                if ($verse['success']) {
                    $text = strtolower($verse['text']);
                    $refLower = strtolower($verseInfo['ref']);

                    if (str_contains($text, $query) || str_contains($refLower, $query)) {
                        $results[] = [
                            'reference' => $verseInfo['ref'],
                            'text' => $verse['text'],
                            'translation' => $verse['translation'],
                            'theme' => $theme['name'],
                            'themeKey' => $themeKey,
                            'themeColor' => $theme['color'],
                            'themeIcon' => $theme['icon'],
                        ];
                    }
                }
            }
        }

        return [
            'query' => $query,
            'count' => count($results),
            'results' => $results,
        ];
    }

    /**
     * Get daily verse (random from health themes).
     */
    public function getDailyVerse(?string $bibleId = null): array
    {
        // Use date as seed for consistent daily verse
        $dayOfYear = date('z');
        $allVerses = [];

        foreach ($this->healthThemes as $themeKey => $theme) {
            foreach ($theme['verses'] as $verseInfo) {
                $allVerses[] = [
                    'id' => $verseInfo['id'],
                    'ref' => $verseInfo['ref'],
                    'themeKey' => $themeKey,
                    'themeName' => $theme['name'],
                    'themeColor' => $theme['color'],
                ];
            }
        }

        $index = $dayOfYear % count($allVerses);
        $selected = $allVerses[$index];

        $verse = $this->lookup($selected['id'], $bibleId);

        if ($verse['success']) {
            return [
                'success' => true,
                'reference' => $selected['ref'],
                'text' => $verse['text'],
                'translation' => $verse['translation'],
                'theme' => $selected['themeName'],
                'themeKey' => $selected['themeKey'],
                'themeColor' => $selected['themeColor'],
            ];
        }

        return $verse;
    }

    /**
     * Parse a human-readable reference to API format.
     */
    public function parseReference(string $reference): ?string
    {
        // Book abbreviations mapping
        $bookAbbreviations = [
            'Genesis' => 'GEN', 'Gen' => 'GEN',
            'Exodus' => 'EXO', 'Exo' => 'EXO',
            'Leviticus' => 'LEV', 'Lev' => 'LEV',
            'Numbers' => 'NUM', 'Num' => 'NUM',
            'Deuteronomy' => 'DEU', 'Deut' => 'DEU',
            'Joshua' => 'JOS', 'Josh' => 'JOS',
            'Judges' => 'JDG', 'Judg' => 'JDG',
            'Ruth' => 'RUT',
            '1 Samuel' => '1SA', '1 Sam' => '1SA', '1Samuel' => '1SA',
            '2 Samuel' => '2SA', '2 Sam' => '2SA', '2Samuel' => '2SA',
            '1 Kings' => '1KI', '1 Kgs' => '1KI', '1Kings' => '1KI',
            '2 Kings' => '2KI', '2 Kgs' => '2KI', '2Kings' => '2KI',
            '1 Chronicles' => '1CH', '1 Chr' => '1CH', '1Chronicles' => '1CH',
            '2 Chronicles' => '2CH', '2 Chr' => '2CH', '2Chronicles' => '2CH',
            'Ezra' => 'EZR',
            'Nehemiah' => 'NEH', 'Neh' => 'NEH',
            'Esther' => 'EST', 'Esth' => 'EST',
            'Job' => 'JOB',
            'Psalms' => 'PSA', 'Psalm' => 'PSA', 'Ps' => 'PSA',
            'Proverbs' => 'PRO', 'Prov' => 'PRO',
            'Ecclesiastes' => 'ECC', 'Eccl' => 'ECC',
            'Song of Solomon' => 'SNG', 'Song' => 'SNG',
            'Isaiah' => 'ISA', 'Isa' => 'ISA',
            'Jeremiah' => 'JER', 'Jer' => 'JER',
            'Lamentations' => 'LAM', 'Lam' => 'LAM',
            'Ezekiel' => 'EZK', 'Ezek' => 'EZK',
            'Daniel' => 'DAN', 'Dan' => 'DAN',
            'Hosea' => 'HOS', 'Hos' => 'HOS',
            'Joel' => 'JOL',
            'Amos' => 'AMO',
            'Obadiah' => 'OBA', 'Obad' => 'OBA',
            'Jonah' => 'JON',
            'Micah' => 'MIC', 'Mic' => 'MIC',
            'Nahum' => 'NAM', 'Nah' => 'NAM',
            'Habakkuk' => 'HAB', 'Hab' => 'HAB',
            'Zephaniah' => 'ZEP', 'Zeph' => 'ZEP',
            'Haggai' => 'HAG', 'Hag' => 'HAG',
            'Zechariah' => 'ZEC', 'Zech' => 'ZEC',
            'Malachi' => 'MAL', 'Mal' => 'MAL',
            'Matthew' => 'MAT', 'Matt' => 'MAT', 'Mt' => 'MAT',
            'Mark' => 'MRK', 'Mk' => 'MRK',
            'Luke' => 'LUK', 'Lk' => 'LUK',
            'John' => 'JHN', 'Jn' => 'JHN',
            'Acts' => 'ACT',
            'Romans' => 'ROM', 'Rom' => 'ROM',
            '1 Corinthians' => '1CO', '1 Cor' => '1CO', '1Corinthians' => '1CO',
            '2 Corinthians' => '2CO', '2 Cor' => '2CO', '2Corinthians' => '2CO',
            'Galatians' => 'GAL', 'Gal' => 'GAL',
            'Ephesians' => 'EPH', 'Eph' => 'EPH',
            'Philippians' => 'PHP', 'Phil' => 'PHP',
            'Colossians' => 'COL', 'Col' => 'COL',
            '1 Thessalonians' => '1TH', '1 Thess' => '1TH', '1Thessalonians' => '1TH',
            '2 Thessalonians' => '2TH', '2 Thess' => '2TH', '2Thessalonians' => '2TH',
            '1 Timothy' => '1TI', '1 Tim' => '1TI', '1Timothy' => '1TI',
            '2 Timothy' => '2TI', '2 Tim' => '2TI', '2Timothy' => '2TI',
            'Titus' => 'TIT',
            'Philemon' => 'PHM', 'Phlm' => 'PHM',
            'Hebrews' => 'HEB', 'Heb' => 'HEB',
            'James' => 'JAS', 'Jas' => 'JAS',
            '1 Peter' => '1PE', '1 Pet' => '1PE', '1Peter' => '1PE',
            '2 Peter' => '2PE', '2 Pet' => '2PE', '2Peter' => '2PE',
            '1 John' => '1JN', '1 Jn' => '1JN', '1John' => '1JN',
            '2 John' => '2JN', '2 Jn' => '2JN', '2John' => '2JN',
            '3 John' => '3JN', '3 Jn' => '3JN', '3John' => '3JN',
            'Jude' => 'JUD',
            'Revelation' => 'REV', 'Rev' => 'REV',
        ];

        // Try to parse the reference (e.g., "John 3:16" or "John 3:16-17")
        if (preg_match('/^(\d?\s?[A-Za-z]+)\s+(\d+):(\d+)(?:-(\d+))?$/', trim($reference), $matches)) {
            $bookName = trim($matches[1]);
            $chapter = $matches[2];
            $verseStart = $matches[3];
            $verseEnd = $matches[4] ?? null;

            $bookCode = null;
            foreach ($bookAbbreviations as $name => $code) {
                if (strcasecmp($bookName, $name) === 0) {
                    $bookCode = $code;
                    break;
                }
            }

            if ($bookCode) {
                if ($verseEnd) {
                    return "{$bookCode}.{$chapter}.{$verseStart}-{$bookCode}.{$chapter}.{$verseEnd}";
                } else {
                    return "{$bookCode}.{$chapter}.{$verseStart}";
                }
            }
        }

        return null;
    }
}
