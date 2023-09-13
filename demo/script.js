import { compiler, getErrorMessage } from "../bern-assembly.js";
const textarea = document.querySelector("textarea");
const output = document.querySelector(".output");
const lineNumbers = document.querySelector(".line-numbers");

const C = new compiler();
addLine(textarea);

textarea.addEventListener("keydown", (e) => {
  const isCtrlPressed = e.ctrlKey || e.metaKey;

  const isSPressed = e.key === "s";

  if (isCtrlPressed && isSPressed) {
    e.preventDefault();
    logClean();
    C.compile(textarea.value, "int num = 5;");
    console.log("Variables: ", C.variables);
    console.log("Sections: ", C.sections);
  }

  if (e.key === "Tab") {
    e.preventDefault();

    const cursorPosition = e.target.selectionStart;

    const currentValue = e.target.value;
    const newValue =
      currentValue.substring(0, cursorPosition) +
      "  " +
      currentValue.substring(cursorPosition);

    e.target.value = newValue;

    e.target.selectionStart = e.target.selectionEnd = cursorPosition + 2;
  }

  addLine(e.target);
});

textarea.addEventListener("keyup", (e) => {
  addLine(e.target);
});

function addLine(target) {
  const numberOfLines = target.value.split("\n").length;

  lineNumbers.innerHTML = Array(numberOfLines).fill("<span></span>").join("");
}

export function log(type, line, message) {
  if (message.length === 0) {
    return getErrorMessage(line, "Not enough arguments");
  }

  if (type === "error") {
    output.innerHTML += `<span class="red">${message}</span><br />`;
  } else {
    output.innerHTML += `<span>${message}</span><br />`;
  }
}

export function logClean() {
  output.innerText = "";
}
