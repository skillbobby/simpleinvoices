<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class TeamController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()->canManageTeam(), 403);

        return Inertia::render('settings/team', [
            'members' => User::query()
                ->where('tenant_id', TenantContext::id())
                ->orderByRaw("case when role = 'owner' then 0 when role = 'admin' then 1 else 2 end")
                ->orderBy('name')
                ->get()
                ->map(fn (User $user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'job_title' => $user->job_title,
                    'role' => $user->role,
                    'is_active' => $user->is_active,
                    'is_self' => $user->id === $request->user()->id,
                    'created_at' => $user->created_at?->toDateString(),
                ]),
            'roles' => [
                ['value' => User::ROLE_ADMIN, 'label' => 'Admin'],
                ['value' => User::ROLE_STAFF, 'label' => 'Staff'],
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        abort_unless($request->user()->canManageTeam(), 403);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            'job_title' => ['nullable', 'string', 'max:255'],
            'role' => ['required', Rule::in([User::ROLE_ADMIN, User::ROLE_STAFF])],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        User::create([
            'tenant_id' => TenantContext::id(),
            'name' => $data['name'],
            'email' => $data['email'],
            'job_title' => $data['job_title'] ?? null,
            'role' => $data['role'],
            'password' => Hash::make($data['password']),
            'email_verified_at' => now(),
        ]);

        return back()->with('success', 'Team member added.');
    }

    public function update(Request $request, User $member): RedirectResponse
    {
        abort_unless($request->user()->canManageTeam(), 403);
        abort_unless($member->tenant_id === TenantContext::id(), 404);

        $data = $request->validate([
            'role' => ['required', Rule::in([User::ROLE_ADMIN, User::ROLE_STAFF])],
            'is_active' => ['sometimes', 'boolean'],
            'job_title' => ['nullable', 'string', 'max:255'],
        ]);

        if ($member->id === $request->user()->id) {
            $data['role'] = $member->role;
            $data['is_active'] = true;
        }

        if ($member->isOwner()) {
            abort(403, 'The company owner cannot be modified here.');
        }

        $member->update([
            'role' => $data['role'],
            'is_active' => $request->boolean('is_active', $member->is_active),
            'job_title' => $data['job_title'] ?? $member->job_title,
        ]);

        return back()->with('success', 'Team member updated.');
    }

    public function destroy(Request $request, User $member): RedirectResponse
    {
        abort_unless($request->user()->canManageTeam(), 403);
        abort_unless($member->tenant_id === TenantContext::id(), 404);
        abort_if($member->id === $request->user()->id, 403, 'You cannot remove yourself.');
        abort_if($member->isOwner(), 403, 'The company owner cannot be removed.');

        $member->delete();

        return back()->with('success', 'Team member removed.');
    }
}
