import express from 'express'
import { comment, deleteComment } from '../controllers/comment.js'
import {isAuthenticated} from "../middleware/auth.js";


const router = express.Router()

router.post('/:id', isAuthenticated,comment)

router.delete('/:id', deleteComment)

export default router