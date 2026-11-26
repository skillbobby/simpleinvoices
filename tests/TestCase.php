<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Feature tests exercise the HTTP/Inertia layer, not built assets.
        $this->withoutVite();

        config([
            'inertia.testing.page_paths' => [resource_path('js/pages')],
            'inertia.testing.page_extensions' => ['tsx', 'jsx', 'js'],
        ]);
    }
    //
}
