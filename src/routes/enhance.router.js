import express from "express";
import { prisma } from "../utils/prisma/index.js"; // Prisma 클라이언트 import

const router = express.Router();

// 강화 확률 설정
const enhancementProbabilities = {
  1: 0.9, // 90% 성공 확률
  2: 0.8,
  3: 0.7,
  4: 0.6,
  5: 0.5,
  6: 0.4,
  7: 0.3,
  8: 0.2,
  9: 0.1,
  10: 0.05,
};

// 강화 API 엔드포인트
router.post("/enhance", async (req, res, next) => {
  // 클라이언트에서 받은 userId와 inventoryId를 추출
  const { userId, inventoryId } = req.body;

  // userId 또는 inventoryId가 제공되지 않은 경우 에러 응답
  if (!userId || !inventoryId) {
    return res
      .status(400)
      .json({ message: "유효한 userId와 inventoryId를 제공해야 합니다." });
  }

  try {
    // inventoryId에 해당하는 플레이어 데이터를 인벤토리에서 조회
    const playerInventory = await prisma.playerInventory.findUnique({
      where: { id: inventoryId },
    });

    // 인벤토리에서 플레이어를 찾지 못한 경우 에러 응답
    if (!playerInventory) {
      return res.status(404).json({ message: "선수를 찾을 수 없습니다." });
    }

    // 현재 강화 레벨 확인
    const currentLevel = playerInventory.enhancementLevel;

    // 강화 레벨이 최대치(10)인 경우 더 이상 강화할 수 없으므로 에러 응답
    if (currentLevel >= 10) {
      return res
        .status(400)
        .json({ message: "최대 강화 레벨에 도달했습니다." });
    }

    // 강화 성공 확률 계산
    const successRate = enhancementProbabilities[currentLevel + 1];
    const randomValue = Math.random(); // 0 ~ 1 사이의 무작위 값 생성

    // 무작위 값이 성공 확률보다 작으면 강화 성공
    if (randomValue < successRate) {
      // 강화 성공 시 강화 레벨을 1 올리고 DB에 업데이트
      const updatedPlayer = await prisma.playerInventory.update({
        where: { id: inventoryId },
        data: { enhancementLevel: currentLevel + 1 },
      });
      // 강화 성공 응답 전송
      return res.json({ message: "강화 성공!", player: updatedPlayer });
    } else {
      // 강화 실패 응답 전송
      return res.json({
        message: "강화 실패.",
        enhancementLevel: currentLevel,
      });
    }
  } catch (error) {
    // 서버 내부 오류 처리
    console.error(error);
    res.status(500).json({ message: "서버 오류" });
  }
});

export default router;
