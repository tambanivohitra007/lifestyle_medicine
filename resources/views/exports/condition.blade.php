<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $condition->name }} - Lifestyle Medicine Guide</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 12px;
            line-height: 1.6;
            color: #333;
        }
        .header {
            background-color: #d31e3a;
            color: white;
            padding: 25px 30px;
            margin-bottom: 20px;
        }
        .logo-wrapper {
            text-align: center;
            margin-bottom: 15px;
        }
        .logo-wrapper img {
            max-width: 100px;
            height: auto;
            background: white;
            border-radius: 8px;
            padding: 8px;
        }
        .title-wrapper {
            text-align: center;
        }
        .org-name {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 5px;
        }
        .document-title {
            font-size: 16px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 8px;
            border-bottom: 1px solid rgba(255,255,255,0.3);
            padding-bottom: 8px;
        }
        .condition-name {
            font-size: 26px;
            font-weight: bold;
            margin-bottom: 5px;
            line-height: 1.2;
        }
        .header .category {
            display: inline-block;
            background-color: rgba(255, 255, 255, 0.2);
            padding: 4px 10px;
            border-radius: 4px;
            font-size: 12px;
            margin-top: 5px;
        }
        .header .summary {
            margin-top: 15px;
            font-size: 12px;
            line-height: 1.5;
            text-align: left;
        }
        .section {
            margin: 20px 30px;
            page-break-inside: avoid;
        }
        .section-title {
            font-size: 18px;
            color: #d31e3a;
            border-bottom: 2px solid #d31e3a;
            padding-bottom: 8px;
            margin-bottom: 15px;
        }
        .subsection {
            margin-bottom: 20px;
        }
        .subsection-title {
            font-size: 14px;
            font-weight: bold;
            color: #374151;
            margin-bottom: 8px;
        }
        .card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
        }
        .card-title {
            font-size: 14px;
            font-weight: bold;
            color: #1e293b;
            margin-bottom: 8px;
        }
        .card-content {
            font-size: 12px;
            color: #475569;
        }
        .badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: bold;
            margin-right: 5px;
        }
        .badge-domain {
            background: #dbeafe;
            color: #1e40af;
        }
        .badge-quality-A {
            background: #dcfce7;
            color: #166534;
        }
        .badge-quality-B {
            background: #dbeafe;
            color: #1e40af;
        }
        .badge-quality-C {
            background: #fef3c7;
            color: #92400e;
        }
        .badge-quality-D {
            background: #fee2e2;
            color: #991b1b;
        }
        .domain-header {
            background: #fef2f2;
            padding: 10px 15px;
            margin: 20px 0 10px 0;
            border-left: 4px solid #d31e3a;
            font-weight: bold;
            color: #991b1b;
        }
        .intervention-item {
            margin-bottom: 15px;
            page-break-inside: avoid;
        }
        .evidence-list {
            margin-left: 15px;
            margin-top: 10px;
        }
        .evidence-item {
            background: white;
            border-left: 3px solid #d31e3a;
            padding: 10px 15px;
            margin-bottom: 10px;
        }
        .reference-list {
            margin-top: 8px;
            padding-left: 15px;
        }
        .reference-item {
            font-size: 10px;
            color: #64748b;
            margin-bottom: 3px;
        }
        .scripture-box {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin-bottom: 15px;
            font-style: italic;
        }
        .scripture-reference {
            font-weight: bold;
            font-style: normal;
            color: #92400e;
            margin-top: 8px;
            text-align: right;
        }
        .recipe-card {
            background: #ecfdf5;
            border: 1px solid #a7f3d0;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
        }
        .recipe-title {
            font-size: 14px;
            font-weight: bold;
            color: #065f46;
            margin-bottom: 5px;
        }
        .recipe-meta {
            font-size: 10px;
            color: #047857;
            margin-bottom: 10px;
        }
        .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: #f1f5f9;
            padding: 10px 30px;
            font-size: 9px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
        }
        .footer-content {
            display: table;
            width: 100%;
        }
        .footer-left {
            display: table-cell;
            width: 70%;
            text-align: left;
        }
        .footer-right {
            display: table-cell;
            width: 30%;
            text-align: right;
        }
        .page-number:after {
            content: counter(page);
        }
        .section-type-badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 9px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .type-risk_factors { background: #fee2e2; color: #991b1b; }
        .type-physiology { background: #dbeafe; color: #1e40af; }
        .type-complications { background: #ffedd5; color: #9a3412; }
        .type-solutions { background: #dcfce7; color: #166534; }
        .type-additional_factors { background: #f3e8ff; color: #7c3aed; }
        .type-scripture { background: #e0e7ff; color: #4338ca; }
        .type-research_ideas { background: #ccfbf1; color: #0f766e; }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo-wrapper">
            <img src="{{ public_path('lifestyle.png') }}" alt="Logo">
        </div>
        <div class="title-wrapper">
            <div class="org-name">Lifestyle Medicine & Gospel Medical Evangelism</div>
            <div class="document-title">Lifestyle Treatment Guide</div>
            <div class="condition-name">{{ $condition->name }}</div>
            @if($condition->category)
                <div class="category">{{ $condition->category }}</div>
            @endif
        </div>
        @if($condition->summary)
            <div class="summary">{{ strip_tags($condition->summary) }}</div>
        @endif
    </div>

    @php
        $sectionTypes = [
            'risk_factors' => 'Risk Factors / Causes',
            'physiology' => 'Physiology',
            'complications' => 'Complications',
            'solutions' => 'Lifestyle Solutions',
            'additional_factors' => 'Additional Factors',
            'scripture' => 'Scripture / SOP',
            'research_ideas' => 'Research Ideas',
        ];
        $groupedSections = $condition->sections ? $condition->sections->groupBy('section_type') : collect();
    @endphp

    @foreach($sectionTypes as $type => $label)
        @if($groupedSections->has($type))
            <div class="section">
                <h2 class="section-title">{{ $label }}</h2>
                @foreach($groupedSections->get($type) as $section)
                    <div class="subsection">
                        <h3 class="subsection-title">{{ $section->title }}</h3>
                        <div class="card-content">{!! $section->body !!}</div>
                    </div>
                @endforeach
            </div>
        @endif
    @endforeach

    @if($condition->interventions && $condition->interventions->count() > 0)
        @php
            $groupedInterventions = $condition->interventions->groupBy(function($intervention) {
                return $intervention->careDomain ? $intervention->careDomain->name : 'Other';
            })->sortKeys();
        @endphp

        <div class="section">
            <h2 class="section-title">Lifestyle Interventions</h2>

            @foreach($groupedInterventions as $domainName => $interventions)
                <div class="domain-header">{{ $domainName }}</div>

                @foreach($interventions as $intervention)
                    <div class="intervention-item">
                        <div class="card">
                            <div class="card-title">{{ $intervention->name }}</div>

                            @if($intervention->description)
                                <div class="card-content" style="margin-top: 10px;">
                                    {{ strip_tags($intervention->description) }}
                                </div>
                            @endif

                            @if($intervention->mechanism)
                                <div style="margin-top: 10px;">
                                    <strong style="font-size: 11px; color: #374151;">Mechanism of Action:</strong>
                                    <div class="card-content">{{ $intervention->mechanism }}</div>
                                </div>
                            @endif

                            @if($intervention->evidenceEntries && $intervention->evidenceEntries->count() > 0)
                                <div class="evidence-list">
                                    <strong style="font-size: 11px; color: #374151;">Evidence:</strong>
                                    @foreach($intervention->evidenceEntries as $evidence)
                                        <div class="evidence-item">
                                            @if($evidence->quality_rating)
                                                <span class="badge badge-quality-{{ $evidence->quality_rating }}">
                                                    Grade {{ $evidence->quality_rating }}
                                                </span>
                                            @endif
                                            @if($evidence->study_type)
                                                <span style="font-size: 10px; color: #64748b;">
                                                    {{ ucwords(str_replace('_', ' ', $evidence->study_type)) }}
                                                </span>
                                            @endif
                                            @if($evidence->summary)
                                                <div class="card-content" style="margin-top: 5px;">
                                                    {{ strip_tags($evidence->summary ?? '') }}
                                                </div>
                                            @endif
                                            @if($evidence->references && $evidence->references->count() > 0)
                                                <div class="reference-list">
                                                    @foreach($evidence->references as $reference)
                                                        <div class="reference-item">
                                                            {{ $reference->citation }}
                                                            @if($reference->year) ({{ $reference->year }})@endif
                                                            @if($reference->doi) - DOI: {{ $reference->doi }}@endif
                                                        </div>
                                                    @endforeach
                                                </div>
                                            @endif
                                        </div>
                                    @endforeach
                                </div>
                            @endif
                        </div>
                    </div>
                @endforeach
            @endforeach
        </div>
    @endif

    @if($condition->scriptures && $condition->scriptures->count() > 0)
        <div class="section">
            <h2 class="section-title">Scriptural Guidance</h2>
            @foreach($condition->scriptures as $scripture)
                <div class="scripture-box">
                    <div>{{ $scripture->text }}</div>
                    <div class="scripture-reference">— {{ $scripture->reference }}</div>
                    @if($scripture->application)
                        <div style="margin-top: 10px; font-style: normal; font-size: 11px; color: #78716c;">
                            <strong>Application:</strong> {{ $scripture->application }}
                        </div>
                    @endif
                </div>
            @endforeach
        </div>
    @endif

    @if($condition->recipes && $condition->recipes->count() > 0)
        <div class="section">
            <h2 class="section-title">Recommended Recipes</h2>
            @foreach($condition->recipes as $recipe)
                <div class="recipe-card">
                    <div class="recipe-title">{{ $recipe->title }}</div>
                    <div class="recipe-meta">
                        @if($recipe->prep_time_minutes)Prep: {{ $recipe->prep_time_minutes }} min @endif
                        @if($recipe->cook_time_minutes)| Cook: {{ $recipe->cook_time_minutes }} min @endif
                        @if($recipe->servings)| Servings: {{ $recipe->servings }}@endif
                    </div>
                    @if($recipe->description)
                        <div class="card-content">{{ strip_tags($recipe->description) }}</div>
                    @endif
                    @if($recipe->ingredients && is_array($recipe->ingredients) && count($recipe->ingredients) > 0)
                        <div style="margin-top: 10px;">
                            <strong style="font-size: 11px;">Ingredients:</strong>
                            <div class="card-content">
                                <ul style="margin: 5px 0; padding-left: 20px;">
                                    @foreach($recipe->ingredients as $ingredient)
                                        <li style="margin-bottom: 3px;">{{ $ingredient }}</li>
                                    @endforeach
                                </ul>
                            </div>
                        </div>
                    @endif
                    @if($recipe->instructions)
                        <div style="margin-top: 10px;">
                            <strong style="font-size: 11px;">Instructions:</strong>
                            <div class="card-content">{!! nl2br(e($recipe->instructions ?? '')) !!}</div>
                        </div>
                    @endif
                </div>
            @endforeach
        </div>
    @endif

    <div class="footer">
        <div class="footer-content">
            <div class="footer-left">
                <strong>{{ $condition->name }}</strong> - Lifestyle Medicine Treatment Guide<br>
                Generated on {{ now()->format('F j, Y') }} | For educational purposes only. Consult a healthcare professional for medical advice.
            </div>
            <div class="footer-right">
                Page <span class="page-number"></span>
            </div>
        </div>
    </div>
</body>
</html>
