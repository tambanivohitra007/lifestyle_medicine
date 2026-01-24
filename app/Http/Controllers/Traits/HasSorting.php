<?php

namespace App\Http\Controllers\Traits;

use Illuminate\Http\Request;

trait HasSorting
{
    /**
     * Apply sorting to the query based on request parameters.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param Request $request
     * @param array $allowedColumns
     * @param string $defaultColumn
     * @param string $defaultOrder
     * @return \Illuminate\Database\Eloquent\Builder
     */
    protected function applySorting($query, Request $request, array $allowedColumns, string $defaultColumn = 'created_at', string $defaultOrder = 'desc')
    {
        $sortBy = $request->get('sort_by', $defaultColumn);
        $sortOrder = $request->get('sort_order', $defaultOrder);

        // Validate sort column to prevent SQL injection
        if (!in_array($sortBy, $allowedColumns)) {
            $sortBy = $defaultColumn;
        }

        // Validate sort order
        $sortOrder = in_array(strtolower($sortOrder), ['asc', 'desc']) ? $sortOrder : $defaultOrder;

        return $query->orderBy($sortBy, $sortOrder);
    }
}
