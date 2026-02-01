<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "App environment: " . config('app.env') . "\n";
echo "Verify SSL: " . (config('services.vertex_ai.verify_ssl') ? 'true' : 'false') . "\n";
echo "Project ID: " . config('services.vertex_ai.project_id') . "\n";
echo "Location: " . config('services.vertex_ai.location') . "\n";
echo "Model: " . config('services.vertex_ai.imagen_model') . "\n";

// Test the condition
$verifySsl = config('services.vertex_ai.verify_ssl', true);
$appEnv = config('app.env');

echo "\nCondition check:\n";
echo "  verifySsl = " . ($verifySsl ? 'true' : 'false') . "\n";
echo "  !verifySsl = " . (!$verifySsl ? 'true' : 'false') . "\n";
echo "  appEnv = $appEnv\n";
echo "  appEnv === 'local' = " . ($appEnv === 'local' ? 'true' : 'false') . "\n";
echo "  Will use REST: " . (!$verifySsl && $appEnv === 'local' ? 'YES' : 'NO') . "\n";
