<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class InvoiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $tenantId = $this->user()->tenant_id;

        return [
            'customer_id' => ['required', 'integer', Rule::exists('customers', 'id')->where('tenant_id', $tenantId)],
            'payment_term_id' => ['nullable', 'integer', Rule::exists('payment_terms', 'id')->where('tenant_id', $tenantId)],
            'issue_date' => ['required', 'date'],
            'due_date' => ['nullable', 'date', 'after_or_equal:issue_date'],
            'currency_code' => ['nullable', 'string', 'size:3'],
            'discount_type' => ['required', Rule::in(['none', 'fixed', 'percent'])],
            'discount_value' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'terms' => ['nullable', 'string', 'max:5000'],
            'footer' => ['nullable', 'string', 'max:5000'],
            'status' => ['nullable', Rule::in(['draft', 'sent'])],
            'items' => ['required', 'array', 'min:1'],
            'items.*.description' => ['required', 'string', 'max:255'],
            'items.*.quantity' => ['required', 'numeric', 'gt:0', 'max:999999'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0', 'max:999999999'],
            'items.*.unit' => ['nullable', 'string', 'max:24'],
            'items.*.product_id' => ['nullable', 'integer', Rule::exists('products', 'id')->where('tenant_id', $tenantId)],
            'items.*.tax_rate_id' => ['nullable', 'integer', Rule::exists('tax_rates', 'id')->where('tenant_id', $tenantId)],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'currency_code' => $this->filled('currency_code') ? strtoupper((string) $this->input('currency_code')) : null,
            'discount_type' => $this->input('discount_type', 'none'),
            'discount_value' => $this->input('discount_value', 0),
        ]);
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'items.required' => 'Add at least one line item to the invoice.',
            'items.*.description.required' => 'Every line item needs a description.',
            'items.*.quantity.gt' => 'Line item quantities must be greater than zero.',
        ];
    }
}
