import { Router } from 'express';
const router = Router();
import { getConversations, createConversation } from '../controllers/conversationController';

router.get('/', getConversations);
router.post('/', (req, res) => createConversation(req, res, io));

export default router;
