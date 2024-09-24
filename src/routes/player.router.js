import express from 'express';
import { prisma } from '../utils/prisma/index.js';

const router = express.Router();

//선수 추가 API
router.post('/create-player', async (req, res, next) => {

    try {
        const { name, rarity, speed, goal, shot, defense, stamina } = req.body;
        console.log(req.body);
        const isExistPlayer = await prisma.player.findFirst({
            where: {
                name
            }
        });

        if (isExistPlayer) {
            return res.status(409).json({ message: '이미 존재하는 선수 입니다.' });
        }
        const newplayer = await prisma.player.create({
            data: {
                name,
                rarity,
                speed,
                goal,
                shot,
                defense,
                stamina
            }
        });

        return res.status(201).json({ data: newplayer });
    } catch (err) {
        return res.status(500).json({ message: "선수 생성 중 에러" });
    }
});

export default router;