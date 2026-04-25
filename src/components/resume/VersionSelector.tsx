'use client';

import { motion } from 'framer-motion';

const STYLE_OPTIONS = [
  { value: 'standard', label: '通用标准' },
  { value: 'big_company', label: '大厂风格' },
  { value: 'industry_tech', label: '科技行业' },
  { value: 'industry_finance', label: '金融行业' },
  { value: 'industry_internet', label: '互联网行业' },
];

interface VersionSelectorProps {
  value: string;
  onChange: (style: string) => void;
}

export default function VersionSelector({ value, onChange }: VersionSelectorProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {STYLE_OPTIONS.map((option) => {
        const isSelected = value === option.value;
        return (
          <motion.button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`relative rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
              isSelected
                ? 'bg-indigo-500 text-white shadow-sm'
                : 'bg-white text-[#6B7280] border border-[#E5E7EB] hover:border-indigo-300 hover:text-indigo-600'
            }`}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            {option.label}
          </motion.button>
        );
      })}
    </div>
  );
}
