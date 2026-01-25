<?php

namespace App\Services;

use GeminiAPI\Client;
use GeminiAPI\Resources\Parts\TextPart;
use GuzzleHttp\Client as GuzzleClient;
use Illuminate\Support\Facades\Log;

class GeminiService
{
    protected ?Client $client = null;
    protected ?string $apiKey = null;

    public function __construct()
    {
        $this->apiKey = config('services.gemini.api_key');

        if ($this->apiKey) {
            $httpClient = null;

            // SSL verification can be disabled via explicit environment variable
            // ONLY use this for local development when you cannot configure CA bundle
            // NEVER disable in production - set GEMINI_VERIFY_SSL=true in production .env
            $verifySsl = config('services.gemini.verify_ssl', true);

            if (!$verifySsl && config('app.env') === 'local') {
                $httpClient = new GuzzleClient([
                    'verify' => false,
                ]);
            }

            $this->client = new Client($this->apiKey, $httpClient);
        }
    }

    /**
     * Check if the Gemini API is configured.
     */
    public function isConfigured(): bool
    {
        return $this->apiKey !== null && $this->apiKey !== '';
    }

    /**
     * Suggest Scripture references for a health condition or intervention.
     */
    public function suggestScriptures(string $topic, string $context = ''): array
    {
        if (!$this->isConfigured()) {
            return ['error' => 'Gemini API is not configured. Please add GEMINI_API_KEY to your .env file.'];
        }

        $prompt = $this->buildScripturePrompt($topic, $context);

        try {
            // Use gemini-2.5-flash (latest and fastest model)
            $response = $this->client->generativeModel('gemini-2.5-flash')->generateContent(
                new TextPart($prompt)
            );

            $text = $response->text();
            return $this->parseScriptureSuggestions($text);
        } catch (\Exception $e) {
            Log::error('Gemini Scripture suggestion error: ' . $e->getMessage());
            return ['error' => 'Failed to generate suggestions. Please try again.'];
        }
    }

    /**
     * Suggest Ellen G. White references for a health condition or intervention.
     */
    public function suggestEgwReferences(string $topic, string $context = ''): array
    {
        if (!$this->isConfigured()) {
            return ['error' => 'Gemini API is not configured. Please add GEMINI_API_KEY to your .env file.'];
        }

        $prompt = $this->buildEgwPrompt($topic, $context);

        try {
            // Use gemini-2.5-flash (latest and fastest model)
            $response = $this->client->generativeModel('gemini-2.5-flash')->generateContent(
                new TextPart($prompt)
            );

            $text = $response->text();
            return $this->parseEgwSuggestions($text);
        } catch (\Exception $e) {
            Log::error('Gemini EGW suggestion error: ' . $e->getMessage());
            return ['error' => 'Failed to generate suggestions. Please try again.'];
        }
    }

    /**
     * Build the prompt for Scripture suggestions.
     */
    protected function buildScripturePrompt(string $topic, string $context): string
    {
        $contextText = $context ? "\n\nAdditional context: {$context}" : '';

        return <<<PROMPT
            You are a knowledgeable Bible scholar helping with a Seventh-day Adventist lifestyle medicine application.
            Suggest 5 relevant Bible scriptures that relate to the following health topic or condition.

            Topic: {$topic}{$contextText}

            For each scripture, provide:
            1. The Bible reference (book, chapter, verse)
            2. The full text of the verse (use KJV or NKJV)
            3. A relevant theme (e.g., "Healing", "Trust in God", "Temperance", "Body as Temple", "Peace", "Rest")
            4. A brief explanation (1-2 sentences) of how it relates to the topic

            Format your response as JSON array with this structure:
            [
            {
                "reference": "Proverbs 3:5-6",
                "text": "Trust in the LORD with all thine heart...",
                "theme": "Trust in God",
                "explanation": "Emphasizes the importance of trusting God in health decisions."
            }
            ]

            Only return valid JSON, no additional text or markdown formatting.
PROMPT;
    }

    /**
     * Build the prompt for EGW reference suggestions.
     */
    protected function buildEgwPrompt(string $topic, string $context): string
    {
        $contextText = $context ? "\n\nAdditional context: {$context}" : '';

        return <<<PROMPT
        You are an expert in Ellen G. White's writings, particularly her health-related works.
        Suggest 5 relevant quotes from Ellen G. White that relate to the following health topic or condition.

        Topic: {$topic}{$contextText}

        Focus on quotes from these health-focused books:
        - Ministry of Healing (MH)
        - Counsels on Diet and Foods (CD)
        - Counsels on Health (CH)
        - Medical Ministry (MM)
        - Temperance (Te)
        - Education (Ed)
        - The Adventist Home (AH)
        - Child Guidance (CG)

        For each quote, provide:
        1. The book name
        2. The book abbreviation
        3. The approximate page number (if known, otherwise estimate)
        4. The actual quote (be accurate to Ellen White's actual writings)
        5. A topic/theme tag
        6. Brief context about application

        Format your response as JSON array with this structure:
        [
        {
            "book": "Ministry of Healing",
            "book_abbreviation": "MH",
            "page_start": 127,
            "quote": "Pure air, sunlight, abstemiousness, rest, exercise, proper diet, the use of water, trust in divine power—these are the true remedies.",
            "topic": "Natural Remedies",
            "context": "The foundational eight laws of health."
        }
        ]

        Only return valid JSON, no additional text or markdown formatting. Use actual Ellen White quotes when possible.
PROMPT;
    }

    /**
     * Parse Scripture suggestions from Gemini response.
     */
    protected function parseScriptureSuggestions(string $text): array
    {
        // Clean the response - remove markdown code blocks if present
        $text = preg_replace('/```json\s*/', '', $text);
        $text = preg_replace('/```\s*/', '', $text);
        $text = trim($text);

        $decoded = json_decode($text, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            Log::warning('Failed to parse Scripture suggestions: ' . json_last_error_msg());
            return ['error' => 'Failed to parse suggestions. The AI response was not in the expected format.'];
        }

        return ['suggestions' => $decoded];
    }

    /**
     * Parse EGW suggestions from Gemini response.
     */
    protected function parseEgwSuggestions(string $text): array
    {
        // Clean the response - remove markdown code blocks if present
        $text = preg_replace('/```json\s*/', '', $text);
        $text = preg_replace('/```\s*/', '', $text);
        $text = trim($text);

        $decoded = json_decode($text, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            Log::warning('Failed to parse EGW suggestions: ' . json_last_error_msg());
            return ['error' => 'Failed to parse suggestions. The AI response was not in the expected format.'];
        }

        return ['suggestions' => $decoded];
    }
}
