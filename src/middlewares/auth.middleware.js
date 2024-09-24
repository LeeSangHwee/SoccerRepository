import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma/index.js';

export default async function (req, res, next) {
    try {
        const authorization = req.headers.authorization;
        console.log(authorization);
        if (!authorization) throw new Error('토큰이 존재하지 않습니다.');
        
        const [tokenType, token] = authorization.split(' ');

        if (tokenType !== 'Bearer')
            throw new Error('토큰 타입이 일치하지 않습니다.');

        const decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const id = decodedToken.userId;     

        const user = await prisma.account.findFirst({
            where: { id: +id },
        });
        if (!user) {
            throw new Error('토큰 사용자가 존재하지 않습니다.');
        }

        // req.user에 사용자 정보를 저장합니다.
        req.user = user;

        next();
    } catch (error) {
        switch (error.name) {
            case 'TokenExpiredError':
                return res.status(401).json({ message: '토큰이 만료되었습니다.' });
            case 'JsonWebTokenError':
                return res.status(401).json({ message: '토큰이 조작되었습니다.' });
            default:
                return res
                    .status(401)
                    .json({ message: error.message ?? '비정상적인 요청입니다.' });
        }
    }
}