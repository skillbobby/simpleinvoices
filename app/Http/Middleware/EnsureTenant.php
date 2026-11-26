<?php

namespace App\Http\Middleware;

use App\Support\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Resolves the active tenant for the authenticated user.
 *
 * This runs as route middleware (after auth) so the user is available; the
 * companion SetTenantContext middleware handles non-authenticated web paths.
 */
class EnsureTenant
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user?->tenant_id || ! $user->is_active) {
            abort(403, 'Your account is not linked to an active company.');
        }

        $tenant = $user->tenant()->first();

        if (! $tenant || ! $tenant->isActive()) {
            abort(403, 'Your company account is inactive.');
        }

        TenantContext::set($tenant);
        $user->setRelation('tenant', $tenant);

        try {
            return $next($request);
        } finally {
            TenantContext::forget();
        }
    }
}
