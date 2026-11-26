<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesTenants;
use Tests\TestCase;

class InvoicePdfTest extends TestCase
{
    use CreatesTenants, RefreshDatabase;

    public function test_authenticated_invoice_pdf_downloads(): void
    {
        $tenant = $this->makeTenant('Acme');
        $user = $this->makeUser($tenant);
        $customer = $this->makeCustomer($tenant, ['name' => 'Lumen Health', 'address_line1' => '1 Market St', 'city' => 'San Francisco']);
        $invoice = $this->makeInvoice($tenant, $customer, ['items' => [['description' => 'Design sprint', 'quantity' => 2, 'unit_price' => 400]]]);

        $response = $this->actingAs($user)->get('/invoices/'.$invoice->id.'/pdf');

        $response->assertOk();
        $this->assertSame('application/pdf', $response->headers->get('content-type'));
        $this->assertStringContainsString($invoice->number.'.pdf', $response->headers->get('content-disposition'));
        $this->assertStringStartsWith('%PDF', $response->getContent());
    }

    public function test_public_pdf_requires_a_valid_token(): void
    {
        $tenant = $this->makeTenant('Acme');
        $user = $this->makeUser($tenant);
        $invoice = $this->makeInvoice($tenant, $this->makeCustomer($tenant));

        $this->actingAs($user)->post('/invoices/'.$invoice->id.'/send');
        $invoice->refresh();

        $this->get('/i/'.$invoice->public_token.'/pdf')
            ->assertOk()
            ->assertHeader('content-type', 'application/pdf');

        $this->get('/i/wrong-token/pdf')->assertNotFound();
    }
}
