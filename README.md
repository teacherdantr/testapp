# Test Pilot Platform

Welcome to the Test Pilot Platform! This project is a web application built with Next.js designed for creating, administering, and taking tests.

**Key Features:**

- **Test Administration:** Create and manage tests, including adding questions and setting parameters.
- **Test Taking:** Users can select and take tests, with different modes (e.g., password-protected, user ID).
- **Score Tracking:** View personal test scores and potentially public records.
- **AI Integration (Experimental):** Includes experimental AI features, such as a flow for preventing bias (see `src/ai/flows/prevent-bias.ts`).

This platform provides a flexible way to conduct assessments and gather results.

To explore the application code, start by looking at the main application layout in `src/app/(app)/layout.tsx` and the main page component in `src/app/(app)/page.tsx`.
