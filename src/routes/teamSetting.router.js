import express from 'express';
import authMiddleware from "../middlewares/auth.middleware.js";
import { prisma } from '../utils/prisma/index.js';

const router = express.Router(); // express.Router()를 이용해 라우터를 생성합니다.

// 인벤토리 불러오기
router.get('/getInventory', authMiddleware, async (req, res) => {
  try {
      // 사용자id 가져오기
      const userAccount = req.user;
      const user = await prisma.account.findFirst({
          where: {
              id: userAccount.id,
          },
          include: {
            PlayerInventory: {
                  include: {
                      Player: true // Inventory의 Player를 포함해서 가져옴
                  }
              }
          }
      });

      // id 이용해서 인벤토리 가져오기
      const result = user.PlayerInventory;
      // 결과 응답
      res.json({ result });
  } catch (error) {
      // 오류 처리
      console.error(error);
      res.status(500).json({ message: 'Server Error: getInventory' });
  }
});

// 유저 ID를 통해 인벤토리의 선수 카드를 팀으로 편성하거나 교체하기
router.post('/setPlayerTeam', authMiddleware, async (req, res) => {
    try {
        const { playerName, playerId } = req.body; // 요청에서 카드 이름과 교체할 선수 ID를 받음
        const userAccount = req.user;

        // 사용자와 팀 정보 가져오기
        const user = await prisma.account.findFirst({
          where: { id: userAccount.id },
          include: {
            Team: {
              include: {
                Player: true, // 팀에 속한 선수 정보를 가져옴
              }
            },
            PlayerInventory: {
              include: {
                Player: true, // 인벤토리에서 사용 가능한 선수 정보를 가져옴
              }
            }
          }
        });

        // 편성할 카드가 인벤토리에 있는지 확인
        const selectCard = user.PlayerInventory.find(element => element.Player.name === playerName);
        if (!selectCard) return res.status(404).json({ message: '선수를 찾을 수 없습니다.' });
  
        // 팀에 3명의 선수가 있는지 확인
        if (user.Team.length < 3) {
            // 팀에 자리가 남아있으면 선수 추가
            await prisma.team.update({
              where: { teamId: user.Team.teamId },
              data: {
                Player: {
                  connect: { playerId: selectCard.playerId }, // 새로운 선수를 팀에 추가
                }
              }
            });
        } else {
            // 교체할 선수를 선택
            const replacePlayer = user.Team.Player.find(player => player.playerId === replacePlayerId);
            if (!replacePlayer) return res.status(404).json({ message: '교체할 선수가 팀에 없습니다.' });

            // 교체 로직 (선수를 제거하고 새로운 선수 추가)
            await prisma.team.update({
              where: { teamId: user.Team.teamId },
              data: {
                Player: {
                  disconnect: { playerId: replacePlayerId }, // 기존 선수 제거
                  connect: { playerId: selectCard.playerId } // 새로운 선수 추가
                }
              }
            });
        }

        res.json({ message: '선수가 팀에 편성되었습니다.' });
      } catch (error) {
        // 오류 처리
        console.error(error);
        res.status(500).json({ message: 'Server Error: setPlayerTeam' });
      }
});

export default router;
