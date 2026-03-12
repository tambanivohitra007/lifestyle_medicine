<?php

namespace App\Models;

use App\Models\Traits\HasAuditFields;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Represents a care domain aligned with NEWSTART+ health principles.
 *
 * Care domains categorize interventions into areas such as Nutrition, Exercise,
 * Water, Sunlight, Temperance, Air, Rest, and Trust in God. Each domain groups
 * related interventions and provides an icon and display ordering.
 *
 * @property int $id Auto-increment primary key
 * @property string $name The care domain name (e.g., "Nutrition", "Exercise")
 * @property string|null $description Description of the care domain
 * @property string|null $icon Icon identifier for UI display
 * @property int|null $order_index Display ordering position
 * @property int|null $created_by ID of the user who created this record
 * @property int|null $updated_by ID of the user who last updated this record
 * @property int|null $deleted_by ID of the user who deleted this record
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property \Illuminate\Support\Carbon|null $deleted_at
 *
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Intervention> $interventions
 * @property-read User|null $creator
 * @property-read User|null $updater
 * @property-read User|null $deleter
 */
class CareDomain extends Model
{
    use HasFactory, SoftDeletes, HasAuditFields;

    protected $fillable = [
        'name',
        'description',
        'icon',
        'order_index',
    ];

    protected $casts = [
        'order_index' => 'integer',
    ];

    /**
     * Get the interventions in this care domain.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany<Intervention, $this>
     */
    public function interventions(): HasMany
    {
        return $this->hasMany(Intervention::class);
    }
}
