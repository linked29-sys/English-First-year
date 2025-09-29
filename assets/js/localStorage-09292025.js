export function saveUserSelection(module, grade) {
  try {
    localStorage.setItem("module", module);
    localStorage.setItem("grade", JSON.stringify(grade));
  } catch (error) {
    console.error("Error saving to localStorage:", error);
  }
}

export function loadUserSelection() {
  const module = localStorage.getItem("module");
  const gradeData = localStorage.getItem("grade");

  let grade = null;

  if (gradeData) {
    try {
      grade = JSON.parse(gradeData);
    } catch (error) {
      console.error("Error parsing grade. It will be removed from localStorage:", error);
      localStorage.removeItem("grade");
    }
  } else {
    console.warn("No grade found in localStorage");
  }
  return { module, grade };
}

// ------------------- SAVE -------------------
export function savePhoneticVid(phoneticVid) {
  try {
    localStorage.setItem("phonetic", JSON.stringify(phoneticVid));
  } catch (error) {
    console.error("Error saving phonetic video:", error);
  }
}

export function saveMaterialVid(materialVid) {
  try {
    localStorage.setItem("material", JSON.stringify(materialVid));
  } catch (error) {
    console.error("Error saving material video:", error);
  }
}

// ------------------- LOAD -------------------
export function loadPhoneticVid() {
  const phoneticVid = localStorage.getItem("phonetic");
  if (!phoneticVid) {
    console.warn("No selected phonetic video found in localStorage");
    return null;
  }

  try {
    return JSON.parse(phoneticVid);
  } catch (error) {
    console.error("Error parsing phonetic video. It will be removed from localStorage:", error);
    localStorage.removeItem("phonetic");
    return null;
  }
}

export function loadMaterialVid() {
  const materialVid = localStorage.getItem("material");
  if (!materialVid) {
    console.warn("No selected material video found in localStorage");
    return null;
  }

  try {
    return JSON.parse(materialVid);
  } catch (error) {
    console.error("Error parsing material video. It will be removed from localStorage:", error);
    localStorage.removeItem("material");
    return null;
  }
}

