<?php

namespace Tests\Feature;

use App\Models\PaymentTerm;
use App\Models\TaxRate;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_creates_a_tenant_and_owner_account(): void
    {
        $this->post('/register', [
            'company_name' => 'Acme Studio',
            'name' => 'Demo Owner',
            'email' => 'owner@acme.test',
            'password' => 'password',
            'password_confirmation' => 'password',
        ])->assertRedirect('/dashboard');

        $this->assertAuthenticated();

        $tenant = Tenant::query()->where('name', 'Acme Studio')->firstOrFail();
        $user = User::query()->where('email', 'owner@acme.test')->firstOrFail();

        $this->assertSame($tenant->id, $user->tenant_id);
        $this->assertSame(User::ROLE_OWNER, $user->role);
        $this->assertSame('acme-studio', $tenant->slug);
        $this->assertSame(2, PaymentTerm::query()->where('tenant_id', $tenant->id)->count());
        $this->assertSame(1, TaxRate::query()->where('tenant_id', $tenant->id)->count());
    }

    public function test_company_name_is_required(): void
    {
        $this->post('/register', [
            'name' => 'Demo Owner',
            'email' => 'owner@acme.test',
            'password' => 'password',
            'password_confirmation' => 'password',
        ])->assertSessionHasErrors('company_name');

        $this->assertDatabaseCount('tenants', 0);
    }

    public function test_email_must_be_unique_across_tenants(): void
    {
        $tenant = Tenant::factory()->create();
        User::factory()->create(['tenant_id' => $tenant->id, 'email' => 'owner@acme.test']);

        $this->post('/register', [
            'company_name' => 'Another Co',
            'name' => 'Other Owner',
            'email' => 'owner@acme.test',
            'password' => 'password',
            'password_confirmation' => 'password',
        ])->assertSessionHasErrors('email');
    }

    public function test_users_can_only_reach_their_own_dashboard_after_login(): void
    {
        $tenant = Tenant::factory()->create();
        $user = User::factory()->owner()->create([
            'tenant_id' => $tenant->id,
            'email' => 'login@acme.test',
        ]);

        $this->post('/login', [
            'email' => 'login@acme.test',
            'password' => 'password',
        ])->assertRedirect('/dashboard');

        $this->assertAuthenticatedAs($user);
    }
}
