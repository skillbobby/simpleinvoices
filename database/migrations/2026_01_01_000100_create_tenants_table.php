<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenants', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('website')->nullable();
            $table->string('address_line1')->nullable();
            $table->string('address_line2')->nullable();
            $table->string('city')->nullable();
            $table->string('state')->nullable();
            $table->string('postal_code', 32)->nullable();
            $table->string('country', 64)->nullable();
            $table->string('tax_id')->nullable();
            $table->string('logo_path')->nullable();

            $table->char('currency_code', 3)->default('USD');
            $table->string('locale', 12)->default('en');
            $table->string('timezone', 64)->default('UTC');

            $table->string('invoice_prefix', 20)->default('INV');
            $table->unsignedInteger('invoice_next_number')->default(1);
            $table->unsignedTinyInteger('invoice_number_padding')->default(4);
            $table->unsignedSmallInteger('default_payment_terms_days')->default(14);
            $table->decimal('default_tax_rate', 8, 4)->default(0);
            $table->text('invoice_notes')->nullable();
            $table->text('invoice_footer')->nullable();
            $table->text('bank_details')->nullable();

            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenants');
    }
};
