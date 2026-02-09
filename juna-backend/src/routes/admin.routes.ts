import { Router } from 'express';
import adminService from '@/services/admin.service';
import providerService from '@/services/provider.service';
import { validate } from '@/middlewares/validation.middleware';
import { authenticate, requireRole } from '@/middlewares/auth.middleware';
import { UserRole } from '@prisma/client';
import {
  approveProviderSchema,
  rejectProviderSchema,
} from '@/validators/provider.validator';

const router = Router();

/**
 * GET /api/v1/admin/providers/pending
 * Lister les demandes de fournisseurs en attente
 * Accès: ADMIN uniquement
 */
router.get(
  '/providers/pending',
  authenticate,
  requireRole(UserRole.ADMIN),
  async (req: any, res: any, next: any) => {
    try {
      const result = await providerService.getPending();
      res.json({ success: true, message: 'Fournisseurs en attente', data: result });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/admin/providers
 * Lister tous les fournisseurs avec filtres optionnels
 * Accès: ADMIN uniquement
 */
router.get(
  '/providers',
  authenticate,
  requireRole(UserRole.ADMIN),
  async (req: any, res: any, next: any) => {
    try {
      const { status, search } = req.query as any;
      const result = await providerService.listAll({ status, search });
      res.json({ success: true, message: 'Liste des fournisseurs', data: result });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/admin/providers/:id
 * Obtenir les détails d'un fournisseur
 * Accès: ADMIN uniquement
 */
router.get(
  '/providers/:id',
  authenticate,
  requireRole(UserRole.ADMIN),
  async (req: any, res: any, next: any) => {
    try {
      const { id } = req.params;
      const providers = await providerService.listAll();
      const provider = providers.find((p: any) => p.id === id);
      if (!provider) {
        return res.status(404).json({ success: false, message: 'Fournisseur introuvable' });
      }
      res.json({ success: true, data: provider });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/v1/admin/providers/:id/approve
 * Approuver une demande de fournisseur
 * Accès: ADMIN uniquement
 */
router.put(
  '/providers/:id/approve',
  authenticate,
  requireRole(UserRole.ADMIN),
  validate(approveProviderSchema),
  async (req: any, res: any, next: any) => {
    try {
      const adminId = req.user!.id;
      const { id } = req.params;
      const { message } = req.body;
      const result = await providerService.approve(id, adminId, message);
      res.json({ success: true, message: 'Fournisseur approuve avec succes', data: result });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/v1/admin/providers/:id/reject
 * Rejeter une demande de fournisseur
 * Accès: ADMIN uniquement
 */
router.put(
  '/providers/:id/reject',
  authenticate,
  requireRole(UserRole.ADMIN),
  validate(rejectProviderSchema),
  async (req: any, res: any, next: any) => {
    try {
      const adminId = req.user!.id;
      const { id } = req.params;
      const { reason } = req.body;
      const result = await providerService.reject(id, adminId, reason);
      res.json({ success: true, message: 'Fournisseur rejete', data: result });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/v1/admin/providers/:id/suspend
 * Suspendre un fournisseur
 * Accès: ADMIN uniquement
 */
router.put(
  '/providers/:id/suspend',
  authenticate,
  requireRole(UserRole.ADMIN),
  async (req: any, res: any, next: any) => {
    try {
      const adminId = req.user!.id;
      const { id } = req.params;
      const { reason } = req.body;
      const result = await providerService.suspend(id, adminId, reason);
      res.json({ success: true, message: 'Fournisseur suspendu avec succes', data: result });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/admin/users
 * Lister tous les utilisateurs
 * Accès: ADMIN uniquement
 */
router.get(
  '/users',
  authenticate,
  requireRole(UserRole.ADMIN),
  async (req: any, res: any, next: any) => {
    try {
      const { role, isActive, search } = req.query as any;
      const result = await adminService.listUsers({ 
        role, 
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        search 
      });
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/admin/users/:id
 * Obtenir un utilisateur par ID
 * Accès: ADMIN uniquement
 */
router.get(
  '/users/:id',
  authenticate,
  requireRole(UserRole.ADMIN),
  async (req: any, res: any, next: any) => {
    try {
      const { id } = req.params;
      const result = await adminService.getUserById(id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/v1/admin/users/:id/suspend
 * Suspendre un utilisateur
 * Accès: ADMIN uniquement
 */
router.put(
  '/users/:id/suspend',
  authenticate,
  requireRole(UserRole.ADMIN),
  async (req: any, res: any, next: any) => {
    try {
      const adminId = req.user!.id;
      const { id } = req.params;
      const { reason } = req.body;
      const result = await adminService.suspendUser(id, adminId, reason);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/v1/admin/users/:id/activate
 * Réactiver un utilisateur
 * Accès: ADMIN uniquement
 */
router.put(
  '/users/:id/activate',
  authenticate,
  requireRole(UserRole.ADMIN),
  async (req: any, res: any, next: any) => {
    try {
      const { id } = req.params;
      const result = await adminService.activateUser(id, req.user!.id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/admin/dashboard
 * Obtenir les statistiques du dashboard
 * Accès: ADMIN uniquement
 */
router.get(
  '/dashboard',
  authenticate,
  requireRole(UserRole.ADMIN),
  async (req: any, res: any, next: any) => {
    try {
      const result = await adminService.getDashboardStats();
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
