import { Response } from 'express';

export const ApiResponse = {
  success<T>(res: Response, data: T, status = 200) {
    return res.status(status).json({
      success: true,
      data,
    });
  },

  created<T>(res: Response, data: T) {
    return res.status(201).json({
      success: true,
      data,
    });
  },

  paginated<T>(
    res: Response,
    data: T[],
    meta: { page: number; limit: number; total: number }
  ) {
    return res.status(200).json({
      success: true,
      data,
      meta: {
        page: meta.page,
        limit: meta.limit,
        total: meta.total,
        totalPages: Math.ceil(meta.total / meta.limit),
        hasNext: meta.page * meta.limit < meta.total,
        hasPrev: meta.page > 1,
      },
    });
  },

  noContent(res: Response) {
    return res.status(204).send();
  },
};
