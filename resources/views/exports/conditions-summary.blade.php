<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Conditions Summary - Lifestyle Medicine Guide</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 11px;
            line-height: 1.5;
            color: #333;
        }
        .header {
            background: linear-gradient(135deg, #d31e3a, #c1213a);
            color: white;
            padding: 25px 30px;
            margin-bottom: 20px;
        }
        .header-top {
            display: table;
            width: 100%;
        }
        .logo-section {
            display: table-cell;
            vertical-align: middle;
            width: 80px;
        }
        .logo-section img {
            width: 60px;
            height: 60px;
            background: white;
            border-radius: 8px;
            padding: 8px;
        }
        .title-section {
            display: table-cell;
            vertical-align: middle;
            padding-left: 20px;
        }
        .org-name {
            font-size: 10px;
            opacity: 0.9;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 3px;
        }
        .header h1 {
            font-size: 22px;
            margin-bottom: 3px;
        }
        .header p {
            font-size: 11px;
            opacity: 0.9;
        }
        .content {
            padding: 0 30px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        th {
            background: #fef2f2;
            color: #374151;
            font-weight: bold;
            text-align: left;
            padding: 12px 10px;
            border-bottom: 2px solid #d31e3a;
        }
        td {
            padding: 10px;
            border-bottom: 1px solid #e2e8f0;
            vertical-align: top;
        }
        tr:nth-child(even) {
            background: #f8fafc;
        }
        .condition-name {
            font-weight: bold;
            color: #1e293b;
            font-size: 12px;
        }
        .condition-summary {
            color: #64748b;
            font-size: 10px;
            max-width: 300px;
        }
        .intervention-count {
            text-align: center;
            font-weight: bold;
            color: #d31e3a;
        }
        .intervention-list {
            font-size: 10px;
            color: #475569;
        }
        .condition-category {
            display: inline-block;
            background: #fee2e2;
            color: #991b1b;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 9px;
            margin-top: 3px;
        }
        .intervention-list li {
            margin-bottom: 2px;
        }
        .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: #f1f5f9;
            padding: 10px 30px;
            font-size: 10px;
            color: #64748b;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        .stats {
            display: table;
            width: 100%;
            margin-bottom: 20px;
        }
        .stat-box {
            display: table-cell;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
            width: 25%;
        }
        .stat-number {
            font-size: 24px;
            font-weight: bold;
            color: #d31e3a;
        }
        .stat-label {
            font-size: 11px;
            color: #64748b;
            margin-top: 5px;
        }
        .page-number:after {
            content: counter(page);
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="header-top">
            <div class="logo-section">
                <img src="{{ public_path('lifestyle.png') }}" alt="Logo">
            </div>
            <div class="title-section">
                <div class="org-name">Lifestyle Medicine & Gospel Medical Evangelism</div>
                <h1>Conditions Summary</h1>
                <p>Comprehensive Knowledge Base</p>
            </div>
        </div>
    </div>

    <div class="content">
        <div class="stats">
            <table style="border: none;">
                <tr>
                    <td style="border: none; padding: 5px;">
                        <div class="stat-box">
                            <div class="stat-number">{{ $conditions->count() }}</div>
                            <div class="stat-label">Total Conditions</div>
                        </div>
                    </td>
                    <td style="border: none; padding: 5px;">
                        <div class="stat-box">
                            <div class="stat-number">{{ $conditions->sum(fn($c) => $c->interventions->count()) }}</div>
                            <div class="stat-label">Total Interventions</div>
                        </div>
                    </td>
                    <td style="border: none; padding: 5px;">
                        <div class="stat-box">
                            <div class="stat-number">{{ $conditions->pluck('category')->filter()->unique()->count() }}</div>
                            <div class="stat-label">Categories</div>
                        </div>
                    </td>
                </tr>
            </table>
        </div>

        <table>
            <thead>
                <tr>
                    <th style="width: 25%;">Condition</th>
                    <th style="width: 35%;">Summary</th>
                    <th style="width: 10%; text-align: center;">Interventions</th>
                    <th style="width: 30%;">Key Interventions</th>
                </tr>
            </thead>
            <tbody>
                @foreach($conditions as $condition)
                    <tr>
                        <td>
                            <div class="condition-name">{{ $condition->name }}</div>
                            @if($condition->category)
                                <span class="condition-category">{{ $condition->category }}</span>
                            @endif
                        </td>
                        <td>
                            <div class="condition-summary">
                                {{ Str::limit(strip_tags($condition->summary ?? ''), 150) }}
                            </div>
                        </td>
                        <td class="intervention-count">
                            {{ $condition->interventions->count() }}
                        </td>
                        <td>
                            @if($condition->interventions->count() > 0)
                                <ul class="intervention-list" style="list-style: none; padding: 0; margin: 0;">
                                    @foreach($condition->interventions->take(3) as $intervention)
                                        <li>• {{ $intervention->name }}</li>
                                    @endforeach
                                    @if($condition->interventions->count() > 3)
                                        <li style="color: #94a3b8; font-style: italic;">
                                            +{{ $condition->interventions->count() - 3 }} more
                                        </li>
                                    @endif
                                </ul>
                            @else
                                <span style="color: #94a3b8; font-style: italic;">No interventions</span>
                            @endif
                        </td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <div class="footer">
        Lifestyle Medicine Conditions Summary - Generated on {{ now()->format('F j, Y') }} | Page <span class="page-number"></span>
    </div>
</body>
</html>
