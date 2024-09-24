import express from 'express';
import authMiddleware from "../middlewares/auth.middleware.js";
import { prisma } from '../utils/prisma/index.js';

const router = express.Router(); // express.Router()를 이용해 라우터를 생성합니다.

router.get('/getInventory', authMiddleware, async (req, res) => {
    try {
        // 사용자id 가져오기
        const userAccount = req.user;
        const user = await prisma.account.findFirst({
          where: {
            id: userAccount.id,
          },
        });
        // 인벤토리 불러오기
        result = user.Inventory;
        // 결과 응답
        res.json({ result });
      } catch (error) {
        // 오류 처리
        console.error(error);
        res.status(500).json({ message: 'Server Error: getInventory' });
      }
});

// 팀 편성시 팀이 가득 찼는지 확인하기 get
const getTeamSetting = async (req, res, next) => {
    try {
        // 사용자id 가져오기
        const userAccount = req.user;
        const user = await prisma.account.findFirst({
          where: {
            id: userAccount.id,
          },
        });
        // 인벤토리 불러오기
        result = user.team;
        // 결과 응답
        res.json({ result });
        next();
      } catch (error) {
        // 오류 처리
        console.error(error);
        res.status(500).json({ message: 'Server Error: getTeamSetting' });
      }      
};

router.post('/getInventory', authMiddleware, async (req, res) => {
    try {
        // 사용자id 가져오기
        const userAccount = req.user;
        const user = await prisma.account.findFirst({
          where: {
            id: userAccount.id,
          },
        });
        // 인벤토리 불러오기
        result = user.Inventory;
        // 결과 응답
        res.json({ result });
      } catch (error) {
        // 오류 처리
        console.error(error);
        res.status(500).json({ message: 'Server Error: getInventory' });
      }
});
// 플레이어 ID를 통해 인벤토리에서 팀으로 편성하기 post
//  아무도 없다면 바로 편성하기

// 팀 편성시 팀이 가득 찼다면 교체할 플레이어 ID 가져오기
// 후에 플레이어 교체하기

export default router;
