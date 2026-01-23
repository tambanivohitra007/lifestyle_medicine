<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class BibleApiService
{
    protected string $baseUrl = 'https://api.scripture.api.bible/v1';
    protected ?string $apiKey = null;
    protected ?string $defaultBibleId = null;

    public function __construct()
    {
        $this->apiKey = config('services.bible_api.api_key');
        // Default to KJV (King James Version) - you can change this
        $this->defaultBibleId = config('services.bible_api.default_bible_id', 'de4e12af7f28f599-02');
    }

    /**
     * Check if the Bible API is configured.
     */
    public function isConfigured(): bool
    {
        return $this->apiKey !== null && $this->apiKey !== '';
    }

    /**
     * Get list of available Bibles.
     */
    public function getBibles(array $options = []): array
    {
        if (!$this->isConfigured()) {
            return ['error' => 'Bible API is not configured. Please add BIBLE_API_KEY to your .env file.'];
        }

        try {
            $response = Http::withHeaders([
                'api-key' => $this->apiKey,
            ])->get("{$this->baseUrl}/bibles", $options);

            if ($response->successful()) {
                return $response->json();
            }

            Log::error('Bible API getBibles error: ' . $response->body());
            return ['error' => 'Failed to fetch Bibles list.'];
        } catch (\Exception $e) {
            Log::error('Bible API getBibles exception: ' . $e->getMessage());
            return ['error' => 'Failed to connect to Bible API.'];
        }
    }

    /**
     * Search for verses by keyword or reference.
     *
     * @param string $query The search query (e.g., "love" or "John 3:16")
     * @param string|null $bibleId The Bible version ID (defaults to KJV)
     * @param int $limit Maximum number of results
     */
    public function searchVerses(string $query, ?string $bibleId = null, int $limit = 10): array
    {
        if (!$this->isConfigured()) {
            return ['error' => 'Bible API is not configured. Please add BIBLE_API_KEY to your .env file.'];
        }

        $bibleId = $bibleId ?? $this->defaultBibleId;

        try {
            $response = Http::withHeaders([
                'api-key' => $this->apiKey,
            ])->get("{$this->baseUrl}/bibles/{$bibleId}/search", [
                'query' => $query,
                'limit' => $limit,
                'sort' => 'relevance',
            ]);

            if ($response->successful()) {
                return $response->json();
            }

            Log::error('Bible API searchVerses error: ' . $response->body());
            return ['error' => 'Failed to search verses.'];
        } catch (\Exception $e) {
            Log::error('Bible API searchVerses exception: ' . $e->getMessage());
            return ['error' => 'Failed to connect to Bible API.'];
        }
    }

    /**
     * Get a specific verse by its ID.
     *
     * @param string $verseId The verse ID (e.g., "JHN.3.16" for John 3:16)
     * @param string|null $bibleId The Bible version ID (defaults to KJV)
     */
    public function getVerse(string $verseId, ?string $bibleId = null): array
    {
        if (!$this->isConfigured()) {
            return ['error' => 'Bible API is not configured. Please add BIBLE_API_KEY to your .env file.'];
        }

        $bibleId = $bibleId ?? $this->defaultBibleId;

        try {
            $response = Http::withHeaders([
                'api-key' => $this->apiKey,
            ])->get("{$this->baseUrl}/bibles/{$bibleId}/verses/{$verseId}", [
                'content-type' => 'text',
                'include-verse-numbers' => false,
            ]);

            if ($response->successful()) {
                return $response->json();
            }

            Log::error('Bible API getVerse error: ' . $response->body());
            return ['error' => 'Failed to fetch verse.'];
        } catch (\Exception $e) {
            Log::error('Bible API getVerse exception: ' . $e->getMessage());
            return ['error' => 'Failed to connect to Bible API.'];
        }
    }

    /**
     * Get a passage (range of verses).
     *
     * @param string $passageId The passage ID (e.g., "JHN.3.16-JHN.3.17" for John 3:16-17)
     * @param string|null $bibleId The Bible version ID (defaults to KJV)
     */
    public function getPassage(string $passageId, ?string $bibleId = null): array
    {
        if (!$this->isConfigured()) {
            return ['error' => 'Bible API is not configured. Please add BIBLE_API_KEY to your .env file.'];
        }

        $bibleId = $bibleId ?? $this->defaultBibleId;

        try {
            $response = Http::withHeaders([
                'api-key' => $this->apiKey,
            ])->get("{$this->baseUrl}/bibles/{$bibleId}/passages/{$passageId}", [
                'content-type' => 'text',
                'include-verse-numbers' => true,
                'include-titles' => true,
            ]);

            if ($response->successful()) {
                return $response->json();
            }

            Log::error('Bible API getPassage error: ' . $response->body());
            return ['error' => 'Failed to fetch passage.'];
        } catch (\Exception $e) {
            Log::error('Bible API getPassage exception: ' . $e->getMessage());
            return ['error' => 'Failed to connect to Bible API.'];
        }
    }

    /**
     * Parse a human-readable reference (e.g., "John 3:16") into verse ID format.
     * Note: This is a basic parser. For complex references, use the search endpoint.
     */
    public function parseReference(string $reference): ?string
    {
        // Book abbreviations mapping (common ones)
        $bookAbbreviations = [
            // Old Testament
            'Genesis' => 'GEN', 'Gen' => 'GEN',
            'Exodus' => 'EXO', 'Exo' => 'EXO',
            'Leviticus' => 'LEV', 'Lev' => 'LEV',
            'Numbers' => 'NUM', 'Num' => 'NUM',
            'Deuteronomy' => 'DEU', 'Deut' => 'DEU',
            'Psalms' => 'PSA', 'Psalm' => 'PSA', 'Ps' => 'PSA',
            'Proverbs' => 'PRO', 'Prov' => 'PRO',
            'Isaiah' => 'ISA', 'Isa' => 'ISA',
            'Jeremiah' => 'JER', 'Jer' => 'JER',

            // New Testament
            'Matthew' => 'MAT', 'Matt' => 'MAT', 'Mt' => 'MAT',
            'Mark' => 'MRK', 'Mk' => 'MRK',
            'Luke' => 'LUK', 'Lk' => 'LUK',
            'John' => 'JHN', 'Jn' => 'JHN',
            'Acts' => 'ACT',
            'Romans' => 'ROM', 'Rom' => 'ROM',
            '1 Corinthians' => '1CO', '1 Cor' => '1CO',
            '2 Corinthians' => '2CO', '2 Cor' => '2CO',
            'Galatians' => 'GAL', 'Gal' => 'GAL',
            'Ephesians' => 'EPH', 'Eph' => 'EPH',
            'Philippians' => 'PHP', 'Phil' => 'PHP',
            'Colossians' => 'COL', 'Col' => 'COL',
            '1 Thessalonians' => '1TH', '1 Thess' => '1TH',
            '2 Thessalonians' => '2TH', '2 Thess' => '2TH',
            '1 Timothy' => '1TI', '1 Tim' => '1TI',
            '2 Timothy' => '2TI', '2 Tim' => '2TI',
            'Hebrews' => 'HEB', 'Heb' => 'HEB',
            'James' => 'JAS', 'Jas' => 'JAS',
            '1 Peter' => '1PE', '1 Pet' => '1PE',
            '2 Peter' => '2PE', '2 Pet' => '2PE',
            '1 John' => '1JN', '1 Jn' => '1JN',
            '2 John' => '2JN', '2 Jn' => '2JN',
            '3 John' => '3JN', '3 Jn' => '3JN',
            'Revelation' => 'REV', 'Rev' => 'REV',
        ];

        // Try to parse the reference (e.g., "John 3:16")
        if (preg_match('/^(\d?\s?[A-Za-z]+)\s+(\d+):(\d+)(?:-(\d+))?$/', $reference, $matches)) {
            $bookName = trim($matches[1]);
            $chapter = $matches[2];
            $verseStart = $matches[3];
            $verseEnd = $matches[4] ?? null;

            if (isset($bookAbbreviations[$bookName])) {
                $bookCode = $bookAbbreviations[$bookName];

                if ($verseEnd) {
                    // Passage range
                    return "{$bookCode}.{$chapter}.{$verseStart}-{$bookCode}.{$chapter}.{$verseEnd}";
                } else {
                    // Single verse
                    return "{$bookCode}.{$chapter}.{$verseStart}";
                }
            }
        }

        return null;
    }
}
