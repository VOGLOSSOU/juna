import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import providerRoutes from './provider.routes';
import adminRoutes from './admin.routes';
import mealRoutes from './meal.routes';
import subscriptionRoutes from './subscription.routes';
import reviewRoutes from './review.routes';
import orderRoutes from './order.routes';
// Import des autres routes ici plus tard
// import proposalRoutes from './proposal.routes';
// import ticketRoutes from './ticket.routes';
// import notificationRoutes from './notification.routes';
// import referralRoutes from './referral.routes';

const router = Router();

// Monter les routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/providers', providerRoutes);
router.use('/admin', adminRoutes);
router.use('/meals', mealRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/reviews', reviewRoutes);
router.use('/orders', orderRoutes);

// Plus tard, ajouter les autres routes
// router.use('/proposals', proposalRoutes);
// router.use('/tickets', ticketRoutes);
// router.use('/notifications', notificationRoutes);
// router.use('/referrals', referralRoutes);

export default router;
