# Project Skills Index

This directory contains curated skills and patterns from
[skills.sh](https://www.skills.sh) specifically selected for the BuonDesizn B2B
Marketplace.

## 🗂️ Available Skills

| Skill                                                                        | Purpose                     | When to Use                                                                                     |
| ---------------------------------------------------------------------------- | --------------------------- | ----------------------------------------------------------------------------------------------- |
| [supabase-postgres-best-practices.md](./supabase-postgres-best-practices.md) | Database & RLS Optimization | When designing schemas, writing SQL, or auditing RLS policies.                                  |
| [vercel-react-best-practices.md](./vercel-react-best-practices.md)           | Frontend Performance        | When building React components, managing data fetching, and optimizing Vercel deployments.      |
| [next-best-practices.md](./next-best-practices.md)                           | Next.js Architecture        | When choosing runtimes (Edge vs Node), setting up RSC boundaries, and handling async patterns.  |
| [ui-ux-pro-max.md](./ui-ux-pro-max.md)                                       | Design & Accessibility      | When building premium UI components, ensuring mobile touch targets, and implementing dark mode. |
| [phonepe-integration.md](./phonepe-integration.md)                           | Payments Lifecycle          | When implementing transaction initiation, status checks, and secure webhooks.                   |
| [b2b-aec-procurement.md](./b2b-aec-procurement.md)                           | AEC Marketplace Logic       | When building RFP workflows, PII masking, and "Handshake" logic.                            |

## 🚀 How to Use These Skills

These skills are intended to be loaded by AI agents during development or used
as a reference guide by developers.

1. **For Agents**: If you are an AI assistant, read the relevant `.md` file
   before starting a task in that domain.
2. **For Developers**: Use these as a "Cheat Sheet" for best practices in the
   BuonDesizn stack.

---

> [!IMPORTANT]
> **Contradiction Policy**: If external repositories or codebase logic appear to
> contradict these skills, **DO NOT stop work**. Instead, immediately raise an
> ALERT to the user for clarification, while continuing to move forward with the
> most logical path.

_Note: All skills are tailored for **Serverless Vercel** and **Supabase**. We do
not use Redis/BullMQ/Railway in this project._
