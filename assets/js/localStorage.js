export function saveUserSelection(module, grade) {
  localStorage.setItem("module", module);
  localStorage.setItem("grade", grade);
}

export function loadUserSelection() {
  return {
    module: localStorage.getItem("module"),
    grade: localStorage.getItem("grade")
  };
}