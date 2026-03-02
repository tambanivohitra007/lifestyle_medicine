<?php

namespace Tests\Feature;

use App\Models\Condition;
use App\Models\ContentRevision;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ContentRevisionTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $editor;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $this->editor = User::factory()->create(['role' => 'editor', 'is_active' => true]);
    }

    public function test_revision_created_on_model_update(): void
    {
        $condition = Condition::factory()->create(['name' => 'Original Name']);

        $this->actingAs($this->admin)
            ->putJson("/api/v1/admin/conditions/{$condition->id}", [
                'name' => 'Updated Name',
            ]);

        $this->assertDatabaseHas('content_revisions', [
            'revisionable_type' => Condition::class,
            'revisionable_id' => $condition->id,
            'version_number' => 1,
        ]);
    }

    public function test_revision_captures_old_state(): void
    {
        $condition = Condition::factory()->create(['name' => 'Original Name', 'summary' => 'Original Summary']);

        $this->actingAs($this->admin)
            ->putJson("/api/v1/admin/conditions/{$condition->id}", [
                'name' => 'Updated Name',
            ]);

        $revision = ContentRevision::where('revisionable_id', $condition->id)->first();
        $this->assertNotNull($revision);
        $this->assertEquals('Original Name', $revision->data['name']);
    }

    public function test_multiple_updates_create_multiple_revisions(): void
    {
        $condition = Condition::factory()->create(['name' => 'V0']);

        $this->actingAs($this->admin)
            ->putJson("/api/v1/admin/conditions/{$condition->id}", ['name' => 'V1']);
        $this->actingAs($this->admin)
            ->putJson("/api/v1/admin/conditions/{$condition->id}", ['name' => 'V2']);

        $revisionCount = ContentRevision::where('revisionable_id', $condition->id)->count();
        $this->assertEquals(2, $revisionCount);
    }

    public function test_can_restore_to_previous_revision(): void
    {
        $condition = Condition::factory()->create(['name' => 'Original Name']);

        $this->actingAs($this->admin)
            ->putJson("/api/v1/admin/conditions/{$condition->id}", ['name' => 'Changed Name']);

        $revision = ContentRevision::where('revisionable_id', $condition->id)
            ->where('version_number', 1)
            ->first();

        $response = $this->actingAs($this->admin)
            ->postJson("/api/v1/admin/revisions/conditions/{$condition->id}/restore/{$revision->id}");

        $response->assertOk();
        $this->assertEquals('Original Name', $condition->fresh()->name);
    }

    public function test_revision_api_list_endpoint(): void
    {
        $condition = Condition::factory()->create(['name' => 'V0']);

        $this->actingAs($this->admin)
            ->putJson("/api/v1/admin/conditions/{$condition->id}", ['name' => 'V1']);

        $response = $this->actingAs($this->admin)
            ->getJson("/api/v1/admin/revisions/conditions/{$condition->id}");

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals(1, $response->json('data.0.version_number'));
    }

    public function test_revision_api_show_endpoint(): void
    {
        $condition = Condition::factory()->create(['name' => 'V0']);

        $this->actingAs($this->admin)
            ->putJson("/api/v1/admin/conditions/{$condition->id}", ['name' => 'V1']);

        $revision = ContentRevision::where('revisionable_id', $condition->id)->first();
        $this->assertNotNull($revision, 'Revision should exist');

        $response = $this->actingAs($this->admin)
            ->getJson("/api/v1/admin/revisions/detail/{$revision->id}");

        $response->assertOk();
        $response->assertJsonPath('version_number', 1);
    }

    public function test_revision_compare_endpoint(): void
    {
        $condition = Condition::factory()->create(['name' => 'V0']);

        $this->actingAs($this->admin)
            ->putJson("/api/v1/admin/conditions/{$condition->id}", ['name' => 'V1']);
        $this->actingAs($this->admin)
            ->putJson("/api/v1/admin/conditions/{$condition->id}", ['name' => 'V2']);

        $revisions = ContentRevision::where('revisionable_id', $condition->id)
            ->orderBy('version_number')
            ->get();

        $response = $this->actingAs($this->admin)
            ->getJson("/api/v1/admin/revisions/compare/{$revisions[0]->id}/{$revisions[1]->id}");

        $response->assertOk();
        $response->assertJsonStructure([
            'data' => [
                'revision_a',
                'revision_b',
                'changes',
            ],
        ]);
    }

    public function test_viewer_cannot_access_revisions(): void
    {
        $viewer = User::factory()->create(['role' => 'viewer', 'is_active' => true]);
        $condition = Condition::factory()->create();

        $response = $this->actingAs($viewer)
            ->getJson("/api/v1/admin/revisions/conditions/{$condition->id}");

        $response->assertForbidden();
    }

    public function test_version_numbers_increment(): void
    {
        $condition = Condition::factory()->create(['name' => 'V0']);

        $this->actingAs($this->admin)
            ->putJson("/api/v1/admin/conditions/{$condition->id}", ['name' => 'V1']);
        $this->actingAs($this->admin)
            ->putJson("/api/v1/admin/conditions/{$condition->id}", ['name' => 'V2']);
        $this->actingAs($this->admin)
            ->putJson("/api/v1/admin/conditions/{$condition->id}", ['name' => 'V3']);

        $versions = ContentRevision::where('revisionable_id', $condition->id)
            ->orderBy('version_number')
            ->pluck('version_number')
            ->toArray();

        $this->assertEquals([1, 2, 3], $versions);
    }
}
