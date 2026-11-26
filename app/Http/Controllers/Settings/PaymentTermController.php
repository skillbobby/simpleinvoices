<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\PaymentTerm;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PaymentTermController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()->canManageSettings(), 403);

        return Inertia::render('settings/payment-terms', [
            'paymentTerms' => PaymentTerm::query()
                ->orderByDesc('is_default')
                ->orderBy('days')
                ->orderBy('name')
                ->get()
                ->map(fn (PaymentTerm $term) => [
                    'id' => $term->id,
                    'name' => $term->name,
                    'days' => $term->days,
                    'is_default' => $term->is_default,
                ]),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        abort_unless($request->user()->canManageSettings(), 403);

        $data = $this->validated($request);

        DB::transaction(function () use ($data) {
            if ($data['is_default']) {
                PaymentTerm::query()->update(['is_default' => false]);
            }

            PaymentTerm::create($data);
        });

        return back()->with('success', 'Payment term created.');
    }

    public function update(Request $request, PaymentTerm $paymentTerm): RedirectResponse
    {
        abort_unless($request->user()->canManageSettings(), 403);

        $data = $this->validated($request);

        DB::transaction(function () use ($data, $paymentTerm) {
            if ($data['is_default']) {
                PaymentTerm::query()->where('id', '!=', $paymentTerm->id)->update(['is_default' => false]);
            }

            $paymentTerm->update($data);
        });

        return back()->with('success', 'Payment term updated.');
    }

    public function destroy(Request $request, PaymentTerm $paymentTerm): RedirectResponse
    {
        abort_unless($request->user()->canManageSettings(), 403);

        $paymentTerm->delete();

        return back()->with('success', 'Payment term deleted.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'days' => ['required', 'integer', 'min:0', 'max:365'],
            'is_default' => ['sometimes', 'boolean'],
        ]);

        return [
            'name' => $data['name'],
            'days' => $data['days'],
            'is_default' => $request->boolean('is_default'),
        ];
    }
}
