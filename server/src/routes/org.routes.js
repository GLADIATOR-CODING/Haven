import { Router } from 'express';
import { z } from 'zod';
import * as orgController from '../controllers/org.controller.js';
import reportRoutes from './report.routes.js';
import aiRoutes from './ai.routes.js';
import claimRoutes from './claim.routes.js';
import { auth } from '../middlewares/auth.js';
import { orgScope } from '../middlewares/orgScope.js';
import { authorize } from '../middlewares/authorize.js';
import { validate } from '../middlewares/validate.js';

// Router for global /api/orgs
export const globalOrgRouter = Router();

const createOrgSchema = {
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    slug: z
      .string()
      .min(2)
      .max(40)
      .regex(/^[a-z0-9-]+$/, 'Slug must only contain lowercase alphanumeric characters and hyphens')
      .optional(),
    templateKey: z.enum(['campus', 'hostel', 'office', 'event', 'blank']).optional(),
    handoverInstructions: z.string().optional(),
    categories: z.array(z.any()).optional(),
    locations: z.array(z.any()).optional(),
    allowedDomains: z.array(z.string()).optional(),
  }),
};

const joinOrgSchema = {
  body: z
    .object({
      code: z.string().min(2, 'Code or slug must be at least 2 characters').optional(),
      slug: z.string().min(2, 'Slug must be at least 2 characters').optional(),
    })
    .refine((data) => data.code || data.slug, {
      message: 'Either an 8-digit admin access code or workspace slug is required',
    }),
};

globalOrgRouter.post('/', auth, validate(createOrgSchema), orgController.createOrg);
globalOrgRouter.post('/join', auth, validate(joinOrgSchema), orgController.joinOrg);

// Router for tenant-scoped /api/o/:slug
export const scopedOrgRouter = Router({ mergeParams: true });

const updateRoleSchema = {
  body: z.object({
    role: z.enum(['member', 'moderator', 'admin']),
  }),
};

scopedOrgRouter.use(auth, orgScope);

// Member accessible
scopedOrgRouter.get('/', orgController.getOrgConfig);

// Reports subroutes
scopedOrgRouter.use('/reports', reportRoutes);

// AI & describe-it query parser subroutes
scopedOrgRouter.use('/ai', aiRoutes);

// Claims subroutes
scopedOrgRouter.use('/claims', claimRoutes);

// Moderator requests
import * as modReqController from '../controllers/moderatorRequest.controller.js';
scopedOrgRouter.post('/moderator-requests', modReqController.createRequest);
scopedOrgRouter.get('/moderator-requests', modReqController.getRequests);
scopedOrgRouter.patch('/moderator-requests/:id', authorize('admin'), modReqController.reviewRequest);

// Admin only
scopedOrgRouter.patch('/', authorize('admin'), orgController.updateOrgConfig);
scopedOrgRouter.post('/invite/rotate', authorize('admin'), orgController.rotateInviteCode);
scopedOrgRouter.get('/members', authorize('admin'), orgController.getMembers);
scopedOrgRouter.patch('/members/:userId', authorize('admin'), validate(updateRoleSchema), orgController.updateMemberRole);

