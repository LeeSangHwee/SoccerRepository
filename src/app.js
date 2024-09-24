import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
dotenv.config();

import accountRouter from "./routes/account.router.js";
import gachaRouter from "./routes/gacha.router.js";
import playerRouter from "./routes/player.router.js";
import teamSettingRouter from './routes/teamSetting.router.js';
import gameplayRouter from './routes/gamePlay.router.js';
import userRankSearchRouter from './routes/userRankSearch.router.js';
import enhanceRouter from "./routes/enhance.router.js";

const app = express();
const PORT = 3306;

app.use(express.json());

app.use("/api", [
  accountRouter,
  gachaRouter,
  playerRouter,
  teamSettingRouter,
  gameplayRouter,
  userRankSearchRouter,
  enhanceRouter,
]);

// 서버 실행
app.listen(PORT, () => {
  console.log(`Server Starting - http://localhost:${PORT}`);
});
