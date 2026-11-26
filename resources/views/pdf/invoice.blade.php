<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>{{ $invoice->number }}</title>
    <style>
        @page { margin: 36px 40px; }
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #111111; font-size: 12px; line-height: 1.5; }
        h1, h2, h3 { margin: 0; font-weight: 500; }
        .muted { color: #626260; }
        .small { font-size: 10px; }
        .header { width: 100%; border-bottom: 1px solid #d3cec6; padding-bottom: 18px; margin-bottom: 24px; }
        .header td { vertical-align: top; }
        .brand { font-size: 22px; letter-spacing: -0.5px; }
        .doc-title { font-size: 28px; letter-spacing: -1px; text-align: right; }
        .meta { text-align: right; color: #626260; font-size: 11px; }
        .parties { width: 100%; margin-bottom: 26px; }
        .parties td { vertical-align: top; width: 50%; }
        .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #7b7b78; margin-bottom: 6px; }
        table.items { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        table.items th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #7b7b78; border-bottom: 1px solid #d3cec6; padding: 8px 6px; }
        table.items td { border-bottom: 1px solid #ebe7e1; padding: 9px 6px; vertical-align: top; }
        .right { text-align: right; }
        .totals { width: 46%; margin-left: 54%; border-collapse: collapse; }
        .totals td { padding: 5px 6px; }
        .totals .grand td { border-top: 1px solid #111111; font-size: 14px; font-weight: 500; padding-top: 9px; }
        .badge { display: inline-block; padding: 3px 9px; border: 1px solid #d3cec6; border-radius: 999px; font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; }
        .footer { margin-top: 32px; border-top: 1px solid #d3cec6; padding-top: 14px; color: #626260; font-size: 10px; }
        .notes { margin-top: 20px; color: #626260; font-size: 11px; }
    </style>
</head>
<body>
    <table class="header">
        <tr>
            <td>
                <div class="brand">{{ $tenant->name }}</div>
                <div class="muted small">
                    {{ collect([$tenant->address_line1, $tenant->address_line2, $tenant->city, $tenant->state, $tenant->postal_code, $tenant->country])->filter()->implode(', ') }}<br>
                    @if($tenant->email){{ $tenant->email }}@endif
                    @if($tenant->phone) &middot; {{ $tenant->phone }}@endif<br>
                    @if($tenant->tax_id)Tax ID: {{ $tenant->tax_id }}@endif
                </div>
            </td>
            <td>
                <div class="doc-title">Invoice</div>
                <div class="meta">
                    {{ $invoice->number }}<br>
                    Issued {{ $invoice->issue_date?->format('M j, Y') }}<br>
                    Due {{ $invoice->due_date?->format('M j, Y') }}<br>
                    <span class="badge">{{ $invoice->displayStatus() }}</span>
                </div>
            </td>
        </tr>
    </table>

    <table class="parties">
        <tr>
            <td>
                <div class="label">Billed to</div>
                <strong>{{ $invoice->customer_name }}</strong><br>
                <span class="muted">{!! nl2br(e($invoice->customer_address)) !!}</span><br>
                @if($invoice->customer_email)<span class="muted">{{ $invoice->customer_email }}</span>@endif
            </td>
            <td class="right">
                <div class="label">Amount due</div>
                <div style="font-size: 24px; letter-spacing: -0.5px;">{{ $invoice->currency_code }} {{ number_format((float) $invoice->balance, 2) }}</div>
            </td>
        </tr>
    </table>

    <table class="items">
        <thead>
            <tr>
                <th style="width:46%">Description</th>
                <th class="right">Qty</th>
                <th class="right">Unit price</th>
                <th class="right">Tax</th>
                <th class="right">Amount</th>
            </tr>
        </thead>
        <tbody>
            @foreach($invoice->items as $item)
                <tr>
                    <td>{{ $item->description }}</td>
                    <td class="right">{{ rtrim(rtrim(number_format((float) $item->quantity, 2), '0'), '.') }}</td>
                    <td class="right">{{ number_format((float) $item->unit_price, 2) }}</td>
                    <td class="right">{{ rtrim(rtrim(number_format((float) $item->tax_rate, 2), '0'), '.') }}%</td>
                    <td class="right">{{ number_format((float) $item->line_total, 2) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <table class="totals">
        <tr><td class="muted">Subtotal</td><td class="right">{{ number_format((float) $invoice->subtotal, 2) }}</td></tr>
        @if((float) $invoice->discount_amount > 0)
            <tr><td class="muted">Discount</td><td class="right">-{{ number_format((float) $invoice->discount_amount, 2) }}</td></tr>
        @endif
        <tr><td class="muted">Tax</td><td class="right">{{ number_format((float) $invoice->tax_total, 2) }}</td></tr>
        <tr class="grand"><td>Total</td><td class="right">{{ $invoice->currency_code }} {{ number_format((float) $invoice->total, 2) }}</td></tr>
        <tr><td class="muted">Paid</td><td class="right">{{ number_format((float) $invoice->amount_paid, 2) }}</td></tr>
        <tr><td class="muted">Balance due</td><td class="right">{{ number_format((float) $invoice->balance, 2) }}</td></tr>
    </table>

    @if($invoice->notes)
        <div class="notes"><strong>Notes</strong><br>{!! nl2br(e($invoice->notes)) !!}</div>
    @endif

    @if($tenant->bank_details)
        <div class="notes"><strong>Payment details</strong><br>{!! nl2br(e($tenant->bank_details)) !!}</div>
    @endif

    @if($invoice->terms)
        <div class="notes"><strong>Terms</strong><br>{!! nl2br(e($invoice->terms)) !!}</div>
    @endif

    <div class="footer">
        {{ $invoice->footer ?: $tenant->invoice_footer }}
    </div>
</body>
</html>
