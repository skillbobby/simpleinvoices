<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('sku', 64)->nullable();
            $table->text('description')->nullable();
            $table->decimal('unit_price', 15, 2)->default(0);
            $table->string('unit', 24)->default('unit');
            $table->foreignId('tax_rate_id')->nullable()->constrained()->nullOnDelete();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'name']);
            $table->index(['tenant_id', 'sku']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
