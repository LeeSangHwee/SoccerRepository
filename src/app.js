import express from 'express';
//import gameplayRouter from './routes/GamePlay.js'; // game.js 라우터 임포트

const app = express();
const PORT = 3000;

// Body 데이터를 JSON 형태로 받을 수 있게 설정
app.use(express.json());

// api/games 경로로 gameRouter 사용
//app.use('/api', [gameplayRouter]);

// 서버 실행
app.listen(PORT, () => {
  console.log(`Server Starting - http://localhost:${PORT}`);
});
