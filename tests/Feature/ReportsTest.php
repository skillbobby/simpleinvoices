<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesTenants;
use Tests\TestCase;

class ReportsTest extends TestCase
{
    use CreatesTenants, RefreshDatabase;

    public function test_reports_aggregate_only_the_active_tenant(): void
    {
        $alpha = $this->makeTenant('Alpha');
        $beta = $this->makeTenant('Beta');
        $alphaUser = $this->makeUser($alpha);
        $this->makeUser($beta);

        $this->makeInvoice($alpha, $this->makeCustomer($alpha), ['items' => [['description' => 'A', 'quantity' => 1, 'unit_price' => 1000]]]);
        $this->makeInvoice($beta, $this->makeCustomer($beta), ['items' => [['description' => 'B', 'quantity' => 1, 'unit_price' => 9000]]]);

        $this->actingAs($alphaUser)
            ->get('/reports?from='.now()->startOfYear()->toDateString().'&to='.now()->toDateString())
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('reports/index')
                ->where('summary.billed', 1000)
                ->where('summary.invoice_count', 1)
                ->has('monthly')
                ->has('aging', 5)
                ->has('topCustomers', 1));
    }

    public function test_invoice_export_streams_a_csv_for_the_range(): void
    {
        $tenant = $this->makeTenant('Alpha');
        $user = $this->makeUser($tenant);
        $this->makeInvoice($tenant, $this->makeCustomer($tenant), ['items' => [['description' => 'A', 'quantity' => 1, 'unit_price' => 1200]]]);

        $response = $this->actingAs($user)->get('/reports/export?from='.now()->startOfYear()->toDateString().'&to='.now()->toDateString());

        $response->assertOk();
        $this->assertStringContainsString('text/csv', $response->headers->get('content-type'));

        $csv = $response->streamedContent();
        $this->assertStringContainsString('Number,Customer,Status', $csv);
        $this->assertStringContainsString('INV-0001', $csv);
        $this->assertStringContainsString('1200.00', $csv);
    }
}
