import express from 'express';
import { prisma } from '../utils/prisma/index.js';

const router = express.Router(); // express.Router()를 이용해 라우터를 생성합니다.

// 유저 랭킹 조회 API
router.get('/UserRankSearch', async (req, res, next) => {
  try {
    // 유저 랭킹 조회
    const result = await prisma.account.findMany({
      orderBy: {
        rp: 'desc'
      },
      select: {
        nickName: true, // 닉네임 필드 선택
        rp: true // rp 필드 선택
      }
    });

    // 결과 응답
    res.json({ result });
  } catch (error) {
    // 오류 처리
    console.error(error);
    res.status(500).json({ message: 'Server Error: UserRankSearch' });
  }
});

export default router;