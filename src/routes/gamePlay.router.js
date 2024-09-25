import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { prisma } from "../utils/prisma/index.js";

const router = express.Router();

const weights = {
  speed: 0.1,
  goal: 0.25,
  shot: 0.15,
  defense: 0.3,
  stamina: 0.2,
};

function calculateTeamScore(team) {
  if (!team || !team.player1 || !team.player2 || !team.player3) {
    return 0; // 팀이 없거나 부족한 경우 기본 점수를 0으로 설정
  }

  let totalScore = 0;
  for (const player of Object.values(team)) {
    const score =
      player.speed * weights.speed +
      player.goal * weights.goal +
      player.shot * weights.shot +
      player.defense * weights.defense +
      player.stamina * weights.stamina;
    totalScore += score;
  }
  return totalScore;
}

router.post("/play", authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user;
    const user_A = await prisma.account.findFirst({
      where: { id: userId.id },
      include: { team: true }, // team 데이터를 가져옴
    });

    if (!user_A || !user_A.team) {
      return res
        .status(400)
        .json({ message: "팀 구성이 완료되지 않았습니다." });
    }

    const userFind = await prisma.account.findMany({
      where: {
        rp: {
          gte: userId.rp - 10,
          lte: userId.rp + 10,
        },
        id: { not: userId.id },
      },
      include: { team: true },
    });

    const user_B = userFind[Math.floor(Math.random() * userFind.length)];

    if (!user_B || !user_B.team) {
      return res
        .status(400)
        .json({ message: "상대방 팀 구성이 완료되지 않았습니다." });
    }

    const scoreA = calculateTeamScore(user_A.team);
    const scoreB = calculateTeamScore(user_B.team);

    if (scoreA === 0 || scoreB === 0) {
      return res.status(400).json({ message: "팀 구성이 불완전합니다." });
    }

    const maxScore = scoreA + scoreB;
    const randomValue = Math.random() * maxScore;
    let result;

    const rpDifference = Math.abs(user_A.rp - user_B.rp);
    let difficultyLevel = "easy";
    if (rpDifference > 10) difficultyLevel = "hard";

    if (randomValue < scoreA) {
      user_A.rp += 10;
      user_B.rp -= 10;
      result = `A 유저 승리: A ${
        Math.floor(Math.random() * 4) + 2
      } - ${Math.floor(Math.random() * 3)} B`;

      if (difficultyLevel === "hard") {
        const reward = Math.random() < 0.5 ? "고급 강화석" : "강화 보호석";
        await prisma.material.create({
          data: { accountId: user_A.id, materialType: reward },
        });
      } else {
        await prisma.material.create({
          data: { accountId: user_A.id, materialType: "일반 강화석" },
        });
      }
    } else {
      user_A.rp -= 10;
      user_B.rp += 10;
      result = `B 유저 승리: B ${
        Math.floor(Math.random() * 4) + 2
      } - ${Math.floor(Math.random() * 3)} A`;

      if (difficultyLevel === "hard") {
        const reward = Math.random() < 0.5 ? "고급 강화석" : "강화 보호석";
        await prisma.material.create({
          data: { accountId: user_B.id, materialType: reward },
        });
      } else {
        await prisma.material.create({
          data: { accountId: user_B.id, materialType: "일반 강화석" },
        });
      }
    }

    res.json({ result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error: GamePlay" });
  }
});

export default router;
