import { createSubscriptionSchema, subscriptionServiceDaysSchema, validServiceDays } from '../../src/validators/subscription.validator';
import { approveSubscriptionProposalSchema } from '../../src/validators/subscription-proposal.validator';
import subscriptionService from '../../src/services/subscription.service';
import repository from '../../src/repositories/subscription.repository';

jest.mock('../../src/repositories/subscription.repository', () => ({ __esModule: true, default: {
  findById: jest.fn(), findByProviderAndName: jest.fn(), create: jest.fn(), updateWithMeals: jest.fn(),
} }));
jest.mock('../../src/repositories/provider.repository', () => ({ __esModule: true, default: {
  findById: jest.fn().mockResolvedValue({ status: 'APPROVED' }),
} }));
jest.mock('../../src/services/meal.service', () => ({ __esModule: true, default: {
  validateMealsForSubscription: jest.fn().mockResolvedValue({ valid: true }),
} }));

const payload = { name: 'Formule semaine', description: 'Une formule de repas pour la semaine', providerPrice: 1000,
  type: 'LUNCH', category: 'AFRICAN', duration: 'WEEK', imageUrl: 'https://example.com/meal.jpg',
  mealIds: ['10000000-0000-4000-8000-000000000001'] };

beforeEach(() => {
  jest.clearAllMocks();
  (repository.findById as jest.Mock).mockResolvedValue({ providerId: 'provider', duration: 'WEEK', serviceDaysCount: 6 });
});

test.each([0, -1, 1.5, 31, '6'])('refuse une quantité invalide : %s', value => {
  expect(subscriptionServiceDaysSchema.safeParse(value).success).toBe(false);
});
test.each([undefined, null, 1, 6, 30])('accepte une quantité optionnelle ou entière : %s', value => {
  expect(subscriptionServiceDaysSchema.safeParse(value).success).toBe(true);
});
test('ancien client : création sans champ toujours acceptée', () => {
  expect(createSubscriptionSchema.safeParse(payload).success).toBe(true);
});
test('une semaine peut inclure six jours de repas, pas huit', () => {
  expect(validServiceDays('WEEK', 6)).toBe(true);
  expect(validServiceDays('WEEK', 8)).toBe(false);
});
test('création : transmet le nombre au stockage', async () => {
  await subscriptionService.create('provider', createSubscriptionSchema.parse({ ...payload, serviceDaysCount: 6 }));
  expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ duration: 'WEEK', serviceDaysCount: 6 }));
});
test('création : refuse un nombre supérieur à la durée', async () => {
  await expect(subscriptionService.create('provider', createSubscriptionSchema.parse({ ...payload, serviceDaysCount: 8 }))).rejects.toThrow();
  expect(repository.create).not.toHaveBeenCalled();
});
test('modification partielle : conserve implicitement la valeur existante', async () => {
  await subscriptionService.update('sub', 'provider', { name: 'Nouveau nom' });
  expect(repository.updateWithMeals).toHaveBeenCalledWith('sub', expect.objectContaining({ serviceDaysCount: undefined }));
});
test('réduire la durée ne peut laisser un nombre incohérent', async () => {
  await expect(subscriptionService.update('sub', 'provider', { duration: 'THREE_DAYS' })).rejects.toThrow();
  expect(repository.updateWithMeals).not.toHaveBeenCalled();
});
test('peut réduire simultanément durée et jours de repas', async () => {
  await subscriptionService.update('sub', 'provider', { duration: 'THREE_DAYS', serviceDaysCount: 3 });
  expect(repository.updateWithMeals).toHaveBeenCalledWith('sub', expect.objectContaining({ duration: 'THREE_DAYS', serviceDaysCount: 3 }));
});
test('null permet de retirer la précision', async () => {
  await subscriptionService.update('sub', 'provider', { serviceDaysCount: null });
  expect(repository.updateWithMeals).toHaveBeenCalledWith('sub', expect.objectContaining({ serviceDaysCount: null }));
});
test('approbation de proposition : accepte aussi le champ', () => {
  expect(approveSubscriptionProposalSchema.parse({ ...payload, serviceDaysCount: 6 }).serviceDaysCount).toBe(6);
});
