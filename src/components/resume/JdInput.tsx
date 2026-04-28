'use client';

interface JdInputProps {
  value: string;
  onChange: (value: string) => void;
}

export default function JdInput({ value, onChange }: JdInputProps) {
  return (
    <div className="space-y-2">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="粘贴职位描述（JD），包括岗位要求、技能需求、工作职责等..."
        className="app-input w-full min-h-[200px] resize-none p-4 text-sm"
      />
      <div className="flex items-center justify-end">
        <span className="text-xs text-muted-foreground">{value.length} 字符</span>
      </div>
    </div>
  );
}
