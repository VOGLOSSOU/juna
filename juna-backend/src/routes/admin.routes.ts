import { Router } from 'express';
import adminService from '@/services/admin.service';
import providerService from '@/services/provider.service';
import payoutService from '@/services/payout.service';
import subscriptionController from '@/controllers/subscription.controller';
import { validate, validateQuery, validateParams } from '@/middlewares/validation.middleware';
import { authenticate, requireRole } from '@/middlewares/auth.middleware';
import { UserRole } from '@prisma/client';
import {
  approveProviderSchema,
  rejectProviderSchema,
} from '@/validators/provider.validator';
import {
  adminListPayoutsQuerySchema,
  orderIdParamSchema,
  confirmManualPayoutSchema,
} from '@/validators/payout.validator';

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
      const result = await providerService.getById(id);
      res.json({ success: true, data: result });
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
 * PUT /api/v1/admin/users/:id/ban
 * Bannir définitivement un utilisateur (anonymise email + désactive)
 * Accès: ADMIN uniquement
 */
router.put(
  '/users/:id/ban',
  authenticate,
  requireRole(UserRole.ADMIN),
  async (req: any, res: any, next: any) => {
    try {
      const adminId = req.user!.id;
      const { id } = req.params;
      const { reason } = req.body;
      const result = await adminService.banUser(id, adminId, reason);
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

/**
 * GET /api/v1/admin/dashboard/stats
 * Statistiques détaillées par période
 * Accès: ADMIN uniquement
 */
router.get(
  '/dashboard/stats',
  authenticate,
  requireRole(UserRole.ADMIN),
  async (req: any, res: any, next: any) => {
    try {
      const period = req.query.period as 'day' | 'week' | 'month' | undefined;
      const result = await adminService.getDetailedStats(period);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/admin/subscriptions
 * Lister tous les abonnements sans filtre de visibilité (admin)
 * Accès: ADMIN uniquement
 */
router.get(
  '/subscriptions',
  authenticate,
  requireRole(UserRole.ADMIN),
  subscriptionController.getAll.bind(subscriptionController)
);

/**
 * GET /api/v1/admin/payouts
 * Lister les versements (commandes actives/terminées) avec leur statut
 * Accès: ADMIN uniquement
 */
router.get(
  '/payouts',
  authenticate,
  requireRole(UserRole.ADMIN),
  validateQuery(adminListPayoutsQuerySchema),
  async (req: any, res: any, next: any) => {
    try {
      const { page, limit, needsAction } = req.query;
      const result = await payoutService.listForAdmin({ page, limit, needsAction });
      res.json({ success: true, message: 'Versements récupérés avec succès', data: result });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/admin/payouts/:orderId/confirm-manual
 * Confirmer un versement déjà effectué en dehors du système (cash, ancien PawaPay...)
 * N'envoie aucun argent — prend acte d'un paiement déjà réalisé.
 * Accès: ADMIN uniquement
 */
router.post(
  '/payouts/:orderId/confirm-manual',
  authenticate,
  requireRole(UserRole.ADMIN),
  validateParams(orderIdParamSchema),
  validate(confirmManualPayoutSchema),
  async (req: any, res: any, next: any) => {
    try {
      const { orderId } = req.params;
      const { amount } = req.body;
      const result = await payoutService.adminConfirmManual(orderId, amount);
      res.json({ success: true, message: 'Versement manuel confirmé', data: result });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/admin/payouts/:orderId/trigger
 * Déclencher réellement le versement via FeexPay (après correction d'un souci)
 * Refusé si une tentative réelle existe déjà pour ce versement.
 * Accès: ADMIN uniquement
 */
router.post(
  '/payouts/:orderId/trigger',
  authenticate,
  requireRole(UserRole.ADMIN),
  validateParams(orderIdParamSchema),
  async (req: any, res: any, next: any) => {
    try {
      const { orderId } = req.params;
      await payoutService.adminTriggerPayout(orderId);
      res.json({ success: true, message: 'Versement déclenché', data: null });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
