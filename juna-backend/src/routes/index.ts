import { Router } from 'express';
import authRoutes from './auth.routes';
// Import des autres routes ici plus tard
// import userRoutes from './user.routes';
// import subscriptionRoutes from './subscription.routes';
// etc...

const router = Router();

// Monter les routes
router.use('/auth', authRoutes);

// Plus tard, ajouter les autres routes
// router.use('/users', userRoutes);
// router.use('/subscriptions', subscriptionRoutes);
// router.use('/orders', orderRoutes);
// router.use('/proposals', proposalRoutes);
// router.use('/reviews', reviewRoutes);
// router.use('/tickets', ticketRoutes);
// router.use('/notifications', notificationRoutes);
// router.use('/providers', providerRoutes);
// router.use('/admin', adminRoutes);
// router.use('/referrals', referralRoutes);

export default router;