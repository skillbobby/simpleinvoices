<?php

use App\Http\Controllers\Settings\CompanyController;
use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\PaymentTermController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\TaxRateController;
use App\Http\Controllers\Settings\TeamController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['auth', 'tenant'])->group(function () {
    Route::redirect('settings', 'settings/profile');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('settings/password', [PasswordController::class, 'edit'])->name('password.edit');
    Route::put('settings/password', [PasswordController::class, 'update'])->name('password.update');

    Route::get('settings/appearance', function () {
        return Inertia::render('settings/appearance');
    })->name('appearance');

    Route::get('settings/company', [CompanyController::class, 'edit'])->name('settings.company');
    Route::patch('settings/company', [CompanyController::class, 'update'])->name('settings.company.update');

    Route::get('settings/tax-rates', [TaxRateController::class, 'index'])->name('settings.tax-rates');
    Route::post('settings/tax-rates', [TaxRateController::class, 'store'])->name('settings.tax-rates.store');
    Route::patch('settings/tax-rates/{taxRate}', [TaxRateController::class, 'update'])->name('settings.tax-rates.update');
    Route::delete('settings/tax-rates/{taxRate}', [TaxRateController::class, 'destroy'])->name('settings.tax-rates.destroy');

    Route::get('settings/payment-terms', [PaymentTermController::class, 'index'])->name('settings.payment-terms');
    Route::post('settings/payment-terms', [PaymentTermController::class, 'store'])->name('settings.payment-terms.store');
    Route::patch('settings/payment-terms/{paymentTerm}', [PaymentTermController::class, 'update'])->name('settings.payment-terms.update');
    Route::delete('settings/payment-terms/{paymentTerm}', [PaymentTermController::class, 'destroy'])->name('settings.payment-terms.destroy');

    Route::get('settings/team', [TeamController::class, 'index'])->name('settings.team');
    Route::post('settings/team', [TeamController::class, 'store'])->name('settings.team.store');
    Route::patch('settings/team/{member}', [TeamController::class, 'update'])->name('settings.team.update');
    Route::delete('settings/team/{member}', [TeamController::class, 'destroy'])->name('settings.team.destroy');
});
