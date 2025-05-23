import { Request, Response, NextFunction } from 'express';
import 'dotenv/config'

interface CustomError extends Error {
  statusCode?: number;
}

const error = (err: CustomError, req: Request, res: Response, next: NextFunction) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Internal Server Error';

  res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
};

export default error;
