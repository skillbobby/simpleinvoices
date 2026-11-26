<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\Product;
use App\Models\TaxRate;
use App\Models\Tenant;
use App\Models\User;
use App\Services\InvoiceService;
use App\Services\PaymentService;
use App\Services\TenantProvisioner;
use App\Support\TenantContext;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $provisioner = app(TenantProvisioner::class);

        $acme = $provisioner->provision([
            'name' => 'Acme Studio',
            'email' => 'billing@acmestudio.test',
            'phone' => '+1 (415) 555-0134',
            'website' => 'acmestudio.test',
            'address_line1' => '48 Clement Street',
            'city' => 'San Francisco',
            'state' => 'CA',
            'postal_code' => '94118',
            'country' => 'United States',
            'tax_id' => 'US-4821-9930',
            'invoice_prefix' => 'ACM',
            'bank_details' => "Acme Studio LLC\nIBAN GB29 NWBK 6016 1331 9268 19\nReference: invoice number",
            'invoice_footer' => 'Acme Studio LLC — design and engineering retainers.',
        ]);

        $northwind = $provisioner->provision([
            'name' => 'Northwind Labs',
            'email' => 'accounts@northwindlabs.test',
            'address_line1' => '12 Harbour Road',
            'city' => 'Bristol',
            'country' => 'United Kingdom',
            'currency_code' => 'GBP',
            'invoice_prefix' => 'NW',
            'default_payment_terms_days' => 30,
            'invoice_footer' => 'Northwind Labs Ltd — research and prototyping.',
        ]);

        $this->seedTenant($acme, 'demo@simpleinvoices.test', 'Demo Owner');
        $this->seedTenant($northwind, 'northwind@simpleinvoices.test', 'Northwind Owner');
    }

    private function seedTenant(Tenant $tenant, string $email, string $ownerName): void
    {
        TenantContext::run($tenant, function () use ($tenant, $email, $ownerName) {
            $owner = User::create([
                'tenant_id' => $tenant->id,
                'name' => $ownerName,
                'email' => $email,
                'role' => User::ROLE_OWNER,
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]);

            $standard = TaxRate::query()->where('is_default', true)->first()
                ?? TaxRate::query()->firstOrFail();
            $standard->update(['rate' => $tenant->currency_code === 'GBP' ? 20 : 8.5]);

            $customers = collect([
                ['name' => 'Maya Chen', 'company_name' => 'Lumen Health', 'email' => 'maya@lumenhealth.test', 'city' => 'Oakland'],
                ['name' => 'Tomas Alvarez', 'company_name' => 'Fieldnote Coffee', 'email' => 'tomas@fieldnote.test', 'city' => 'Portland'],
                ['name' => 'Priya Raman', 'company_name' => 'Orbit Freight', 'email' => 'priya@orbitfreight.test', 'city' => 'Austin'],
                ['name' => 'Jonas Weber', 'company_name' => 'Weber & Co', 'email' => 'jonas@weberco.test', 'city' => 'Berlin'],
                ['name' => 'Sofia Rossi', 'company_name' => 'Studio Rossi', 'email' => 'sofia@studiorossi.test', 'city' => 'Milan'],
            ])->map(fn (array $attributes) => Customer::create([
                'tenant_id' => $tenant->id,
                'country' => $tenant->country,
                'address_line1' => fake()->streetAddress(),
                'postal_code' => fake()->postcode(),
                ...$attributes,
            ]));

            $retainer = Product::create([
                'tenant_id' => $tenant->id,
                'name' => 'Design retainer',
                'sku' => 'RET-DESIGN',
                'description' => 'Monthly product design retainer, billed in advance.',
                'unit_price' => 4800,
                'unit' => 'month',
                'tax_rate_id' => $standard->id,
            ]);

            $sprint = Product::create([
                'tenant_id' => $tenant->id,
                'name' => 'Engineering sprint',
                'sku' => 'ENG-SPRINT',
                'description' => 'Two week delivery sprint with a dedicated pair.',
                'unit_price' => 9500,
                'unit' => 'sprint',
                'tax_rate_id' => $standard->id,
            ]);

            $workshop = Product::create([
                'tenant_id' => $tenant->id,
                'name' => 'Discovery workshop',
                'sku' => 'DISC-WORKSHOP',
                'description' => 'Full-day discovery workshop with stakeholder interviews.',
                'unit_price' => 2200,
                'unit' => 'day',
                'tax_rate_id' => null,
            ]);

            $service = app(InvoiceService::class);
            $payments = app(PaymentService::class);

            $scenarios = [
                ['customer' => $customers[0], 'product' => $retainer, 'quantity' => 1, 'days_ago' => 210, 'due_in' => 14, 'status' => 'paid', 'pay' => 1.0],
                ['customer' => $customers[1], 'product' => $sprint, 'quantity' => 1, 'days_ago' => 160, 'due_in' => 14, 'status' => 'paid', 'pay' => 1.0],
                ['customer' => $customers[2], 'product' => $workshop, 'quantity' => 2, 'days_ago' => 96, 'due_in' => 30, 'status' => 'partial', 'pay' => 0.4],
                ['customer' => $customers[0], 'product' => $retainer, 'quantity' => 1, 'days_ago' => 66, 'due_in' => 14, 'status' => 'paid', 'pay' => 1.0],
                ['customer' => $customers[3], 'product' => $sprint, 'quantity' => 1, 'days_ago' => 51, 'due_in' => 14, 'status' => 'sent', 'pay' => 0],
                ['customer' => $customers[4], 'product' => $workshop, 'quantity' => 1, 'days_ago' => 28, 'due_in' => 14, 'status' => 'sent', 'pay' => 0],
                ['customer' => $customers[1], 'product' => $retainer, 'quantity' => 1, 'days_ago' => 8, 'due_in' => 14, 'status' => 'sent', 'pay' => 0],
                ['customer' => $customers[2], 'product' => $workshop, 'quantity' => 1, 'days_ago' => 2, 'due_in' => 30, 'status' => 'draft', 'pay' => 0],
            ];

            foreach ($scenarios as $scenario) {
                $issueDate = today()->subDays($scenario['days_ago']);

                $invoice = $service->create($tenant, [
                    'customer_id' => $scenario['customer']->id,
                    'issue_date' => $issueDate->toDateString(),
                    'due_date' => $issueDate->copy()->addDays($scenario['due_in'])->toDateString(),
                    'currency_code' => $tenant->currency_code,
                    'discount_type' => 'none',
                    'discount_value' => 0,
                    'status' => $scenario['status'] === 'draft' ? 'draft' : 'sent',
                    'terms' => 'Payment due within '.$scenario['due_in'].' days. Late payments accrue 1.5% monthly interest.',
                    'items' => [[
                        'product_id' => $scenario['product']->id,
                        'tax_rate_id' => $scenario['product']->tax_rate_id,
                        'description' => $scenario['product']->name,
                        'quantity' => $scenario['quantity'],
                        'unit' => $scenario['product']->unit,
                        'unit_price' => (float) $scenario['product']->unit_price,
                    ]],
                ], $owner);

                if ($scenario['pay'] > 0) {
                    $payments->record($invoice, [
                        'amount' => round((float) $invoice->total * $scenario['pay'], 2),
                        'paid_on' => $invoice->issue_date->copy()->addDays(min(10, $scenario['due_in']))->toDateString(),
                        'method' => 'bank_transfer',
                        'reference' => 'REF-'.$invoice->number,
                    ], $owner);
                }
            }

            if ($tenant->currency_code === 'GBP') {
                Customer::create([
                    'tenant_id' => $tenant->id,
                    'name' => 'Elena Petrova',
                    'company_name' => 'Kite Robotics',
                    'email' => 'elena@kiterobotics.test',
                    'city' => 'London',
                    'country' => 'United Kingdom',
                    'is_active' => false,
                ]);
            }
        });
    }
}
