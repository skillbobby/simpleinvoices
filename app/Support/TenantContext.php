<?php

namespace App\Support;

use App\Models\Tenant;

/**
 * Request-scoped holder for the tenant the current request operates in.
 *
 * The active tenant is resolved by the SetTenantContext middleware from the
 * authenticated user and is used by the BelongsToTenant global scope.
 */
class TenantContext
{
    protected static ?Tenant $tenant = null;

    public static function set(?Tenant $tenant): void
    {
        static::$tenant = $tenant;
    }

    public static function get(): ?Tenant
    {
        return static::$tenant;
    }

    public static function id(): ?int
    {
        return static::$tenant?->id;
    }

    public static function has(): bool
    {
        return static::$tenant !== null;
    }

    public static function forget(): void
    {
        static::$tenant = null;
    }

    /**
     * Run a callback inside the given tenant context and restore the previous one.
     *
     * @template T
     *
     * @param  callable(Tenant): T  $callback
     * @return T
     */
    public static function run(Tenant $tenant, callable $callback): mixed
    {
        $previous = static::$tenant;
        static::$tenant = $tenant;

        try {
            return $callback($tenant);
        } finally {
            static::$tenant = $previous;
        }
    }
}
