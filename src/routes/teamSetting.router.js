import express from 'express';
import authMiddleware from "../middlewares/auth.middleware.js";
import { prisma } from '../utils/prisma/index.js';

const router = express.Router(); // express.Router()를 이용해 라우터를 생성합니다.

//선수 배치 API
router.post('/setPlayerTeam', authMiddleware, async (req, res) => {
    try {
        const { playerId, replacePlayerId } = req.body; // 요청에서 배치할 선수 ID, 교체할 선수 ID를 받음
        const userAccount = req.user;
        //사용자id 가져오기
        const user = await prisma.account.findFirst({
            where: {
                id: userAccount.id,
            },
        });
        // 편성할 카드가 인벤토리에 있는지 확인
        const gatherPlayer = await prisma.playerInventory.findMany({
            where: { accountId: user.id },
        })
        if (!gatherPlayer) {
            return res.status(404).json({ message: '보유한 선수를 찾을 수 없습니다.' });
        }
        const selectedPlayer = await prisma.playerInventory.findFirst({
            where: { accountId: user.id, playerId: playerId },
        })
        if (!selectedPlayer) return res.status(404).json({ message: '보유하지 않은 선수는 편성할 수 없습니다.' });
        // 팀에 3명의 선수가 있는지 확인
        const myTeam = await prisma.team.findMany({
            where: { accountId: user.id },
        })
        console.log(myTeam);
        if (myTeam.length < 3) {
            // 팀에 자리가 남아있으면 선수 추가
            // 팀에 중복되는 선수가 있다면 생성은 하지않고 인벤토리에서만 데이터 제거 (테스트 과정에서 발생한 중복 데이터 제거용)
            const isExistTeamPlayer = await prisma.team.findFirst({
                where: {
                    accountId: user.id,
                    playerId: selectedPlayer.playerId,
                }
            });
            if (!isExistTeamPlayer) {
                await prisma.team.create({
                    data: {
                        accountId: user.id,
                        playerId: selectedPlayer.playerId,
                        enhancementLevel: selectedPlayer.enhancementLevel
                    }
                });
            }
            // 추가한 선수 인벤토리에서 제거
            await prisma.playerInventory.delete({
                where: { id: selectedPlayer.id },
            });
        } else {
            // 교체할 선수를 선택
            const replacedPlayer = await prisma.team.findFirst({
                where: {
                    accountId: user.id,
                    playerId: replacePlayerId
                }
            });
            if (!replacedPlayer) {
                return res.status(404).json({ message: '교체할 선수를 잘못 지정하셨습니다.' });
            }

            // 교체 로직 (선수를 제거하고 새로운 선수 추가)
            await prisma.team.delete({
                where: { teamId: replacedPlayer.teamId }
            });
            await prisma.team.create({
                data: {
                    accountId: user.id,
                    playerId: selectedPlayer.playerId,
                    enhancementLevel: selectedPlayer.enhancementLevel
                }
            });
            // 추가한 선수 인벤토리에서 제거      
            await prisma.playerInventory.delete({
                where: { id: selectedPlayer.id },
            });
            // 교체한 선수 인벤토리로            
            // 중복되는 선수가 있다면 생성은 하지않고 팀에서만 데이터 제거 (테스트 과정에서 발생한 중복 데이터 제거용)      
            const isExistInventoryPlayer = await prisma.playerInventory.findFirst({
                where: {
                    accountId: user.id,
                    playerId: replacedPlayer.playerId,
                }
            });
            if (!isExistInventoryPlayer) {
                await prisma.playerInventory.create({
                    data: {
                        accountId: user.id,
                        playerId: replacedPlayer.playerId,
                        enhancementLevel: replacedPlayer.enhancementLevel
                    }
                });
            }
        }

        res.json({ message: '선수가 팀에 편성되었습니다.' });
    } catch (error) {
        // 오류 처리
        console.error(error);
        res.status(500).json({ message: 'Server Error: setPlayerTeam' });
    }
});

export default router;