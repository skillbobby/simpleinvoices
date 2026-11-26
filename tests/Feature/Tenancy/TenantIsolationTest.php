<?php

namespace Tests\Feature\Tenancy;

use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesTenants;
use Tests\TestCase;

class TenantIsolationTest extends TestCase
{
    use CreatesTenants, RefreshDatabase;

    private Tenant $alpha;

    private Tenant $beta;

    private User $alphaUser;

    private User $betaUser;

    private Customer $alphaCustomer;

    private Customer $betaCustomer;

    private Invoice $alphaInvoice;

    private Invoice $betaInvoice;

    protected function setUp(): void
    {
        parent::setUp();

        $this->alpha = $this->makeTenant('Alpha Co');
        $this->beta = $this->makeTenant('Beta Co');

        $this->alphaUser = $this->makeUser($this->alpha);
        $this->betaUser = $this->makeUser($this->beta);

        $this->alphaCustomer = $this->makeCustomer($this->alpha, ['name' => 'Alpha Client']);
        $this->betaCustomer = $this->makeCustomer($this->beta, ['name' => 'Beta Client']);

        $this->alphaInvoice = $this->makeInvoice($this->alpha, $this->alphaCustomer, ['items' => [['description' => 'Alpha work', 'quantity' => 1, 'unit_price' => 400]]]);
        $this->betaInvoice = $this->makeInvoice($this->beta, $this->betaCustomer, ['items' => [['description' => 'Beta work', 'quantity' => 1, 'unit_price' => 900]]]);
    }

    public function test_customer_index_only_contains_active_tenant_records(): void
    {
        $this->actingAs($this->alphaUser)
            ->get('/customers')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('customers/index')
                ->has('customers.data', 1)
                ->where('customers.data.0.name', 'Alpha Client'));
    }

    public function test_other_tenant_customer_is_not_reachable(): void
    {
        $this->actingAs($this->alphaUser)->get('/customers/'.$this->betaCustomer->id)->assertNotFound();
        $this->actingAs($this->alphaUser)->patch('/customers/'.$this->betaCustomer->id, [
            'name' => 'Hijacked',
        ])->assertNotFound();
        $this->actingAs($this->alphaUser)->delete('/customers/'.$this->betaCustomer->id)->assertNotFound();

        $this->assertDatabaseHas('customers', ['id' => $this->betaCustomer->id, 'name' => 'Beta Client']);
    }

    public function test_other_tenant_invoice_and_pdf_are_not_reachable(): void
    {
        $this->actingAs($this->alphaUser)->get('/invoices/'.$this->betaInvoice->id)->assertNotFound();
        $this->actingAs($this->alphaUser)->get('/invoices/'.$this->betaInvoice->id.'/edit')->assertNotFound();
        $this->actingAs($this->alphaUser)->get('/invoices/'.$this->betaInvoice->id.'/pdf')->assertNotFound();
    }

    public function test_payment_cannot_be_recorded_against_other_tenant_invoice(): void
    {
        $this->actingAs($this->alphaUser)->post('/invoices/'.$this->betaInvoice->id.'/payments', [
            'amount' => 10,
            'paid_on' => today()->toDateString(),
            'method' => 'cash',
        ])->assertNotFound();

        $this->assertDatabaseCount('payments', 0);
    }

    public function test_public_invoice_link_is_scoped_to_its_own_token(): void
    {
        $this->actingAs($this->alphaUser)->post('/invoices/'.$this->alphaInvoice->id.'/send');
        $this->actingAs($this->betaUser)->post('/invoices/'.$this->betaInvoice->id.'/send');

        $alpha = $this->alphaInvoice->fresh();
        $beta = $this->betaInvoice->fresh();

        $this->get('/i/'.$alpha->public_token)
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('public/invoice')
                ->where('invoice.number', $alpha->number)
                ->where('company.name', 'Alpha Co'));

        $this->get('/i/'.$beta->public_token)
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('company.name', 'Beta Co'));

        $this->get('/i/not-a-real-token')->assertNotFound();
    }

    public function test_dashboard_metrics_do_not_mix_tenants(): void
    {
        $this->actingAs($this->alphaUser)
            ->get('/dashboard')
            ->assertInertia(fn ($page) => $page
                ->where('metrics.invoice_count', 1)
                ->where('metrics.outstanding', 400)
                ->where('metrics.customer_count', 1));
    }

    public function test_team_management_cannot_touch_users_of_other_tenants(): void
    {
        $this->actingAs($this->alphaUser)
            ->patch('/settings/team/'.$this->betaUser->id, ['role' => 'staff'])
            ->assertNotFound();

        $this->actingAs($this->alphaUser)
            ->delete('/settings/team/'.$this->betaUser->id)
            ->assertNotFound();
    }

    public function test_inactive_company_cannot_access_the_application(): void
    {
        $this->alpha->update(['is_active' => false]);

        $this->actingAs($this->alphaUser)->get('/dashboard')->assertForbidden();
    }
}
