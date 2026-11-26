<?php

namespace App\Models;

use Database\Factories\TenantFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Tenant extends Model
{
    /** @use HasFactory<TenantFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'email',
        'phone',
        'website',
        'address_line1',
        'address_line2',
        'city',
        'state',
        'postal_code',
        'country',
        'tax_id',
        'logo_path',
        'currency_code',
        'locale',
        'timezone',
        'invoice_prefix',
        'invoice_next_number',
        'invoice_number_padding',
        'default_payment_terms_days',
        'default_tax_rate',
        'invoice_notes',
        'invoice_footer',
        'bank_details',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'invoice_next_number' => 'integer',
            'invoice_number_padding' => 'integer',
            'default_payment_terms_days' => 'integer',
            'default_tax_rate' => 'decimal:4',
            'is_active' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Tenant $tenant) {
            if (! $tenant->slug) {
                $tenant->slug = static::uniqueSlug($tenant->name);
            }
        });
    }

    public static function uniqueSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'company';
        $slug = $base;
        $suffix = 2;

        while (static::where('slug', $slug)->exists()) {
            $slug = $base.'-'.$suffix++;
        }

        return $slug;
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function customers(): HasMany
    {
        return $this->hasMany(Customer::class);
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function taxRates(): HasMany
    {
        return $this->hasMany(TaxRate::class);
    }

    public function paymentTerms(): HasMany
    {
        return $this->hasMany(PaymentTerm::class);
    }

    public function owner(): ?User
    {
        return $this->users()->where('role', 'owner')->first();
    }

    public function isActive(): bool
    {
        return (bool) $this->is_active;
    }
}
