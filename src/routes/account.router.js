import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import express from 'express';
import { prisma } from '../utils/prisma/index.js';

const router = express.Router();

//회원가입 API
router.post('/sign-up', async (req, res, next) => {
    try {
        //req.body 에 account, password, cofirmPassword, nickName 값을 주고 가입요청
        const { account, password, confirmPassword, nickName } = req.body;
        //id중복
        const isExistUser = await prisma.account.findFirst({
            where: {
                account
            }
        });
        if (isExistUser) {
            return res.status(409).json({ message: "이미 존재하는 계정ID 입니다." });
        }
        //nickName중복
        const isExistNickName = await prisma.account.findFirst({
            where: {
                nickName,
            }
        });
        if (isExistNickName) {
            return res.status(409).json({ message: "이미 존재하는 닉네임 입니다." });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ message: "비밀번호 확인이 일치하지 않습니다." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.account.create({
            data: {
                account,
                password: hashedPassword,
                nickName,
            }
        });

        return res.status(201).json({
            id: user.id,
            account: user.account,
            nickName: user.nickName,
        })

    } catch (err) {
        console.error("회원가입 중 에러 발생:", err);
        return res.status(500).json({ message: "회원가입 중 에러가 발생했습니다." });
    }
});

//로그인 API
router.post('/sign-in', async (req, res, next) => {
    try {
        //id, password 값으로 로그인 요청
        const { account, password } = req.body;
        const user = await prisma.account.findFirst({ where: { account } });
        console.log(user); //요청 확인용 로그

        //계정 정보 불일치
        if (!user)
            return res.status(401).json({ messgae: "존재하지 않는 ID 입니다." });
        else if (!(await bcrypt.compare(password, user.password)))
            return res.status(401).json({ message: "비밀번호가 일치하지 않습니다." });

        //로그인 성공 시
        const token = jwt.sign(
            {
                userId: user.id,
            },
            process.env.JWT_SECRET_KEY
        );
        res.header("authorization", `Bearer ${token}`);
        return res.status(200).json({ message: "로그인 성공" });
    } catch (err) {
        console.error("로그인 중 에러 발생", err);
        return res.status(500).json({ message: "로그인 중 에러가 발생하였습니다." });
    }
});

export default router;