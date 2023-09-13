import calc from "./functions/calc.js";
import { log, logClean } from "./demo/script.js";

export class compiler {
  constructor() {
    this.initialize();
  }

  initialize() {
    this.variables = {};
    this.lines = [];
    this.temp = "null";
    this.space = " ";
    this.sections = {};
    this.argument = "";
    console.clear();
  }

  getInput(input) {
    this.lines = input.split("\n");
    //Just put a line before that to match the line number (I don't want to start from 0)
    this.lines.unshift("");
  }

  compile(input, argument) {
    this.initialize();
    this.getInput(input);
    this.getSections(input);
    this.argument = argument;

    for (let i = 1; i < this.lines.length; i++) {
      //Checks for comments
      const newLine = this.lines[i].replace(/^\s+/, "");
      if (newLine.startsWith("//")) continue;

      //lines to words
      const oldContent = newLine.split(" ");
      let content = [];

      //checks for variables
      content = oldContent.map((item) => {
        if (item.startsWith("$")) {
          if (item === "$temp") {
            return this.temp;
          }
          if (item === "$space") {
            return this.space;
          }
          if (item === "$argument") {
            return this.argument;
          }
          const variableValue = this.getVariableValue(item);
          return variableValue;
        } else {
          return item;
        }
      });

      //break if you bump into a section
      if (content[0] === "section") {
        break;
      }

      //function container object
      const functions = {
        add: () => {
          content = content.filter((n) => n !== undefined && n !== "");
          this.runFunction(calc, i, content[1], content[2], "+");
        },
        sub: () => {
          content = content.filter((n) => n !== undefined && n !== "");
          this.runFunction(calc, i, content[1], content[2], "-");
        },
        mul: () => {
          content = content.filter((n) => n !== undefined && n !== "");
          this.runFunction(calc, i, content[1], content[2], "*");
        },
        div: () => {
          content = content.filter((n) => n !== undefined && n !== "");
          this.runFunction(calc, i, content[1], content[2], "/");
        },
        mod: () => {
          content = content.filter((n) => n !== undefined && n !== "");
          this.runFunction(calc, i, content[1], content[2], "%");
        },
        var: () => {
          content = content.filter((n) => n !== undefined && n !== "");
          const varName = content[1];
          content.shift();
          content.shift();

          this.runFunction(this.setVariable, varName, i, ...content);
        },
        jump: () => {
          content = content.filter((n) => n !== undefined && n !== "");
          const result = this.jump(content[1], i);
          if (result) {
            i = result;
          }
        },
        jump_gt: () => {
          content = content.filter((n) => n !== undefined && n !== "");
          const left = ifNaNReturnLength(content[2]);
          const right = ifNaNReturnLength(content[3]);

          this.runFunction(this.operation, left, right, ">");

          if (this.temp === 1) {
            const result = this.jump(content[1], i);
            if (result) {
              i = result;
            }
          }
        },
        jump_lt: () => {
          content = content.filter((n) => n !== undefined && n !== "");
          const left = ifNaNReturnLength(content[2]);
          const right = ifNaNReturnLength(content[3]);

          this.runFunction(this.operation, left, right, "<");

          if (this.temp === 1) {
            const result = this.jump(content[1], i);
            if (result) {
              i = result;
            }
          }
        },
        jump_ge: () => {
          content = content.filter((n) => n !== undefined && n !== "");
          const left = ifNaNReturnLength(content[2]);
          const right = ifNaNReturnLength(content[3]);

          this.runFunction(this.operation, left, right, ">=");

          if (this.temp === 1) {
            const result = this.jump(content[1], i);
            if (result) {
              i = result;
            }
          }
        },
        jump_le: () => {
          content = content.filter((n) => n !== undefined && n !== "");
          const left = ifNaNReturnLength(content[2]);
          const right = ifNaNReturnLength(content[3]);

          this.runFunction(this.operation, left, right, "<=");

          if (this.temp === 1) {
            const result = this.jump(content[1], i);
            if (result) {
              i = result;
            }
          }
        },
        jump_e: () => {
          content = content.filter((n) => n !== undefined && n !== "");
          let left;
          let right;
          if (isNaN(content[2])) {
            left = content[2];
          } else {
            if (content[2] === this.space) {
              left = this.space;
            } else {
              left = JSON.parse(content[2]);
            }
          }
          if (isNaN(content[3])) {
            right = content[3];
          } else {
            if (content[3] === this.space) {
              right = this.space;
            } else {
              right = JSON.parse(content[3]);
            }
          }

          this.runFunction(this.operation, left, right, "=");

          if (this.temp === 1) {
            const result = this.jump(content[1], i);
            if (result) {
              i = result;
            }
          }
        },
        log: () => {
          content.shift();
          this.runFunction(log, "", i, content.join(" "));
        },
        remove: () => {
          content = content.filter((n) => n !== undefined && n !== "");
          if (content[1] in this.variables) {
            delete this.variables[content[1]];
          } else {
            this.logError(i, `There is no variable called: ${content[1]}`);
          }
        },
        concat: () => {
          content = content.filter((n) => n !== undefined && n !== "");
          this.runFunction(this.concat, i, content[1], content[2]);
        },
        length: () => {
          content = content.filter((n) => n !== undefined && n !== "");
          this.runFunction(length, i, content[1]);
        },
        char: () => {
          content = content.filter((n) => n !== undefined && n !== "");
          this.runFunction(char, i, content[1], content[2]);
        },
        logClean: logClean,
      };

      //if there is a function run it, otherwise drop an error
      if (content[0] && functions[content[0]]) {
        functions[content[0]]();
      } else {
        if (content[0] !== undefined && content[0] !== "") {
          this.logError(i, `Wrong command: ${content[0]}`);
        }
      }
    }
  }

  concat(line, input1, input2) {
    if (input1 === "" || input1 === undefined) {
      return getErrorMessage(line, `Wrong argument: ${input1}`);
    }
    if (input2 === "" || input2 === undefined) {
      return getErrorMessage(line, `Wrong argument: ${input2}`);
    }

    return input1 + input2;
  }

  runFunction(func, ...args) {
    //runs the function
    const result = func.bind(this)(...args);

    //checks for errors
    if (typeof result === "object" && "type" in result) {
      if (result.type === "ERROR") {
        this.logError(result.line, result.message);
      }
    }

    //if it has results, save it in the temp
    if (result !== undefined && typeof result !== "object") {
      this.temp = result;
    }
  }

  getSections(input) {
    const lines = input.split("\n");

    for (let i = 0; i < lines.length; i++) {
      let words = lines[i].split(" ");
      words = words.filter((n) => n !== undefined && n !== "");

      //check if the line starts with "section"
      if (words[0] === "section") {
        //save it like this (name: line_number): main: 4
        this.sections[words[1]] = i + 1;
      }
    }
  }

  getVariableValue(input) {
    //remove $ sign
    const newInput = input.split("");
    newInput.shift();
    const varName = newInput.join("");

    if (varName in this.variables) {
      return this.variables[varName];
    } else {
      return "UNDEFINED";
    }
  }

  setVariable(name, line, ...value) {
    if (value.length === 0 || value === undefined) {
      return getErrorMessage(line, "Not enough arguments");
    }
    if (name === "temp") {
      return getErrorMessage(line, 'The variable name cannot be "temp"');
    }
    if (name === "space") {
      return getErrorMessage(line, 'The variable name cannot be "space"');
    }
    if (name === "argument") {
      return getErrorMessage(line, 'The variable name cannot be "argument"');
    }

    let newValue = null;

    //if a value is not a number, then check if it's an array (array of words = string)
    //otherwise just parse it to a number
    //if it starts with 0, then it's a string
    if (
      isNaN(value) ||
      value[0].toString().startsWith("0") ||
      value[0] === this.space
    ) {
      newValue = value.join(" ");
    } else {
      newValue = JSON.parse(value.toString().replace(/^0+/, ""));
    }
    //save it
    this.variables[name] = newValue;
  }

  jump(name, line) {
    //if the section exists return the line number
    if (name in this.sections) {
      return this.sections[name];
    } else {
      this.logError(line, `There is no section called: '${name}'`);
      return;
    }
  }

  operation(value1, value2, operator) {
    switch (operator) {
      case "<":
        return value1 < value2 ? 1 : 0;
      case "<=":
        return value1 <= value2 ? 1 : 0;
      case ">":
        return value1 > value2 ? 1 : 0;
      case ">=":
        return value1 >= value2 ? 1 : 0;
      case "=":
        return value1 === value2 ? 1 : 0;
    }
  }

  logError(line, message) {
    this.log(`ERROR: Line: ${line}: ${message}`, "error", log, line);
  }

  log(message, type, f, line) {
    if (f) {
      f(type, line, message);
    } else {
      console.error(message);
    }
  }
}

const length = (i, input) => {
  if (input === "" || input === undefined)
    return getErrorMessage(i, "No argument has been added");
  return input.toString().length;
};

const char = (i, input, index) => {
  if (input === undefined || input === "") {
    return getErrorMessage(i, "You haven't provided an input");
  }
  if (isNaN(index) || index === "") {
    return getErrorMessage(i, "You haven't provided an index");
  }

  const arr = input.split("");

  if (arr.length <= index) {
    return getErrorMessage(
      i,
      `The index is bigger than the length of ${input}`
    );
  }
  return arr[index];
};

export const getErrorMessage = (line, message) => {
  return {
    type: "ERROR",
    message,
    line,
  };
};

const ifNaNReturnLength = (input) => {
  return isNaN(input) ? input.length : JSON.parse(input);
};
