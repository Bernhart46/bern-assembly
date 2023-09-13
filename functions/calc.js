import { getErrorMessage } from "../bern-assembly.js";

export default function calc(line, num1, num2, operator) {
  if (!num1 || !num2) getErrorMessage(line, "Not enough arguments");

  if (isNaN(num1)) {
    return getErrorMessage(line, `Wrong argument '${num1}'`);
  }
  if (isNaN(num2)) {
    return getErrorMessage(line, `Wrong argument '${num2}'`);
  }

  const n1 = JSON.parse(num1);
  const n2 = JSON.parse(num2);
  switch (operator) {
    case "+":
      return n1 + n2;
    case "-":
      return n1 - n2;
    case "*":
      return n1 * n2;
    case "/":
      return n1 / n2;
    case "%":
      return n1 % n2;
  }
}
