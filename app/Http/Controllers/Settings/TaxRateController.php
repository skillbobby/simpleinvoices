<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\InvoiceItem;
use App\Models\TaxRate;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class TaxRateController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()->canManageSettings(), 403);

        $rates = TaxRate::query()
            ->withCount('products')
            ->orderByDesc('is_default')
            ->orderBy('name')
            ->get()
            ->map(fn (TaxRate $rate) => [
                'id' => $rate->id,
                'name' => $rate->name,
                'rate' => (float) $rate->rate,
                'is_default' => $rate->is_default,
                'is_active' => $rate->is_active,
                'products_count' => $rate->products_count,
            ]);

        return Inertia::render('settings/tax-rates', [
            'taxRates' => $rates,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        abort_unless($request->user()->canManageSettings(), 403);

        $data = $this->validateRate($request);

        DB::transaction(function () use ($data) {
            if ($data['is_default'] ?? false) {
                TaxRate::query()->update(['is_default' => false]);
            }

            TaxRate::create($data);
        });

        return back()->with('success', 'Tax rate created.');
    }

    public function update(Request $request, TaxRate $taxRate): RedirectResponse
    {
        abort_unless($request->user()->canManageSettings(), 403);

        $data = $this->validateRate($request);

        DB::transaction(function () use ($data, $taxRate) {
            if ($data['is_default'] ?? false) {
                TaxRate::query()->where('id', '!=', $taxRate->id)->update(['is_default' => false]);
            }

            $taxRate->update($data);
        });

        return back()->with('success', 'Tax rate updated.');
    }

    public function destroy(Request $request, TaxRate $taxRate): RedirectResponse
    {
        abort_unless($request->user()->canManageSettings(), 403);

        $inUse = InvoiceItem::query()->where('tax_rate_id', $taxRate->id)->exists();

        if ($inUse) {
            $taxRate->update(['is_active' => false]);

            return back()->with('error', 'Tax rate is used on invoices and was deactivated instead of deleted.');
        }

        $taxRate->delete();

        return back()->with('success', 'Tax rate deleted.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validateRate(Request $request): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'rate' => ['required', 'numeric', 'min:0', 'max:100'],
            'is_default' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        return [
            'name' => $data['name'],
            'rate' => $data['rate'],
            'is_default' => $request->boolean('is_default'),
            'is_active' => $request->boolean('is_active', true),
        ];
    }
}
