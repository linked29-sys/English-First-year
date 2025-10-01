import {backendUrl} from "./config-10012025.js";
let jsonToInterpret = null;
const container = document.getElementById("lesson-container");

//Function to get the json to interpret
export const setJsonToInterpret = async (idLesson) => {
    try {
        const response = await fetch(backendUrl()+"lesson/" + idLesson);
        if (!response.ok) {
            throw new Error("Error while fetching the class with id " + idLesson + ": " + response.statusText);
        }
        const data = response.json();
        jsonToInterpret = await data;
    }
    catch (error) {
        console.error({error: error.message});
    }
};

const jsonModules = () => {
    return jsonToInterpret.modules;
};

export const injectJsonContentToLessonContainer = async (lessonId) => {
    await setJsonToInterpret(lessonId)
    showContainer();
    container.innerHTML = htmlContent();
};

const showContainer = () => {
    container.classList.add("d-block");
    container.classList.remove("d-none");
}

const htmlContent = () => {
    return `
        ${LessonInfo()}
        ${lessonContent()}
        <div class="position-fixed bottom-0 end-0 d-flex gap-3 me-3 mb-3">
            <div class="button-primary p-2 d-none" id="to-top">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="bi bi-arrow-up-short" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M8 12a.5.5 0 0 0 .5-.5V5.707l2.146 2.147a.5.5 0 0 0 .708-.708l-3-3a.5.5 0 0 0-.708 0l-3 3a.5.5 0 1 0 .708.708L7.5 5.707V11.5a.5.5 0 0 0 .5.5"/>
                </svg>
            </div>
            <div class="button-primary p-2" id="to-home">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="bi bi-house-fill" viewBox="0 0 16 16">
                    <path d="M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.708L8 2.207l6.646 6.647a.5.5 0 0 0 .708-.708L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293z"/>
                    <path d="m8 3.293 6 6V13.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 13.5V9.293z"/>
                </svg>
            </div>
        </div>
    `;
}

const LessonInfo = () => {
    return `
        <div class="container-fluid p-4 m-0 lesson-info mb-4">
            <h1  class="mb-4">${jsonToInterpret.title}</h1>
            <p class="mb-4">${jsonToInterpret.description}</p>
        </div>
    `;
}

const lessonContent = () => {
    return ` 
        <div class="bg-white container rounded-3 p-5 d-flex flex-column gap-5">
            ${jsonModules().map((module, index) => moduleContent(module, index + 1)).join('')}
            <button class="btn btn-primary mt-4" onclick="validateExercises()">Check Answers</button>
        </div>
    `;
}

const moduleContent = (module, index) => {
    return `
        <div class="border-start border-5 p-3 lesson-module">
            <div class="p-2">
                <h2 class="mb-3">${"Module " + index + ": " + module.title}</h2>
                <p class="mb-5">${module.description}</p>
                ${theoryContent(module.theory)}
                ${exercisesContent(module.exercises, index)}
            </div>
        </div>
    `;
};

const theoryContent = (theory) => {
    if (!theory || theory.length === 0) return '';

    return `
        <div class="lesson-theory mt-5 mb-5">
            <h3>Theory</h3>
            ${theory.map((section) => theorySectionContent(section)).join('')}
        </div>
    `;
}

const theorySectionContent = (section) => {
    let content = '';
    if (section.type === 'paragraph') {
        content = `<p>${section.content}</p>`;
    }
    else if (section.type === 'image') {
        content = `<img src="${section.content}" alt="Image" class="img-fluid my-3">`;
    }
    else if (section.type === 'list') {
        //to add <p>${section.content}</p>
        content = `
            <ul></ul>
                ${section.items.map(item => `<li>${item}</li>`).join('')}
            </ul>
        `;
    }
    else if (section.type === 'example') {
        content = `
            <div class="example p-3 my-3 rounded-3 mt-5 mb-3">
                <strong>${section.caption}</strong>
                <p class="mt-3">${section.content}</p>
            </div>
            `;
    }
    else if (section.type === 'tip') {
        content = `
            <div class="my-3 d-flex flex-row align-items-center gap-2">
                <i class="text-black fs-5 fi fi-rr-lightbulb-on"></i>
                <p class="mt-3">${section.content}</p>
            </div>
            `;
    }
    else if (section.type === 'table'){
        content = `
            <div class="table-responsive p-2 justify-content-center">
                <p>${section.caption}</p>
                <table class="table table-striped table-hover">
                    <thead>
                        <tr>
                            ${section.headers.map(header => `<th>${header}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${section.rows.map(row => `
                            <tr>
                                ${row.map(cell => `<td>${cell}</td>`).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
    return content;
}

const exercisesContent = (exercises, moduleIndex) => {
    if (!exercises || exercises.length === 0) return '';
    return `
        <div class="lesson-exercise">
            <h3>Exercises</h3>
            <div class="d-flex flex-column gap-5">
                ${exercises.map((section, exerciseIndex) => exerciseSectionContent(section, moduleIndex, exerciseIndex)).join('')}
            </div>
        </div>
    `;
};

const exerciseSectionContent = (section, moduleIndex, exerciseIndex) => {
    let content = "";

    const sectionHeader = `
        <div class="exercise-header">
            <h5 class="fw-bold">${section.instructions}</h5>
        </div>
    `;

    if (section.type === "fill-in") {
        content = `
            <div class="exercise-section">
                ${sectionHeader}
                ${section.cases.map((cases, caseIndex) => `
                    <div class="mb-3">
                        <label for="fill-in-${moduleIndex}-${exerciseIndex}-${caseIndex}" class="form-label fw-semibold">
                            ${caseIndex + 1}. ${cases.question}
                        </label>
                        <input type="text" id="fill-in-${moduleIndex}-${exerciseIndex}-${caseIndex}" class="form-control" placeholder="Your answer here">
                    </div>
                `).join('')}
            </div>
        `;
    } else if (section.type === "multiple-choice") {
        content = `
            <div class="exercise-section">
                ${sectionHeader}
                ${section.cases.map((cases, caseIndex) => `
                    <div class="mb-4">
                        <p class="fw-semibold">${caseIndex + 1}. ${cases.question}</p>
                        ${cases.options.map((option, optIndex) => `
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="mc-${moduleIndex}-${exerciseIndex}-${caseIndex}" id="mc-${moduleIndex}-${exerciseIndex}-${caseIndex}-option-${optIndex}">
                                <label class="form-check-label" for="mc-${moduleIndex}-${exerciseIndex}-${caseIndex}-option-${optIndex}">
                                    ${option}
                                </label>
                            </div>
                        `).join('')}
                    </div>
                `).join('')}
            </div>
        `;
    } else if (section.type === "true-false") {
        content = `
            <div class="exercise-section">
                ${sectionHeader}
                ${section.cases.map((cases, caseIndex) => `
                    <div class="mb-4">
                        <p class="fw-semibold">${caseIndex + 1}. ${cases.statement}</p>
                        <div class="form-check">
                            <input class="form-check-input" type="radio" name="tf-${moduleIndex}-${exerciseIndex}-${caseIndex}" id="tf-${moduleIndex}-${exerciseIndex}-${caseIndex}-true">
                            <label class="form-check-label" for="tf-${moduleIndex}-${exerciseIndex}-${caseIndex}-true">True</label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="radio" name="tf-${moduleIndex}-${exerciseIndex}-${caseIndex}" id="tf-${moduleIndex}-${exerciseIndex}-${caseIndex}-false">
                            <label class="form-check-label" for="tf-${moduleIndex}-${exerciseIndex}-${caseIndex}-false">False</label>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    } else if (section.type === "matching") {
        const allPairs = section.cases[0].pairs;
        const rightOptions = allPairs.map(pair => pair.right);

        const shuffledOptions = rightOptions
            .map(value => ({ value, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .map(({ value }) => value);

        content = `
            <div class="exercise-section">
                ${sectionHeader}
                <div class="matching-exercise d-flex flex-column gap-4">
                    ${allPairs.map((pair, pairIndex) => `
                        <div class="d-flex flex-column flex-md-row align-items-start align-items-md-center gap-3">
                            <label class="fw-semibold">${pairIndex + 1}. ${pair.left}</label>
                            <select class="form-select w-auto" id="match-${moduleIndex}-${exerciseIndex}-${pairIndex}">
                                <option disabled selected value="">Select match</option>
                                ${shuffledOptions.map(option => `
                                    <option value="${option}">${option}</option>
                                `).join('')}
                            </select>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    return content;
};

window.validateExercises = () => {
    document.querySelectorAll('input, select').forEach(el => {
        el.classList.remove("is-valid", "is-invalid");
    });

    const modules = jsonModules();

    modules.forEach((module, moduleIndex) => {
        module.exercises.forEach((exercise, exIndex) => {
            const type = exercise.type;
            const cases = exercise.cases;

            if (type === "fill-in") {
                cases.forEach((item, caseIndex) => {
                    const id = `fill-in-${moduleIndex + 1}-${exIndex}-${caseIndex}`;
                    const input = document.getElementById(id);
                    if (!input) return;

                    const normalize = (str) => str.trim().toLowerCase().replace(/[’‘´`]/g, "'").replace(/\s+/g, " ");
                    const userAnswer = normalize(input.value);
                    const correctAnswer = normalize(item.answer);

                    input.classList.remove("is-valid", "is-invalid");
                    input.classList.add(userAnswer === correctAnswer ? "is-valid" : "is-invalid");
                });
            }

            else if (type === "multiple-choice") {
    cases.forEach((item, caseIndex) => {
        const name = `mc-${moduleIndex + 1}-${exIndex}-${caseIndex}`;
        const options = document.getElementsByName(name);

        let hasSelected = false;
        options.forEach((opt) => {
            if (opt.checked) hasSelected = true;
        });

        options.forEach((opt, optIndex) => {
            const optionText = item.options[optIndex];
            const isCorrect = optionText === item.answer;
            const isSelected = opt.checked;

            // Reset classes first
            opt.classList.remove("is-valid", "is-invalid");

            if (!hasSelected) {
                // No option selected – mark all as invalid (or apply red border to group)
                opt.classList.add("is-invalid");
            } else if (isSelected && isCorrect) {
                opt.classList.add("is-valid");
            } else if (isSelected && !isCorrect) {
                opt.classList.add("is-invalid");
            }
        });
    });
}

            else if (type === "true-false") {
    cases.forEach((item, caseIndex) => {
        const trueRadio = document.getElementById(`tf-${moduleIndex + 1}-${exIndex}-${caseIndex}-true`);
        const falseRadio = document.getElementById(`tf-${moduleIndex + 1}-${exIndex}-${caseIndex}-false`);

        const userSelected = trueRadio.checked ? true : falseRadio.checked ? false : null;
        
        [trueRadio, falseRadio].forEach(input => input.classList.remove("is-valid", "is-invalid"));

        if (userSelected === null) {
            trueRadio.classList.add("is-invalid");
            falseRadio.classList.add("is-invalid");
        } else if (userSelected === item.answer) {
            const selectedInput = userSelected ? trueRadio : falseRadio;
            selectedInput.classList.add("is-valid");
        } else {
            const selectedInput = userSelected ? trueRadio : falseRadio;
            selectedInput.classList.add("is-invalid");
        }
    });
}

            else if (type === "matching") {
                const pairs = exercise.cases[0].pairs;
                pairs.forEach((pair, pairIndex) => {
                    const select = document.getElementById(`match-${moduleIndex + 1}-${exIndex}-${pairIndex}`);
                    if (!select) return;

                    const selected = select.value.trim().toLowerCase();
                    const correct = pair.right.trim().toLowerCase();

                    select.classList.add(selected === correct ? "is-valid" : "is-invalid");
                    select.classList.remove(selected === correct ? "is-invalid" : "is-valid");
                });
            }
        });
    });
};


