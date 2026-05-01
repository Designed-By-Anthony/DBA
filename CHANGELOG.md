# Changelog

Notable changes to the **ANTHONY.** public site (single Next.js app at repo root).

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

- Documentation: removed legacy **Agency OS monorepo** changelog entries that referenced `apps/*`, `packages/*`, and **pnpm** workspaces — those trees are not part of this repository. Use git history on `main` if you need older multi-app notes.

## Historical note

Earlier iterations of the studio stack used separate marketing, Lighthouse, and CRM apps. This repo is **one** Next.js deployment (marketing + `/lighthouse` + shared `src/app/api`). See [README.md](README.md), [AGENTS.md](AGENTS.md), and [STATUS.md](STATUS.md).
