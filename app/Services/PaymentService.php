<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PaymentService
{
    public function __construct(private readonly InvoiceService $invoices) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function record(Invoice $invoice, array $data, ?User $user = null): Payment
    {
        if ($invoice->isVoid()) {
            throw ValidationException::withMessages([
                'amount' => 'Void invoices cannot receive payments.',
            ]);
        }

        $amount = round((float) ($data['amount'] ?? 0), 2);

        if ($amount <= 0) {
            throw ValidationException::withMessages([
                'amount' => 'The payment amount must be greater than zero.',
            ]);
        }

        if ($amount - (float) $invoice->balance > 0.004) {
            throw ValidationException::withMessages([
                'amount' => 'The payment amount cannot exceed the outstanding balance.',
            ]);
        }

        return DB::transaction(function () use ($invoice, $data, $amount, $user) {
            $payment = $invoice->payments()->create([
                'tenant_id' => $invoice->tenant_id,
                'customer_id' => $invoice->customer_id,
                'created_by' => $user?->id,
                'paid_on' => $data['paid_on'] ?? today()->toDateString(),
                'amount' => $amount,
                'method' => $data['method'] ?? 'bank_transfer',
                'reference' => $data['reference'] ?? null,
                'notes' => $data['notes'] ?? null,
            ]);

            $this->invoices->syncPaymentState($invoice->fresh());

            return $payment;
        });
    }

    public function delete(Payment $payment): void
    {
        DB::transaction(function () use ($payment) {
            $invoice = $payment->invoice;
            $payment->delete();

            if ($invoice) {
                $this->invoices->syncPaymentState($invoice->fresh());
            }
        });
    }
}
