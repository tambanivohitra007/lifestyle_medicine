<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\InfographicGenerationRequest;
use App\Jobs\GenerateInfographicJob;

// Reset failed/pending requests
InfographicGenerationRequest::whereIn('status', ['failed', 'pending'])->update([
    'status' => 'pending',
    'attempts' => 0,
    'error_message' => null
]);

// Clear old jobs from queue
Illuminate\Support\Facades\DB::table('jobs')->truncate();

$requests = InfographicGenerationRequest::where('status', 'pending')->get();

echo "Found " . count($requests) . " pending requests\n";

foreach ($requests as $request) {
    GenerateInfographicJob::dispatch($request);
    echo "Dispatched job for request: " . $request->id . " (" . $request->infographic_type . ")\n";
}

echo "Done!\n";
