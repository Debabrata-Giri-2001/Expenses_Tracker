import { Request, Response, NextFunction } from 'express';

const asyncHandler = (theFun: (req: Request, res: Response, next: NextFunction) => Promise<any>) => 
    (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(theFun(req, res, next)).catch(next);
    };

export default asyncHandler;
