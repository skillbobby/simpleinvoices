<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\TenantProvisioner;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    public function __construct(private readonly TenantProvisioner $provisioner) {}

    /**
     * Show the registration page.
     */
    public function create(): Response
    {
        return Inertia::render('auth/register');
    }

    /**
     * Create the company (tenant) and its first owner account.
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'company_name' => ['required', 'string', 'max:255'],
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:'.User::class],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $user = DB::transaction(function () use ($request) {
            $tenant = $this->provisioner->provision([
                'name' => $request->string('company_name')->trim()->value(),
                'email' => $request->string('email')->lower()->value(),
            ]);

            return User::create([
                'tenant_id' => $tenant->id,
                'name' => $request->string('name')->trim()->value(),
                'email' => $request->string('email')->lower()->value(),
                'role' => User::ROLE_OWNER,
                'password' => Hash::make($request->string('password')->value()),
                'email_verified_at' => now(),
            ]);
        });

        event(new Registered($user));

        Auth::login($user);

        return to_route('dashboard');
    }
}
