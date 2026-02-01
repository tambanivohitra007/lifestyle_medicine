<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Services\ImagenService;

$service = new ImagenService();

echo "Is configured: " . ($service->isConfigured() ? 'yes' : 'no') . "\n";
echo "Config status:\n";
print_r($service->getConfigurationStatus());

echo "\nAttempting to generate a simple test image...\n";

$result = $service->generateImage('A simple blue circle on white background');

echo "\nResult:\n";
print_r($result);
