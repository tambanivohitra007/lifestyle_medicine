<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Role-based access control middleware for API routes.
 *
 * Enforces authentication, account activation status, and role-based authorization
 * on protected API endpoints. Designed for use with Laravel Sanctum-authenticated routes.
 *
 * Behavior:
 * - Returns 401 if the user is not authenticated
 * - Returns 403 if the user's account is deactivated (is_active = false)
 * - If no roles are specified, allows any authenticated active user
 * - If roles are specified, checks the user's role against the allowed list
 * - Returns 403 with diagnostic info (required vs. actual role) if unauthorized
 *
 * Usage in routes:
 *   middleware('role:admin')           — admin only
 *   middleware('role:admin,editor')    — admin or editor
 *   middleware('role')                 — any authenticated active user
 *
 * @see \App\Models\User::$role The user role column (admin, editor, viewer)
 */
class CheckRole
{
    /**
     * Handle an incoming request by checking authentication, account status, and role.
     *
     * @param  \Illuminate\Http\Request  $request  The incoming HTTP request
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next  The next middleware/handler in the pipeline
     * @param  string  ...$roles  Allowed roles (e.g., 'admin', 'editor'). If empty, any role is accepted.
     * @return \Symfony\Component\HttpFoundation\Response The response (JSON error or next handler result)
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
