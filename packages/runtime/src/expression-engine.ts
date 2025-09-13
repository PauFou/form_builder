/**
 * Expression Engine for evaluating mathematical and logical expressions
 * Supports variables, operators, and functions
 */

interface Context {
  [key: string]: string | number | boolean | Date | Context | undefined;
}

interface Expression {
  type: "literal" | "variable" | "binary" | "unary" | "function" | "conditional";
  value?: string | number | boolean;
  operator?: string;
  left?: Expression;
  right?: Expression;
  condition?: Expression;
  trueExpr?: Expression;
  falseExpr?: Expression;
  name?: string;
  args?: Expression[];
}

// Token types for the lexer
type TokenType =
  | "NUMBER"
  | "STRING"
  | "VARIABLE"
  | "OPERATOR"
  | "LPAREN"
  | "RPAREN"
  | "COMMA"
  | "FUNCTION"
  | "BOOLEAN"
  | "QUESTION"
  | "COLON"
  | "EOF";

interface Token {
  type: TokenType;
  value: string | number | boolean;
  position: number;
}

// Built-in functions
const FUNCTIONS = {
  // Math functions
  abs: Math.abs,
  round: Math.round,
  floor: Math.floor,
  ceil: Math.ceil,
  min: Math.min,
  max: Math.max,
  sum: (...args: number[]) => args.reduce((a, b) => a + b, 0),
  avg: (...args: number[]) => args.reduce((a, b) => a + b, 0) / args.length,

  // String functions
  length: (str: string) => str.length,
  upper: (str: string) => str.toUpperCase(),
  lower: (str: string) => str.toLowerCase(),
  contains: (str: string, search: string) => str.includes(search),
  startsWith: (str: string, search: string) => str.startsWith(search),
  endsWith: (str: string, search: string) => str.endsWith(search),

  // Date functions
  now: () => new Date(),
  year: (date: Date) => date.getFullYear(),
  month: (date: Date) => date.getMonth() + 1,
  day: (date: Date) => date.getDate(),
  daysBetween: (date1: Date, date2: Date) => {
    const diff = Math.abs(date2.getTime() - date1.getTime());
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  },

  // Logical functions
  if: <T>(condition: boolean, trueVal: T, falseVal: T): T => (condition ? trueVal : falseVal),
  and: (...args: boolean[]) => args.every(Boolean),
  or: (...args: boolean[]) => args.some(Boolean),
  not: (val: boolean) => !val,
};

export class ExpressionEngine {
  private expression: string;
  private position: number = 0;
  private tokens: Token[] = [];
  private current: number = 0;

  constructor(expression: string) {
    this.expression = expression;
  }

  /**
   * Evaluate an expression with the given context
   */
  evaluate(context: Context = {}): string | number | boolean | Date | undefined {
    this.position = 0;
    this.current = 0;
    this.tokens = [];
    this.tokenize();
    this.current = 0; // Reset current before parsing
    const ast = this.parse();
    return this.evaluateAST(ast, context);
  }

  /**
   * Tokenize the expression
   */
  private tokenize(): void {
    this.tokens = [];
    this.position = 0;

    while (this.position < this.expression.length) {
      this.skipWhitespace();

      if (this.position >= this.expression.length) {
        break;
      }

      const char = this.expression[this.position];

      // Numbers
      if (/\d/.test(char) || (char === "." && /\d/.test(this.expression[this.position + 1]))) {
        this.tokens.push(this.readNumber());
      }
      // Strings
      else if (char === '"' || char === "'") {
        this.tokens.push(this.readString());
      }
      // Variables or functions
      else if (/[a-zA-Z_]/.test(char)) {
        const identifier = this.readIdentifier();
        if (Object.prototype.hasOwnProperty.call(FUNCTIONS, identifier.value as string)) {
          identifier.type = "FUNCTION";
        }
        this.tokens.push(identifier);
      }
      // Operators
      else if ("+-*/%<>=!&|".includes(char)) {
        this.tokens.push(this.readOperator());
      }
      // Parentheses
      else if (char === "(") {
        this.tokens.push({ type: "LPAREN", value: "(", position: this.position++ });
      } else if (char === ")") {
        this.tokens.push({ type: "RPAREN", value: ")", position: this.position++ });
      }
      // Comma
      else if (char === ",") {
        this.tokens.push({ type: "COMMA", value: ",", position: this.position++ });
      }
      // Ternary operators
      else if (char === "?") {
        this.tokens.push({ type: "QUESTION", value: "?", position: this.position++ });
      } else if (char === ":") {
        this.tokens.push({ type: "COLON", value: ":", position: this.position++ });
      }
      // Unknown character
      else {
        throw new Error(`Unexpected character '${char}' at position ${this.position}`);
      }
    }

    this.tokens.push({ type: "EOF", value: "", position: this.position });
  }

  private skipWhitespace(): void {
    while (this.position < this.expression.length && /\s/.test(this.expression[this.position])) {
      this.position++;
    }
  }

  private readNumber(): Token {
    const start = this.position;
    let hasDecimal = false;

    while (
      this.position < this.expression.length &&
      (/\d/.test(this.expression[this.position]) ||
        (this.expression[this.position] === "." && !hasDecimal))
    ) {
      if (this.expression[this.position] === ".") {
        hasDecimal = true;
      }
      this.position++;
    }

    const value = this.expression.slice(start, this.position);
    return { type: "NUMBER", value: parseFloat(value), position: start };
  }

  private readString(): Token {
    const quote = this.expression[this.position];
    const start = this.position++;
    let value = "";

    while (this.position < this.expression.length && this.expression[this.position] !== quote) {
      if (this.expression[this.position] === "\\") {
        this.position++;
      }
      value += this.expression[this.position++];
    }

    if (this.position >= this.expression.length) {
      throw new Error(`Unterminated string at position ${start}`);
    }

    this.position++; // Skip closing quote
    return { type: "STRING", value, position: start };
  }

  private readIdentifier(): Token {
    const start = this.position;

    while (
      this.position < this.expression.length &&
      /[a-zA-Z0-9_.]/.test(this.expression[this.position])
    ) {
      this.position++;
    }

    const value = this.expression.slice(start, this.position);

    // Check for boolean literals
    if (value === "true" || value === "false") {
      return { type: "BOOLEAN", value: value === "true", position: start };
    }

    return { type: "VARIABLE", value, position: start };
  }

  private readOperator(): Token {
    const start = this.position;
    const char = this.expression[this.position];
    let value = char;
    this.position++;

    // Check for two-character operators
    if (this.position < this.expression.length) {
      const nextChar = this.expression[this.position];
      const twoChar = char + nextChar;
      if (["==", "!=", "<=", ">=", "&&", "||"].includes(twoChar)) {
        value = twoChar;
        this.position++;
      }
    }

    return { type: "OPERATOR", value, position: start };
  }

  /**
   * Parse tokens into an AST
   */
  private parse(): Expression {
    this.current = 0;
    return this.parseExpression();
  }

  private parseExpression(): Expression {
    return this.parseTernary();
  }

  private parseTernary(): Expression {
    const expr = this.parseOr();

    if (this.match("QUESTION")) {
      const trueExpr = this.parseExpression();
      this.consume("COLON", "Expected ':' after true expression");
      const falseExpr = this.parseExpression();
      return {
        type: "conditional",
        condition: expr,
        trueExpr,
        falseExpr,
      };
    }

    return expr;
  }

  private parseOr(): Expression {
    let expr = this.parseAnd();

    while (this.check("OPERATOR") && this.peek().value === "||") {
      this.advance(); // consume the operator
      const operator = this.previous().value as string;
      const right = this.parseAnd();
      expr = { type: "binary", operator, left: expr, right };
    }

    return expr;
  }

  private parseAnd(): Expression {
    let expr = this.parseEquality();

    while (this.check("OPERATOR") && this.peek().value === "&&") {
      this.advance(); // consume the operator
      const operator = this.previous().value as string;
      const right = this.parseEquality();
      expr = { type: "binary", operator, left: expr, right };
    }

    return expr;
  }

  private parseEquality(): Expression {
    let expr = this.parseComparison();

    while (this.check("OPERATOR") && ["==", "!="].includes(this.peek().value as string)) {
      this.advance(); // consume the operator
      const operator = this.previous().value as string;
      const right = this.parseComparison();
      expr = { type: "binary", operator, left: expr, right };
    }

    return expr;
  }

  private parseComparison(): Expression {
    let expr = this.parseAddition();

    while (this.check("OPERATOR") && ["<", ">", "<=", ">="].includes(this.peek().value as string)) {
      this.advance(); // consume the operator
      const operator = this.previous().value as string;
      const right = this.parseAddition();
      expr = { type: "binary", operator, left: expr, right };
    }

    return expr;
  }

  private parseAddition(): Expression {
    let expr = this.parseMultiplication();

    while (this.check("OPERATOR") && ["+", "-"].includes(this.peek().value as string)) {
      this.advance(); // consume the operator
      const operator = this.previous().value as string;
      const right = this.parseMultiplication();
      expr = { type: "binary", operator, left: expr, right };
    }

    return expr;
  }

  private parseMultiplication(): Expression {
    let expr = this.parseUnary();

    while (this.check("OPERATOR") && ["*", "/", "%"].includes(this.peek().value as string)) {
      this.advance(); // consume the operator
      const operator = this.previous().value as string;
      const right = this.parseUnary();
      expr = { type: "binary", operator, left: expr, right };
    }

    return expr;
  }

  private parseUnary(): Expression {
    if (this.check("OPERATOR")) {
      const value = this.peek().value;
      if (value === "-" || value === "!") {
        this.advance();
        const operator = this.previous().value as string;
        const right = this.parseUnary();
        return { type: "unary", operator, right };
      }
    }

    return this.parsePrimary();
  }

  private parsePrimary(): Expression {
    // Numbers
    if (this.match("NUMBER")) {
      return { type: "literal", value: this.previous().value };
    }

    // Strings
    if (this.match("STRING")) {
      return { type: "literal", value: this.previous().value };
    }

    // Booleans
    if (this.match("BOOLEAN")) {
      return { type: "literal", value: this.previous().value };
    }

    // Functions
    if (this.match("FUNCTION")) {
      const name = this.previous().value as string;
      this.consume("LPAREN", `Expected '(' after function '${name}'`);
      const args: Expression[] = [];

      if (!this.check("RPAREN")) {
        do {
          args.push(this.parseExpression());
        } while (this.match("COMMA"));
      }

      this.consume("RPAREN", `Expected ')' after function arguments`);
      return { type: "function", name, args };
    }

    // Variables
    if (this.match("VARIABLE")) {
      return { type: "variable", value: this.previous().value };
    }

    // Grouped expressions
    if (this.match("LPAREN")) {
      const expr = this.parseExpression();
      this.consume("RPAREN", "Expected ')' after expression");
      return expr;
    }

    if (this.isAtEnd()) {
      throw new Error("Unexpected token: EOF");
    }

    throw new Error(`Unexpected token: ${this.peek().value} at position ${this.peek().position}`);
  }

  private match(type: TokenType): boolean {
    if (this.check(type)) {
      this.advance();
      return true;
    }
    return false;
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === "EOF";
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    throw new Error(message);
  }

  /**
   * Evaluate an AST node
   */
  private evaluateAST(
    node: Expression,
    context: Context
  ): string | number | boolean | Date | undefined {
    switch (node.type) {
      case "literal":
        return node.value;

      case "variable": {
        const path = (node.value as string).split(".");
        let value: string | number | boolean | Date | Context | undefined = context;
        for (const key of path) {
          if (value && typeof value === "object" && !(value instanceof Date) && key in value) {
            value = (value as Context)[key];
          } else {
            return undefined;
          }
        }
        return value as string | number | boolean | Date | undefined;
      }

      case "binary": {
        if (!node.left || !node.right) {
          throw new Error("Binary expression missing operands");
        }
        const left = this.evaluateAST(node.left, context);
        const right = this.evaluateAST(node.right, context);

        switch (node.operator) {
          case "+":
            return (left as any) + (right as any);
          case "-":
            return (left as any) - (right as any);
          case "*":
            return (left as any) * (right as any);
          case "/":
            return (left as any) / (right as any);
          case "%":
            return (left as any) % (right as any);
          case "<":
            return (left as any) < (right as any);
          case ">":
            return (left as any) > (right as any);
          case "<=":
            return (left as any) <= (right as any);
          case ">=":
            return (left as any) >= (right as any);
          case "==":
            return left == right;
          case "!=":
            return left != right;
          case "&&":
            return left && right;
          case "||":
            return left || right;
          default:
            throw new Error(`Unknown operator: ${node.operator}`);
        }
      }

      case "unary": {
        if (!node.right) {
          throw new Error("Unary expression missing operand");
        }
        const operand = this.evaluateAST(node.right, context);
        switch (node.operator) {
          case "-":
            return -(operand as any);
          case "!":
            return !operand;
          default:
            throw new Error(`Unknown unary operator: ${node.operator}`);
        }
      }

      case "function": {
        if (!node.name || !node.args) {
          throw new Error("Function expression missing name or arguments");
        }
        const func = FUNCTIONS[node.name as keyof typeof FUNCTIONS];
        if (!func) {
          throw new Error(`Unknown function: ${node.name}`);
        }
        const args = node.args.map((arg) => this.evaluateAST(arg, context));
        return (func as (...args: any[]) => any)(...args) as
          | string
          | number
          | boolean
          | Date
          | undefined;
      }

      case "conditional": {
        if (!node.condition || !node.trueExpr || !node.falseExpr) {
          throw new Error("Conditional expression missing required parts");
        }
        const condition = this.evaluateAST(node.condition, context);
        return condition
          ? this.evaluateAST(node.trueExpr, context)
          : this.evaluateAST(node.falseExpr, context);
      }

      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
  }
}

/**
 * Helper function to evaluate an expression
 */
export function evaluate(
  expression: string,
  context: Context = {}
): string | number | boolean | Date | undefined {
  const engine = new ExpressionEngine(expression);
  return engine.evaluate(context);
}

/**
 * Helper function to validate an expression
 */
export function validateExpression(expression: string): { valid: boolean; error?: string } {
  try {
    const engine = new ExpressionEngine(expression);
    // Use a dummy context to validate
    engine.evaluate({});
    return { valid: true };
  } catch (error) {
    return { valid: false, error: (error as Error).message };
  }
}
