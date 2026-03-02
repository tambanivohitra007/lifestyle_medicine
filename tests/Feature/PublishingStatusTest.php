<?php

namespace Tests\Feature;

use App\Models\Condition;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublishingStatusTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $editor;

    private User $viewer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $this->editor = User::factory()->create(['role' => 'editor', 'is_active' => true]);
        $this->viewer = User::factory()->create(['role' => 'viewer', 'is_active' => true]);
    }

    public function test_public_api_only_returns_published_items(): void
    {
        Condition::factory()->published()->create(['name' => 'Published Condition']);
        Condition::factory()->draft()->create(['name' => 'Draft Condition']);
        Condition::factory()->inReview()->create(['name' => 'In Review Condition']);
        Condition::factory()->archived()->create(['name' => 'Archived Condition']);

        $response = $this->getJson('/api/v1/conditions');

        $response->assertOk();
        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals('Published Condition', $data[0]['name']);
    }

    public function test_admin_can_see_all_statuses(): void
    {
        Condition::factory()->published()->create();
        Condition::factory()->draft()->create();
        Condition::factory()->inReview()->create();
        Condition::factory()->archived()->create();

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/conditions');

        $response->assertOk();
        $this->assertCount(4, $response->json('data'));
    }

    public function test_admin_can_filter_by_status(): void
    {
        Condition::factory()->published()->create();
        Condition::factory()->draft()->create();
        Condition::factory()->draft()->create();

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/conditions?status=draft');

        $response->assertOk();
        $this->assertCount(2, $response->json('data'));
    }

    public function test_viewer_only_sees_published_items(): void
    {
        Condition::factory()->published()->create();
        Condition::factory()->draft()->create();

        $response = $this->actingAs($this->viewer)
            ->getJson('/api/v1/conditions');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
    }

    public function test_public_show_returns_404_for_non_published(): void
    {
        $condition = Condition::factory()->draft()->create();

        $response = $this->getJson("/api/v1/conditions/{$condition->id}");

        $response->assertNotFound();
    }

    public function test_admin_can_view_non_published_item(): void
    {
        $condition = Condition::factory()->draft()->create();

        $response = $this->actingAs($this->admin)
            ->getJson("/api/v1/conditions/{$condition->id}");

        $response->assertOk();
    }

    public function test_admin_can_publish_condition(): void
    {
        $condition = Condition::factory()->draft()->create();

        $response = $this->actingAs($this->admin)
            ->postJson("/api/v1/admin/conditions/{$condition->id}/publish");

        $response->assertOk();
        $this->assertEquals('published', $condition->fresh()->status);
    }

    public function test_editor_cannot_publish(): void
    {
        $condition = Condition::factory()->draft()->create();

        $response = $this->actingAs($this->editor)
            ->postJson("/api/v1/admin/conditions/{$condition->id}/publish");

        $response->assertForbidden();
    }

    public function test_editor_can_submit_for_review(): void
    {
        $condition = Condition::factory()->draft()->create();

        $response = $this->actingAs($this->editor)
            ->postJson("/api/v1/admin/conditions/{$condition->id}/submit-for-review");

        $response->assertOk();
        $this->assertEquals('in_review', $condition->fresh()->status);
    }

    public function test_admin_can_archive(): void
    {
        $condition = Condition::factory()->published()->create();

        $response = $this->actingAs($this->admin)
            ->postJson("/api/v1/admin/conditions/{$condition->id}/archive");

        $response->assertOk();
        $this->assertEquals('archived', $condition->fresh()->status);
    }

    public function test_return_to_draft(): void
    {
        $condition = Condition::factory()->inReview()->create();

        $response = $this->actingAs($this->editor)
            ->postJson("/api/v1/admin/conditions/{$condition->id}/return-to-draft");

        $response->assertOk();
        $this->assertEquals('draft', $condition->fresh()->status);
    }

    public function test_new_condition_defaults_to_draft(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/v1/admin/conditions', [
                'name' => 'New Condition',
                'category' => 'test',
            ]);

        $response->assertSuccessful();
        $this->assertEquals('draft', Condition::where('name', 'New Condition')->first()->status);
    }

    public function test_status_included_in_resource(): void
    {
        $condition = Condition::factory()->published()->create();

        $response = $this->actingAs($this->admin)
            ->getJson("/api/v1/conditions/{$condition->id}");

        $response->assertOk();
        $response->assertJsonPath('data.status', 'published');
    }
}
