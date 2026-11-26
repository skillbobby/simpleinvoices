<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesTenants;
use Tests\TestCase;

class RolesTest extends TestCase
{
    use CreatesTenants, RefreshDatabase;

    public function test_staff_can_manage_customers_and_invoices(): void
    {
        $tenant = $this->makeTenant('Acme');
        $staff = $this->makeUser($tenant, User::ROLE_STAFF);
        $customer = $this->makeCustomer($tenant);

        $this->actingAs($staff)->get('/customers')->assertOk();
        $this->actingAs($staff)->post('/customers', ['name' => 'New Client'])->assertSessionHasNoErrors();

        $invoice = $this->makeInvoice($tenant, $customer);
        $this->actingAs($staff)->get('/invoices/'.$invoice->id)->assertOk();
    }

    public function test_staff_cannot_access_company_settings_or_team_management(): void
    {
        $tenant = $this->makeTenant('Acme');
        $staff = $this->makeUser($tenant, User::ROLE_STAFF);

        $this->actingAs($staff)->get('/settings/company')->assertForbidden();
        $this->actingAs($staff)->get('/settings/tax-rates')->assertForbidden();
        $this->actingAs($staff)->get('/settings/team')->assertForbidden();
        $this->actingAs($staff)->post('/settings/team', [
            'name' => 'Sneaky',
            'email' => 'sneaky@acme.test',
            'role' => 'admin',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertForbidden();
    }

    public function test_staff_cannot_void_delete_or_reassign_invoices(): void
    {
        $tenant = $this->makeTenant('Acme');
        $staff = $this->makeUser($tenant, User::ROLE_STAFF);
        $customer = $this->makeCustomer($tenant);
        $invoice = $this->makeInvoice($tenant, $customer);

        $this->actingAs($staff)->post('/invoices/'.$invoice->id.'/void')->assertForbidden();
        $this->actingAs($staff)->delete('/invoices/'.$invoice->id)->assertForbidden();
        $this->assertSame('sent', $invoice->fresh()->status);
    }

    public function test_admin_can_manage_settings_and_team(): void
    {
        $tenant = $this->makeTenant('Acme');
        $admin = $this->makeUser($tenant, User::ROLE_ADMIN);

        $this->actingAs($admin)->get('/settings/company')->assertOk();
        $this->actingAs($admin)->get('/settings/team')->assertOk();

        $this->actingAs($admin)->post('/settings/team', [
            'name' => 'New Staffer',
            'email' => 'staffer@acme.test',
            'role' => User::ROLE_STAFF,
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertSessionHasNoErrors();

        $this->assertDatabaseHas('users', [
            'email' => 'staffer@acme.test',
            'tenant_id' => $tenant->id,
            'role' => User::ROLE_STAFF,
        ]);
    }

    public function test_team_members_cannot_be_removed_by_themselves_or_when_owner(): void
    {
        $tenant = $this->makeTenant('Acme');
        $owner = $this->makeUser($tenant, User::ROLE_OWNER);

        $this->actingAs($owner)->delete('/settings/team/'.$owner->id)->assertForbidden();
    }
}
