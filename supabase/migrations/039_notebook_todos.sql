-- 039_notebook_todos.sql
-- Add sort_order and updated_at to notebook_tasks for todo feature
ALTER TABLE public.notebook_tasks
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_notebook_tasks_sort ON public.notebook_tasks(user_id, sort_order);

-- Auto-update trigger for updated_at
CREATE OR REPLACE FUNCTION update_notebook_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notebook_tasks_updated_at ON public.notebook_tasks;
CREATE TRIGGER trg_notebook_tasks_updated_at
  BEFORE UPDATE ON public.notebook_tasks
  FOR EACH ROW EXECUTE FUNCTION update_notebook_tasks_updated_at();
