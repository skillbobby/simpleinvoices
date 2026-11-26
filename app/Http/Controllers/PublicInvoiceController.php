<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\Payment;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Response;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class PublicInvoiceController extends Controller
{
    public function show(string $token): InertiaResponse
    {
        $invoice = $this->resolve($token);

        return Inertia::render('public/invoice', [
            'invoice' => $this->payload($invoice),
            'company' => $this->tenantPayload($invoice),
        ]);
    }

    public function pdf(string $token): Response
    {
        $invoice = $this->resolve($token);

        $pdf = Pdf::loadView('pdf.invoice', [
            'invoice' => $invoice,
            'tenant' => $invoice->tenant,
        ])->setPaper('a4');

        return $pdf->download($invoice->number.'.pdf');
    }

    private function resolve(string $token): Invoice
    {
        $invoice = Invoice::findByPublicToken($token);

        abort_if(! $invoice || ! $invoice->tenant, 404);

        return $invoice;
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(Invoice $invoice): array
    {
        return [
            'number' => $invoice->number,
            'status' => $invoice->displayStatus(),
            'issue_date' => $invoice->issue_date?->toDateString(),
            'due_date' => $invoice->due_date?->toDateString(),
            'currency_code' => $invoice->currency_code,
            'customer_name' => $invoice->customer_name,
            'customer_email' => $invoice->customer_email,
            'customer_address' => $invoice->customer_address,
            'subtotal' => (float) $invoice->subtotal,
            'discount_amount' => (float) $invoice->discount_amount,
            'tax_total' => (float) $invoice->tax_total,
            'total' => (float) $invoice->total,
            'amount_paid' => (float) $invoice->amount_paid,
            'balance' => (float) $invoice->balance,
            'notes' => $invoice->notes,
            'terms' => $invoice->terms,
            'footer' => $invoice->footer,
            'items' => $invoice->items->map(fn ($item) => [
                'description' => $item->description,
                'quantity' => (float) $item->quantity,
                'unit' => $item->unit,
                'unit_price' => (float) $item->unit_price,
                'tax_rate' => (float) $item->tax_rate,
                'tax_amount' => (float) $item->tax_amount,
                'line_total' => (float) $item->line_total,
            ])->all(),
            'payments' => $invoice->payments->map(fn (Payment $payment) => [
                'paid_on' => $payment->paid_on?->toDateString(),
                'amount' => (float) $payment->amount,
                'method_label' => $payment->methodLabel(),
            ])->all(),
            'pdf_url' => route('invoices.public.pdf', $invoice->public_token),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function tenantPayload(Invoice $invoice): array
    {
        $tenant = $invoice->tenant;

        return [
            'name' => $tenant->name,
            'email' => $tenant->email,
            'phone' => $tenant->phone,
            'website' => $tenant->website,
            'address' => collect([$tenant->address_line1, $tenant->address_line2, $tenant->city, $tenant->state, $tenant->postal_code, $tenant->country])->filter()->implode(', '),
            'tax_id' => $tenant->tax_id,
            'bank_details' => $tenant->bank_details,
            'invoice_footer' => $tenant->invoice_footer,
        ];
    }
}
