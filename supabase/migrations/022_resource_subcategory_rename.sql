-- 022: 子分类重命名 + 修正文件夹记录
-- 将旧的 subcategory 值映射到新的分类体系

-- 网站: learning→ai_api, official→dev_framework, interview→pm_toolkit, tools→open_source (coding保留不变)
UPDATE external_resources SET subcategory = 'ai_api' WHERE resource_type = 'website' AND subcategory = 'learning';
UPDATE external_resources SET subcategory = 'dev_framework' WHERE resource_type = 'website' AND subcategory = 'official';
UPDATE external_resources SET subcategory = 'pm_toolkit' WHERE resource_type = 'website' AND subcategory = 'interview';
UPDATE external_resources SET subcategory = 'open_source' WHERE resource_type = 'website' AND subcategory = 'tools';

-- 论文: classic→product_ai
UPDATE external_resources SET subcategory = 'product_ai' WHERE resource_type = 'paper' AND subcategory = 'classic';

-- 博客: tech→ai_tech, product→ai_product, personal→pm_practice
UPDATE external_resources SET subcategory = 'ai_tech' WHERE resource_type = 'blog' AND subcategory = 'tech';
UPDATE external_resources SET subcategory = 'ai_product' WHERE resource_type = 'blog' AND subcategory = 'product';
UPDATE external_resources SET subcategory = 'pm_practice' WHERE resource_type = 'blog' AND subcategory = 'personal';

-- 视频: course→ai_course, tech_share→tech_talk, product_review→product_demo, interview_exp→interview_prep
UPDATE external_resources SET subcategory = 'ai_course' WHERE resource_type = 'video' AND subcategory = 'course';
UPDATE external_resources SET subcategory = 'tech_talk' WHERE resource_type = 'video' AND subcategory = 'tech_share';
UPDATE external_resources SET subcategory = 'product_demo' WHERE resource_type = 'video' AND subcategory = 'product_review';
UPDATE external_resources SET subcategory = 'interview_prep' WHERE resource_type = 'video' AND subcategory = 'interview_exp';

-- 修正文件夹记录: 确保文件夹有正确的 resource_type
UPDATE external_resources SET resource_type = 'website' WHERE type = 'folder' AND resource_type IS NULL;
