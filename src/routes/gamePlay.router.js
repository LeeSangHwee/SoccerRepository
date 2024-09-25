import express, { response } from "express";
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

async function calculateTeamScore(team) {
  let totalScore = 0;
  for(let index = 0; index < 3; index++) {
    const _player = await prisma.player.findFirst({
      where: {playerId: team[index].playerId}
    });
  if(!_player) return res.status(404).json({message:"Error: calculateTeamScore"});
    const score = 
    _player.speed * weights.speed +
    _player.goal * weights.goal +
    _player.shot * weights.shot +
    _player.defense * weights.defense +
    _player.stamina * weights.stamina;
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

    if (!user_A || user_A.team.length != 3) {
      return res
        .status(400)
        .json({ message: "팀 구성이 완료되지 않았습니다." });
    }

    const userFind = await prisma.account.findMany({
      where: {
        rp: {
          gte: userId.rp - 30,
          lte: userId.rp + 30,
        },
        id: { not: userId.id },
      },
      include: { team: true },
    });
    
    const user_B = userFind[Math.floor(Math.random() * userFind.length)];
    
    if (!user_B || user_B.team.length != 3) {
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
      await prisma.account.update({
        where: { id: user_A.id },
        data: { rp: user_A.rp + 10 },
      });  
      await prisma.account.update({
        where: { id: user_B.id },
        data: { rp: user_B.rp - 10 },
      });
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
      await prisma.account.update({
        where: { id: user_A.id },
        data: { rp: user_A.rp - 10 },
      });  
      await prisma.account.update({
        where: { id: user_B.id },
        data: { rp: user_B.rp + 10 },
      });

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
