import { evaluate, validateExpression } from "../expression-engine";

describe("ExpressionEngine", () => {
  describe("evaluate", () => {
    describe("literals", () => {
      it("should evaluate numbers", () => {
        expect(evaluate("42")).toBe(42);
        expect(evaluate("3.14")).toBe(3.14);
        expect(evaluate("0")).toBe(0);
        expect(evaluate("-5")).toBe(-5);
      });

      it("should evaluate strings", () => {
        expect(evaluate('"hello"')).toBe("hello");
        expect(evaluate("'world'")).toBe("world");
        expect(evaluate('""')).toBe("");
      });

      it("should evaluate booleans", () => {
        expect(evaluate("true")).toBe(true);
        expect(evaluate("false")).toBe(false);
      });
    });

    describe("arithmetic operations", () => {
      it("should handle addition", () => {
        expect(evaluate("2 + 3")).toBe(5);
        expect(evaluate("1.5 + 2.5")).toBe(4);
        expect(evaluate('"hello" + " " + "world"')).toBe("hello world");
      });

      it("should handle subtraction", () => {
        expect(evaluate("10 - 4")).toBe(6);
        expect(evaluate("5.5 - 2.5")).toBe(3);
        expect(evaluate("-5 - 3")).toBe(-8);
      });

      it("should handle multiplication", () => {
        expect(evaluate("3 * 4")).toBe(12);
        expect(evaluate("2.5 * 2")).toBe(5);
        expect(evaluate("-3 * 4")).toBe(-12);
      });

      it("should handle division", () => {
        expect(evaluate("10 / 2")).toBe(5);
        expect(evaluate("15 / 3")).toBe(5);
        expect(evaluate("5 / 2")).toBe(2.5);
        expect(evaluate("10 / 0")).toBe(Infinity);
      });

      it("should handle modulo", () => {
        expect(evaluate("10 % 3")).toBe(1);
        expect(evaluate("15 % 4")).toBe(3);
        expect(evaluate("20 % 5")).toBe(0);
      });

      it("should respect operator precedence", () => {
        expect(evaluate("2 + 3 * 4")).toBe(14);
        expect(evaluate("10 - 2 * 3")).toBe(4);
        expect(evaluate("20 / 4 + 3")).toBe(8);
        expect(evaluate("2 * 3 + 4 * 5")).toBe(26);
      });

      it("should handle parentheses", () => {
        expect(evaluate("(2 + 3) * 4")).toBe(20);
        expect(evaluate("10 - (2 * 3)")).toBe(4);
        expect(evaluate("((2 + 3) * 4) / 5")).toBe(4);
      });
    });

    describe("comparison operations", () => {
      it("should handle equality", () => {
        expect(evaluate("5 == 5")).toBe(true);
        expect(evaluate("5 == 6")).toBe(false);
        expect(evaluate('"hello" == "hello"')).toBe(true);
        expect(evaluate("true == true")).toBe(true);
      });

      it("should handle inequality", () => {
        expect(evaluate("5 != 6")).toBe(true);
        expect(evaluate("5 != 5")).toBe(false);
        expect(evaluate('"hello" != "world"')).toBe(true);
      });

      it("should handle less than", () => {
        expect(evaluate("3 < 5")).toBe(true);
        expect(evaluate("5 < 3")).toBe(false);
        expect(evaluate("5 < 5")).toBe(false);
      });

      it("should handle greater than", () => {
        expect(evaluate("5 > 3")).toBe(true);
        expect(evaluate("3 > 5")).toBe(false);
        expect(evaluate("5 > 5")).toBe(false);
      });

      it("should handle less than or equal", () => {
        expect(evaluate("3 <= 5")).toBe(true);
        expect(evaluate("5 <= 5")).toBe(true);
        expect(evaluate("6 <= 5")).toBe(false);
      });

      it("should handle greater than or equal", () => {
        expect(evaluate("5 >= 3")).toBe(true);
        expect(evaluate("5 >= 5")).toBe(true);
        expect(evaluate("3 >= 5")).toBe(false);
      });
    });

    describe("logical operations", () => {
      it("should handle AND", () => {
        expect(evaluate("true && true")).toBe(true);
        expect(evaluate("true && false")).toBe(false);
        expect(evaluate("false && true")).toBe(false);
        expect(evaluate("false && false")).toBe(false);
      });

      it("should handle OR", () => {
        expect(evaluate("true || true")).toBe(true);
        expect(evaluate("true || false")).toBe(true);
        expect(evaluate("false || true")).toBe(true);
        expect(evaluate("false || false")).toBe(false);
      });

      it("should handle NOT", () => {
        expect(evaluate("!true")).toBe(false);
        expect(evaluate("!false")).toBe(true);
        expect(evaluate("!(5 > 3)")).toBe(false);
        expect(evaluate("!!(5 > 3)")).toBe(true);
      });

      it("should handle complex logical expressions", () => {
        expect(evaluate("(5 > 3) && (2 < 4)")).toBe(true);
        expect(evaluate("(5 > 3) || (2 > 4)")).toBe(true);
        expect(evaluate("!(5 > 3) || (2 < 4)")).toBe(true);
      });
    });

    describe("ternary operator", () => {
      it("should handle simple ternary", () => {
        expect(evaluate("true ? 1 : 2")).toBe(1);
        expect(evaluate("false ? 1 : 2")).toBe(2);
        expect(evaluate("5 > 3 ? 'yes' : 'no'")).toBe("yes");
        expect(evaluate("2 > 5 ? 'yes' : 'no'")).toBe("no");
      });

      it("should handle nested ternary", () => {
        expect(evaluate("true ? (false ? 1 : 2) : 3")).toBe(2);
        expect(evaluate("5 > 3 ? (2 > 1 ? 'a' : 'b') : 'c'")).toBe("a");
      });
    });

    describe("variables", () => {
      it("should evaluate simple variables", () => {
        const context = { x: 10, name: "John", active: true };
        expect(evaluate("x", context)).toBe(10);
        expect(evaluate("name", context)).toBe("John");
        expect(evaluate("active", context)).toBe(true);
      });

      it("should evaluate nested variables", () => {
        const context = {
          user: {
            name: "John",
            age: 30,
            address: {
              city: "New York",
            },
          },
        };
        expect(evaluate("user.name", context)).toBe("John");
        expect(evaluate("user.age", context)).toBe(30);
        expect(evaluate("user.address.city", context)).toBe("New York");
      });

      it("should return undefined for missing variables", () => {
        const context = { x: 10 };
        expect(evaluate("y", context)).toBeUndefined();
        expect(evaluate("user.name", context)).toBeUndefined();
      });

      it("should use variables in expressions", () => {
        const context = { x: 10, y: 5 };
        expect(evaluate("x + y", context)).toBe(15);
        expect(evaluate("x * 2 + y", context)).toBe(25);
        expect(evaluate("x > y", context)).toBe(true);
      });
    });

    describe("functions", () => {
      describe("math functions", () => {
        it("should handle abs", () => {
          expect(evaluate("abs(-5)")).toBe(5);
          expect(evaluate("abs(5)")).toBe(5);
          expect(evaluate("abs(0)")).toBe(0);
        });

        it("should handle round", () => {
          expect(evaluate("round(3.7)")).toBe(4);
          expect(evaluate("round(3.2)")).toBe(3);
          expect(evaluate("round(3.5)")).toBe(4);
        });

        it("should handle floor and ceil", () => {
          expect(evaluate("floor(3.7)")).toBe(3);
          expect(evaluate("ceil(3.2)")).toBe(4);
        });

        it("should handle min and max", () => {
          expect(evaluate("min(5, 3, 7, 1)")).toBe(1);
          expect(evaluate("max(5, 3, 7, 1)")).toBe(7);
        });

        it("should handle sum and avg", () => {
          expect(evaluate("sum(1, 2, 3, 4)")).toBe(10);
          expect(evaluate("avg(2, 4, 6, 8)")).toBe(5);
        });
      });

      describe("string functions", () => {
        it("should handle length", () => {
          expect(evaluate('length("hello")')).toBe(5);
          expect(evaluate('length("")')).toBe(0);
        });

        it("should handle upper and lower", () => {
          expect(evaluate('upper("hello")')).toBe("HELLO");
          expect(evaluate('lower("WORLD")')).toBe("world");
        });

        it("should handle contains", () => {
          expect(evaluate('contains("hello world", "world")')).toBe(true);
          expect(evaluate('contains("hello world", "foo")')).toBe(false);
        });

        it("should handle startsWith and endsWith", () => {
          expect(evaluate('startsWith("hello world", "hello")')).toBe(true);
          expect(evaluate('endsWith("hello world", "world")')).toBe(true);
          expect(evaluate('startsWith("hello world", "world")')).toBe(false);
        });
      });

      describe("logical functions", () => {
        it("should handle if function", () => {
          expect(evaluate("if(true, 1, 2)")).toBe(1);
          expect(evaluate("if(false, 1, 2)")).toBe(2);
          expect(evaluate("if(5 > 3, 'yes', 'no')")).toBe("yes");
        });

        it("should handle and function", () => {
          expect(evaluate("and(true, true, true)")).toBe(true);
          expect(evaluate("and(true, false, true)")).toBe(false);
        });

        it("should handle or function", () => {
          expect(evaluate("or(false, false, true)")).toBe(true);
          expect(evaluate("or(false, false, false)")).toBe(false);
        });

        it("should handle not function", () => {
          expect(evaluate("not(true)")).toBe(false);
          expect(evaluate("not(false)")).toBe(true);
        });
      });

      it("should handle functions with variable arguments", () => {
        const context = { x: 10, y: 5 };
        expect(evaluate("max(x, y)", context)).toBe(10);
        expect(evaluate("sum(x, y, 15)", context)).toBe(30);
        expect(evaluate('if(x > y, "x is greater", "y is greater")', context)).toBe("x is greater");
      });
    });

    describe("complex expressions", () => {
      it("should handle complex mathematical expressions", () => {
        expect(evaluate("2 * (3 + 4) - 5")).toBe(9);
        expect(evaluate("(10 + 5) * 2 / 3")).toBe(10);
        expect(evaluate("abs(-5) + round(3.7) * 2")).toBe(13);
      });

      it("should handle complex logical expressions", () => {
        const context = { age: 25, premium: true };
        expect(evaluate("age >= 18 && age <= 65", context)).toBe(true);
        expect(evaluate("premium || age < 18", context)).toBe(true);
        expect(evaluate("(age > 20 && age < 30) && !premium", context)).toBe(false);
      });

      it("should handle mixed expressions", () => {
        const context = { score: 85, bonus: 10 };
        expect(evaluate("score + bonus > 90 ? 'A' : 'B'", context)).toBe("A");
        expect(evaluate('if(score >= 80, "Pass", "Fail")', context)).toBe("Pass");
        expect(evaluate("round(score * 1.1) + bonus", context)).toBe(104);
      });
    });
  });

  describe("validateExpression", () => {
    it("should validate correct expressions", () => {
      expect(validateExpression("5 + 3")).toEqual({ valid: true });
      expect(validateExpression("x > 10")).toEqual({ valid: true });
      expect(validateExpression('if(true, "yes", "no")')).toEqual({ valid: true });
    });

    it("should catch syntax errors", () => {
      const result1 = validateExpression("5 +");
      expect(result1.valid).toBe(false);
      expect(result1.error).toContain("Unexpected token");

      const result2 = validateExpression("(5 + 3");
      expect(result2.valid).toBe(false);
      expect(result2.error).toContain("Expected ')'");

      const result3 = validateExpression("5 > > 3");
      expect(result3.valid).toBe(false);
      expect(result3.error).toBeTruthy();
    });

    it("should catch invalid characters", () => {
      const result = validateExpression("5 @ 3");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Unexpected character");
    });
  });
});
