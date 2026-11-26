<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Database\Factories\PaymentFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    /** @use HasFactory<PaymentFactory> */
    use BelongsToTenant, HasFactory;

    public const METHODS = [
        'bank_transfer' => 'Bank transfer',
        'cash' => 'Cash',
        'credit_card' => 'Credit card',
        'debit_card' => 'Debit card',
        'paypal' => 'PayPal',
        'stripe' => 'Stripe',
        'cheque' => 'Cheque',
        'other' => 'Other',
    ];

    protected $fillable = [
        'tenant_id',
        'invoice_id',
        'customer_id',
        'created_by',
        'paid_on',
        'amount',
        'method',
        'reference',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'paid_on' => 'date:Y-m-d',
            'amount' => 'decimal:2',
        ];
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function methodLabel(): string
    {
        return self::METHODS[$this->method] ?? ucfirst(str_replace('_', ' ', (string) $this->method));
    }
}
