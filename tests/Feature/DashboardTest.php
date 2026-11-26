<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesTenants;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use CreatesTenants, RefreshDatabase;

    public function test_dashboard_requires_authentication(): void
    {
        $this->get('/dashboard')->assertRedirect('/login');
    }

    public function test_dashboard_shows_tenant_metrics(): void
    {
        $tenant = $this->makeTenant('Acme');
        $user = $this->makeUser($tenant);
        $customer = $this->makeCustomer($tenant);
        $this->makeInvoice($tenant, $customer, ['items' => [['description' => 'Retainer', 'quantity' => 1, 'unit_price' => 500]]]);

        $this->actingAs($user)
            ->get('/dashboard')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('dashboard')
                ->where('metrics.invoice_count', 1)
                ->where('metrics.outstanding', 500)
                ->where('tenant.name', 'Acme'));
    }
}
