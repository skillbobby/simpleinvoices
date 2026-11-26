<?php

namespace Database\Factories;

use App\Models\Invoice;
use App\Models\InvoiceItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<InvoiceItem>
 */
class InvoiceItemFactory extends Factory
{
    protected $model = InvoiceItem::class;

    public function definition(): array
    {
        return [
            'invoice_id' => Invoice::factory(),
            'description' => fake()->sentence(3),
            'quantity' => 1,
            'unit' => 'unit',
            'unit_price' => 500,
            'tax_rate' => 0,
            'tax_amount' => 0,
            'line_subtotal' => 500,
            'line_total' => 500,
            'sort_order' => 0,
        ];
    }
}
