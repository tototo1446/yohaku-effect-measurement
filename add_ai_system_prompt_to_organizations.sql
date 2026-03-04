-- organizationsテーブルにAI分析用のカスタムシステムプロンプトカラムを追加
-- NULLの場合はアプリ側でデフォルトプロンプトにフォールバック

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS ai_system_prompt TEXT DEFAULT NULL;

COMMENT ON COLUMN organizations.ai_system_prompt IS '法人ごとのAI分析カスタムシステムプロンプト。NULLの場合はデフォルトプロンプトを使用。';
