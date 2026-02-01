<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\MediaResource;
use App\Models\Condition;
use App\Models\Media;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ConditionMediaController extends Controller
{
    /**
     * Allowed MIME types for images.
     */
    protected array $imageMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
    ];

    /**
     * Allowed MIME types for documents.
     */
    protected array $documentMimeTypes = [
        'application/pdf',
    ];

    /**
     * Get all media for a condition.
     */
    public function index(Condition $condition): AnonymousResourceCollection
    {
        return MediaResource::collection($condition->media);
    }

    /**
     * Upload media to a condition.
     */
    public function store(Request $request, Condition $condition): MediaResource|JsonResponse
    {
        $request->validate([
            'file' => 'required|file|max:10240', // 10MB max
            'alt_text' => 'nullable|string|max:255',
            'caption' => 'nullable|string|max:500',
            'type' => 'nullable|string|in:image,document,infographic',
        ]);

        $file = $request->file('file');
        $mimeType = $file->getMimeType();

        // Determine file type
        if (in_array($mimeType, $this->imageMimeTypes)) {
            $type = $request->input('type', 'image');
        } elseif (in_array($mimeType, $this->documentMimeTypes)) {
            $type = 'document';
        } else {
            return response()->json([
                'message' => 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP, PDF',
            ], 422);
        }

        // Generate unique filename
        $extension = $file->getClientOriginalExtension();
        $filename = Str::uuid() . '.' . $extension;

        // Store file
        $path = $file->storeAs(
            'conditions/' . $condition->id,
            $filename,
            'public'
        );

        // Get the next order index
        $maxOrder = $condition->media()->max('order_index') ?? -1;

        // Create media record
        $media = $condition->media()->create([
            'filename' => $filename,
            'original_filename' => $file->getClientOriginalName(),
            'mime_type' => $mimeType,
            'size' => $file->getSize(),
            'disk' => 'public',
            'path' => $path,
            'type' => $type,
            'alt_text' => $request->input('alt_text'),
            'caption' => $request->input('caption'),
            'order_index' => $maxOrder + 1,
        ]);

        return new MediaResource($media);
    }

    /**
     * Update media metadata.
     */
    public function update(Request $request, Condition $condition, Media $medium): MediaResource|JsonResponse
    {
        // Verify media belongs to condition
        if ($medium->mediable_id !== $condition->id || $medium->mediable_type !== Condition::class) {
            return response()->json(['message' => 'Media not found'], 404);
        }

        $validated = $request->validate([
            'alt_text' => 'nullable|string|max:255',
            'caption' => 'nullable|string|max:500',
            'order_index' => 'nullable|integer|min:0',
        ]);

        $medium->update($validated);

        return new MediaResource($medium);
    }

    /**
     * Reorder media items.
     */
    public function reorder(Request $request, Condition $condition): JsonResponse
    {
        $request->validate([
            'order' => 'required|array',
            'order.*' => 'required|uuid',
        ]);

        $order = $request->input('order');

        foreach ($order as $index => $mediaId) {
            $condition->media()
                ->where('id', $mediaId)
                ->update(['order_index' => $index]);
        }

        return response()->json(['message' => 'Media reordered successfully']);
    }

    /**
     * Delete media.
     */
    public function destroy(Condition $condition, Media $medium): JsonResponse
    {
        // Verify media belongs to condition
        if ($medium->mediable_id !== $condition->id || $medium->mediable_type !== Condition::class) {
            return response()->json(['message' => 'Media not found'], 404);
        }

        // Delete the file from storage
        Storage::disk($medium->disk)->delete($medium->path);

        // Delete the record (force delete to remove from DB)
        $medium->forceDelete();

        return response()->json(['message' => 'Media deleted successfully']);
    }
}
