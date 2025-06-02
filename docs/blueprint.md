# **App Name**: TestWave

## Core Features:

- Password Protection: Allow test takers to enter a test access password.
- Online Test Taking: Enable test-takers to complete the test online.
- Test Creation: Enable content creators to create tests with questions, answers, and scoring.
- Link Distribution: Provide a method for distributing/sharing test access links.
- Bias Prevention Tool: Use generative AI as a tool to automatically create question answer options to prevent a question writer from unconsciously biasing answer sequences. The AI tool is called on questions that already have a defined correct answer.
- Instant Results: Make results immediately available after test completion.
- Admin Interface (/admin): Create new tests, add multiple question types (MCQ, Short Answer, True/False), define correct answers, set an optional password, and store tests in MongoDB via Prisma.
- Student Test Page (/test/[id]): Load test based on ID, show password prompt if required, verify password, render questions, allow submission, and show score and correct answers.
- Homepage (/): Simple landing page explaining the platform, optionally listing public tests or allowing test ID entry.

## Style Guidelines:

- Primary color: Deep indigo (#3F51B5) for a professional, focused atmosphere.
- Background color: Very light indigo (#E8EAF6). Offers a calming backdrop that doesn't distract from the test content, promoting concentration.
- Accent color: Amber (#FFC107) to draw attention to key interactive elements such as buttons and active form fields, guiding the user.
- Clean and modern font for question display, ensuring optimal readability during tests.
- Simple, intuitive icons for navigation and test controls.
- A clear, sequential layout for questions to minimize confusion.
- Subtle transitions to indicate question progression and feedback.