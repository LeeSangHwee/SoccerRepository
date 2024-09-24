import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { prisma } from '../utils/prisma/index.js';

const router = express.Router();


router.post("/gacha", authMiddleware, async (req, res, next) => {
    try {
        //사용자id 가져오기
        const userId = req.user;
        const user = await prisma.account.findFirst({
            where: {
                id: userId.id,
            },
        });

        //뽑기 비용, 캐쉬 부족 경고
        const cost = 100;
        if (user.cash < cost) {
            return res.status(400).json({
                message: "보유 캐쉬가 부족합니다.",
            });
        }
        user.cash -= cost;
        /*
        가챠 로직
        등급 뽑기 -> 해당 등급 선수 중 랜덤        
        (테스트용)확률 SSS : 20 % / SS : 30% / S : 50%
        
         */
        //등급뽑기
        const roulette = Math.floor((Math.random() * 99) + 1);
        let hit_rarity = "";
        if (roulette < 21) {
            hit_rarity = "SSS";
        } else if (roulette < 51) {
            hit_rarity = "SS";
        } else if (roulette <= 100) {
            hit_rarity = "S";
        }
        //해당 등급 선수 중 랜덤
        const playerTable = await prisma.player.findMany({
            where: {
                rarity: hit_rarity,
            },
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
        //console.log(characterTable)
        if(playerTable.length <= 0){
            return res.status(501).json({message:"선수 풀이 충분하지 않습니다."});
        }
        const result_player = playerTable[Math.floor((Math.random() * playerTable.length - 1) + 1)];
        console.log(result_player);
        //중복 확인
        const isExistPlayer = await prisma.inventory.findFirst({
            where: {
                accountId: userId.id,
                playerId: result_player.playerId,
            },
        });

        if (isExistPlayer) {
            return res.status(201).json({
                message: `${isExistPlayer.name} 선수 보유중`,
                data: result_player,
            });
        }
        //인벤토리에 생성
        await prisma.inventory.create({
            data: {
                accountId: userId.id,
                playerId: result_player.playerId,
            },
        });

        //응답 메시지
        return res.status(201).json({
            message: `${result_player.rarity}급 선수 ${result_player.name} `,
            data: {
                name: result_player.name,
                rarity: result_player.rarity,
                speed: result_player.speed,
                goal: result_player.goal,
                shot: result_player.shot,
                defense: result_player.defense,
                stamina: result_player.stamina,
                remaincash: user.cash
            },
        });
    } catch (err) {
        //next(err);
        console.error("가챠 중 에러 발생", err);
        return res.status(500).json({ message: "가챠 중 에러가 발생하였습니다." });
    }
});

export default router;