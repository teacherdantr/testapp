
'use server';

// This file serves as a central hub for re-exporting server actions
// related to tests, ensuring a consistent import path for client components.

export { createTest } from './test/createTest';
export { updateTest } from './test/updateTest';
export { fetchTestById, fetchAdminTestById, getAllTests } from './test/getTests';
export { deleteTestById } from './test/deleteTest';
export { verifyTestPassword, submitTest } from './test/submitTest';
export { generateAnswerOptionsAI } from './test/aiActions';

// Mappers and schemas are generally not client-facing actions,
// so they are not re-exported here to maintain a clean action boundary.
// They are used internally by the server actions above.
