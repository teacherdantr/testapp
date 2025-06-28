# TestWave: The Open-Source Online Testing Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5-blue?logo=prisma)](https://www.prisma.io/)
[![Genkit](https://img.shields.io/badge/Genkit-AI-orange)](https://firebase.google.com/docs/genkit)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

TestWave is a modern, full-featured web application for creating, administering, and taking tests online. Built with a powerful stack including Next.js, Prisma, and Google's Genkit for AI, it provides a seamless experience for both educators and test-takers.

## Key Features

-   **Intuitive Test Creation**: An admin dashboard for creating tests with multiple question types (MCQ, Multiple Answer, True/False, Matching, Hotspot, and more).
-   **AI-Powered Assistance**: Leverage generative AI with Genkit to automatically create plausible answer options, helping to prevent unconscious bias in test design.
-   **Secure Test-Taking**: Optional password protection for tests.
-   **Multiple Test Modes**:
    -   **Training Mode**: Questions and answers in a fixed order.
    -   **Testing Mode**: Randomized question and option order.
    -   **Race Mode**: A competitive mode where incorrect answers reset your progress!
-   **Instant Feedback**: View detailed results and answer breakdowns immediately after submission.
-   **Public Records & Personal Scores**: Track public submissions and allow users to look up their personal score history.
-   **Themeable UI**: Switch between different UI themes on the fly.
-   **JSON Upload**: Quickly create tests by uploading a JSON file.

## Tech Stack

-   **Framework**: [Next.js](https://nextjs.org/) (App Router)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **ORM**: [Prisma](https://www.prisma.io/)
-   **Database**: Compatible with PostgreSQL, MySQL, SQLite (Defaults to SQLite in `schema.prisma`).
-   **AI**: [Genkit for Firebase](https://firebase.google.com/docs/genkit)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **UI Components**: [ShadCN UI](https://ui.shadcn.com/)
-   **State Management**: [TanStack Query](https://tanstack.com/query/latest)

## Getting Started

Follow these instructions to get a local copy up and running for development and testing purposes.

### Prerequisites

-   Node.js (v18 or later)
-   npm, yarn, or pnpm
-   A running database instance (e.g., PostgreSQL, MySQL). The schema is pre-configured for SQLite for ease of setup.

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/testwave.git
    cd testwave
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up your environment variables:**
    Create a new file named `.env.local` in the root of the project by copying the example file:
    ```bash
    cp .env.example .env
    ```
    Now, open `.env.local` and fill in the required variables:

    -   `DATABASE_URL`: The connection string for your database. For the default SQLite setup, it's `file:./dev.db`. For PostgreSQL, it would look like `postgresql://USER:PASSWORD@HOST:PORT/DATABASE`.
    -   `ADMIN_PASSWORD`: A secure password to protect the `/admin` dashboard.
    -   `GOOGLE_API_KEY`: Your API key for Google AI Studio, required for the Genkit AI features. You can get one from [Google AI Studio](https://aistudio.google.com/app/apikey).

    Your `.env.local` file should look something like this:
    ```env
    # Example for SQLite (default)
    DATABASE_URL="file:./dev.db"

    # Example for PostgreSQL
    # DATABASE_URL="postgresql://testwave_user:your_password@localhost:5432/testwave_db"

    # Required for accessing the /admin panel
    ADMIN_PASSWORD="your_super_secret_password"

    # Required for AI features (Genkit)
    GOOGLE_API_KEY="your_google_ai_api_key_here"
    ```

4.  **Run database migrations:**
    This command will create your database tables based on the schema in `prisma/schema.prisma`.
    ```bash
    npx prisma migrate dev
    ```

5.  **(Optional) Seed the database:**
    The project includes a seed script, which is currently deactivated to prevent accidental data overwrites. To use it, you must first modify the `prisma/seed.ts` file to include actual seeding logic. Once configured, you can run:
    ```bash
    npx prisma db seed
    ```

### Running the Application

This project requires two separate development servers running concurrently: one for the Next.js application and one for the Genkit AI tools.

1.  **Start the Next.js development server:**
    Open a terminal and run:
    ```bash
    npm run dev
    ```
    Your application will be available at `http://localhost:9002`.

2.  **Start the Genkit development server:**
    Open a *second* terminal and run:
    ```bash
    npm run genkit:dev
    ```
    This starts the local Genkit development UI, where you can inspect and test your AI flows. It's usually available at `http://localhost:4000`.

## Usage

-   **Homepage**: `http://localhost:9002/` - The main landing page.
-   **Admin Panel**: `http://localhost:9002/admin` - Access the test creation and management dashboard. You will be prompted for the `ADMIN_PASSWORD` you set in your `.env.local` file.
-   **Take a Test**: `http://localhost:9002/select-test` - Browse and select an available test.

## Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE.txt` for more information (Note: `LICENSE.txt` file not included in this boilerplate, but you would add one).
