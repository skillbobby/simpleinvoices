<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable()->after('id')->constrained()->nullOnDelete();
            $table->string('role', 20)->default('staff')->after('password');
            $table->boolean('is_active')->default(true)->after('role');
            $table->string('job_title')->nullable()->after('name');
            $table->string('phone', 40)->nullable()->after('email');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('tenant_id');
            $table->dropColumn(['role', 'is_active', 'job_title', 'phone']);
        });
    }
};
