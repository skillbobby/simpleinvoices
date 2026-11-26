<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProductRequest;
use App\Models\Product;
use App\Models\TaxRate;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));
        $status = (string) $request->query('status', 'all');

        $products = Product::query()
            ->with('taxRate:id,name,rate')
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('sku', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->when($status === 'active', fn ($q) => $q->where('is_active', true))
            ->when($status === 'inactive', fn ($q) => $q->where('is_active', false))
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Product $product) => [
                'id' => $product->id,
                'name' => $product->name,
                'sku' => $product->sku,
                'description' => $product->description,
                'unit_price' => (float) $product->unit_price,
                'unit' => $product->unit,
                'tax_rate' => $product->taxRate ? [
                    'id' => $product->taxRate->id,
                    'name' => $product->taxRate->name,
                    'rate' => (float) $product->taxRate->rate,
                ] : null,
                'is_active' => $product->is_active,
            ]);

        return Inertia::render('products/index', [
            'products' => $products,
            'filters' => ['search' => $search, 'status' => $status],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('products/create', [
            'taxRates' => $this->taxRates(),
        ]);
    }

    public function store(ProductRequest $request): RedirectResponse
    {
        Product::create($request->validated());

        return redirect()->route('products.index')->with('success', 'Product created.');
    }

    public function edit(Product $product): Response
    {
        return Inertia::render('products/edit', [
            'product' => $product->only([
                'id', 'name', 'sku', 'description', 'unit_price', 'unit', 'tax_rate_id', 'is_active',
            ]),
            'taxRates' => $this->taxRates(),
        ]);
    }

    public function update(ProductRequest $request, Product $product): RedirectResponse
    {
        $product->update($request->validated());

        return redirect()->route('products.index')->with('success', 'Product updated.');
    }

    public function destroy(Product $product): RedirectResponse
    {
        $product->delete();

        return redirect()->route('products.index')->with('success', 'Product deleted.');
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function taxRates(): array
    {
        return TaxRate::query()
            ->where('is_active', true)
            ->orderByDesc('is_default')
            ->orderBy('name')
            ->get(['id', 'name', 'rate', 'is_default'])
            ->map(fn (TaxRate $rate) => [
                'id' => $rate->id,
                'name' => $rate->name,
                'rate' => (float) $rate->rate,
                'is_default' => $rate->is_default,
            ])->all();
    }
}
