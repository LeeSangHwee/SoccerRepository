import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
dotenv.config();
import accountRouter from "./routes/account.router.js";
import gachaRouter from "./routes/gacha.router.js";
import playerRouter from "./routes/player.router.js";
import gameplayRouter from "./routes/gamePlay.router.js"; // gamePlay.js 라우터 임포트
import UserRankSearchRouter from "./routes/UserRankSearch.router.js";
import enhanceRouter from "./routes/enhance.router.js";
import inventoryRouter from "./routes/inventory.router.js";
import teamSettingRouter from "./routes/teamSetting.router.js";
import materialRouter from "./routes/materials.router.js";

const app = express();
const PORT = 3000;

// Body 데이터를 JSON 형태로 받을 수 있게 설정
app.use(express.json());

// api/games 경로로 gameRouter 사용
app.use("/api", [
  accountRouter,
  gachaRouter,
  gameplayRouter,
  UserRankSearchRouter,
  enhanceRouter,
  inventoryRouter,
  teamSettingRouter,
  materialRouter,
]);

// 서버 실행
app.listen(PORT, () => {
  console.log(`Server Starting - http://localhost:${PORT}`);
});
