

let modules = [];

//Function to get all modules
const getModules = () => {
    modules = document.querySelectorAll(".module");
};

//Function to set navigation for modules
const setModuleNavigation = () => {
    getModules();
    modules.forEach((module) => {
        module.addEventListener("click", (e) => {
            showGrades(e);
        });
    })
};


const gradesSection = document.getElementById("choose-grade");

let selectedModuleName = "";

//Function to show module's grades

const showGrades = (e) => {
    e.preventDefault();
    selectedModuleName = e.currentTarget.getAttribute("id").split("-")[1];
    hideModules();
    gradesSection.style.display = "block";
    setGradesList(selectedModuleName);
};

const moduleSection = document.getElementById("choose-module");

//Function to hide modules
const hideModules = () => {
    moduleSection.style.display = "none";
};

const gradesList = document.getElementById("grades-list");

//Function to charge grade's list with available grades

const setGradesList = async () => {
    const grades = await getGrades();
    grades.forEach((grade) => {
        const gradeItem = document.createElement("li");
        gradeItem.classList.add("p-3");
        gradeItem.setAttribute("id", `grade-${grade.id.toLowerCase()}`);
        const gradeName = grade.title;
        gradeItem.innerHTML = `
            <div class="grade bg-white p-3 rounded-3">
                    <div class="back rounded-3"></div>
                <div class="title-grade gap-2 mt-2 mb-2 d-flex align-items-center">
                    <span class="rounded-3 text-white p-2 fs-4">${grade.logo}</span>
                    <h4>${grade.title}</h4>
                </div>
                <p>Lorem, ipsum dolor sit amet consectetur adipisicing elit. Repudiandae dicta qui quibusdam modi voluptate iste, amet facere. Illo consectetur quis excepturi, consequuntur deleniti obcaecati error? Odio repellat quae tempora quo.</p>
                <div class="grade-details d-flex flex-row gap-2 border-top">
                    <span>${grade.classes.length}</span>
                    <p>Available classes</p>
                </div>
            </div>
        `;
        gradesList.appendChild(gradeItem);
        setGradeNavigation(gradeItem);
    });
};

//Function to show available grades
const getGrades = async () => {
    try{
        const response = await fetch("./data/" + selectedModuleName + ".json"); 
        if (!response.ok) {
            throw new Error("Error while fetching the grades of " + selectedModuleName + ": " + response.statusText);
        }
        const data = await response.json();
        return data
    }
    catch (error) {
        console.error({error: error.message});
    }
};

//Function to set navigation for grades
const setGradeNavigation = (gradeItem) => {
    gradeItem.addEventListener("click", (e) => {
        showClasses(e);
    });
}

selectedGrade = "";

const classesSection = document.getElementById("choose-class");

//Function to show classes of a selected grade
const showClasses = (e) => {
    e.preventDefault();
    selectedGrade = e.currentTarget.getAttribute("id").split("-")[1];
    setClassesList();
    classesSection.style.display = "block";
    hideGrades();
}

const classesList = document.getElementById("classes-list");

//Function to charge Classes' list with available classes
const setClassesList = async () => {
    const classes = await getClasses();
    if (classes.length == 0) {
        const classItem = document.createElement("p");
        classItem.innerHTML = "There is no available classes. Try again later."
        classesList.appendChild(classItem)
    } 
    classes.forEach((aClass) => {
        const classItem = document.createElement("li");
        classItem.classList.add("class", "d-flex", "align-items-center", "rounded-3", "p-3");
        classItem.setAttribute("id", `class-${aClass.id.toLowerCase()}`);
        const className = aClass.title;
        classItem.innerHTML = `
            <a href="./${selectedModuleName}/${selectedGrade}/${aClass.file}">
                <div class="info-class d-flex flex-row gap-3 p-3 rounded-3 bg-white">
                    <i class="fi ${typeOfClassIcon(aClass.typeOfClass)}"></i>
                    <div class="d-flex gap-2 flex-column">
                        <h4 class="fs-5 m-0">${aClass.title}</h3>
                        <p class="text-black m-0">${aClass.description}</p>
                    </div>
                </div>
            </a>
        `;
        classesList.appendChild(classItem);
    });
};

//Function to get the class icon with the class type.
const typeOfClassIcon = (typeOfClass) => {
    switch (typeOfClass) {
  case "grammar":
    return "fi-rr-text-check";
  case "time":
    return "fi-rr-clock";
  case "vocabulary":
    return "fi-rr-dictionary-alt";
  default:
    //Declaraciones ejecutadas cuando ninguno de los valores coincide con el valor de la expresión
    return fi-rr-english;
}
}

//Function to get classes of a selected grade
const getClasses = async () => {
    let grades = await getGrades();
    grades = grades.filter((grade) => grade.id == selectedGrade);
    const classes = grades[0].classes;
    return classes;
}


//Function to hide grades
const hideGrades = () => {
    gradesList.innerHTML = "";
    gradesSection.style.display = "none";
}

//Initial state
hideGrades();

//Function to show modules again
const showModules = () => {
    moduleSection.style.display = "block";
    hideGrades();
};

//Function to go back to grades    
const backToGrades = (e) => {
    e.preventDefault();
    gradesSection.style.display = "block";
    setGradesList(selectedModuleName);
    hideClasses();
}

//Function to hide classes
const hideClasses = () => { 
    classesList.innerHTML = "";
    classesSection.style.display = "none";
}

//Initial state
hideClasses();

setModuleNavigation();

