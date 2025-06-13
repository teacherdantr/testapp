// src/ai/server-actions.ts
'use server';

/**
 * @fileOverview This file re-exports server actions from AI flows
 * to provide a clear boundary for client-side imports.
 */

// Import the specific server action function
import { generateAnswerOptions as _internalGenerateAnswerOptions } from './flows/prevent-bias';

// Explicitly re-export it.
// This makes it clear that only an async function (which is a server action) is being exported.
export const generateAnswerOptions = _internalGenerateAnswerOptions;

// If you have other server actions in other flow files, you can re-export them here too.
// e.g.:
// import { anotherAction as _internalAnotherAction } from './flows/another-flow';
// export const anotherAction = _internalAnotherAction;
