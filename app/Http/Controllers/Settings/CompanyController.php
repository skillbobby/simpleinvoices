<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Services\InvoiceService;
use App\Support\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CompanyController extends Controller
{
    public function edit(Request $request): Response
    {
        abort_unless($request->user()->canManageSettings(), 403);

        $tenant = TenantContext::get();

        return Inertia::render('settings/company', [
            'company' => $tenant->only([
                'name', 'email', 'phone', 'website', 'address_line1', 'address_line2',
                'city', 'state', 'postal_code', 'country', 'tax_id', 'logo_path',
                'currency_code', 'locale', 'timezone', 'invoice_prefix',
                'invoice_next_number', 'invoice_number_padding',
                'default_payment_terms_days', 'default_tax_rate',
                'invoice_notes', 'invoice_footer', 'bank_details',
            ]),
            'nextNumberPreview' => app(InvoiceService::class)->nextNumberPreview($tenant),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        abort_unless($request->user()->canManageSettings(), 403);

        $tenant = TenantContext::get();

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:40'],
            'website' => ['nullable', 'string', 'max:255'],
            'address_line1' => ['nullable', 'string', 'max:255'],
            'address_line2' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:255'],
            'state' => ['nullable', 'string', 'max:255'],
            'postal_code' => ['nullable', 'string', 'max:32'],
            'country' => ['nullable', 'string', 'max:64'],
            'tax_id' => ['nullable', 'string', 'max:64'],
            'currency_code' => ['required', 'string', 'size:3'],
            'locale' => ['required', 'string', 'max:12'],
            'timezone' => ['required', 'string', 'max:64', Rule::in(timezone_identifiers_list())],
            'invoice_prefix' => ['required', 'string', 'max:20'],
            'invoice_next_number' => ['required', 'integer', 'min:1', 'max:999999999'],
            'invoice_number_padding' => ['required', 'integer', 'min:1', 'max:10'],
            'default_payment_terms_days' => ['required', 'integer', 'min:0', 'max:365'],
            'default_tax_rate' => ['required', 'numeric', 'min:0', 'max:100'],
            'invoice_notes' => ['nullable', 'string', 'max:5000'],
            'invoice_footer' => ['nullable', 'string', 'max:5000'],
            'bank_details' => ['nullable', 'string', 'max:5000'],
            'logo' => ['nullable', 'image', 'max:2048'],
        ]);

        if ($request->hasFile('logo')) {
            if ($tenant->logo_path) {
                Storage::disk('public')->delete($tenant->logo_path);
            }

            $data['logo_path'] = $request->file('logo')->store('logos', 'public');
        }

        unset($data['logo']);

        $data['currency_code'] = strtoupper($data['currency_code']);
        $tenant->update($data);

        return back()->with('success', 'Company settings saved.');
    }
}
