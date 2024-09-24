import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router(); // express.Router()를 이용해 라우터를 생성합니다.
const prisma = new PrismaClient({
  // Prisma를 이용해 데이터베이스를 접근할 때, SQL을 출력해줍니다.
  log: ['query', 'info', 'warn', 'error'],

  // 에러 메시지를 평문이 아닌, 개발자가 읽기 쉬운 형태로 출력해줍니다.
  errorFormat: 'pretty',
}); // PrismaClient 인스턴스를 생성합니다.

// A 유저 팀과 B 유저 팀의 스탯 예시
// const teams = {
//   A: {
//     player1: { speed: 85, goal: 90, shot: 88, defense: 60, stamina: 80 },
//     player2: { speed: 78, goal: 75, shot: 80, defense: 70, stamina: 85 },
//     player3: { speed: 70, goal: 60, shot: 65, defense: 90, stamina: 82 },
//   },
//   B: {
//     player1: { speed: 88, goal: 85, shot: 90, defense: 55, stamina: 78 },
//     player2: { speed: 80, goal: 70, shot: 75, defense: 72, stamina: 88 },
//     player3: { speed: 72, goal: 65, shot: 68, defense: 92, stamina: 83 },
//   },
// };

// 가중치 설정
const weights = {
  speed: 0.1,
  goal: 0.25,
  shot: 0.15,
  defense: 0.3,
  stamina: 0.2,
};

// 각 팀의 총 점수를 계산하는 함수
function calculateTeamScore(team) {
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

// 비동기 작업 (DB에 게임 결과 저장)
async function saveGameResult(result) {
  return new Promise((resolve) => {
    console.log('Game result saved to database:', result);
    resolve();
  });
}

// 게임 결과 API (비동기)
router.post('/play', async (req, res) => {
  try {
    const scoreA = calculateTeamScore(teams.A);
    const scoreB = calculateTeamScore(teams.B);

    // 점수에 따른 최대값 설정
    const maxScore = scoreA + scoreB;
    const randomValue = Math.random() * maxScore;
    let result;

    // A 팀이 승리하는 경우
    if (randomValue < scoreA) {
      const aScore = Math.floor(Math.random() * 4) + 2; // 2~5
      const bScore = Math.floor(Math.random() * Math.min(3, aScore));
      result = `A 유저 승리: A ${aScore}-${bScore} B`;
    } else {
      // B 팀이 승리하는 경우
      const bScore = Math.floor(Math.random() * 4) + 2;
      const aScore = Math.floor(Math.random() * Math.min(3, bScore));
      result = `B 유저 승리: B ${bScore}-${aScore} A`;
    }

    // 비동기 작업: 게임 결과 저장 (DB 또는 외부 API)
    await saveGameResult(result);

    // 결과 응답
    res.json({ result });
  } catch (error) {
    // 오류 처리
    console.error(error);
    res.status(500).json({ message: 'Server Error: GamePlay' });
  }
});

export default router;
