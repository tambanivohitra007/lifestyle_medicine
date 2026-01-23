<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\MediaResource;
use App\Models\Intervention;
use App\Models\Media;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MediaController extends Controller
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
     * Get all media for an intervention.
     */
    public function index(Intervention $intervention): AnonymousResourceCollection
    {
        return MediaResource::collection($intervention->media);
    }

    /**
     * Upload media to an intervention.
     */
    public function store(Request $request, Intervention $intervention): MediaResource|JsonResponse
    {
        $request->validate([
            'file' => 'required|file|max:10240', // 10MB max
            'alt_text' => 'nullable|string|max:255',
            'caption' => 'nullable|string|max:500',
        ]);

        $file = $request->file('file');
        $mimeType = $file->getMimeType();

        // Determine file type
        if (in_array($mimeType, $this->imageMimeTypes)) {
            $type = 'image';
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
            'interventions/' . $intervention->id,
            $filename,
            'public'
        );

        // Get the next order index
        $maxOrder = $intervention->media()->max('order_index') ?? -1;

        // Create media record
        $media = $intervention->media()->create([
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
    public function update(Request $request, Intervention $intervention, Media $medium): MediaResource
    {
        // Verify media belongs to intervention
        if ($medium->mediable_id !== $intervention->id) {
            abort(404);
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
    public function reorder(Request $request, Intervention $intervention): JsonResponse
    {
        $request->validate([
            'order' => 'required|array',
            'order.*' => 'required|uuid',
        ]);

        $order = $request->input('order');

        foreach ($order as $index => $mediaId) {
            $intervention->media()
                ->where('id', $mediaId)
                ->update(['order_index' => $index]);
        }

        return response()->json(['message' => 'Media reordered successfully']);
    }

    /**
     * Delete media.
     */
    public function destroy(Intervention $intervention, Media $medium): JsonResponse
    {
        // Verify media belongs to intervention
        if ($medium->mediable_id !== $intervention->id) {
            abort(404);
        }

        // Delete the file from storage
        Storage::disk($medium->disk)->delete($medium->path);

        // Delete the record (force delete to remove from DB)
        $medium->forceDelete();

        return response()->json(['message' => 'Media deleted successfully']);
    }
}
