import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { prisma } from "../utils/prisma/index.js";
const router = express.Router();
// 인벤토리 목록 조회 또는 인벤토리 상세 조회
router.get("/inventory/:inventoryId?", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { inventoryId } = req.params;
  try {
    // 특정 인벤토리 항목 조회 (inventoryId가 있는 경우)
    if (inventoryId) {
      const inventoryItem = await prisma.playerInventory.findFirst({
        where: {
          id: parseInt(inventoryId),
          accountId: userId,
        },
        include: {
          player: true, // 선수 정보 포함
        },
      });
      if (!inventoryItem) {
        return res
          .status(404)
          .json({ message: "해당 인벤토리 아이템을 찾을 수 없습니다." });
      }
      return res.status(200).json({
        message: "인벤토리 아이템 상세 정보",
        data: {
          inventoryId: inventoryItem.id,
          playerId: inventoryItem.playerId,
          playerName: inventoryItem.player.name,
          rarity: inventoryItem.player.rarity,
          enhancementLevel: inventoryItem.enhancementLevel,
          speed: inventoryItem.player.speed,
          goal: inventoryItem.player.goal,
          shot: inventoryItem.player.shot,
          defense: inventoryItem.player.defense,
          stamina: inventoryItem.player.stamina,
        },
      });
    }
    // 인벤토리 목록 조회 (inventoryId가 없는 경우)
    const inventoryItems = await prisma.playerInventory.findMany({
      where: { accountId: userId },
      include: {
        player: true, // 선수 정보 포함
      },
    });
    const inventoryCount = inventoryItems.length;
    return res.status(200).json({
      message: "인벤토리 목록",
      count: inventoryCount, // 총 인벤토리 아이템 개수
      data: inventoryItems.map((item) => ({
        inventoryId: item.id,
        playerId: item.playerId,
        playerName: item.player.name,
        rarity: item.player.rarity,
        enhancementLevel: item.enhancementLevel,
      })),
    });
  } catch (error) {
    console.error("인벤토리 조회 중 오류:", error);
    return res.status(500).json({ message: "서버 오류: 인벤토리 조회 실패" });
  }
});
export default router;