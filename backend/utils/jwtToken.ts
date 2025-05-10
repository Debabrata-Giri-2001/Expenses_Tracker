import { Response } from 'express';
import 'dotenv/config'

interface User {
    getJWTToken: () => string;
}

const sendToken = (user: User, statusCode: number, res: Response): void => {
    const token = user.getJWTToken();

    try {
        const option = {
            expires: new Date(Date.now() + Number(process.env.COOKIE_EXPIER) * 24 * 60 * 60 * 1000),
            httpOnly: true
        };
        res.status(statusCode).cookie('token', token, option).json({
            success: true,
            user,
            token
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error });
    }
};

export default sendToken;
