
import { PrismaClient } from '@prisma/client';
// Note: QuestionType and HotspotShapeType enums might still be needed if you have
// complex logic elsewhere in this file, but typically not if main() is inert.
// For a fully deactivated seed, they can be removed if no other part of this script uses them.
// import { QuestionType, HotspotShapeType } from '@prisma/client';

// The import for L6P1Data is removed as it's not used by a deactivated main()
// import L6P1Data from '../src/data/tests/L6P1.json';

const prisma = new PrismaClient();

// Helper functions like mapQuestionType and mapHotspotShapeType are removed
// as they are no longer used by the deactivated main() function.
// If you have other utility functions in this file that are still needed,
// they can remain.

async function main() {
  console.warn("-------------------------------------------------------------------------------");
  console.warn("--- Prisma Database Seeding Script (prisma/seed.ts) ---");
  console.warn("STATUS: CURRENTLY DEACTIVATED.");
  console.warn("This script, when executed (e.g., via 'npx prisma db seed'), will NOT");
  console.warn("perform any data creation, modification, or deletion in any database.");
  console.warn("It is safe to run in any environment (development, production, etc.) as it");
  console.warn("will only print this informational message and then exit.");
  console.warn("To re-enable actual seeding operations, you must modify the 'main' function");
  console.warn("within this file ('prisma/seed.ts') to include data manipulation logic.");
  console.warn("-------------------------------------------------------------------------------");

  // All original seeding logic that was previously here (e.g., deleting existing tests,
  // creating new tests from JSON data) has been removed or commented out to ensure
  // no unintended data modifications occur while seeding is meant to be off.
}

// The main function is called, but its content is now just a deactivation notice.
main()
  .catch((e) => {
    console.error("ERROR: An unexpected error occurred during the (deactivated) seed script execution:");
    console.error(e);
    // Exit with an error code if something unexpected happens, even in a deactivated state.
    process.exit(1);
  })
  .finally(async () => {
    console.log("INFO: Seed script (deactivated) finished its execution. Disconnecting the Prisma Client instance used by this script.");
    await prisma.$disconnect();
  });

// The previous if (require.main === module) block is no longer necessary
// as main() is now always called and handles the primary logic (which is to do nothing but log).
