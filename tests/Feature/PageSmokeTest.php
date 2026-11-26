<?php

namespace Tests\Feature;

use App\Models\Invoice;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Renders every Inertia page for the seeded demo tenant. This protects against
 * missing page components, controller prop drift and broken route wiring.
 */
class PageSmokeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(DatabaseSeeder::class);
    }

    public function test_every_application_page_renders_for_the_owner(): void
    {
        $owner = User::query()->where('email', 'demo@simpleinvoices.test')->firstOrFail();
        $invoice = Invoice::withoutGlobalScopes()
            ->where('tenant_id', $owner->tenant_id)
            ->where('status', Invoice::STATUS_DRAFT)
            ->firstOrFail();
        $customer = $invoice->customer;

        $this->actingAs($owner);

        $pages = [
            '/dashboard' => 'dashboard',
            '/invoices' => 'invoices/index',
            '/invoices?status=overdue' => 'invoices/index',
            '/invoices/create' => 'invoices/create',
            '/invoices/'.$invoice->id => 'invoices/show',
            '/invoices/'.$invoice->id.'/edit' => 'invoices/edit',
            '/customers' => 'customers/index',
            '/customers/create' => 'customers/create',
            '/customers/'.$customer->id => 'customers/show',
            '/customers/'.$customer->id.'/edit' => 'customers/edit',
            '/products' => 'products/index',
            '/products/create' => 'products/create',
            '/payments' => 'payments/index',
            '/reports' => 'reports/index',
            '/settings/company' => 'settings/company',
            '/settings/tax-rates' => 'settings/tax-rates',
            '/settings/payment-terms' => 'settings/payment-terms',
            '/settings/team' => 'settings/team',
            '/settings/profile' => 'settings/profile',
            '/settings/password' => 'settings/password',
            '/settings/appearance' => 'settings/appearance',
        ];

        foreach ($pages as $url => $component) {
            $this->get($url)
                ->assertOk()
                ->assertInertia(fn ($page) => $page->component($component));
        }
    }

    public function test_public_invoice_page_renders_from_the_demo_data(): void
    {
        $invoice = Invoice::withoutGlobalScopes()
            ->whereNotNull('public_token')
            ->firstOrFail();

        $this->get('/i/'.$invoice->public_token)
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('public/invoice')
                ->where('invoice.number', $invoice->number));
    }

    public function test_demo_tenants_have_independent_invoice_numbering(): void
    {
        $numbers = Invoice::withoutGlobalScopes()
            ->orderBy('tenant_id')
            ->orderBy('number')
            ->get(['tenant_id', 'number'])
            ->groupBy('tenant_id')
            ->map(fn ($invoices) => $invoices->pluck('number')->first());

        $this->assertCount(2, $numbers);
        $this->assertNotSame($numbers->values()[0], $numbers->values()[1]);
    }
}
