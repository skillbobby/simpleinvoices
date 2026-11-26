<?php

namespace App\Http\Middleware;

use App\Support\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Resolves the active tenant before route model binding runs.
 *
 * The session guard can already resolve the user here even though the auth
 * middleware has not executed yet, so binding is always tenant-scoped.
 */
class SetTenantContext
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->tenant_id && $user->is_active) {
            $tenant = $user->relationLoaded('tenant') ? $user->tenant : $user->tenant()->first();

            if ($tenant && $tenant->isActive()) {
                TenantContext::set($tenant);
                $user->setRelation('tenant', $tenant);
            }
        }

        try {
            return $next($request);
        } finally {
            // Avoid leaking tenant state between requests on long-running workers.
            TenantContext::forget();
        }
    }
}
