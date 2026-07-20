import { Router } from 'express';
import { generateQuestions } from '../controllers/generateController.js';

const router = Router();

router.post('/', generateQuestions);

export default router;
