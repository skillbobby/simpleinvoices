<?php

namespace Database\Factories;

use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Tenant>
 */
class TenantFactory extends Factory
{
    protected $model = Tenant::class;

    public function definition(): array
    {
        $name = fake()->unique()->company();

        return [
            'name' => $name,
            'slug' => Tenant::uniqueSlug($name.'-'.fake()->unique()->numerify('###')),
            'email' => fake()->companyEmail(),
            'phone' => fake()->phoneNumber(),
            'address_line1' => fake()->streetAddress(),
            'city' => fake()->city(),
            'state' => fake()->stateAbbr(),
            'postal_code' => fake()->postcode(),
            'country' => 'United States',
            'currency_code' => 'USD',
            'invoice_prefix' => 'INV',
            'invoice_next_number' => 1,
            'invoice_number_padding' => 4,
            'default_payment_terms_days' => 14,
            'invoice_footer' => 'Thank you for your business.',
            'is_active' => true,
        ];
    }
}
