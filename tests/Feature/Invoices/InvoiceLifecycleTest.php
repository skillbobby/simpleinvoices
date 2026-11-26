<?php

namespace Tests\Feature\Invoices;

use App\Models\Invoice;
use App\Models\Payment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesTenants;
use Tests\TestCase;

class InvoiceLifecycleTest extends TestCase
{
    use CreatesTenants, RefreshDatabase;

    public function test_invoice_can_be_created_with_tax_and_percentage_discount(): void
    {
        $tenant = $this->makeTenant('Acme', ['invoice_prefix' => 'ACM']);
        $user = $this->makeUser($tenant);
        $customer = $this->makeCustomer($tenant);
        $tax = $this->taxRate($tenant, 10);

        $this->actingAs($user)->post('/invoices', [
            'customer_id' => $customer->id,
            'issue_date' => '2026-02-01',
            'due_date' => '2026-02-15',
            'currency_code' => 'USD',
            'discount_type' => 'percent',
            'discount_value' => 10,
            'status' => 'draft',
            'items' => [
                ['description' => 'Design', 'quantity' => 2, 'unit_price' => 100, 'tax_rate_id' => $tax->id],
            ],
        ])->assertRedirect();

        $invoice = Invoice::query()->firstOrFail();

        $this->assertSame('ACM-0001', $invoice->number);
        $this->assertSame('200.00', (string) $invoice->subtotal);
        $this->assertSame('20.00', (string) $invoice->discount_amount);
        $this->assertSame('18.00', (string) $invoice->tax_total);
        $this->assertSame('198.00', (string) $invoice->total);
        $this->assertSame('198.00', (string) $invoice->balance);
        $this->assertSame(1, $invoice->items()->count());
        $this->assertSame('2026-02-15', $invoice->due_date->toDateString());
    }

    public function test_invoice_numbers_are_sequential_and_per_tenant(): void
    {
        $acme = $this->makeTenant('Acme', ['invoice_prefix' => 'ACM']);
        $northwind = $this->makeTenant('Northwind', ['invoice_prefix' => 'NW']);
        $acmeUser = $this->makeUser($acme);
        $northwindUser = $this->makeUser($northwind);

        $acmeCustomer = $this->makeCustomer($acme);
        $northwindCustomer = $this->makeCustomer($northwind);

        $first = $this->makeInvoice($acme, $acmeCustomer);
        $second = $this->makeInvoice($acme, $acmeCustomer);
        $other = $this->makeInvoice($northwind, $northwindCustomer);

        $this->assertSame('ACM-0001', $first->number);
        $this->assertSame('ACM-0002', $second->number);
        $this->assertSame('NW-0001', $other->number);
    }

    public function test_payments_move_invoice_through_partial_and_paid_states(): void
    {
        $tenant = $this->makeTenant('Acme');
        $user = $this->makeUser($tenant);
        $customer = $this->makeCustomer($tenant);
        $invoice = $this->makeInvoice($tenant, $customer, ['items' => [['description' => 'Work', 'quantity' => 1, 'unit_price' => 500]]]);

        $this->actingAs($user)->post('/invoices/'.$invoice->id.'/payments', [
            'amount' => 200,
            'paid_on' => today()->toDateString(),
            'method' => 'bank_transfer',
            'reference' => 'REF-1',
        ])->assertSessionHasNoErrors();

        $invoice->refresh();
        $this->assertSame('partial', $invoice->status);
        $this->assertSame('300.00', (string) $invoice->balance);

        $this->actingAs($user)->post('/invoices/'.$invoice->id.'/payments', [
            'amount' => 300,
            'paid_on' => today()->toDateString(),
            'method' => 'credit_card',
        ])->assertSessionHasNoErrors();

        $invoice->refresh();
        $this->assertSame('paid', $invoice->status);
        $this->assertSame('0.00', (string) $invoice->balance);
        $this->assertNotNull($invoice->paid_at);
        $this->assertSame(2, Payment::query()->count());
    }

    public function test_payment_cannot_exceed_the_outstanding_balance(): void
    {
        $tenant = $this->makeTenant('Acme');
        $user = $this->makeUser($tenant);
        $customer = $this->makeCustomer($tenant);
        $invoice = $this->makeInvoice($tenant, $customer, ['items' => [['description' => 'Work', 'quantity' => 1, 'unit_price' => 100]]]);

        $this->actingAs($user)->post('/invoices/'.$invoice->id.'/payments', [
            'amount' => 250,
            'paid_on' => today()->toDateString(),
            'method' => 'cash',
        ])->assertSessionHasErrors('amount');

        $this->assertDatabaseCount('payments', 0);
        $this->assertSame('100.00', (string) $invoice->fresh()->balance);
    }

    public function test_void_invoice_rejects_payments_and_leaves_outstanding_totals(): void
    {
        $tenant = $this->makeTenant('Acme');
        $user = $this->makeUser($tenant);
        $customer = $this->makeCustomer($tenant);
        $invoice = $this->makeInvoice($tenant, $customer);

        $this->actingAs($user)->post('/invoices/'.$invoice->id.'/void')->assertSessionHasNoErrors();

        $invoice->refresh();
        $this->assertSame('void', $invoice->status);
        $this->assertSame('0.00', (string) $invoice->balance);

        $this->actingAs($user)->post('/invoices/'.$invoice->id.'/payments', [
            'amount' => 10,
            'paid_on' => today()->toDateString(),
            'method' => 'cash',
        ])->assertSessionHasErrors('amount');
    }

    public function test_duplicate_creates_a_draft_copy_with_the_same_lines(): void
    {
        $tenant = $this->makeTenant('Acme');
        $user = $this->makeUser($tenant);
        $customer = $this->makeCustomer($tenant);
        $invoice = $this->makeInvoice($tenant, $customer, ['items' => [['description' => 'Retainer', 'quantity' => 3, 'unit_price' => 250]]]);

        $this->actingAs($user)->post('/invoices/'.$invoice->id.'/duplicate')->assertRedirect();

        $copy = Invoice::query()->where('id', '!=', $invoice->id)->firstOrFail();

        $this->assertSame('draft', $copy->status);
        $this->assertSame('750.00', (string) $copy->total);
        $this->assertSame(1, $copy->items()->count());
        $this->assertSame('3.00', (string) $copy->items()->first()->quantity);
        $this->assertSame('750.00', (string) $copy->items()->first()->line_subtotal);
    }

    public function test_updating_items_recalculates_totals_and_balance(): void
    {
        $tenant = $this->makeTenant('Acme');
        $user = $this->makeUser($tenant);
        $customer = $this->makeCustomer($tenant);
        $invoice = $this->makeInvoice($tenant, $customer, ['items' => [['description' => 'Work', 'quantity' => 1, 'unit_price' => 100]]]);

        $this->actingAs($user)->put('/invoices/'.$invoice->id, [
            'customer_id' => $customer->id,
            'issue_date' => today()->toDateString(),
            'discount_type' => 'fixed',
            'discount_value' => 50,
            'items' => [
                ['description' => 'Work', 'quantity' => 2, 'unit_price' => 200],
            ],
        ])->assertSessionHasNoErrors();

        $invoice->refresh();
        $this->assertSame('400.00', (string) $invoice->subtotal);
        $this->assertSame('50.00', (string) $invoice->discount_amount);
        $this->assertSame('350.00', (string) $invoice->total);
        $this->assertSame('350.00', (string) $invoice->balance);
    }

    public function test_invoice_requires_at_least_one_line_item(): void
    {
        $tenant = $this->makeTenant('Acme');
        $user = $this->makeUser($tenant);
        $customer = $this->makeCustomer($tenant);

        $this->actingAs($user)->post('/invoices', [
            'customer_id' => $customer->id,
            'issue_date' => today()->toDateString(),
            'discount_type' => 'none',
            'items' => [],
        ])->assertSessionHasErrors('items');

        $this->assertDatabaseCount('invoices', 0);
    }

    public function test_overdue_status_is_derived_from_due_date_and_balance(): void
    {
        $tenant = $this->makeTenant('Acme');
        $user = $this->makeUser($tenant);
        $customer = $this->makeCustomer($tenant);
        $invoice = $this->makeInvoice($tenant, $customer, [
            'issue_date' => today()->subDays(30)->toDateString(),
            'due_date' => today()->subDays(10)->toDateString(),
            'items' => [['description' => 'Late work', 'quantity' => 1, 'unit_price' => 250]],
        ]);

        $this->assertSame('overdue', $invoice->displayStatus());
        $this->assertSame(10, $invoice->daysOverdue());

        $this->actingAs($user)
            ->get('/invoices?status=overdue')
            ->assertInertia(fn ($page) => $page
                ->component('invoices/index')
                ->has('invoices.data', 1)
                ->where('summary.overdue.total', 250));

        $this->actingAs($user)->post('/invoices/'.$invoice->id.'/payments', [
            'amount' => 250,
            'paid_on' => today()->toDateString(),
            'method' => 'bank_transfer',
        ])->assertSessionHasNoErrors();

        $this->assertSame('paid', $invoice->fresh()->displayStatus());
        $this->assertFalse($invoice->fresh()->isOverdue());
    }
}
