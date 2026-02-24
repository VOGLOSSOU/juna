import { Router } from 'express';
import orderController from '@/controllers/order.controller';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { validate, validateParams } from '@/middlewares/validation.middleware';
import { createOrderSchema, orderIdSchema, orderNumberSchema } from '@/validators/order.validator';
import { UserRole } from '@prisma/client';

const router = Router();

// ============================================
// Routes CLIENT (authentifié)
// ============================================

// Créer une commande
router.post(
  '/',
  authenticate,
  validate(createOrderSchema),
  orderController.create.bind(orderController)
);

// Mes commandes
router.get(
  '/me',
  authenticate,
  orderController.getMyOrders.bind(orderController)
);

// Détails d'une commande
router.get(
  '/:id',
  authenticate,
  validateParams(orderIdSchema),
  orderController.getById.bind(orderController)
);

// Annuler ma commande
router.delete(
  '/:id',
  authenticate,
  validateParams(orderIdSchema),
  orderController.cancel.bind(orderController)
);

// Valider le retrait/livraison (QR)
router.post(
  '/:id/complete',
  authenticate,
  validateParams(orderIdSchema),
  orderController.complete.bind(orderController)
);

// ============================================
// Routes FOURNISSEUR
// ============================================

// Commandes du fournisseur
router.get(
  '/provider/me',
  authenticate,
  authorize([UserRole.PROVIDER]),
  orderController.getProviderOrders.bind(orderController)
);

// Confirmer une commande
router.put(
  '/:id/confirm',
  authenticate,
  authorize([UserRole.PROVIDER]),
  validateParams(orderIdSchema),
  orderController.confirm.bind(orderController)
);

// Marquer comme prêt
router.put(
  '/:id/ready',
  authenticate,
  authorize([UserRole.PROVIDER]),
  validateParams(orderIdSchema),
  orderController.markReady.bind(orderController)
);

// Régénérer QR code
router.put(
  '/:id/qrcode',
  authenticate,
  authorize([UserRole.PROVIDER]),
  validateParams(orderIdSchema),
  orderController.regenerateQrCode.bind(orderController)
);

// ============================================
// Routes PUBLIQUES (scan QR)
// ============================================

// Scanner QR code
router.post(
  '/scan/:id/:qrCode',
  orderController.scanQrCode.bind(orderController)
);

// ============================================
// Routes ADMIN
// ============================================

// Lister toutes les commandes
router.get(
  '/',
  authenticate,
  authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  orderController.getAll.bind(orderController)
);

// Commandes en attente (admin)
router.get(
  '/pending/count',
  authenticate,
  authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  orderController.getPendingCount.bind(orderController)
);

export default router;
