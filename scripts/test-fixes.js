// Test script to verify all fixes work after running the SQL migration
// Run with: node scripts/test-fixes.js

const { createClient } = require('@supabase/supabase-js');

const url = 'https://jgtvzfmzzhpfzpvdgzgk.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpndHZ6Zm16emhwZnpwdmRnemdrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjIwNTcwNSwiZXhwIjoyMDkxNzgxNzA1fQ.8E55jhLLN_pQFFfUrgSmDH4hRv-Wd0nFXmg-D8OitHg';
const client = createClient(url, key);

async function test() {
  console.log('=== Testing fixes ===\n');

  // Test 1: assistant_qa_records table exists and can insert
  console.log('1. Testing assistant_qa_records...');
  const { data: insertData, error: insertError } = await client
    .from('assistant_qa_records')
    .insert({
      user_id: '00000000-0000-0000-0000-000000000000',
      question: 'Test question from verification script',
      category: 'general',
      answer: 'Test answer',
    })
    .select('id')
    .single();

  if (insertError) {
    console.log('   FAIL: Cannot insert into assistant_qa_records');
    console.log('   Error:', insertError.message);
    console.log('   Code:', insertError.code);
    if (insertError.code === 'PGRST205') {
      console.log('   >>> Table does not exist! Run the SQL migration first.');
    }
  } else {
    console.log('   PASS: Insert successful, id:', insertData.id);
    // Clean up
    await client.from('assistant_qa_records').delete().eq('id', insertData.id);
    console.log('   Cleaned up test record');
  }

  // Test 2: daily_tech_cache can be written to
  console.log('\n2. Testing daily_tech_cache write...');
  const testDate = '2099-12-31';
  const { data: techData, error: techError } = await client
    .from('daily_tech_cache')
    .insert({
      date: testDate,
      title: 'Test Tech',
      summary: 'Test',
      explanation: 'Test',
      impact: 'Test',
      tags: ['test'],
    })
    .select('id')
    .single();

  if (techError) {
    console.log('   FAIL: Cannot insert into daily_tech_cache');
    console.log('   Error:', techError.message);
  } else {
    console.log('   PASS: Insert successful');
    // Test UPDATE
    const { error: updateError } = await client
      .from('daily_tech_cache')
      .update({ title: 'Updated Test Tech' })
      .eq('date', testDate);
    if (updateError) {
      console.log('   FAIL: Cannot update daily_tech_cache');
      console.log('   Error:', updateError.message);
    } else {
      console.log('   PASS: Update successful');
    }
    // Clean up
    await client.from('daily_tech_cache').delete().eq('date', testDate);
    console.log('   Cleaned up test record');
  }

  // Test 3: daily_tech_bookmarks can be written to with full data
  console.log('\n3. Testing daily_tech_bookmarks with full data...');
  const { data: bookmarkData, error: bookmarkError } = await client
    .from('daily_tech_bookmarks')
    .insert({
      user_id: '00000000-0000-0000-0000-000000000000',
      tech_date: '2099-12-31',
      title: 'Test Bookmark',
      summary: 'Test summary',
      explanation: 'Test explanation',
      impact: 'Test impact',
      tags: ['test'],
    })
    .select('id')
    .single();

  if (bookmarkError) {
    console.log('   FAIL: Cannot insert into daily_tech_bookmarks with full data');
    console.log('   Error:', bookmarkError.message);
    console.log('   Code:', bookmarkError.code);
  } else {
    console.log('   PASS: Insert with full data successful');
    // Clean up
    await client.from('daily_tech_bookmarks').delete().eq('id', bookmarkData.id);
    console.log('   Cleaned up test record');
  }

  console.log('\n=== Test complete ===');
}

test().catch(console.error);
