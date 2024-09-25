import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { prisma } from "../utils/prisma/index.js";

const router = express.Router();

router.post("/gacha", authMiddleware, async (req, res, next) => {
    try {
        // 사용자 id 가져오기
        const userId = req.user.id;
        const user = await prisma.account.findUnique({
            where: { id: userId },
        });

        if(!user) {
            return res.status(403).json({message:"계정이 올바르지 않습니다."});
        }

        // 뽑기 비용, 캐시 부족 경고
        const cost = 100;
        if (user.cash < cost) {
            return res.status(400).json({
                message: "보유 캐시가 부족합니다.",
            });
        }
        
        /*
            가챠 로직
            등급 뽑기 -> 해당 등급 선수 중 랜덤
            확률: SSS : 20%, SS : 30%, S : 50%
            */
        const roulette = Math.floor(Math.random() * 99 + 1);
        let hit_rarity = "";
        if (roulette < 21) {
            hit_rarity = "SSS";
        } else if (roulette < 51) {
            hit_rarity = "SS";
        } else {
            hit_rarity = "S";
        }

        // 해당 등급의 선수 중 랜덤 선택
        const players = await prisma.player.findMany({
            where: { rarity: hit_rarity },
            select: {
                playerId: true,
                name: true,
                rarity: true,
                speed: true,
                goal: true,
                shot: true,
                defense: true,
                stamina: true,
            },
        });

        if (players.length === 0) {
            return res.status(501).json({ message: "선수 풀이 충분하지 않습니다." });
        }

        const randomPlayer = players[Math.floor(Math.random() * players.length)];

        // 인벤토리에 중복으로 추가 가능 (각 항목은 고유한 inventoryId를 가짐)
        const newInventoryItem = await prisma.playerInventory.create({
            data: {
                accountId: userId,
                playerId: randomPlayer.playerId,
                enhancementLevel: 0, // 기본 강화 레벨 0
            },
        });

        // 캐시 차감
        await prisma.account.update({
            where: { id: userId },
            data: { cash: { decrement: cost } }, // 캐시 차감
        });
        const updatedUser = await prisma.account.findUnique({
            where: { id: userId },
            select: { cash: true },
        });

        return res.status(201).json({
            message: `축하합니다! ${randomPlayer.rarity}급 ${randomPlayer.name} 선수를 뽑았습니다!`,
            player: randomPlayer,
            inventoryId: newInventoryItem.id, // 새롭게 부여된 인벤토리 ID
            remaincash: updatedUser.cash, // 남은 캐시 표시
        });
    } catch (err) {
        console.error("가챠 중 에러 발생", err);
        return res.status(500).json({ message: "가챠 중 에러가 발생하였습니다." });
    }
});

export default router;