<?php

namespace Tests\Concerns;

use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Product;
use App\Models\TaxRate;
use App\Models\Tenant;
use App\Models\User;
use App\Services\InvoiceService;
use App\Services\TenantProvisioner;
use App\Support\TenantContext;
use Illuminate\Support\Facades\Hash;

trait CreatesTenants
{
    protected function makeTenant(string $name = 'Acme', array $attributes = []): Tenant
    {
        return app(TenantProvisioner::class)->provision(['name' => $name, ...$attributes]);
    }

    protected function makeUser(Tenant $tenant, string $role = User::ROLE_OWNER, array $attributes = []): User
    {
        return User::create([
            'tenant_id' => $tenant->id,
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'role' => $role,
            'is_active' => true,
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
            ...$attributes,
        ]);
    }

    protected function makeCustomer(Tenant $tenant, array $attributes = []): Customer
    {
        return TenantContext::run($tenant, fn () => Customer::create([
            'name' => 'Customer of '.$tenant->name,
            'email' => fake()->unique()->safeEmail(),
            ...$attributes,
        ]));
    }

    protected function makeProduct(Tenant $tenant, array $attributes = []): Product
    {
        return TenantContext::run($tenant, fn () => Product::create([
            'name' => 'Retainer',
            'unit_price' => 100,
            'unit' => 'month',
            ...$attributes,
        ]));
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function makeInvoice(Tenant $tenant, Customer $customer, array $overrides = []): Invoice
    {
        return TenantContext::run($tenant, fn () => app(InvoiceService::class)->create($tenant, [
            'customer_id' => $customer->id,
            'issue_date' => today()->toDateString(),
            'due_date' => today()->addDays(14)->toDateString(),
            'discount_type' => 'none',
            'discount_value' => 0,
            'status' => 'sent',
            'items' => [[
                'description' => 'Design retainer',
                'quantity' => 1,
                'unit_price' => 1000,
            ]],
            ...$overrides,
        ]));
    }

    protected function taxRate(Tenant $tenant, float $rate = 10): TaxRate
    {
        return TenantContext::run($tenant, fn () => TaxRate::create([
            'name' => 'Tax '.$rate,
            'rate' => $rate,
            'is_active' => true,
        ]));
    }
}
