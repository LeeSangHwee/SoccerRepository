import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { prisma } from "../utils/prisma/index.js";

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
  10: 0.05, // 5% 성공 확률
};

// 강화 API (강화석 선택 가능)
router.post("/enhance", authMiddleware, async (req, res, next) => {
  const { userId, inventoryId, selectedMaterial } = req.body; // 선택한 강화석 추가

  if (!userId || !inventoryId || !selectedMaterial) {
    return res.status(400).json({
      message: "유효한 userId, inventoryId, 및 강화석을 제공해야 합니다.",
    });
  }

  try {
    // 유저 인벤토리에서 해당 선수 정보를 가져옴
    const playerInventory = await prisma.playerInventory.findUnique({
      where: { id: inventoryId },
    });

    if (!playerInventory) {
      return res.status(404).json({ message: "선수를 찾을 수 없습니다." });
    }

    const currentLevel = playerInventory.enhancementLevel;
    if (currentLevel >= 10) {
      return res
        .status(400)
        .json({ message: "최대 강화 레벨에 도달했습니다." });
    }

    // 강화석이 충분한지 확인
    const userMaterials = await prisma.material.findFirst({
      where: { accountId: userId, materialType: selectedMaterial },
    });

    if (!userMaterials) {
      return res
        .status(400)
        .json({ message: `선택한 강화석 (${selectedMaterial})이 부족합니다.` });
    }

    // 기본 강화 확률
    const baseSuccessRate = enhancementProbabilities[currentLevel + 1];
    let finalSuccessRate = baseSuccessRate;
    let protectLevel = false;

    // 강화석에 따른 효과 적용
    if (selectedMaterial === "일반 강화석") {
      finalSuccessRate = Math.min(1, baseSuccessRate + 0.05); // 일반 강화석은 +5%
    } else if (selectedMaterial === "고급 강화석") {
      finalSuccessRate = Math.min(1, baseSuccessRate + 0.1); // 고급 강화석은 +10%
    } else if (selectedMaterial === "강화 보호석") {
      protectLevel = true; // 강화 보호석은 실패해도 강화 레벨 하락 방지
    }

    const randomValue = Math.random();

    if (randomValue < finalSuccessRate) {
      // 강화 성공: 선수의 강화 레벨을 증가시키고 강화석 소모
      const updatedPlayer = await prisma.playerInventory.update({
        where: { id: inventoryId },
        data: { enhancementLevel: currentLevel + 1 },
      });

      // 강화석 소모 (1개 차감)
      await prisma.material.delete({
        where: { id: userMaterials.id },
      });

      return res.json({ message: "강화 성공!", player: updatedPlayer });
    } else {
      // 강화 실패 시: 강화석 소모 및 보호석에 따른 처리
      if (!protectLevel) {
        await prisma.playerInventory.update({
          where: { id: inventoryId },
          data: { enhancementLevel: currentLevel > 0 ? currentLevel - 1 : 0 }, // 실패 시 레벨 감소 (보호석 없을 때만)
        });
      }

      // 강화석 소모 (1개 차감)
      await prisma.material.delete({
        where: { id: userMaterials.id },
      });

      return res.json({
        message: protectLevel
          ? "강화 실패: 보호석으로 레벨이 유지되었습니다."
          : "강화 실패: 레벨이 하락했습니다.",
        enhancementLevel: currentLevel,
      });
    }
  } catch (error) {
    console.error("Error during enhancement:", error);
    res.status(500).json({ message: "서버 오류" });
  }
});

export default router;
