import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { prisma } from "../utils/prisma/index.js";

const router = express.Router(); // express.Router()를 이용해 라우터를 생성합니다.

router.get("/materials", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // 해당 유저가 보유한 강화석 목록 조회
    const materials = await prisma.material.findMany({
      where: {
        accountId: userId,
      },
      select: {
        id: true,
        materialType: true,
      },
    });

    if (!materials || materials.length === 0) {
      return res.status(404).json({ message: "강화석이 없습니다." });
    }

    // 유저가 보유한 강화석의 종류별 개수 조회
    const materialCounts = await prisma.material.groupBy({
      by: ["materialType"],
      where: {
        accountId: userId,
      },
      _count: {
        _all: true,
      },
    });

    // 강화석이 없는 경우 처리
    if (!materialCounts || materialCounts.length === 0) {
      return res
        .status(404)
        .json({ message: "강화석 종류별 개수가 없습니다." });
    }

    // 정상 응답
    return res.json({
      message: "강화석 목록 및 종류별 개수",
      materials,
      materialCounts,
    });
  } catch (error) {
    // 오류 처리
    console.error(error);
    return res
      .status(500)
      .json({ message: "강화석 조회 중 오류 발생", error: error.message });
  }
});

export default router;
