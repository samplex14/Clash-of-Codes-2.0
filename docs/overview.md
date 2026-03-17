# Project Overview

Clash of Codes 2.0 is a Phase 1-only competitive coding event platform.

## Objectives

- Run fast participant onboarding and quiz delivery.
- Provide reliable admin controls for starting and ending the round.
- Publish qualification outcomes and leaderboard rankings.

## Architecture

- Frontend: React (Vite) + Tailwind CSS.
- Backend: Node.js + Express + Socket.IO (`/phase1` namespace only).
- Database: MongoDB (participants, questions, phase1sessions).

## Competition Flow

1. Participants register with USN, name, and year.
2. Admin starts Phase 1.
3. Participants receive shuffled questions and submit answers.
4. Admin ends Phase 1.
5. Leaderboard and qualification status are published.

## Current Status

- Phase 1: Active and supported.
- Additional tournament phases: Not part of this codebase.
