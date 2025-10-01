import { 
    saveUserSelection, 
    loadUserSelection, 
    savePhoneticVid, 
    saveMaterialVid, 
    loadPhoneticVid, 
    loadMaterialVid, 
} from "./localStorage-09302025.js";
import {injectJsonContentToLessonContainer} from "./jsonLessonInterpreter.js";
import {backendUrl, youtubeApiUrl} from "./config-09302025.js";

    const { module, grade } = loadUserSelection();
    //data
    let phoneticsAuthor = null;
    let materialAuthor = null;

    let formReseted = false;

    //Sections
    const moduleSection = document.getElementById("choose-module");
    const gradesSection = document.getElementById("choose-grade");
    const dashboard = document.getElementById("dashboard");

const appState = {
  selected: {
    module: module ? module : "",
    grade: grade ? grade : "",
    material: null,
    phonetic: null,
  },
  loaded: {
    institutes: false,
    lessons: false,
    faq: false,
    phonetic: false,
    material: false,
  },
  arrays: {
    buttons: [],
    phonetics: [],
    material: [],
  },
  error: {
    institute: null,
    lesson: null,
    material: null,
    phonetic: null,
  },
};

const cache = {
    modules: null,
    grades: null,
    buttons: null,
    faqs: null,
    playlists: {},
};

const routes = {
    lessons: (button, subId) => {
        if (subId) {
          injectJsonContentToLessonContainer(subId).then(() => {
            hideContents();
            removeElementsVisibility([dashboard]);
            setLessonButtons();
          });
          return;
        }
      
        prepareSection("lessons", button);
        if (!appState.loaded.lessons) {
            setLessonsList().then(() => { appState.loaded.lessons = true; });
        }
    },
    material: async (button) => {
        prepareSection("material", button);

        if (!appState.loaded.material) {
            const pid = appState.selected.grade?.playlistId;
            if (!pid) { 
                showErrorScreen("content-material", "empty"); 
                return; 
            }

            const firstVid = await setPlaylist("material", pid); 
            if (firstVid) {
                loadVideo("material");
            }

            appState.loaded.material = true;
            setTrigger("material");
        } else {
            loadVideo("material");
        }
    },
    phonetics: async (button) => {
        prepareSection("phonetics", button);
        if (!appState.loaded.phonetic) {
            //const pid = appState.selected.grade?.phoneticsPlaylistId; lo dejo asi porque todavia no defini la phonetica para los grados
            const pid = "PLpLaqjI39e1-wZOrixiNRoU6W89RqFj4k"
            if (!pid) { showErrorScreen("content-phonetics", "empty"); return; }

            const firstVid = await setPlaylist("phonetics", pid); 
            if (firstVid) {
                loadVideo("phonetics");
            }
            appState.loaded.phonetic = true;
            setTrigger("phonetics");
        } else {
            loadVideo("phonetics");
        }
    },
    faq: (button) => {
        prepareSection("faq", button);
        if (!appState.loaded.faq) {
            setFAQList().then(() => { 
                appState.loaded.faq = true; 
                setFAQSectionButtons()
            });
        }   
    },
};

const fetchJson = async (url, context = "fetch") => {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`${context} failed: ${response.status} ${response.statusText}`);
            return null;
        }
        return await response.json();
    } catch (error) {
        console.error(`${context} error:`, error);
        return null;
    }
}

const fetchJsonWithError = async (url, context = "fetch") => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`${context} failed: ${response.status} ${response.statusText}`);
      return { data: null, error: response.status.toString() };
    }
    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    console.error(`${context} error:`, error);
    return { data: null, error: "network" };
  }
};

const wakeServer = async () => {
  try {
    await fetch(`${backendUrl()}health`, { cache: "no-store" });
  } catch (err) {
    console.warn("Backend wake failed:", err);
  }
};

const showSpinner = (message, container) => {
    const containerHTML = container.innerHTML
    container.classList.add("overflow-hidden")
    clearContainer(container);

    const template = document.getElementById("spinner-template");
    const clone = template.content.cloneNode(true);

    clone.querySelector("h3").textContent = message;

    container.appendChild(clone);

    return containerHTML;
};

const hideSpinner = (container, containerHTML) => {
    clearContainer(container);
    container.classList.remove("overflow-hidden")
    container.innerHTML = containerHTML;
};
  
const setModules = async () => {
    const container = document.getElementById("choose-module")
    const containerHTML = showSpinner("Loading institutes, please wait...", container);
    
    try{
        const institutes = await getModules();

        if (appState.error.institute) {
            throw new Error("the institutes could not be obtained: "+ appState.error.institute)
        }

        hideSpinner(container, containerHTML);

        const moduleList = document.getElementById("modules-list");
        clearContainer(moduleList);

        const template = document.getElementById("institute-template");

        institutes.forEach(institute => {
            const clone = template.content.cloneNode(true);

            const li = clone.querySelector("li");
            li.id = `module-${institute.name.toLowerCase()}`;

            const img = clone.querySelector("img");
            img.src = `./assets/img/logos/${institute.name}-logo.png`;
            img.alt = `${institute.name}-logo`;

            const h4 = clone.querySelector("h4");
            h4.textContent = institute.name;
            h4.classList.add(`title-${institute.name.toLowerCase()}`);

            moduleList.appendChild(clone);

            setModuleNavigation(li, institute);
        });
        appState.loaded.institutes = true
    } catch (err) {
        hideSpinner(container, "");
        showErrorScreen("choose-module", appState.error.institute)
    }
};


const clearContainer = (container) => {
    if (container) container.innerHTML = "";
};

//Function to get all modules
const getModules = async () => {
    if (!cache.modules) {
        const { data, error } = await fetchJsonWithError(
            backendUrl() + "institute",
            "getModules"
        );
      
        if (error) {
            appState.error.institute = error;
            return [];
        }
      
        cache.modules = data;
    }

    return cache.modules || [];
};

//Function to set navigation for modules
const setModuleNavigation = (item, module) => {
    item.addEventListener("click", (e) => {
        appState.selected.module = module;
        showSelectedGrades(e);
    });
};

//Function to show actual selected module's grades
const showSelectedGrades = (e) => {
    e.preventDefault();
    setColorBySection();
    removeElementsVisibility([moduleSection])
    addElementsVisibility([gradesSection])
    setGradesList();
};

const setColorBySection = () => {
    document.documentElement.style.setProperty("--primary-color", appState.selected.module.instituteColor);
}

//Function to hide some elements
const removeElementsVisibility = (array) => {
    array.forEach(e => {
         e.classList.add("d-none")
         e.classList.remove("d-block")
    });
}

//Function to show some elements
const addElementsVisibility = (array) => {
        array.forEach(e => {
            e.classList.add("d-block")
            e.classList.remove("d-none")
        });
}

//Function to charge grade's list with available grades
const setGradesList = () => {
    const container = document.getElementById("grades-list");
    clearContainer(container);
    const grades = appState.selected.module.grades;

    const template = document.getElementById("grade-template");
    if (!template) {
        console.error("Template 'grade-template' not found");
        return;
    }
    grades.forEach((grade) => {
        const clone = template.content.cloneNode(true);

        const li = clone.querySelector("li");
        li.id = `grade-${grade.shortTitle.toLowerCase()}`;

        const back = clone.querySelector(".back");
        back.style.backgroundColor = grade.gradeColor;

        const logoSpan = clone.querySelector(".title-grade span");
        logoSpan.style.backgroundColor = grade.gradeColor;
        logoSpan.textContent = grade.logo;

        const title = clone.querySelector("h4");
        title.style.color = grade.gradeColor;
        title.textContent = grade.title;

        const desc = clone.querySelector("p");
        //change when grade description is implemented
        desc.textContent = "Lorem, ipsum dolor sit amet consectetur adipisicing elit. Repudiandae dicta qui quibusdam modi voluptate iste, amet facere. Illo consectetur quis excepturi, consequuntur deleniti obcaecati error? Odio repellat quae tempora quo.";

        const lessonCount = clone.querySelector(".grade-details span");
        lessonCount.style.color = grade.gradeColor;
        lessonCount.textContent = grade.lessonCount;

        container.appendChild(clone);

        const insertedLi = container.lastElementChild;
        setGradeNavigation(insertedLi, grade);
    });
};

//Function to set navigation for grades
const setGradeNavigation = (gradeItem, grade) => {
    gradeItem.addEventListener("click", (e) => {
        appState.selected.grade = grade;
        showDashboard(e, grade);      
    });
};

//Function to show dashboard of selected grade
const showDashboard = (e) => {
    e.preventDefault();
    document.documentElement.style.setProperty("--secondary-color", appState.selected.grade.gradeColor);
    addElementsVisibility([dashboard]);
    removeElementsVisibility([gradesSection]);
    fillDashboardGradeData();
    saveUserSelection(appState.selected.module, appState.selected.grade);
    location.hash = "#lessons";
};

//Function to charge lessons' list with available lessons
const setLessonsList = async () => {
    const container = document.getElementById("content-lessons")
    const containerHTML = showSpinner("Loading lessons, please wait...", container);

    if (appState.selected.grade.lessonCount < 1) {
        hideSpinner(container, containerHTML);
        showErrorScreen("content-lessons", "empty")
        return;
    } 

    try{
        const lessonList = document.getElementById("lessons-list");
        clearContainer(container);

        const lessons = await getLessons();

        if (appState.error.lesson){
            throw new Error("the lessons could not be obtained: "+ appState.error.lesson)
        }

        hideSpinner(container, containerHTML);


        const template = document.getElementById("lesson-template");
        if (!template) {
            console.error("Template 'lesson-template' no encontrado en el DOM");
            return;
        }

        lessons.forEach((lesson) => {
            const clone = template.content.cloneNode(true);

            const li = clone.querySelector("li");
            li.id = `lesson-${lesson.title.toLowerCase()}`;

            const icon = clone.querySelector("i");
            icon.className = `fi ${typeOfClassIcon(lesson.type)}`;

            const title = clone.querySelector("h4");
            title.textContent = lesson.title;

            const desc = clone.querySelector("p");
            desc.textContent = lesson.shortDescription;

            lessonList.appendChild(clone);

            const insertedLi = container.lastElementChild;
            setLessonNavigation(insertedLi, lesson._id);
        });
    }
    catch {
        hideSpinner(container, "");
        showErrorScreen("content-lessons", appState.error.lesson)
    }
};

//Function to get lessons of a selected grade
const getLessons = async () => {
    const { data, error } = await fetchJsonWithError(
        backendUrl() + "lesson/grade/" + appState.selected.grade.id,
        "getLessons"
    );

    if (error) {
        appState.error.lesson = error; // guardamos el error en appState
        return [];
    }

    return data || [];
};

//Function to get the lesson icon with the lesson type.
const typeOfClassIcon = (typeOfLesson) => {
    switch (typeOfLesson) {
        case "grammar":
            return "fi-rr-text-check";
        case "time":
            return "fi-rr-clock";
        case "vocabulary":
            return "fi-rr-dictionary-alt";
        default:
            return "fi-rr-english";
    }
}

    //Function to set navigation for lessons
const setLessonNavigation = (lessonItem, lessonId) => {
    lessonItem.addEventListener("click", () => {
        location.hash = "#lessons/" + lessonId;
    });
}

//Function to show load dashboard after a reload
const loadDashboard = () => {
    if (appState.selected.grade) {
        removeElementsVisibility([moduleSection, gradesSection]);
        addElementsVisibility([dashboard]);
        fillDashboardGradeData();
        setColorBySection();
        document.documentElement.style.setProperty("--secondary-color", appState.selected.grade.gradeColor);
    }
    return;
}

//Function to fill the course logo on the dashboard with the chosen data
const fillDashboardGradeData = () => {
    const gradeName = document.querySelector("#grade-circle span");
    const gradeType = document.getElementById("grade-type");
    const institute = document.getElementById("grade-institute");

    if (!gradeName || !gradeType || !institute || !appState.selected.grade || !appState.selected.module) {
        console.warn("fillDashboardGradeData: missing elements or undefined state");
        return;
    }

    gradeName.textContent = appState.selected.grade.shortTitle;
    institute.textContent = appState.selected.module.name;

    let typeLabel = "Grade";

    if (appState.selected.module.name === "Billinghurst") {
        typeLabel = "Year";
    } else if (appState.selected.module.name === "Cambridge") {
        typeLabel = appState.selected.grade.isExam ? "Exam" : "Level";
    }

    gradeType.textContent = typeLabel;
};

//Function to add their events to the nav buttons
const setDashboardNavButtons = async () => {
    await addButons();
    setButtonEvent(); 
    return true;
}

//Function to add buttons on the document
const addButons = async () => {
    const container = document.getElementById("buttons-nav");
    const buttons = await getButtons();

    buttons.forEach(button => {
        const element = document.createElement("div");
        element.classList.add("button-icon", "d-flex", "flex-column", "gap-2");
        element.id = button.id;
        
        element.insertAdjacentHTML("beforeend", button.svg);
        
        const span = document.createElement("span");
        span.classList.add("text-center");
        span.textContent = button.text;
        element.appendChild(span);
        
        container.appendChild(element);
        appState.arrays.buttons.push(button);
    });
    return true;
};

//Function to get buttons from data/json
const getButtons = async () => {
    if (!cache.buttons) {
        cache.buttons = await fetchJson("./data/webContent/buttons.json", "getButtons");
    }
    return cache.buttons || [];
};

//Function to get all html container of buttons
const getButtonsElement = () => {
    const array = appState.arrays.buttons.map((button) => {
        return document.getElementById(button.id);
    });
    return array;
};

//Function to add event listener click on all buttons
const setButtonEvent = () => {
    getButtonsElement().forEach(button => {
        button.addEventListener("click", () => {
            buttonAction(button);
        })
    })
}

//Function to group all buttons' actions 
const buttonAction = (button) => {
    if (button.id == "logout"){
        deleteActualSesion();
        location = "";
        return;
    }
    location.hash = button.id;
}

//Function to add active state on selected button
const navButtonAlternateColor = (button) => {
    resetAllButtonsState();
    button.classList.add("button-active");
}

//Function to set button svg to fill when it is selected
const setButtonFillSvg = (button) => {
    const buttonObject = appState.arrays.buttons.find(btn => btn.id === button.id);
    if (!buttonObject) return;

    button.innerHTML = "";
    button.insertAdjacentHTML("beforeend", buttonObject.svgFill);

    const span = document.createElement("span");
    span.classList.add("text-center");
    span.textContent = buttonObject.text;
    button.appendChild(span);
};

//Function to set button svg to normal when it is not selected
const setButtonNormalSvg = (button) => {
    const buttonObject = appState.arrays.buttons.find(btn => btn.id === button.id);
    if (!buttonObject) return;

    button.innerHTML = "";
    button.insertAdjacentHTML("beforeend", buttonObject.svg);

    const span = document.createElement("span");
    span.classList.add("text-center");
    span.textContent = buttonObject.text;
    button.appendChild(span);
};

//Function to remove active state in all buttons
const resetAllButtonsState = () => {
    getButtonsElement().forEach(button => {
        button.classList.remove("button-active");
        setButtonNormalSvg(button);    
    });
}

//Function to show the selected dashboard content and hide the others
const showSelectedDashboardContent = (contentId) => {
    const contentContainer = document.getElementById("content-" + contentId);
    removeElementsVisibility(getAllcontentContainers());
    addElementsVisibility([contentContainer]);
    
}

const setPlaylist = async (contentId, playlistId) => {
    const container = document.getElementById("content-" + contentId)
    const containerHTML = showSpinner("Loading playlist, please wait...", container);
    try{
        const playlist = await getPlaylistVideos(playlistId, contentId);

        if(getPlaylistErrorByContentId(contentId)){
            throw new Error("Could not get playlist: ", getPlaylistErrorByContentId(contentId))
        }

        hideSpinner(container, containerHTML)   
        
        let firstVid = null;
        const playlistContainer = document.getElementById(`${contentId}-vids`);
        clearContainer(playlistContainer);
        
        const videos = Array.isArray(playlist?.videos) ? playlist.videos : [];
        
        //simplificar en subtarea
        switch (contentId) {
          case "phonetics":
            appState.arrays.phonetics = sortVideosByUnit(videos, contentId);
            break;
          case "material":
            appState.arrays.material = videos;
            break;
        }
        
        if (playlist.playlist?.author) {
          setPlaylistAuthor(playlist.playlist.author, contentId);
        }
        

        const template = document.getElementById("playlist-item-template");
        if (!template) {
          console.error("Template 'playlist-item-template' no encontrado en el DOM");
          return null;
        }

        
        videos.forEach((vid, index) => {
            const vidId = vid.snippet?.resourceId?.videoId;
            if (!vidId) return;

            if (index === 0) firstVid = vid;

            const title = vid.snippet.title;
            const thumb =
                vid.snippet.thumbnails.maxres?.url ||
                vid.snippet.thumbnails.high?.url ||
                vid.snippet.thumbnails.medium?.url ||
                vid.snippet.thumbnails.default?.url || "";

            const clone = template.content.cloneNode(true);

            

            const li = clone.querySelector("li");
            li.classList.add(`${contentId}-vid`);
            li.id = vidId;
            li.dataset.index = `${contentId}-${index + 1}`;

            const indexEl = clone.querySelector(".index");
            indexEl.textContent = index + 1;
            

            const img = clone.querySelector("img");
            img.src = thumb;
            img.alt = title;

            const span = clone.querySelector(".vid-data span:last-child");
            span.textContent = title;
            
            playlistContainer.appendChild(clone);

            const insertedLi = playlistContainer.lastElementChild;
            insertedLi.addEventListener("click", () => {
                selectVideo(vid, contentId);
            });
        });

        setPlaylistOffcanvaData(
            contentId,
            videos.length,
            playlist.playlist.title,
            playlist.playlist.author?.channelTitle || ""
        );
        

        setVideo(contentId, firstVid);

        return firstVid;

    }
    catch (err) {
        hideSpinner(container, containerHTML)
        showErrorScreen("content-" + contentId, getPlaylistErrorByContentId(contentId))
    }
};

const getPlaylistErrorByContentId = (contentId) => {
    switch (contentId) {
        case "phonetics":
            return appState.error.phonetic;
        case "material":
            return appState.error.material;
    }
} 

const setVideo = (contentId, firstVid) => {
    switch (contentId) {
        case "phonetics":
                appState.selected.phonetic = loadPhoneticVid()
                if (!appState.selected.phonetic) {
                    savePhoneticVid(firstVid)
                    appState.selected.phonetic = firstVid
                }
                
            break;
        case "material":
                appState.selected.material = loadMaterialVid()
                if (!appState.selected.material) {
                    saveMaterialVid(firstVid)
                    appState.selected.material = firstVid
                }
            break;
    }
} 

const setPlaylistAuthor = (author, contentId) => {
    if (!author){
        return;
    }
    else {
        switch (contentId){
            case "phonetics":
                if (!phoneticsAuthor) {
                    phoneticsAuthor = author;
                }
                break;
            case "material":
                if (!materialAuthor) {
                    materialAuthor = author;
                }
                break;
        }
    }
}

const setPlaylistOffcanvaData = (contentId, playlistLength, playlistTitle, authorTitle) => {
    const offcanva = document.querySelector(`.${contentId}-offcanva`);
    if (!offcanva) {
        console.warn(`Offcanvas for section '${contentId}' not found`);
        return;
    }

    const lengthEl = offcanva.querySelector(".playlist-length");
    const playlistName = offcanva.querySelector(".playlist-title");
    const author = offcanva.querySelector(".author-title");

    if (lengthEl) lengthEl.textContent = `/${playlistLength}`;
    if (playlistName) playlistName.textContent = playlistTitle || "";
    if (author) author.textContent = authorTitle || "";
};


const getPlaylistVideos = async (playlistId, contentId) => {
  if (cache.playlists[playlistId]) {
    return cache.playlists[playlistId];
  }

  const { data, error } = await fetchJsonWithError(
    youtubeApiUrl() + `/playlist/${playlistId}`,
    "getPlaylistVideos"
  );

  if (error) {
    switch (contentId){
        case "phonetics":
            appState.error.phonetic = { [contentId]: error };
            break;
        case "material":
            appState.error.material = { [contentId]: error };
            break;
    }
    return [];
  }

  cache.playlists[playlistId] = data;
  return data || [];
};

const sortVideosByUnit = (videos, contentId) => {
    return videos.sort((a, b) => {
        const titleA = a.snippet.title.toLowerCase();
        const titleB = b.snippet.title.toLowerCase();

        // Extraer el número después de "unit"
        const getUnitNumber = (title) => {
            const match = title.match(/unit\s*(\d+)/i);
            return match ? parseInt(match[1], 10) : Infinity; // Si no hay número, lo manda al final
        };

        const unitA = getUnitNumber(titleA);
        const unitB = getUnitNumber(titleB);

        if (unitA !== unitB) return unitA - unitB;

        // Si tienen el mismo unit, ordenar alfabéticamente
        return titleA.localeCompare(titleB);
    });
};

const setTrigger = (contentId) => {
    const trigger = document.getElementById(contentId + "-trigger");
    const offcanvasEl = document.querySelector("." + contentId + "-offcanva");
    const bsOffcanvas = new bootstrap.Offcanvas(offcanvasEl);

    trigger.addEventListener("mouseenter", () => {
        bsOffcanvas.show();
    });

    offcanvasEl.addEventListener("mouseleave", () => {
        bsOffcanvas.hide();
    });
}

    const getAllcontentContainers = () => {
        return document.querySelectorAll(".dashboard-content")
    }

    //Function to delete the selected grade and module and going back to initial page state
    const deleteActualSesion = () => {
        /*I dont delete phoneticVid because there isnt other phonetic playlist*/
        saveMaterialVid(null)
        saveUserSelection(null, null);
        reloadPage();
        setColorBySection()
    }

    //Function to remove hide de dashboard and show all modules to select. 
    const reloadPage = () => {
        addElementsVisibility([moduleSection]);
        removeElementsVisibility([dashboard]);
    }

    function selectVideo(vid, contentId) {
        switch (contentId) {
            case "phonetics":
                savePhoneticVid(vid);
                appState.selected.phonetic = vid
                break;
            case "material":
                saveMaterialVid(vid);
                appState.selected.material = vid
                break;  
        }
        loadVideo(contentId);
    }


function loadVideo(contentId) {
    const selectedVid = contentId === "material" 
        ? loadMaterialVid() 
        : loadPhoneticVid();

    if (!selectedVid || !selectedVid.snippet?.resourceId) {
        console.warn("No video found to load for", contentId);
        return;
    }
    const player = document.getElementById(contentId + "-player");
    const vidId = getSelectedVid(contentId).snippet.resourceId.videoId; 
    setCurrentVidNumberOnPlaylist(contentId, getVidContainer(contentId).dataset.index.split("-")[1])


    setVidData(contentId, vidId);
    setVidNav(contentId)
    
    player.src = `https://www.youtube.com/embed/${vidId}`;
    refreshPlaylistUi(vidId, contentId);
}

// Subtarea: obtener el elemento HTML de un video según contentId e índice
const getVideoElementByIndex = (contentId, index) => {
    return document.querySelector(`[data-index="${contentId}-${index}"]`);
};

// Subtarea: obtener el objeto de video (desde array global) según contentId e id de video
const getVideoObjectById = (contentId, videoId) => {
    switch (contentId) {
        case "phonetics":
            return appState.arrays.phonetics.find(v => v.snippet.resourceId.videoId === videoId);
        case "material":
            return appState.arrays.material.find(v => v.snippet.resourceId.videoId === videoId);
        default:
            return null;
    }
};

// Función principal
const setVidNav = (contentId) => {
    const selectedVideo = getVidContainer(contentId); 
    const vidContainer = document.getElementById(contentId + "-info-vid");
    const buttons = vidContainer.querySelectorAll(".nav-vid div");

    // Mostrar ambos botones al inicio
    buttons.forEach(button => button.classList.remove("d-none"));

    const currentIndex = parseInt(selectedVideo.dataset.index.split("-")[1]);

    // Ocultar botón "anterior" si estamos en el primero
    if (currentIndex === 1) {
        buttons[0].classList.add("d-none");
    }

    // Ocultar botón "siguiente" si estamos en el último
    if (currentIndex === getPlaylistLenght(contentId)) {
        buttons[1].classList.add("d-none");
    }

    // Funcionalidad botón "anterior"
    buttons[0].onclick = () => {
        if (currentIndex > 1) {
            const prevElement = getVideoElementByIndex(contentId, currentIndex - 1);
            if (prevElement) {
                const prevId = prevElement.id;
                const videoObj = getVideoObjectById(contentId, prevId);
                if (videoObj) selectVideo(videoObj, contentId);
            }
        }
    };

    // Funcionalidad botón "siguiente"
    buttons[1].onclick = () => {
        if (currentIndex < getPlaylistLenght(contentId)) {
            const nextElement = getVideoElementByIndex(contentId, currentIndex + 1);
            if (nextElement) {
                const nextId = nextElement.id;
                const videoObj = getVideoObjectById(contentId, nextId);
                if (videoObj) selectVideo(videoObj, contentId);
            }
        }
    };
};

const getPlaylistLenght = (contentId) => {
    const offcanva = document.querySelector("." + contentId + "-offcanva");
    const span = offcanva.querySelector(".playlist-length")
    return parseInt(span.innerHTML.split("/")[1]);
}

const getVidContainer = (contentId) => {
    switch (contentId) {
        case "phonetics":
            return document.getElementById(appState.selected.phonetic.snippet.resourceId.videoId);
        case "material":
            return document.getElementById(appState.selected.material.snippet.resourceId.videoId);
    }
}

const getSelectedVid = (contentId) => {
    let selectedVid = appState.selected.phonetic;
    if (contentId == "material") {  
        selectedVid = appState.selected.material;
    }
    return selectedVid;
}

const setVidData = (contentId) => {
    const vidDataContainer = document.getElementById(`${contentId}-info-vid`);
    const vidTitle = vidDataContainer.querySelector("h3");
    const authorName = vidDataContainer.querySelector(".vid-author a");
    const authorImg = vidDataContainer.querySelector(".author-image");
    const authorImgHyperlink = vidDataContainer.querySelector("a");
    const authorSubs = vidDataContainer.querySelector(".vid-author span");
    const subscribeButton = vidDataContainer.querySelector(".subscribe");

    const selectedVid = getSelectedVid(contentId);
    vidTitle.textContent = selectedVid.snippet.title;

    let author = null;
    switch (contentId) {
        case "phonetics":
            author = phoneticsAuthor;
            break;
        case "material":
            author = materialAuthor;
            break;
    }

    if (author) {
        const channelUrl = `https://www.youtube.com/@${author.channelTitle}`;
        
        authorName.textContent = author.channelTitle;
        authorName.href = channelUrl;
        
        authorImg.src = author.profilePicture;
        authorImg.alt = `${author.channelTitle} profile picture`;
        
        authorImgHyperlink.href = channelUrl;
        
        authorSubs.textContent = `${formatSubscribers(author.subscribers)} subscribers`;
        
        if (!subscribeButton.dataset.bound) {
            subscribeButton.addEventListener("click", () => {
                location.href = `${channelUrl}?sub_confirmation=1`;
            });
            subscribeButton.dataset.bound = "true";
        }
    }
};


const setCurrentVidNumberOnPlaylist = (contentId, currentVidNumber) => {
    const offcanva = document.querySelector("." + contentId + "-offcanva")
    const span = offcanva.querySelector(".current-vid")
    span.innerHTML = currentVidNumber
}

const formatSubscribers = (count) => {
    if (count >= 1_000_000_000) {
        return (count / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B";
    }
    if (count >= 1_000_000) {
        return (count / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    }
    if (count >= 1_000) {
        return (count / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
    }
    return count.toString();
};

const refreshPlaylistUi = (vidId, contentId) => {
    const allVideos = document.querySelectorAll(`.${contentId}-vid`);
    const selectedVideo = document.getElementById(vidId);
    allVideos.forEach(video => {
        video.classList.remove("selected-vid")
    })
    selectedVideo.classList.add("selected-vid")
};

const hideContents = () => {
    const contents = document.querySelectorAll(".dashboard-content")
    removeElementsVisibility(contents);
}

const handleHash = () => {
  const hash = location.hash.replace("#", "");
  if (!hash) return;

  const [section, subId] = hash.split("/");
  const button = document.querySelector(`#${section}`);

  if (routes[section]) {
    routes[section](button, subId);
  } else {
    routes.lessons();
  }
};

const showErrorScreen = (section, errorType) => {
    const container = document.getElementById(section);
    container.classList.add("overflow-hidden")
    container.innerHTML = "";

    let message = "";
    let errorCode = "";
    let addButton = true;

    switch (errorType) {
    case "network":
        message = "You seem to have a connection error. Please try again in a few minutes.";
        errorCode = "Network error";
        break;
    case "empty":
        message = "There's no content available at the moment. Talk to your teacher or wait for something to be uploaded.";
        errorCode = "Empty";
        addButton = false;
        break;
    case "404":
        message = "The requested resource could not be found. Please check again later.";
        errorCode = "Not Found";
        addButton = false;
        break;
    case "401":
        message = "You are not authorized to access this content. Please log in and try again.";
        errorCode = "Unauthorized";
        break;
    case "403":
        message = "You don’t have permission to access this section.";
        errorCode = "Forbidden";
        break;
    case "500":
        message = "The server encountered an error. Please try again later.";
        errorCode = "Server error";
        break;
    case "503":
        message = "The service is temporarily unavailable. Please try again later.";
        errorCode = "Service unavailable";
        break;
    case "429":
        message = "It looks like you've made a lot of requests. Please try again in a few minutes.";
        errorCode = "Too many requests";
        break;
    default:
        message = "An unexpected error occurred. Please try again later.";
        errorCode = "Error";
}

    const row = document.createElement("div");
    row.classList.add("row", "bg-white", "align-items-center", "vh-100", "overflow-hidden");

    const colLeft = document.createElement("div");
    colLeft.classList.add("col-6", "d-flex", "flex-column", "gap-3", "error-screen", "text-center", "p-5");

    const h1 = document.createElement("h1");
    h1.classList.add("fs-1", "text-start");
    h1.textContent = errorCode;

    const h3 = document.createElement("h3");
    h3.classList.add("text-start");
    h3.textContent = "Sorry. We couldn't retrieve what you were looking for...";

    const p = document.createElement("p");
    p.classList.add("text-start");
    p.textContent = message;

    colLeft.appendChild(h1);
    colLeft.appendChild(h3);
    colLeft.appendChild(p);

    if (addButton) {
        const btn = document.createElement("div");
        btn.classList.add("px-3", "w-fit", "button-primary", "d-flex", "flex-row", "justify-content-center", "gap-2", "align-items-center", "p-2");
        btn.addEventListener("click", () => location.reload());

        btn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-arrow-clockwise" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z"/>
            <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466"/>
            </svg>
            <span>Refresh page</span>
        `;
        colLeft.appendChild(btn);
    }

    const colRight = document.createElement("div");
    colRight.classList.add("col-6");
    const img = document.createElement("img");
    img.classList.add("w-75", "m-auto", "d-block");
    img.src = "./assets/img/man-with-book.png";
    colRight.appendChild(img);

    row.appendChild(colLeft);
    row.appendChild(colRight);

    container.appendChild(row);
};



const setLessonButtons = () => {
    const toHome = document.querySelector("#lesson-container #to-home")
    const toTop =   document.querySelector("#lesson-container #to-top")
    toHome.addEventListener("click", () => {
        location.hash = "lessons"
        resetLessonContainer()
        addElementsVisibility([dashboard])
    })

    toTop.addEventListener("click", () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });

    window.addEventListener("scroll", () => {
        if (window.scrollY > 500) {
            addElementsVisibility([toTop])
        } else {
            removeElementsVisibility([toTop])
        }
    });
} 

const resetLessonContainer = () => {
    const container = document.getElementById("lesson-container");
    container.innerHTML = ""
    removeElementsVisibility([container])
}

//Function to put the FAQ in the FAQ section
const setFAQList = async () => {
    const FAQs = await getFAQs();
    const list = document.getElementById("faq-list");

    const faqTemplate = document.getElementById("faq-template");
    const buttonTemplate = document.getElementById("faq-button-template");

    FAQs.forEach((faq) => {
        const clone = faqTemplate.content.cloneNode(true);
        
        const li = clone.querySelector("li");
        li.id = faq.questionId;
        
        const title = clone.querySelector("h4");
        title.textContent = faq.title;
        
        const answer = clone.querySelector(".question-body p");
        answer.textContent = faq.answer;
        
        if (parseBool(faq.buttons)) {
            const buttonClone = buttonTemplate.content.cloneNode(true);
            clone.querySelector(".question-body").appendChild(buttonClone);
        }
      
        list.appendChild(clone);
      
        const insertedLi = list.lastElementChild;
        insertedLi.addEventListener("click", (e) => {
            alternateQuestionBodyDisplay(e);
        });
    });
};


function parseBool(value) {
    if (typeof value === "boolean") return value; // ya es boolean
    if (typeof value === "string") {
        const val = value.trim().toLowerCase();
        if (val === "true") return true;
        if (val === "false") return false;
    }
    if (typeof value === "number") {
        return value !== 0; // 0 = false, cualquier otro número = true
    }
    return Boolean(value); // fallback para otros casos
}

const getFAQs = async () => {
    if (!cache.faqs) {
        cache.faqs = await fetchJson("./data/webContent/faq.json", "getFAQs");
    }
    return cache.faqs || [];
};

const alternateQuestionBodyDisplay = (e) => {
    const questionBody = e.currentTarget.querySelector(".question-body")
    if (questionBody.classList.contains("d-none")) {
        resetAllQuestionUi();
        setDashSVGForAQuestion(e.currentTarget);
        addElementsVisibility([questionBody]);
    }
    else{
        resetAllQuestionUi();
    }
};

const resetAllQuestionUi = () => {
    removeElementsVisibility(getAllQuestionBodys());
    setPlusSVGForAllQuestions();
}

const getAllQuestionBodys = () => {
    return document.querySelectorAll(".question-body");
}

const setPlusSVGForAllQuestions = () => {
    const template = document.getElementById("plus-icon-template");
    getAllQuestionHeads().forEach(element => {
        const div = element.querySelector("div");
        div.innerHTML = ""; // limpiar
        div.appendChild(template.content.cloneNode(true));
    });
};

const setDashSVGForAQuestion = (questionElement) => {
    const template = document.getElementById("dash-icon-template");
    const div = questionElement.querySelector(".question-head div");
    div.innerHTML = ""; // limpiar
    div.appendChild(template.content.cloneNode(true));
};


const getAllQuestionHeads = () => {
    return document.querySelectorAll(".question-head");
}

const prepareSection = (section, button) => {
  if (button) {
    
    navButtonAlternateColor(button);
    showSelectedDashboardContent(section);
    setButtonFillSvg(button);
  }
};

const sendEmail = async () => {
    const name = document.getElementById("name").value;
    const subject = document.getElementById("subject").value || document.getElementById("other-subject").value;
    const message = document.getElementById("message").value;
    const email = document.getElementById("email").value || "anonymous@no-reply.com";
    
    const payload = { name, subject, message, email };
    
    try {
        const response = await fetch(backendUrl() + "contact", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            alert("Something went wrong. Try again later.");
            return;
        }

        formReseted = false;
        setFormSuccessStatus();
        setTimeout(() => {
            if (!formReseted){
                resetForm();
            }
        }, "5000");
        
        
    } catch (error) {
        console.error("Error sending form:", error);
        alert("Connection error. Try again later.");
    }
}

const setFormSuccessStatus = () => {
    const form = document.getElementById("contact-form");
    const succesScreen = document.getElementById("success-status-form");
    addElementsVisibility([succesScreen]);
    removeElementsVisibility([form]);
};

const resetForm = () => {
    formReseted = true;
    const succesScreen = document.getElementById("success-status-form");
    const form = document.getElementById("contact-form");
    removeElementsVisibility([succesScreen]);
    addElementsVisibility([form]);
    toFAQs()
}

const setFAQSectionButtons = () => {
    const goToForm = document.querySelectorAll(".to-form");
    const goToFAQ = document.getElementById("cancel-form");
    const returnForm = document.getElementById("return-form")
    const form = document.getElementById("contact-form")

    returnForm.addEventListener("click", resetForm);
    goToForm.forEach(element => {
        element.addEventListener("click", toForm)
    })
    goToFAQ.addEventListener("click", toFAQs)
    form.addEventListener("submit", (e) => {
        e.preventDefault()
        sendEmail()
    })
}

//Function to hide FAQs in faq content to show the contact form
const toForm = () => {
    const FAQs = document.getElementById("question");
    const form = document.getElementById("contact");
    removeElementsVisibility([FAQs]);
    addElementsVisibility([form])
}

//Function to hide the contact form, clear de inputs and return to the FAQs
const toFAQs = () => {
    const FAQs = document.getElementById("question");
    const form = document.getElementById("contact");
    removeElementsVisibility([form]);
    addElementsVisibility([FAQs]);
    clearContactInputs();
}

const clearContactInputs = () => {
    const contentContainer = document.getElementById("content-faq");
    let inputs = Array.from(contentContainer.querySelectorAll("form input"));
    inputs.push(contentContainer.querySelector("textarea"))
    inputs.push(contentContainer.querySelector("select"))
    inputs.forEach(input => {
        input.value = ""
    })

}

//Initial state
const initApp = async () => {
    const container = document.getElementById("choose-module");
    const spinnerBackup = showSpinner("Waking up server, please wait...", container);

    await wakeServer();
    hideSpinner(container, spinnerBackup)

    setModules();
    loadDashboard();          
    await setDashboardNavButtons();  
    handleHash();                  
    window.addEventListener("hashchange", handleHash);
}

window.addEventListener("load", initApp);
