<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesTenants;
use Tests\TestCase;

class ResourceCrudTest extends TestCase
{
    use CreatesTenants, RefreshDatabase;

    public function test_customers_can_be_created_updated_and_deleted(): void
    {
        $tenant = $this->makeTenant('Acme');
        $staff = $this->makeUser($tenant, User::ROLE_STAFF);

        $this->actingAs($staff)->post('/customers', [
            'name' => 'Maya Chen',
            'company_name' => 'Lumen Health',
            'email' => 'maya@lumen.test',
            'address_line1' => '1 Market St',
            'city' => 'San Francisco',
            'is_active' => true,
        ])->assertRedirect();

        $customer = Customer::query()->firstOrFail();
        $this->assertSame($tenant->id, $customer->tenant_id);

        $this->actingAs($staff)->patch('/customers/'.$customer->id, [
            'name' => 'Maya Chen-Ruiz',
            'email' => 'maya@lumen.test',
            'is_active' => true,
        ])->assertRedirect(route('customers.show', $customer, absolute: false));

        $this->assertSame('Maya Chen-Ruiz', $customer->fresh()->name);

        $this->actingAs($staff)->delete('/customers/'.$customer->id)->assertRedirect();
        $this->assertSoftDeleted($customer);
    }

    public function test_customer_with_invoices_is_archived_instead_of_deleted(): void
    {
        $tenant = $this->makeTenant('Acme');
        $owner = $this->makeUser($tenant);
        $customer = $this->makeCustomer($tenant);
        $this->makeInvoice($tenant, $customer);

        $this->actingAs($owner)->delete('/customers/'.$customer->id)->assertSessionHas('error');

        $this->assertDatabaseHas('customers', ['id' => $customer->id, 'is_active' => false]);
        $this->assertNotSoftDeleted($customer);
    }

    public function test_products_can_be_managed_with_a_tenant_tax_rate(): void
    {
        $tenant = $this->makeTenant('Acme');
        $staff = $this->makeUser($tenant, User::ROLE_STAFF);
        $tax = $this->taxRate($tenant, 20);

        $this->actingAs($staff)->post('/products', [
            'name' => 'Engineering sprint',
            'sku' => 'ENG-1',
            'description' => 'Two week sprint',
            'unit_price' => 9500,
            'unit' => 'sprint',
            'tax_rate_id' => $tax->id,
            'is_active' => true,
        ])->assertRedirect(route('products.index', absolute: false));

        $product = Product::query()->firstOrFail();
        $this->assertSame('9500.00', (string) $product->unit_price);

        $this->actingAs($staff)->patch('/products/'.$product->id, [
            'name' => 'Engineering sprint (updated)',
            'sku' => 'ENG-1',
            'unit_price' => 9900,
            'unit' => 'sprint',
            'tax_rate_id' => $tax->id,
            'is_active' => true,
        ])->assertSessionHasNoErrors();

        $this->assertSame('9900.00', (string) $product->fresh()->unit_price);

        $this->actingAs($staff)->delete('/products/'.$product->id)->assertRedirect();
        $this->assertSoftDeleted($product);
    }

    public function test_products_cannot_use_another_tenants_tax_rate(): void
    {
        $alpha = $this->makeTenant('Alpha');
        $beta = $this->makeTenant('Beta');
        $staff = $this->makeUser($alpha, User::ROLE_STAFF);
        $foreignTax = $this->taxRate($beta, 25);

        $this->actingAs($staff)->post('/products', [
            'name' => 'Leak attempt',
            'unit_price' => 10,
            'tax_rate_id' => $foreignTax->id,
            'is_active' => true,
        ])->assertSessionHasErrors('tax_rate_id');

        $this->assertDatabaseCount('products', 0);
    }

    public function test_product_requires_a_valid_price(): void
    {
        $tenant = $this->makeTenant('Acme');
        $staff = $this->makeUser($tenant, User::ROLE_STAFF);

        $this->actingAs($staff)->post('/products', [
            'name' => 'Missing price',
        ])->assertSessionHasErrors('unit_price');
    }
}
