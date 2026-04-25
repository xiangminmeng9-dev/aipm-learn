-- Add user_answer column to assistant_qa_records
ALTER TABLE assistant_qa_records
ADD COLUMN IF NOT EXISTS user_answer TEXT;

-- Add record_id tracking: make answer column store AI's answer
-- (answer = AI回答, user_answer = 用户回答, evaluation = 评估结果)
