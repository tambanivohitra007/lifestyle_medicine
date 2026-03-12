<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Laravel\Sanctum\HasApiTokens;

/**
 * Represents an authenticated user of the platform.
 *
 * Users have one of three roles (admin, editor, viewer) that control their access
 * level. Unlike other models, User uses auto-increment integer primary keys (not UUIDs).
 * Authentication is handled via Laravel Sanctum (API tokens) and Fortify (two-factor auth).
 * Users are soft-deleted and referenced by audit fields across the system.
 *
 * @property int $id Auto-increment primary key
 * @property string $name The user's display name
 * @property string $email The user's email address
 * @property string $password The hashed password
 * @property string $role User role (admin, editor, viewer)
 * @property bool $is_active Whether the user account is active
 * @property \Illuminate\Support\Carbon|null $email_verified_at When the email was verified
 * @property string|null $two_factor_secret Two-factor authentication secret (hidden)
 * @property string|null $two_factor_recovery_codes Two-factor recovery codes (hidden)
 * @property \Illuminate\Support\Carbon|null $two_factor_confirmed_at When 2FA was confirmed
 * @property string|null $remember_token Remember me token (hidden)
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property \Illuminate\Support\Carbon|null $deleted_at
 *
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \Laravel\Sanctum\PersonalAccessToken> $tokens
 * @property-read \Illuminate\Notifications\DatabaseNotificationCollection<int, \Illuminate\Notifications\DatabaseNotification> $notifications
 */
class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, TwoFactorAuthenticatable, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'is_active',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Check if user has the admin role.
     *
     * @return bool
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * Check if user has the editor role.
     *
     * @return bool
     */
    public function isEditor(): bool
    {
        return $this->role === 'editor';
    }

    /**
     * Check if user has the viewer role.
     *
     * @return bool
     */
    public function isViewer(): bool
    {
        return $this->role === 'viewer';
    }

    /**
     * Check if user can edit content (admin or editor role).
     *
     * @return bool
     */
    public function canEdit(): bool
    {
        return in_array($this->role, ['admin', 'editor']);
    }
}
