<?php

namespace App\Services;

use App\Models\PaymentTerm;
use App\Models\TaxRate;
use App\Models\Tenant;
use App\Support\TenantContext;
use Illuminate\Support\Facades\DB;

class TenantProvisioner
{
    /**
     * Create a tenant together with the defaults every company needs.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function provision(array $attributes): Tenant
    {
        return DB::transaction(function () use ($attributes) {
            $tenant = Tenant::create([
                'currency_code' => 'USD',
                'invoice_prefix' => 'INV',
                'invoice_number_padding' => 4,
                'default_payment_terms_days' => 14,
                'country' => 'United States',
                ...$attributes,
            ]);

            TenantContext::run($tenant, function () use ($tenant) {
                $taxRate = TaxRate::create([
                    'tenant_id' => $tenant->id,
                    'name' => 'Standard',
                    'rate' => 0,
                    'is_default' => true,
                ]);

                PaymentTerm::create([
                    'tenant_id' => $tenant->id,
                    'name' => 'Net 14',
                    'days' => 14,
                    'is_default' => true,
                ]);

                PaymentTerm::create([
                    'tenant_id' => $tenant->id,
                    'name' => 'Due on receipt',
                    'days' => 0,
                ]);
            });

            return $tenant->fresh();
        });
    }
}
