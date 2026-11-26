<?php

namespace Tests\Unit\Services;

use App\Services\InvoiceCalculator;
use PHPUnit\Framework\TestCase;

class InvoiceCalculatorTest extends TestCase
{
    public function test_it_calculates_tax_on_the_discounted_value(): void
    {
        $result = (new InvoiceCalculator)->calculate([
            ['description' => 'Design', 'quantity' => 2, 'unit_price' => 100, 'tax_rate' => 10],
            ['description' => 'Hosting', 'quantity' => 1, 'unit_price' => 50, 'tax_rate' => 20],
        ], 'percent', 10);

        $this->assertSame(250.0, $result['subtotal']);
        $this->assertSame(25.0, $result['discount_amount']);
        $this->assertSame(27.0, $result['tax_total']);
        $this->assertSame(252.0, $result['total']);
        $this->assertSame(18.0, $result['items'][0]['tax_amount']);
        $this->assertSame(9.0, $result['items'][1]['tax_amount']);
    }

    public function test_fixed_discount_never_exceeds_the_subtotal(): void
    {
        $result = (new InvoiceCalculator)->calculate([
            ['description' => 'Work', 'quantity' => 1, 'unit_price' => 80, 'tax_rate' => 0],
        ], 'fixed', 500);

        $this->assertSame(80.0, $result['discount_amount']);
        $this->assertSame(0.0, $result['total']);
    }

    public function test_rounding_is_stable_for_fractional_quantities(): void
    {
        $result = (new InvoiceCalculator)->calculate([
            ['description' => 'Hours', 'quantity' => 1.5, 'unit_price' => 133.33, 'tax_rate' => 8.25],
        ]);

        $this->assertSame(200.0, $result['subtotal']);
        $this->assertSame(16.5, $result['tax_total']);
        $this->assertSame(216.5, $result['total']);
    }
}
