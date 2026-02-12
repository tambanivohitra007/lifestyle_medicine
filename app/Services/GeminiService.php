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

            // SSL verification can be disabled via GEMINI_VERIFY_SSL=false in .env
            // This is blocked in production regardless of config
            $verifySsl = config('services.gemini.verify_ssl', true);
            if (! $verifySsl && config('app.env') !== 'production') {
                $httpClient = new GuzzleClient(['verify' => false]);
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
     * Generate generic text content based on system instructions and a user prompt.
     * Used for the Infographic "Architect" step.
     *
     * @throws \RuntimeException if Gemini is not configured
     */
    public function generateText(string $systemInstruction, string $userPrompt): string
    {
        if (! $this->isConfigured()) {
            // Throw exception so caller can handle appropriately with context-aware fallback
            throw new \RuntimeException('Gemini API is not configured.');
        }

        // Combine instructions since the wrapper usually handles single prompts best
        $fullPrompt = $systemInstruction."\n\nTask: ".$userPrompt;

        try {
            // Use gemini-2.5-flash for speed
            $response = $this->client->generativeModel('gemini-2.5-flash')->generateContent(
                new TextPart($fullPrompt)
            );

            $text = $response->text();

            // Clean up any markdown formatting Gemini might add
            $text = preg_replace('/^```[a-z]*\s*/i', '', $text);
            $text = preg_replace('/\s*```$/i', '', $text);
            $text = trim($text);

            return $text;
        } catch (\Exception $e) {
            Log::error('Gemini text generation error: '.$e->getMessage());
            // Re-throw so caller can use context-aware fallback
            throw $e;
        }
    }

    /**
     * Suggest Scripture references for a health condition or intervention.
     */
    public function suggestScriptures(string $topic, string $context = ''): array
    {
        if (! $this->isConfigured()) {
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
            Log::error('Gemini Scripture suggestion error: '.$e->getMessage());

            return ['error' => 'Failed to generate suggestions. Please try again.'];
        }
    }

    /**
     * Suggest Ellen G. White references for a health condition or intervention.
     */
    public function suggestEgwReferences(string $topic, string $context = ''): array
    {
        if (! $this->isConfigured()) {
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
            Log::error('Gemini EGW suggestion error: '.$e->getMessage());

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

        IMPORTANT: Only suggest quotes that are verifiable on the official Ellen G. White Writings website (https://egwwritings.org/).
        Every quote you provide MUST be an actual, real quote from Ellen White's published writings — do NOT paraphrase, fabricate, or approximate.
        If you are not confident a quote is accurate, do not include it.

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
        3. The page number where this quote appears
        4. The exact quote from Ellen White's writings
        5. A topic/theme tag
        6. Brief context about application
        7. A source_url linking to the quote on egwwritings.org (format: https://egwwritings.org/?ref=en_MH.127.1 where MH is the book abbreviation, 127 is the page, and 1 is the paragraph)

        Format your response as JSON array with this structure:
        [
        {
            "book": "Ministry of Healing",
            "book_abbreviation": "MH",
            "page_start": 127,
            "quote": "Pure air, sunlight, abstemiousness, rest, exercise, proper diet, the use of water, trust in divine power—these are the true remedies.",
            "topic": "Natural Remedies",
            "context": "The foundational eight laws of health.",
            "source_url": "https://egwwritings.org/?ref=en_MH.127.1"
        }
        ]

        Only return valid JSON, no additional text or markdown formatting.
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
            Log::warning('Failed to parse Scripture suggestions: '.json_last_error_msg());

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
            Log::warning('Failed to parse EGW suggestions: '.json_last_error_msg());

            return ['error' => 'Failed to parse suggestions. The AI response was not in the expected format.'];
        }

        return ['suggestions' => $decoded];
    }
}
