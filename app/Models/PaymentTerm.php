<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Database\Factories\PaymentTermFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentTerm extends Model
{
    /** @use HasFactory<PaymentTermFactory> */
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id',
        'name',
        'days',
        'is_default',
    ];

    protected function casts(): array
    {
        return [
            'days' => 'integer',
            'is_default' => 'boolean',
        ];
    }
}
