<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\Tenant;

class InvoiceNumberService
{
    /**
     * Reserve the next invoice number for a tenant.
     *
     * Call inside a database transaction: the tenant row is locked so
     * concurrent requests cannot hand out the same number.
     */
    public function next(Tenant $tenant): string
    {
        $tenant = Tenant::whereKey($tenant->id)->lockForUpdate()->firstOrFail();

        do {
            $sequence = max(1, (int) $tenant->invoice_next_number);
            $number = sprintf(
                '%s-%s',
                $tenant->invoice_prefix ?: 'INV',
                str_pad((string) $sequence, max(1, (int) $tenant->invoice_number_padding), '0', STR_PAD_LEFT)
            );

            $tenant->invoice_next_number = $sequence + 1;
            $tenant->save();
        } while (
            Invoice::withoutGlobalScopes()
                ->where('tenant_id', $tenant->id)
                ->where('number', $number)
                ->exists()
        );

        return $number;
    }
}
