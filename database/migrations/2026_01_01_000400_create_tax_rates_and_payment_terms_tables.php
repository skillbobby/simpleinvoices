<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tax_rates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->decimal('rate', 8, 4)->default(0);
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['tenant_id', 'is_active']);
        });

        Schema::create('payment_terms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->unsignedSmallInteger('days')->default(0);
            $table->boolean('is_default')->default(false);
            $table->timestamps();

            $table->index(['tenant_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_terms');
        Schema::dropIfExists('tax_rates');
    }
};
