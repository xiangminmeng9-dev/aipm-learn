-- 放宽 external_resources.type 的 CHECK 约束，支持更多类型
ALTER TABLE external_resources DROP CONSTRAINT IF EXISTS external_resources_type_check;
ALTER TABLE external_resources ADD CONSTRAINT external_resources_type_check
  CHECK (type IN ('link', 'video', 'doc', 'folder', 'blog', 'paper', 'book', 'wechat', 'lark_doc'));
