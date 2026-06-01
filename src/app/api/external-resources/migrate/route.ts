import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// One-time migration endpoint to add new columns to external_resources table
// Call once after deployment, then can be removed
export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    // Check if resource_type column exists by querying
    const { data: testData, error: testError } = await supabase
      .from('external_resources')
      .select('id, resource_type')
      .limit(1);

    if (!testError && testData) {
      // Column exists, run data migration for existing resources
      const { data: allResources } = await supabase
        .from('external_resources')
        .select('id, type, category, resource_type')
        .eq('user_id', user.id);

      if (allResources) {
        for (const r of allResources) {
          if (!r.resource_type) {
            // Migrate based on old type/category
            let newType = 'website';
            if (r.type === 'video') newType = 'video';
            else if (r.type === 'doc') newType = 'lark_doc';
            else if (r.type === 'folder') newType = 'website';
            else if (r.type === 'link') newType = 'website';

            await supabase
              .from('external_resources')
              .update({ resource_type: newType, subcategory: r.category || null })
              .eq('id', r.id);
          }
        }
      }
      return NextResponse.json({ message: 'Migration completed - data migrated', migrated: allResources?.length || 0 });
    }

    return NextResponse.json({ message: 'Columns need to be added via Supabase dashboard SQL editor', sql: `
ALTER TABLE external_resources ADD COLUMN IF NOT EXISTS resource_type VARCHAR DEFAULT 'website';
ALTER TABLE external_resources ADD COLUMN IF NOT EXISTS subcategory VARCHAR;
ALTER TABLE external_resources ADD COLUMN IF NOT EXISTS thumbnail_url VARCHAR;
ALTER TABLE external_resources ADD COLUMN IF NOT EXISTS local_path VARCHAR;
ALTER TABLE external_resources ADD COLUMN IF NOT EXISTS author VARCHAR;
ALTER TABLE external_resources ADD COLUMN IF NOT EXISTS year INTEGER;
ALTER TABLE external_resources ADD COLUMN IF NOT EXISTS platform VARCHAR;
ALTER TABLE external_resources ADD COLUMN IF NOT EXISTS duration VARCHAR;
CREATE INDEX IF NOT EXISTS idx_external_resources_type ON external_resources(user_id, resource_type);
    `.trim() });
  } catch (err) {
    console.error('Migration error:', err);
    return NextResponse.json({ error: '迁移失败' }, { status: 500 });
  }
}
