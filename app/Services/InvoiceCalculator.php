<?php

namespace App\Services;

/**
 * Pure money maths for invoices. Keeping this side-effect free makes the
 * calculation unit-testable and guarantees web requests, seeders and imports
 * all produce identical totals.
 */
class InvoiceCalculator
{
    /**
     * @param  array<int, array<string, mixed>>  $items
     * @return array{items: array<int, array<string, mixed>>, subtotal: float, discount_amount: float, tax_total: float, total: float}
     */
    public function calculate(array $items, string $discountType = 'none', float|string|null $discountValue = 0): array
    {
        $discountType = in_array($discountType, ['none', 'fixed', 'percent'], true) ? $discountType : 'none';
        $discountValue = max(0, (float) $discountValue);

        $subtotal = 0.0;
        $normalized = [];

        foreach (array_values($items) as $index => $item) {
            $quantity = round((float) ($item['quantity'] ?? 0), 2);
            $unitPrice = round((float) ($item['unit_price'] ?? 0), 2);
            $taxRate = round((float) ($item['tax_rate'] ?? 0), 4);
            $lineSubtotal = round($quantity * $unitPrice, 2);
            $subtotal += $lineSubtotal;

            $normalized[] = [
                'product_id' => $item['product_id'] ?? null,
                'tax_rate_id' => $item['tax_rate_id'] ?? null,
                'description' => (string) ($item['description'] ?? ''),
                'quantity' => $quantity,
                'unit' => (string) ($item['unit'] ?? 'unit'),
                'unit_price' => $unitPrice,
                'tax_rate' => $taxRate,
                'line_subtotal' => $lineSubtotal,
                'sort_order' => (int) ($item['sort_order'] ?? $index),
            ];
        }

        $subtotal = round($subtotal, 2);

        $discountAmount = match ($discountType) {
            'percent' => round($subtotal * min($discountValue, 100) / 100, 2),
            'fixed' => round(min($discountValue, $subtotal), 2),
            default => 0.0,
        };
        $discountAmount = round($discountAmount, 2);

        // Spread the invoice-level discount proportionally so tax is charged on
        // the discounted value rather than the gross line total.
        $taxableRatio = $subtotal > 0 ? max(0.0, ($subtotal - $discountAmount) / $subtotal) : 0.0;

        $taxTotal = 0.0;

        foreach ($normalized as &$line) {
            $taxable = round($line['line_subtotal'] * $taxableRatio, 2);
            $line['tax_amount'] = round($taxable * $line['tax_rate'] / 100, 2);
            $line['line_total'] = round($taxable + $line['tax_amount'], 2);
            $taxTotal += $line['tax_amount'];
        }
        unset($line);

        $taxTotal = round($taxTotal, 2);
        $total = round($subtotal - $discountAmount + $taxTotal, 2);

        return [
            'items' => $normalized,
            'subtotal' => $subtotal,
            'discount_amount' => $discountAmount,
            'tax_total' => $taxTotal,
            'total' => $total,
        ];
    }
}
