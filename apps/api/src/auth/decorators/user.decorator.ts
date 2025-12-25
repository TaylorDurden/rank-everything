import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    
    // Fallback logic for extraction if user is nested or differently named
    const contextUser = user || request.raw?.user || request.session?.user;

    if (!contextUser) return null;
    return data ? contextUser[data] : contextUser;
  },
);
