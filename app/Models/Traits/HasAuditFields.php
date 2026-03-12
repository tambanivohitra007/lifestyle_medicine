<?php

namespace App\Models\Traits;

use App\Models\User;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Auth;

/**
 * Provides automatic audit field tracking for Eloquent models.
 *
 * This trait automatically sets `created_by`, `updated_by`, and `deleted_by` fields
 * based on the currently authenticated user. It hooks into Eloquent's creating,
 * updating, and deleting events. The `deleted_by` field is only set when the model
 * uses soft deletes.
 *
 * Models using this trait gain `creator()`, `updater()`, and `deleter()` relationship
 * methods that return the associated User instances.
 *
 * Required database columns: `created_by` (nullable foreignId), `updated_by` (nullable foreignId),
 * `deleted_by` (nullable foreignId, only if using SoftDeletes).
 *
 * @property int|null $created_by
 * @property int|null $updated_by
 * @property int|null $deleted_by
 *
 * @property-read User|null $creator
 * @property-read User|null $updater
 * @property-read User|null $deleter
 */
trait HasAuditFields
{
    /**
     * Boot the trait.
     *
     * Registers model event listeners to automatically populate audit fields
     * (created_by, updated_by, deleted_by) from the authenticated user.
     *
     * @return void
     */
    protected static function bootHasAuditFields(): void
    {
        static::creating(function ($model) {
            if (Auth::check()) {
                $model->created_by = Auth::id();
                $model->updated_by = Auth::id();
            }
        });

        static::updating(function ($model) {
            if (Auth::check()) {
                $model->updated_by = Auth::id();
            }
        });

        static::deleting(function ($model) {
            if (Auth::check() && $model->usingSoftDeletes()) {
                $model->deleted_by = Auth::id();
                $model->save();
            }
        });
    }

    /**
     * Check if the model uses soft deletes.
     *
     * @return bool
     */
    protected function usingSoftDeletes(): bool
    {
        return in_array('Illuminate\Database\Eloquent\SoftDeletes', class_uses_recursive($this));
    }

    /**
     * Get the user who created this record.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the user who last updated this record.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<User, $this>
     */
    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Get the user who deleted this record.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<User, $this>
     */
    public function deleter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'deleted_by');
    }
}
