<?php

use App\Http\Middleware\CheckRole;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        // Register middleware aliases
        $middleware->alias([
            'role' => CheckRole::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Handle database connection errors gracefully
        $exceptions->render(function (QueryException $e, $request) {
            // Connection error codes: 2002 (can't connect), 2003 (can't connect to MySQL),
            // 2006 (server gone away), 1045 (access denied), 1049 (unknown database)
            $connectionCodes = ['2002', '2003', '2006', '1045', '1049', 2002, 2003, 2006, 1045, 1049];

            $isConnectionError = $e->getPrevious() instanceof \PDOException &&
                in_array($e->getPrevious()->getCode(), $connectionCodes, false);

            if ($isConnectionError) {
                // Log the actual error for debugging
                Log::error('Database connection error', [
                    'message' => $e->getMessage(),
                    'code' => $e->getCode(),
                ]);

                // Return user-friendly response
                if ($request->expectsJson() || $request->is('api/*')) {
                    return response()->json([
                        'message' => 'Service temporarily unavailable. Please try again later.',
                    ], 503);
                }

                // For web requests, render an error page
                return Inertia::render('Error', [
                    'status' => 503,
                    'message' => 'Service temporarily unavailable. Please try again later.',
                ])->toResponse($request)->setStatusCode(503);
            }

            // For other database errors in production, hide details
            if (! config('app.debug')) {
                Log::error('Database error', [
                    'message' => $e->getMessage(),
                    'code' => $e->getCode(),
                ]);

                if ($request->expectsJson() || $request->is('api/*')) {
                    return response()->json([
                        'message' => 'A database error occurred. Please try again later.',
                    ], 500);
                }

                return Inertia::render('Error', [
                    'status' => 500,
                    'message' => 'A database error occurred. Please try again later.',
                ])->toResponse($request)->setStatusCode(500);
            }
        });

        // Handle PDO exceptions directly (in case they're not wrapped)
        $exceptions->render(function (\PDOException $e, $request) {
            $connectionCodes = ['2002', '2003', '2006', '1045', '1049', 2002, 2003, 2006, 1045, 1049];

            if (in_array($e->getCode(), $connectionCodes, false)) {
                Log::error('Database connection error (PDO)', [
                    'message' => $e->getMessage(),
                    'code' => $e->getCode(),
                ]);

                if ($request->expectsJson() || $request->is('api/*')) {
                    return response()->json([
                        'message' => 'Service temporarily unavailable. Please try again later.',
                    ], 503);
                }

                return Inertia::render('Error', [
                    'status' => 503,
                    'message' => 'Service temporarily unavailable. Please try again later.',
                ])->toResponse($request)->setStatusCode(503);
            }

            // For other PDO errors in production, hide details
            if (! config('app.debug')) {
                Log::error('Database error (PDO)', [
                    'message' => $e->getMessage(),
                    'code' => $e->getCode(),
                ]);

                if ($request->expectsJson() || $request->is('api/*')) {
                    return response()->json([
                        'message' => 'A database error occurred. Please try again later.',
                    ], 500);
                }

                return Inertia::render('Error', [
                    'status' => 500,
                    'message' => 'A database error occurred. Please try again later.',
                ])->toResponse($request)->setStatusCode(500);
            }
        });
    })->create();
