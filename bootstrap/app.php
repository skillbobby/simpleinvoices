<?php

use App\Http\Middleware\EnsureTenant;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\SetTenantContext;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Routing\Middleware\SubstituteBindings;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Tenant resolution must run before SubstituteBindings, otherwise route
        // model binding would resolve records without the tenant global scope
        // and another company's customer/invoice could be loaded by id.
        $middleware->web(
            remove: [SubstituteBindings::class],
            append: [
                SetTenantContext::class,
                SubstituteBindings::class,
                HandleInertiaRequests::class,
                AddLinkHeadersForPreloadedAssets::class,
            ],
        );

        $middleware->alias([
            'tenant' => EnsureTenant::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
