<?php

namespace Database\Factories;

use App\Models\PaymentTerm;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PaymentTerm>
 */
class PaymentTermFactory extends Factory
{
    protected $model = PaymentTerm::class;

    public function definition(): array
    {
        return [
            'tenant_id' => Tenant::factory(),
            'name' => 'Net 14',
            'days' => 14,
            'is_default' => false,
        ];
    }
}
