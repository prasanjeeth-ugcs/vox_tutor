import { Router } from 'express';
import { appendTranscript } from '../controllers/transcriptController.js';

const router = Router();

router.post('/', appendTranscript);

export default router;
