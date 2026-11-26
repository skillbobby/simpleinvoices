<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Support\TenantContext;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Response;

class InvoicePdfController extends Controller
{
    public function __invoke(Invoice $invoice): Response
    {
        $invoice->load(['items', 'tenant', 'payments', 'customer']);

        $pdf = Pdf::loadView('pdf.invoice', [
            'invoice' => $invoice,
            'tenant' => TenantContext::get() ?? $invoice->tenant,
        ])->setPaper('a4');

        return $pdf->download($invoice->number.'.pdf');
    }
}
