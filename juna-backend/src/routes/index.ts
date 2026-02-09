import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import providerRoutes from './provider.routes';
// Import des autres routes ici plus tard
// import subscriptionRoutes from './subscription.routes';
// import orderRoutes from './order.routes';
// etc...

const router = Router();

// Monter les routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/providers', providerRoutes);

// Plus tard, ajouter les autres routes
// router.use('/subscriptions', subscriptionRoutes);
// router.use('/orders', orderRoutes);
// router.use('/proposals', proposalRoutes);
// router.use('/reviews', reviewRoutes);
// router.use('/tickets', ticketRoutes);
// router.use('/notifications', notificationRoutes);
// router.use('/admin', adminRoutes);
// router.use('/referrals', referralRoutes);

export default router;