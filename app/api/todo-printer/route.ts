import { handleTodoPrinterRequest, methodNotAllowed } from './queue';

export const POST = handleTodoPrinterRequest;
export const GET = methodNotAllowed;
export const PUT = methodNotAllowed;
export const PATCH = methodNotAllowed;
export const DELETE = methodNotAllowed;

