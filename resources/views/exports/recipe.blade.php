<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $recipe->title }} - Recipe</title>
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
            padding-bottom: 20px;
        }
        @page {
            margin-top: 40px;
            margin-bottom: 20px;
        }
        .header {
            background-color: #065f46;
            color: white;
            padding: 25px 30px;
            margin-bottom: 20px;
        }
        .logo-wrapper {
            text-align: center;
            margin-bottom: 15px;
        }
        .logo-wrapper img {
            max-width: 80px;
            height: auto;
            background: white;
            border-radius: 8px;
            padding: 6px;
        }
        .title-wrapper {
            text-align: center;
        }
        .org-name {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 5px;
            opacity: 0.9;
        }
        .document-title {
            font-size: 14px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 8px;
            border-bottom: 1px solid rgba(255,255,255,0.3);
            padding-bottom: 8px;
        }
        .recipe-name {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
            line-height: 1.2;
        }
        .recipe-meta {
            display: table;
            width: 100%;
            margin-top: 15px;
            background: rgba(255,255,255,0.15);
            border-radius: 6px;
            padding: 10px 15px;
        }
        .meta-item {
            display: table-cell;
            text-align: center;
            padding: 0 10px;
            border-right: 1px solid rgba(255,255,255,0.3);
        }
        .meta-item:last-child {
            border-right: none;
        }
        .meta-label {
            font-size: 9px;
            text-transform: uppercase;
            opacity: 0.8;
            margin-bottom: 2px;
        }
        .meta-value {
            font-size: 16px;
            font-weight: bold;
        }
        .dietary-tags {
            margin-top: 15px;
            text-align: center;
        }
        .dietary-tag {
            display: inline-block;
            background: rgba(255,255,255,0.2);
            padding: 4px 12px;
            border-radius: 15px;
            font-size: 10px;
            margin: 2px;
        }
        .content-wrapper {
            padding-bottom: 60px;
        }
        .section {
            margin: 20px 30px;
            page-break-inside: avoid;
        }
        .section-title {
            font-size: 16px;
            color: #065f46;
            border-bottom: 2px solid #065f46;
            padding-bottom: 8px;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .description {
            background: #f0fdf4;
            border-left: 4px solid #10b981;
            padding: 15px;
            margin-bottom: 20px;
            font-style: italic;
            color: #166534;
        }
        .ingredients-list {
            background: #fefce8;
            border: 1px solid #fde047;
            border-radius: 8px;
            padding: 20px;
        }
        .ingredients-list ul {
            margin: 0;
            padding-left: 20px;
        }
        .ingredients-list li {
            margin-bottom: 8px;
            padding-left: 5px;
        }
        .ingredient-amount {
            font-weight: bold;
            color: #854d0e;
        }
        .instructions-list {
            counter-reset: step-counter;
        }
        .instruction-step {
            display: table;
            width: 100%;
            margin-bottom: 15px;
            page-break-inside: avoid;
        }
        .step-number {
            display: table-cell;
            width: 40px;
            vertical-align: top;
        }
        .step-circle {
            width: 30px;
            height: 30px;
            background: #065f46;
            color: white;
            border-radius: 50%;
            text-align: center;
            line-height: 30px;
            font-weight: bold;
            font-size: 14px;
        }
        .step-content {
            display: table-cell;
            vertical-align: top;
            padding-left: 10px;
            padding-top: 5px;
        }
        .related-section {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 15px;
            margin-top: 10px;
        }
        .related-title {
            font-size: 12px;
            font-weight: bold;
            color: #475569;
            margin-bottom: 10px;
        }
        .related-item {
            display: inline-block;
            background: #e2e8f0;
            padding: 4px 10px;
            border-radius: 4px;
            font-size: 10px;
            margin: 2px;
            color: #334155;
        }
        .related-item.condition {
            background: #fce7f3;
            color: #9d174d;
        }
        .related-item.intervention {
            background: #dbeafe;
            color: #1e40af;
        }
        .related-item.tag {
            background: #e0e7ff;
            color: #4338ca;
        }
        .nutrition-note {
            background: #fef3c7;
            border: 1px solid #fcd34d;
            border-radius: 8px;
            padding: 15px;
            margin-top: 20px;
            font-size: 11px;
            color: #92400e;
        }
        .nutrition-note strong {
            display: block;
            margin-bottom: 5px;
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
            height: 50px;
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
    </style>
</head>
<body>
    <div class="content-wrapper">
        <div class="header">
            <div class="logo-wrapper">
                <img src="{{ public_path('lifestyle.png') }}" alt="Logo">
            </div>
            <div class="title-wrapper">
                <div class="org-name">Lifestyle Medicine & Gospel Medical Evangelism</div>
                <div class="document-title">Healthy Recipe</div>
                <div class="recipe-name">{{ $recipe->title }}</div>
            </div>

            @if($recipe->prep_time_minutes || $recipe->cook_time_minutes || $recipe->servings)
                <div class="recipe-meta">
                    @if($recipe->prep_time_minutes)
                        <div class="meta-item">
                            <div class="meta-label">Prep Time</div>
                            <div class="meta-value">{{ $recipe->prep_time_minutes }} min</div>
                        </div>
                    @endif
                    @if($recipe->cook_time_minutes)
                        <div class="meta-item">
                            <div class="meta-label">Cook Time</div>
                            <div class="meta-value">{{ $recipe->cook_time_minutes }} min</div>
                        </div>
                    @endif
                    @if($recipe->prep_time_minutes && $recipe->cook_time_minutes)
                        <div class="meta-item">
                            <div class="meta-label">Total Time</div>
                            <div class="meta-value">{{ $recipe->prep_time_minutes + $recipe->cook_time_minutes }} min</div>
                        </div>
                    @endif
                    @if($recipe->servings)
                        <div class="meta-item">
                            <div class="meta-label">Servings</div>
                            <div class="meta-value">{{ $recipe->servings }}</div>
                        </div>
                    @endif
                </div>
            @endif

            @if($recipe->dietary_tags && is_array($recipe->dietary_tags) && count($recipe->dietary_tags) > 0)
                <div class="dietary-tags">
                    @foreach($recipe->dietary_tags as $tag)
                        <span class="dietary-tag">{{ $tag }}</span>
                    @endforeach
                </div>
            @endif
        </div>

        @if($recipe->description)
            <div class="section">
                <div class="description">
                    {{ strip_tags($recipe->description) }}
                </div>
            </div>
        @endif

        @if($recipe->ingredients && is_array($recipe->ingredients) && count($recipe->ingredients) > 0)
            <div class="section">
                <h2 class="section-title">Ingredients</h2>
                <div class="ingredients-list">
                    <ul>
                        @foreach($recipe->ingredients as $ingredient)
                            <li>
                                @if(is_array($ingredient) || is_object($ingredient))
                                    @php $ing = (array) $ingredient; @endphp
                                    @if(isset($ing['amount']) && $ing['amount'])
                                        <span class="ingredient-amount">{{ $ing['amount'] }}</span>
                                    @endif
                                    {{ $ing['item'] ?? '' }}
                                @else
                                    {{ $ingredient }}
                                @endif
                            </li>
                        @endforeach
                    </ul>
                </div>
            </div>
        @endif

        @if($recipe->instructions)
            <div class="section">
                <h2 class="section-title">Instructions</h2>
                <div class="instructions-list">
                    @php
                        $steps = preg_split('/\r\n|\r|\n/', trim($recipe->instructions));
                        $steps = array_filter($steps, fn($step) => trim($step) !== '');
                        $stepNumber = 0;
                    @endphp
                    @foreach($steps as $step)
                        @php $stepNumber++; @endphp
                        <div class="instruction-step">
                            <div class="step-number">
                                <div class="step-circle">{{ $stepNumber }}</div>
                            </div>
                            <div class="step-content">
                                {{ trim($step) }}
                            </div>
                        </div>
                    @endforeach
                </div>
            </div>
        @endif

        @if(($recipe->conditions && $recipe->conditions->count() > 0) ||
            ($recipe->interventions && $recipe->interventions->count() > 0) ||
            ($recipe->tags && $recipe->tags->count() > 0))
            <div class="section">
                <h2 class="section-title">Related Information</h2>

                @if($recipe->conditions && $recipe->conditions->count() > 0)
                    <div class="related-section">
                        <div class="related-title">Beneficial for Conditions:</div>
                        @foreach($recipe->conditions as $condition)
                            <span class="related-item condition">{{ $condition->name }}</span>
                        @endforeach
                    </div>
                @endif

                @if($recipe->interventions && $recipe->interventions->count() > 0)
                    <div class="related-section">
                        <div class="related-title">Supports Interventions:</div>
                        @foreach($recipe->interventions as $intervention)
                            <span class="related-item intervention">
                                {{ $intervention->name }}
                                @if($intervention->careDomain)
                                    ({{ $intervention->careDomain->name }})
                                @endif
                            </span>
                        @endforeach
                    </div>
                @endif

                @if($recipe->tags && $recipe->tags->count() > 0)
                    <div class="related-section">
                        <div class="related-title">Content Tags:</div>
                        @foreach($recipe->tags as $tag)
                            <span class="related-item tag">{{ $tag->name }}</span>
                        @endforeach
                    </div>
                @endif
            </div>
        @endif

        <div class="section">
            <div class="nutrition-note">
                <strong>Nutritional Note</strong>
                This recipe is designed to support a whole-food, plant-based lifestyle. For specific nutritional requirements
                or dietary restrictions, please consult with a registered dietitian or healthcare provider.
            </div>
        </div>
    </div>

    <div class="footer">
        <div class="footer-content">
            <div class="footer-left">
                <strong>{{ $recipe->title }}</strong> - Healthy Recipe<br>
                Generated on {{ now()->format('F j, Y') }} | Lifestyle Medicine & Gospel Medical Evangelism
            </div>
            <div class="footer-right">
                Page <span class="page-number"></span>
            </div>
        </div>
    </div>
</body>
</html>
