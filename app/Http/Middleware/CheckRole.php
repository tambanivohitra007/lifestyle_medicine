<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$roles  Allowed roles (comma-separated or multiple args)
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        // Check if user is active
        if (! $user->is_active) {
            return response()->json([
                'message' => 'Your account has been deactivated.',
            ], 403);
        }

        // If no specific roles required, just check authentication
        if (empty($roles)) {
            return $next($request);
        }

        // Check if user has one of the required roles
        if (in_array($user->role, $roles)) {
            return $next($request);
        }

        return response()->json([
            'message' => 'You do not have permission to access this resource.',
            'required_roles' => $roles,
            'your_role' => $user->role,
        ], 403);
    }
}
