/**
 * Simple router for Cloudflare Workers
 */

type Method = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";
type RouteHandler<T> = (
  request: Request,
  env: T,
  ctx: ExecutionContext,
  params: Record<string, string>
) => Promise<Response> | Response;
type Middleware<T> = (
  request: Request,
  env: T,
  ctx: ExecutionContext,
  next: () => Promise<Response>
) => Promise<Response>;

interface Route<T> {
  method: Method | "*";
  pattern: RegExp;
  paramNames: string[];
  handler: RouteHandler<T>;
  middlewares: Middleware<T>[];
}

export class Router<T = any> {
  private routes: Route<T>[] = [];
  private globalMiddlewares: Middleware<T>[] = [];

  use(middleware: Middleware<T>): void {
    this.globalMiddlewares.push(middleware);
  }

  private addRoute(method: Method | "*", path: string, ...args: any[]): void {
    const middlewares = args.slice(0, -1) as Middleware<T>[];
    const handler = args[args.length - 1] as RouteHandler<T>;

    // Convert path to regex and extract param names
    const paramNames: string[] = [];
    const pattern = new RegExp(
      "^" +
        path
          .replace(/:[^/]+/g, (match) => {
            paramNames.push(match.slice(1));
            return "([^/]+)";
          })
          .replace(/\*/g, ".*") +
        "$"
    );

    this.routes.push({ method, pattern, paramNames, handler, middlewares });
  }

  get(path: string, ...args: any[]): void {
    this.addRoute("GET", path, ...args);
  }

  post(path: string, ...args: any[]): void {
    this.addRoute("POST", path, ...args);
  }

  put(path: string, ...args: any[]): void {
    this.addRoute("PUT", path, ...args);
  }

  delete(path: string, ...args: any[]): void {
    this.addRoute("DELETE", path, ...args);
  }

  all(path: string, ...args: any[]): void {
    this.addRoute("*", path, ...args);
  }

  async handle(request: Request, env: T, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method as Method;

    // Find matching route
    for (const route of this.routes) {
      if (route.method !== "*" && route.method !== method) continue;

      const match = url.pathname.match(route.pattern);
      if (!match) continue;

      // Extract params
      const params: Record<string, string> = {};
      for (let i = 0; i < route.paramNames.length; i++) {
        params[route.paramNames[i]] = match[i + 1];
      }

      // Build middleware chain
      const allMiddlewares = [...this.globalMiddlewares, ...route.middlewares];

      // Execute middleware chain
      let index = 0;
      const next = async (): Promise<Response> => {
        if (index < allMiddlewares.length) {
          const middleware = allMiddlewares[index++];
          return await middleware(request, env, ctx, next);
        } else {
          return await route.handler(request, env, ctx, params);
        }
      };

      return await next();
    }

    return new Response("Not Found", { status: 404 });
  }
}
