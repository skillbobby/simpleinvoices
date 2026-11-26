<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    public const ROLE_OWNER = 'owner';

    public const ROLE_ADMIN = 'admin';

    public const ROLE_STAFF = 'staff';

    public const ROLES = [self::ROLE_OWNER, self::ROLE_ADMIN, self::ROLE_STAFF];

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $attributes = [
        'role' => self::ROLE_STAFF,
        'is_active' => true,
    ];

    protected $fillable = [
        'tenant_id',
        'name',
        'job_title',
        'email',
        'phone',
        'role',
        'is_active',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
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
            'is_active' => 'boolean',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function isOwner(): bool
    {
        return $this->role === self::ROLE_OWNER;
    }

    public function isAdmin(): bool
    {
        return in_array($this->role, [self::ROLE_OWNER, self::ROLE_ADMIN], true);
    }

    public function isStaff(): bool
    {
        return $this->role === self::ROLE_STAFF;
    }

    public function canManageTeam(): bool
    {
        return $this->isAdmin();
    }

    public function canManageSettings(): bool
    {
        return $this->isAdmin();
    }

    public function firstName(): string
    {
        return explode(' ', trim((string) $this->name))[0] ?: (string) $this->name;
    }
}
