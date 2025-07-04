'use server';

// This file serves as a central hub for re-exporting server actions
// related to tests, ensuring a consistent import path for client components.

import { createTest as _createTest } from './test/createTest';
import { updateTest as _updateTest } from './test/updateTest';
import { fetchTestById as _fetchTestById, fetchAdminTestById as _fetchAdminTestById, getAllTests as _getAllTests } from './test/getTests';
import { deleteTestById as _deleteTestById } from './test/deleteTest';
import { verifyTestPassword as _verifyTestPassword, submitTest as _submitTest } from './test/submitTest';
import { generateAnswerOptionsAI as _generateAnswerOptionsAI } from './test/aiActions';

export const createTest = _createTest;
export const updateTest = _updateTest;
export const fetchTestById = _fetchTestById;
export const fetchAdminTestById = _fetchAdminTestById;
export const getAllTests = _getAllTests;
export const deleteTestById = _deleteTestById;
export const verifyTestPassword = _verifyTestPassword;
export const submitTest = _submitTest;
export const generateAnswerOptionsAI = _generateAnswerOptionsAI;


// Mappers and schemas are generally not client-facing actions,
// so they are not re-exported here to maintain a clean action boundary.
// They are used internally by the server actions above.
