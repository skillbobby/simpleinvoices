<?php

namespace Tests\Feature;

use App\Models\TaxRate;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesTenants;
use Tests\TestCase;

class SettingsTest extends TestCase
{
    use CreatesTenants, RefreshDatabase;

    public function test_admin_can_update_company_profile_and_numbering(): void
    {
        $tenant = $this->makeTenant('Acme');
        $admin = $this->makeUser($tenant, User::ROLE_ADMIN);

        $this->actingAs($admin)->patch('/settings/company', [
            'name' => 'Acme Studio Ltd',
            'email' => 'billing@acme.test',
            'currency_code' => 'eur',
            'locale' => 'en',
            'timezone' => 'Europe/Berlin',
            'invoice_prefix' => 'ACS',
            'invoice_next_number' => 120,
            'invoice_number_padding' => 5,
            'default_payment_terms_days' => 30,
            'default_tax_rate' => 19,
            'invoice_footer' => 'Danke!',
        ])->assertSessionHasNoErrors();

        $tenant->refresh();

        $this->assertSame('Acme Studio Ltd', $tenant->name);
        $this->assertSame('EUR', $tenant->currency_code);
        $this->assertSame('ACS', $tenant->invoice_prefix);
        $this->assertSame(120, $tenant->invoice_next_number);
        $this->assertSame(5, $tenant->invoice_number_padding);
    }

    public function test_only_one_tax_rate_can_be_the_default_per_tenant(): void
    {
        $tenant = $this->makeTenant('Acme');
        $admin = $this->makeUser($tenant, User::ROLE_ADMIN);

        $this->actingAs($admin)->post('/settings/tax-rates', [
            'name' => 'Reduced',
            'rate' => 7,
            'is_default' => true,
            'is_active' => true,
        ])->assertSessionHasNoErrors();

        $defaults = TaxRate::query()->where('tenant_id', $tenant->id)->where('is_default', true)->get();

        $this->assertCount(1, $defaults);
        $this->assertSame('Reduced', $defaults->first()->name);
    }

    public function test_tax_rates_are_isolated_between_tenants(): void
    {
        $alpha = $this->makeTenant('Alpha');
        $beta = $this->makeTenant('Beta');
        $alphaAdmin = $this->makeUser($alpha, User::ROLE_ADMIN);

        $betaRate = $this->taxRate($beta, 25);

        $this->actingAs($alphaAdmin)->delete('/settings/tax-rates/'.$betaRate->id)->assertNotFound();
        $this->assertDatabaseHas('tax_rates', ['id' => $betaRate->id]);
    }

    public function test_company_update_requires_a_valid_timezone(): void
    {
        $tenant = $this->makeTenant('Acme');
        $admin = $this->makeUser($tenant, User::ROLE_ADMIN);

        $this->actingAs($admin)->patch('/settings/company', [
            'name' => 'Acme',
            'currency_code' => 'USD',
            'locale' => 'en',
            'timezone' => 'Mars/Olympus',
            'invoice_prefix' => 'INV',
            'invoice_next_number' => 1,
            'invoice_number_padding' => 4,
            'default_payment_terms_days' => 14,
            'default_tax_rate' => 0,
        ])->assertSessionHasErrors('timezone');
    }
}
