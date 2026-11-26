<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Database\Factories\InvoiceFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class Invoice extends Model
{
    /** @use HasFactory<InvoiceFactory> */
    use BelongsToTenant, HasFactory, SoftDeletes;

    public const STATUS_DRAFT = 'draft';

    public const STATUS_SENT = 'sent';

    public const STATUS_PARTIAL = 'partial';

    public const STATUS_PAID = 'paid';

    public const STATUS_VOID = 'void';

    public const STATUSES = [
        self::STATUS_DRAFT,
        self::STATUS_SENT,
        self::STATUS_PARTIAL,
        self::STATUS_PAID,
        self::STATUS_VOID,
    ];

    protected $fillable = [
        'tenant_id',
        'customer_id',
        'payment_term_id',
        'number',
        'status',
        'issue_date',
        'due_date',
        'currency_code',
        'customer_name',
        'customer_email',
        'customer_address',
        'subtotal',
        'discount_type',
        'discount_value',
        'discount_amount',
        'tax_total',
        'total',
        'amount_paid',
        'balance',
        'notes',
        'terms',
        'footer',
        'public_token',
        'sent_at',
        'paid_at',
        'voided_at',
    ];

    protected function casts(): array
    {
        return [
            'issue_date' => 'date:Y-m-d',
            'due_date' => 'date:Y-m-d',
            'subtotal' => 'decimal:2',
            'discount_value' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'tax_total' => 'decimal:2',
            'total' => 'decimal:2',
            'amount_paid' => 'decimal:2',
            'balance' => 'decimal:2',
            'sent_at' => 'datetime',
            'paid_at' => 'datetime',
            'voided_at' => 'datetime',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function paymentTerm(): BelongsTo
    {
        return $this->belongsTo(PaymentTerm::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(InvoiceItem::class)->orderBy('sort_order');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function scopeOverdue($query)
    {
        return $query
            ->whereIn('status', [self::STATUS_SENT, self::STATUS_PARTIAL])
            ->whereDate('due_date', '<', now()->toDateString())
            ->where('balance', '>', 0);
    }

    public function scopeOutstanding($query)
    {
        return $query
            ->whereIn('status', [self::STATUS_SENT, self::STATUS_PARTIAL])
            ->where('balance', '>', 0);
    }

    public function isDraft(): bool
    {
        return $this->status === self::STATUS_DRAFT;
    }

    public function isVoid(): bool
    {
        return $this->status === self::STATUS_VOID;
    }

    public function isPaid(): bool
    {
        return $this->status === self::STATUS_PAID || (float) $this->balance <= 0 && (float) $this->total > 0;
    }

    public function isEditable(): bool
    {
        return ! in_array($this->status, [self::STATUS_PAID, self::STATUS_VOID], true);
    }

    public function isOverdue(): bool
    {
        if ($this->isVoid() || (float) $this->balance <= 0) {
            return false;
        }

        if (in_array($this->status, [self::STATUS_DRAFT], true)) {
            return false;
        }

        return $this->due_date instanceof Carbon && $this->due_date->isBefore(today());
    }

    public function displayStatus(): string
    {
        if ($this->isVoid()) {
            return self::STATUS_VOID;
        }

        if ($this->isPaid()) {
            return self::STATUS_PAID;
        }

        if ($this->isOverdue()) {
            return 'overdue';
        }

        return $this->status;
    }

    public function daysOverdue(): int
    {
        if (! $this->isOverdue()) {
            return 0;
        }

        return (int) $this->due_date->startOfDay()->diffInDays(today());
    }

    public static function generatePublicToken(): string
    {
        do {
            $token = Str::random(40);
        } while (static::withoutGlobalScopes()->where('public_token', $token)->exists());

        return $token;
    }

    public static function findByPublicToken(string $token): ?self
    {
        return static::withoutGlobalScopes()
            ->with(['items', 'payments', 'tenant', 'customer'])
            ->where('public_token', $token)
            ->first();
    }

    public function publicUrl(): ?string
    {
        return $this->public_token ? route('invoices.public', $this->public_token) : null;
    }

    public function amountDue(): float
    {
        return max(0, (float) $this->balance);
    }
}
