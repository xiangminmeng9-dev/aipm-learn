-- 增强外部资源表的类型分类体系
-- 新增：resource_type(资源类型)、subcategory(子分类)、thumbnail_url(略缩图)、local_path(本地路径)、author(作者)、year(年份)、platform(平台)、duration(时长)

-- 添加新字段
ALTER TABLE external_resources
  ADD COLUMN IF NOT EXISTS resource_type VARCHAR DEFAULT 'website',
  ADD COLUMN IF NOT EXISTS subcategory VARCHAR,
  ADD COLUMN IF NOT EXISTS thumbnail_url VARCHAR,
  ADD COLUMN IF NOT EXISTS local_path VARCHAR,
  ADD COLUMN IF NOT EXISTS author VARCHAR,
  ADD COLUMN IF NOT EXISTS year INTEGER,
  ADD COLUMN IF NOT EXISTS platform VARCHAR,
  ADD COLUMN IF NOT EXISTS duration VARCHAR,
  ADD COLUMN IF NOT EXISTS description TEXT;

-- 基于现有category字段迁移数据到新的resource_type
UPDATE external_resources SET resource_type = 'website' WHERE category IN ('学习平台', '编程实战', '官方文档', '求职面试', '工具社区', 'AI导航', '网站', '工具', '教程', '平台');
UPDATE external_resources SET resource_type = 'paper' WHERE category IN ('论文', '学术', 'Paper', '研究');
UPDATE external_resources SET resource_type = 'blog' WHERE category IN ('博客', 'Blog', '技术博客', '文章', '社区');
UPDATE external_resources SET resource_type = 'lark_doc' WHERE category IN ('飞书文档', '飞书', '文档', 'Lark');
UPDATE external_resources SET resource_type = 'wechat' WHERE category IN ('公众号', '微信', 'WeChat');
UPDATE external_resources SET resource_type = 'video' WHERE category IN ('视频', '课程', 'Video', '教程视频');
UPDATE external_resources SET resource_type = 'book' WHERE category IN ('书籍', '图书', 'Book', '电子书');

-- 对于没有匹配的记录，默认设为website
UPDATE external_resources SET resource_type = 'website' WHERE resource_type IS NULL OR resource_type = '';

-- 将旧的category值迁移到subcategory字段
UPDATE external_resources SET subcategory = category WHERE subcategory IS NULL;

-- 创建索引加速按类型查询
CREATE INDEX IF NOT EXISTS idx_external_resources_type ON external_resources(user_id, resource_type);
CREATE INDEX IF NOT EXISTS idx_external_resources_subcategory ON external_resources(user_id, resource_type, subcategory);

-- 添加资源活动事件类型注释（在user_activities表中使用）
-- 活动类型：resource_added, resource_viewed, resource_searched
-- 这些不需要新的表，通过activity_type字段区分即可
