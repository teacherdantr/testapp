
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
  console.warn("--------------------------------------------------------------------------");
  console.warn("ATTENTION: Database seeding (prisma/seed.ts) is currently DEACTIVATED.");
  console.warn("The 'main' function was executed, but it will NOT perform any data changes.");
  console.warn("To re-enable seeding, you need to restore or add data manipulation logic");
  console.warn("within this 'main' function.");
  console.warn("--------------------------------------------------------------------------");

  // All original seeding logic that was previously here (e.g., deleting existing tests,
  // creating new tests from JSON data) has been removed or commented out to ensure
  // no unintended data modifications occur while seeding is meant to be off.
  //
  // Example of original logic that would be here if active:
  //
  // console.log(`Start seeding ...`);
  // try {
  //   // Prisma requires deleting related records (questions) before deleting the parent (test)
  //   // if there's a required relation.
  //   await prisma.question.deleteMany({ where: { testId: L6P1Data.id } });
  //   await prisma.test.delete({ where: { id: L6P1Data.id } });
  //   console.log(`Deleted existing test with ID: ${L6P1Data.id} and its questions.`);
  // } catch (error: any) {
  //   if (error.code === 'P2025') {
  //     console.log(`Test with ID ${L6P1Data.id} not found or already deleted, proceeding to create.`);
  //   } else {
  //     console.error(`Error deleting existing test ${L6P1Data.id} (or its questions):`, error.message);
  //   }
  // }
  // const createdTest = await prisma.test.create({
  //   data: { /* ... L6P1Data mapping ... */ },
  //   include: { questions: true },
  // });
  // console.log(`Created test "${createdTest.title}" (ID: ${createdTest.id}) with ${createdTest.questions.length} questions.`);
  // console.log(`Seeding finished.`);
}

// The main function is called, but its content is now just a deactivation notice.
main()
  .catch((e) => {
    console.error("An error occurred during the (deactivated) seed process execution:", e);
    // Exit with an error code if something unexpected happens, even in a deactivated state.
    process.exit(1);
  })
  .finally(async () => {
    console.log("Prisma client disconnecting (from seed script).");
    await prisma.$disconnect();
  });

// The previous if (require.main === module) block is no longer necessary
// as main() is now always called and handles the primary logic (which is to do nothing but log).
// console.log("Database seeding is currently deactivated in prisma/seed.ts."); // This top-level log is also now covered by main()

// async function disconnectPrisma() {
//   await prisma.$disconnect();
// }

// if (require.main === module) {
//   console.log("Seed script was run directly. Main function (deactivated) will run. Disconnecting Prisma in finally block.");
//   // disconnectPrisma().catch(e => { // This explicit call is handled by main's finally block
//   //   console.error("Error disconnecting Prisma:", e);
//   //   process.exit(1);
//   // });
// }
