import { Router } from 'express';

const router = Router();

// Basic companies routes - placeholder for now
router.get('/', (req, res) => {
  res.json({ message: 'Companies API endpoint' });
});

export default router;