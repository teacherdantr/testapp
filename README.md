# Test Pilot Platform

Welcome to the Test Pilot Platform! This project is a web application built with Next.js designed for creating, administering, and taking tests.

**Key Features:**

- **Test Administration:** Create and manage tests, including adding questions and setting parameters.
- **Test Taking:** Users can select and take tests, with different modes (e.g., password-protected, user ID).
- **Score Tracking:** View personal test scores and potentially public records.
- **AI Integration (Experimental):** Includes experimental AI features, such as a flow for preventing bias (see `src/ai/flows/prevent-bias.ts`).

This platform provides a flexible way to conduct assessments and gather results.

To explore the application code, start by looking at the main application layout in `src/app/(app)/layout.tsx` and the main page component in `src/app/(app)/page.tsx`.

## Production Deployment

Before deploying this application to a production environment, you must configure the necessary environment variables.

1.  **Create an Environment File**: Create a `.env.local` file in the root of your project or configure the environment variables directly in your hosting provider's dashboard (recommended for production).

2.  **Set Admin Password**: The most critical variable is `ADMIN_PASSWORD`. This password protects the `/admin` section of your application. Set it to a strong, secret value.

    ```bash
    # In your .env.local file or hosting provider's settings
    ADMIN_PASSWORD="your_strong_and_secret_password_here"
    ```

    Refer to the `.env.example` file for a template of required variables.
