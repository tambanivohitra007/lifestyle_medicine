<?php

namespace App\Services;

use Google\Cloud\AIPlatform\V1\Client\PredictionServiceClient;
use Google\Cloud\AIPlatform\V1\PredictRequest;
use Google\Protobuf\Value;
use GuzzleHttp\Client as GuzzleClient;
use GuzzleHttp\HandlerStack;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Vertex AI Imagen API service for AI-powered image generation.
 *
 * Integrates with Google Cloud's Vertex AI Imagen model to generate medical infographic
 * background images from text prompts. Supports two execution paths:
 * - **gRPC Client**: Uses the official Google Cloud PHP client for production environments
 * - **REST API**: Direct HTTP requests for local development with SSL verification disabled
 *
 * Also provides image storage functionality to save generated images to the public disk,
 * with automatic MIME type detection and file extension mapping.
 *
 * @see \App\Services\InfographicGeneratorService The orchestrator that uses this service
 * @see \App\Jobs\GenerateInfographicJob The async job that calls generateImage()
 */
class ImagenService
{
    /** @var string|null The Google Cloud project ID */
    protected ?string $projectId;

    /** @var string|null The Vertex AI region/location (e.g., 'us-central1') */
    protected ?string $location;

    /** @var string|null The file path to Google Cloud service account credentials JSON */
    protected ?string $credentials;

    /** @var string The Imagen model identifier (e.g., 'imagen-4.0-fast-generate-001') */
    protected string $model;

    /** @var bool Whether to verify SSL certificates for API requests */
    protected bool $verifySsl;

    /**
     * Initialize the Imagen service with Vertex AI configuration.
     *
     * Reads project ID, location, credentials path, model name, and SSL verification
     * settings from the services.vertex_ai configuration.
     */
    public function __construct()
    {
        $this->projectId = config('services.vertex_ai.project_id');
        $this->location = config('services.vertex_ai.location', 'us-central1');
        $this->credentials = config('services.vertex_ai.credentials');
        $this->model = config('services.vertex_ai.imagen_model', 'imagen-4.0-fast-generate-001');
        $this->verifySsl = config('services.vertex_ai.verify_ssl', true);
    }

    /**
     * Check if Vertex AI Imagen is configured.
     */
    public function isConfigured(): bool
    {
        return !empty($this->projectId)
            && !empty($this->credentials)
            && file_exists($this->credentials);
    }

    /**
     * Generate an image using Vertex AI Imagen.
     *
     * @param string $prompt The text prompt for image generation
     * @param array $options Optional parameters (aspectRatio, sampleCount, etc.)
     * @return array{success: bool, image_data?: string, error?: string}
     */
    public function generateImage(string $prompt, array $options = []): array
    {
        if (!$this->isConfigured()) {
            return [
                'success' => false,
                'error' => 'Vertex AI Imagen is not configured. Please set VERTEX_AI_PROJECT_ID and GOOGLE_APPLICATION_CREDENTIALS.',
            ];
        }

        // Use REST API directly for better SSL control
        Log::info('Imagen SSL check', [
            'verifySsl' => $this->verifySsl,
            'appEnv' => config('app.env'),
            'useRest' => !$this->verifySsl && config('app.env') === 'local',
        ]);

        if (!$this->verifySsl && config('app.env') === 'local') {
            Log::info('Using REST API for Imagen (SSL verification disabled)');
            return $this->generateImageViaRest($prompt, $options);
        }

        try {
            // Set credentials environment variable for the Google Cloud client
            putenv("GOOGLE_APPLICATION_CREDENTIALS={$this->credentials}");

            $endpoint = sprintf(
                'projects/%s/locations/%s/publishers/google/models/%s',
                $this->projectId,
                $this->location,
                $this->model
            );

            $client = new PredictionServiceClient([
                'apiEndpoint' => "{$this->location}-aiplatform.googleapis.com",
            ]);

            // Build the instance (prompt)
            $instanceValue = new Value();
            $instanceValue->setStructValue(
                new \Google\Protobuf\Struct([
                    'fields' => [
                        'prompt' => (new Value())->setStringValue($prompt),
                    ],
                ])
            );

            // Build parameters
            $parametersStruct = new \Google\Protobuf\Struct();
            $fields = [
                'sampleCount' => (new Value())->setNumberValue($options['sampleCount'] ?? 1),
            ];

            // Add aspect ratio if specified (default 1:1 for infographics)
            if (isset($options['aspectRatio'])) {
                $fields['aspectRatio'] = (new Value())->setStringValue($options['aspectRatio']);
            } else {
                // Portrait orientation is good for infographics
                $fields['aspectRatio'] = (new Value())->setStringValue('3:4');
            }

            $parametersStruct->setFields($fields);
            $parametersValue = new Value();
            $parametersValue->setStructValue($parametersStruct);

            $request = new PredictRequest([
                'endpoint' => $endpoint,
                'instances' => [$instanceValue],
                'parameters' => $parametersValue,
            ]);

            $response = $client->predict($request);
            $predictions = $response->getPredictions();

            if (count($predictions) === 0) {
                return [
                    'success' => false,
                    'error' => 'No image was generated by the model.',
                ];
            }

            // Extract base64 image data from the first prediction
            $prediction = $predictions[0];
            $structValue = $prediction->getStructValue();
            $imageData = null;

            if ($structValue) {
                $fields = $structValue->getFields();
                if (isset($fields['bytesBase64Encoded'])) {
                    $imageData = $fields['bytesBase64Encoded']->getStringValue();
                }
            }

            if (!$imageData) {
                return [
                    'success' => false,
                    'error' => 'Failed to extract image data from response.',
                ];
            }

            $client->close();

            return [
                'success' => true,
                'image_data' => $imageData,
            ];

        } catch (\Exception $e) {
            Log::error('Imagen generation error: ' . $e->getMessage(), [
                'prompt' => Str::limit($prompt, 100),
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'error' => 'Image generation failed: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Generate an image using the Vertex AI REST API directly.
     *
     * Used as an alternative to the gRPC client for local development environments
     * where SSL verification is disabled. Obtains an OAuth2 access token from the
     * service account credentials and makes a direct POST request to the Vertex AI
     * predict endpoint.
     *
     * @param  string  $prompt  The text prompt for image generation
     * @param  array  $options  Optional parameters: aspectRatio (default '3:4'), sampleCount (default 1)
     * @return array{success: bool, image_data?: string, error?: string}
     */
    protected function generateImageViaRest(string $prompt, array $options = []): array
    {
        try {
            // Get access token from service account
            $accessToken = $this->getAccessToken();
            if (!$accessToken) {
                return [
                    'success' => false,
                    'error' => 'Failed to obtain access token from service account.',
                ];
            }

            $url = sprintf(
                'https://%s-aiplatform.googleapis.com/v1/projects/%s/locations/%s/publishers/google/models/%s:predict',
                $this->location,
                $this->projectId,
                $this->location,
                $this->model
            );

            $aspectRatio = $options['aspectRatio'] ?? '3:4';
            $sampleCount = $options['sampleCount'] ?? 1;

            $payload = [
                'instances' => [
                    ['prompt' => $prompt],
                ],
                'parameters' => [
                    'sampleCount' => $sampleCount,
                    'aspectRatio' => $aspectRatio,
                ],
            ];

            $client = new GuzzleClient([
                'verify' => false, // Disable SSL verification for local dev
                'timeout' => 120,
            ]);

            $response = $client->post($url, [
                'headers' => [
                    'Authorization' => 'Bearer ' . $accessToken,
                    'Content-Type' => 'application/json',
                ],
                'json' => $payload,
            ]);

            $data = json_decode($response->getBody()->getContents(), true);

            if (empty($data['predictions'])) {
                return [
                    'success' => false,
                    'error' => 'No image was generated by the model.',
                ];
            }

            $imageData = $data['predictions'][0]['bytesBase64Encoded'] ?? null;

            if (!$imageData) {
                return [
                    'success' => false,
                    'error' => 'Failed to extract image data from response.',
                ];
            }

            return [
                'success' => true,
                'image_data' => $imageData,
            ];

        } catch (\Exception $e) {
            Log::error('Imagen REST generation error: ' . $e->getMessage(), [
                'prompt' => Str::limit($prompt, 100),
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'error' => 'Image generation failed: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Get an OAuth2 access token from Google Cloud service account credentials.
     *
     * Creates a JWT (RS256) signed with the service account's private key, then
     * exchanges it for an access token via Google's OAuth2 token endpoint. The
     * JWT requests the cloud-platform scope and has a 1-hour expiry.
     *
     * @return string|null The access token, or null on failure
     */
    protected function getAccessToken(): ?string
    {
        try {
            $credentialsData = json_decode(file_get_contents($this->credentials), true);

            if (!$credentialsData || !isset($credentialsData['client_email']) || !isset($credentialsData['private_key'])) {
                Log::error('Invalid service account credentials format');
                return null;
            }

            // Create JWT for service account
            $now = time();
            $header = base64_encode(json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
            $claim = base64_encode(json_encode([
                'iss' => $credentialsData['client_email'],
                'scope' => 'https://www.googleapis.com/auth/cloud-platform',
                'aud' => 'https://oauth2.googleapis.com/token',
                'exp' => $now + 3600,
                'iat' => $now,
            ]));

            $signature = '';
            $privateKey = openssl_pkey_get_private($credentialsData['private_key']);
            openssl_sign("$header.$claim", $signature, $privateKey, OPENSSL_ALGO_SHA256);
            $signature = $this->base64UrlEncode($signature);

            $jwt = "$header.$claim.$signature";

            // Exchange JWT for access token
            $client = new GuzzleClient([
                'verify' => false, // Disable SSL for local dev
                'timeout' => 30,
            ]);

            $response = $client->post('https://oauth2.googleapis.com/token', [
                'form_params' => [
                    'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                    'assertion' => $jwt,
                ],
            ]);

            $data = json_decode($response->getBody()->getContents(), true);

            return $data['access_token'] ?? null;

        } catch (\Exception $e) {
            Log::error('Failed to get access token: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Base64 URL-safe encode for JWT token construction.
     *
     * Converts standard base64 encoding to URL-safe variant by replacing
     * '+' with '-', '/' with '_', and stripping trailing '=' padding.
     *
     * @param  string  $data  The raw binary data to encode
     * @return string The URL-safe base64 encoded string
     */
    protected function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    /**
     * Save base64 image data to storage and return the path.
     *
     * @param string $base64Data The base64 encoded image data
     * @param string $filename The desired filename (without extension)
     * @param string $directory The storage directory
     * @return array{success: bool, path?: string, filename?: string, size?: int, error?: string}
     */
    public function saveImage(string $base64Data, string $filename, string $directory = 'infographics'): array
    {
        try {
            $imageData = base64_decode($base64Data);

            if ($imageData === false) {
                return [
                    'success' => false,
                    'error' => 'Failed to decode base64 image data.',
                ];
            }

            // Detect image type from data
            $finfo = new \finfo(FILEINFO_MIME_TYPE);
            $mimeType = $finfo->buffer($imageData);
            $extension = $this->getExtensionFromMime($mimeType);

            $fullFilename = $filename . '.' . $extension;
            $path = $directory . '/' . $fullFilename;

            Storage::disk('public')->put($path, $imageData);

            return [
                'success' => true,
                'path' => $path,
                'filename' => $fullFilename,
                'size' => strlen($imageData),
                'mime_type' => $mimeType,
            ];

        } catch (\Exception $e) {
            Log::error('Failed to save image: ' . $e->getMessage());

            return [
                'success' => false,
                'error' => 'Failed to save image: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Map a MIME type to a file extension for image storage.
     *
     * Supports PNG, JPEG, WebP, and GIF. Defaults to 'png' for unknown types.
     *
     * @param  string  $mimeType  The MIME type string (e.g., 'image/png')
     * @return string The file extension without dot (e.g., 'png', 'jpg')
     */
    protected function getExtensionFromMime(string $mimeType): string
    {
        $map = [
            'image/png' => 'png',
            'image/jpeg' => 'jpg',
            'image/jpg' => 'jpg',
            'image/webp' => 'webp',
            'image/gif' => 'gif',
        ];

        return $map[$mimeType] ?? 'png';
    }

    /**
     * Get the configured Imagen model identifier.
     *
     * @return string The model name (e.g., 'imagen-4.0-fast-generate-001')
     */
    public function getModel(): string
    {
        return $this->model;
    }

    /**
     * Get diagnostic information about the Imagen service configuration.
     *
     * Returns a safe summary (project ID is masked) for use in admin status endpoints.
     *
     * @return array{configured: bool, project_id: string|null, location: string|null, model: string, credentials_exist: bool}
     */
    public function getConfigurationStatus(): array
    {
        return [
            'configured' => $this->isConfigured(),
            'project_id' => $this->projectId ? '***' . substr($this->projectId, -4) : null,
            'location' => $this->location,
            'model' => $this->model,
            'credentials_exist' => $this->credentials && file_exists($this->credentials),
        ];
    }
}
