# Feature: Skill Workshop (技能工坊)

## Summary
A sub-feature within the AI PM skill tree that enables users to browse community skills from ClawHub and skills.sh, analyze skill quality with AI, write their own Claude Code Skills (SKILL.md format), and publish to community platforms.

## Motivation
Users want to learn how to write high-quality Claude Code skills, discover popular community skills, get AI-powered quality analysis, and publish their own skills to platforms like ClawHub and skills.sh. This bridges the gap between skill consumption and creation.

## User Stories
1. As a PM, I want to browse popular skills from ClawHub and skills.sh so I can discover useful tools
2. As a PM, I want AI to analyze a skill's quality and suggest improvements so I can learn best practices
3. As a PM, I want a guided skill editor with templates so I can write my own skills without knowing the SKILL.md format
4. As a PM, I want to publish my skills to ClawHub and skills.sh so others can use them

## Key Features
- **Browse**: Dual-platform skill gallery with search, filter, pagination, and detail view
- **Analyze**: AI-powered 5-dimension quality scoring (clarity, completeness, practicality, robustness, innovation) with improvement suggestions
- **Write**: Guided editor with 4 templates (basic, agent, workflow, PM-specialist), frontmatter form, raw mode, live preview, AI-assisted writing
- **Publish**: Draft management, token configuration, one-click publish to ClawHub, CLI fallback for skills.sh

## Technical Scope
- 4 new pages under `/skills/workshop/`
- 15+ API routes (proxy + business)
- 3 new database tables (user_skill_drafts, skill_workshop_analyses, user_external_tokens)
- 12+ React components
- Integration with ClawHub API and skills.sh API
- 3 new AI prompt sets

## Constraints
- skills.sh requires Vercel OIDC token (not simple API key) — publish via CLI fallback
- Role-agnostic but PM-specialist template prioritized
- All external API calls proxied through server routes for CORS
