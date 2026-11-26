<?php

namespace App\Http\Middleware;

use App\Support\TenantContext;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');
        $tenant = TenantContext::get();
        $user = $request->user();

        return array_merge(parent::share($request), [
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'job_title' => $user->job_title,
                    'is_admin' => $user->isAdmin(),
                    'is_owner' => $user->isOwner(),
                    'can_manage_settings' => $user->canManageSettings(),
                    'can_manage_team' => $user->canManageTeam(),
                    'tenant_id' => $user->tenant_id,
                ] : null,
            ],
            'tenant' => $tenant ? [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'currency_code' => $tenant->currency_code,
                'invoice_prefix' => $tenant->invoice_prefix,
                'logo_path' => $tenant->logo_path,
            ] : null,
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ]);
    }
}
