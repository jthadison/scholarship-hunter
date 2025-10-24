/**
 * Validation Schemas Index
 * Central export point for all Zod validation schemas
 */

// Profile validation
export {
  profileCreateSchema,
  profileUpdateSchema,
  profileFilterSchema,
  type ProfileCreateInput,
  type ProfileUpdateInput,
  type ProfileFilterInput,
} from "./profile";

// Scholarship validation
export {
  scholarshipCreateSchema,
  scholarshipUpdateSchema,
  scholarshipFilterSchema,
  type ScholarshipCreateInput,
  type ScholarshipUpdateInput,
  type ScholarshipFilterInput,
} from "./scholarship";

// Application validation
export {
  applicationCreateSchema,
  applicationUpdateSchema,
  applicationStatusTransitionSchema,
  applicationFilterSchema,
  type ApplicationCreateInput,
  type ApplicationUpdateInput,
  type ApplicationStatusTransition,
  type ApplicationFilterInput,
} from "./application";

// Essay validation
export {
  essayCreateSchema,
  essayUpdateSchema,
  essayPhaseTransitionSchema,
  essayFilterSchema,
  type EssayCreateInput,
  type EssayUpdateInput,
  type EssayPhaseTransition,
  type EssayFilterInput,
} from "./essay";

// Document validation
export {
  documentCreateSchema,
  documentUpdateSchema,
  documentFilterSchema,
  recommendationCreateSchema,
  recommendationUpdateSchema,
  type DocumentCreateInput,
  type DocumentUpdateInput,
  type DocumentFilterInput,
  type RecommendationCreateInput,
  type RecommendationUpdateInput,
} from "./document";
