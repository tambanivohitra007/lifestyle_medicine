<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'gemini' => [
        'api_key' => env('GEMINI_API_KEY'),
        // SSL verification - set to false ONLY for local development if you have certificate issues
        // MUST be true in production
        'verify_ssl' => env('GEMINI_VERIFY_SSL', true),
        // Fast model for draft generation (System 1 - quick, creative)
        'draft_model' => env('GEMINI_DRAFT_MODEL', 'gemini-2.0-flash'),
        // Thinking model for structuring (System 2 - slow, deliberate, accurate)
        // Options: gemini-2.5-pro (best reasoning), gemini-2.5-flash (balanced, fast thinking)
        'structure_model' => env('GEMINI_STRUCTURE_MODEL', 'gemini-2.5-flash'),
    ],

    'bible_api' => [
        'api_key' => env('BIBLE_API_KEY'),
        'default_bible_id' => env('BIBLE_API_DEFAULT_ID', 'de4e12af7f28f599-02'), // KJV
    ],

    'vertex_ai' => [
        'project_id' => env('VERTEX_AI_PROJECT_ID'),
        'location' => env('VERTEX_AI_LOCATION', 'us-central1'),
        'credentials' => env('GOOGLE_APPLICATION_CREDENTIALS'),
        'imagen_model' => env('VERTEX_AI_IMAGEN_MODEL', 'imagen-4.0-fast-generate-001'),
    ],

];
