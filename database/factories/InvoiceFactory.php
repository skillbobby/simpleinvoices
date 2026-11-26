<?php

namespace Database\Factories;

use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Invoice>
 */
class InvoiceFactory extends Factory
{
    protected $model = Invoice::class;

    public function definition(): array
    {
        $subtotal = 1000;

        return [
            'tenant_id' => Tenant::factory(),
            'customer_id' => Customer::factory(),
            'number' => 'INV-'.fake()->unique()->numerify('####'),
            'status' => Invoice::STATUS_SENT,
            'issue_date' => now()->toDateString(),
            'due_date' => now()->addDays(14)->toDateString(),
            'currency_code' => 'USD',
            'customer_name' => fake()->name(),
            'customer_email' => fake()->safeEmail(),
            'subtotal' => $subtotal,
            'discount_type' => 'none',
            'discount_value' => 0,
            'discount_amount' => 0,
            'tax_total' => 0,
            'total' => $subtotal,
            'amount_paid' => 0,
            'balance' => $subtotal,
            'sent_at' => now(),
        ];
    }
}
