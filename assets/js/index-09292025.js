import { 
    saveUserSelection, 
    loadUserSelection, 
    savePhoneticVid, 
    saveMaterialVid, 
    loadPhoneticVid, 
    loadMaterialVid, 
} from "./localStorage-09292025.js";
import {injectJsonContentToLessonContainer} from "./jsonLessonInterpreter.js";
import {backendUrl, youtubeApiUrl} from "./config.js";


    let modules = [];
    const { module, grade } = loadUserSelection();
    //data
    let phoneticsAuthor = null;
    let materialAuthor = null
    let selectedGrade = grade ? grade : null;   
    let selectedModuleName = module ? module : "";
    let selectedPhoneticVid = null;   ;
    let selectedMaterialVid = null;   ;
    let materialPlaylist = "";
    const arrayButtons = [];
    //loaded content
    let phoneticsPlaylistLoaded = false;
    let lessonsLoaded = false;
    let faqLoaded = false;
    let materialPlaylistLoaded = false;


    let arrayPhoneticVid = [];
    let arrayMaterialVid = [];

    //Sections
    const moduleSection = document.getElementById("choose-module");
    const gradesSection = document.getElementById("choose-grade");
    const dashboard = document.getElementById("dashboard");

    //Function to get all modules
    const getModules = () => {
        modules = document.querySelectorAll(".module");
        return modules;
    };

    //Function to set navigation for modules
    const setModuleNavigation = () => {
        getModules();
        modules.forEach((module) => {
            module.addEventListener("click", (e) => {
                showSelectedGrades(e);
            });
        })
    };

    //Function to show actual selected module's grades
    const showSelectedGrades = async (e) => {
        e.preventDefault();
        selectedModuleName = e.currentTarget.getAttribute("id").split("-")[1];
        setColorBySection();
        removeElementsVisibility([moduleSection])
        addElementsVisibility([gradesSection])
        setGradesList();
    };

    function setColorBySection() {
    let color;
    switch (selectedModuleName){
        case "billinghurst":
            color = "#0055A4";
            break ;
        case "cambridge":
            color = "#ee3d34";
            break ;
        default:
            color = "#000"
            break ;
    }

    document.documentElement.style.setProperty("--primary-color", color);
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

    const setGradesList = async () => {
        const container = document.getElementById("grades-list")
        cleanGradesList();
        const grades = await getGrades();
        const totalLessonsArray = await Promise.all(grades.map((grade) => lessonsLenght(grade.id)));
        grades.forEach((grade, index) => {
            const gradeItem = document.createElement("li");
            gradeItem.classList.add("p-3");
            gradeItem.setAttribute("id", `grade-${grade.id.toLowerCase()}`);
            gradeItem.innerHTML = `
                <div class="grade bg-white px-3 pt-3 rounded-3">
                        <div class="back rounded-3" style="background-color: ${grade.gradeColor}"></div>
                    <div class="title-grade gap-2 mt-2 mb-2 d-flex align-items-center">
                        <span class="rounded-3 text-white p-2 fs-4" style="background-color: ${grade.gradeColor}">${grade.logo}</span>
                        <h4 style="color: ${grade.gradeColor}">${grade.title}</h4>
                    </div>
                    <p>Lorem, ipsum dolor sit amet consectetur adipisicing elit. Repudiandae dicta qui quibusdam modi voluptate iste, amet facere. Illo consectetur quis excepturi, consequuntur deleniti obcaecati error? Odio repellat quae tempora quo.</p>
                    <div class="grade-details d-flex flex-row gap-2 border-top pt-3">
                        <span style="color: ${grade.gradeColor}">${!totalLessonsArray[index] ? 0 : totalLessonsArray[index]}</span>
                        <p>Available lessons</p>
                    </div>
                </div>
            `;
            container.appendChild(gradeItem);
            setGradeNavigation(gradeItem, grade);
        });
    };

    //Function to remove previous charged lessons
    const cleanGradesList = () => {
        document.getElementById("grades-list").innerHTML = ""
    };

    //Function to show available grades
    const getGrades = async () => {
        try{
            const response = await fetch("./data/modules/" + selectedModuleName + ".json"); 
            if (!response.ok) {
                console.error("Error while fetching the grades of " + selectedModuleName + ": " + response.statusText);
            }
            const data = await response.json();
            return data
        }
        catch (error) {
            console.error({error: error.message});
        }
    };

    //Function to get the number of lessons of a grade
    const lessonsLenght = async (gradeId) => {
        try{
            const response = await fetch(backendUrl() + "/lesson/grade/" + gradeId); 
            if (!response.ok) {
                console.error("Error while fetching the lessons of " + gradeId + ": " + response.statusText);
            }
            const data = await response.json();
            return data.length;
        }
        catch (error) {
            console.error({error: error.message});
        }
    };

    //Function to set navigation for grades
    const setGradeNavigation = (gradeItem, grade) => {
        gradeItem.addEventListener("click", (e) => {
            showDashboard(e, grade);
        });
    };

    //Function to show dashboard of selected grade
    const showDashboard = async (e, grade) => {
        e.preventDefault();

        selectedGrade = grade;
        materialPlaylist = await getInstitutePlaylistId();

        document.documentElement.style.setProperty("--secondary-color", grade.gradeColor);
        addElementsVisibility([dashboard]);
        removeElementsVisibility([gradesSection]);
        fillDashboardGradeData();
        saveUserSelection(selectedModuleName, selectedGrade);
        location.hash = "#lessons";
    };

    //Function to charge lessons' list with available lessons
    const setLessonsList = async () => {
        const container = document.getElementById("lessons-list")
        cleanLessonsList();
        const lessons = await getLessons();
        if (!lessons) return;
        await lessons.forEach((lesson) => {
            const lessonItem = document.createElement("li");
            lessonItem.classList.add("class", "d-flex", "align-items-center", "rounded-3", "p-3");
            lessonItem.innerHTML = `
                <div class="info-class flex-fill h-100 d-flex flex-row gap-3 p-3 rounded-3 bg-white">
                    <i class="fi ${typeOfClassIcon(lesson.type)}"></i>
                    <div class="d-flex gap-2 flex-column">
                        <h4 class="fs-5 m-0">${lesson.title}</h3>
                        <p class="text-black m-0">${lesson.shortDescription}</p>
                    </div>
                </div>
            `;
            container.appendChild(lessonItem);
            setLessonNavigation(lessonItem, lesson._id)
        });
    };

    //Function to remove previous charged lessons
    const cleanLessonsList = () => {
        document.getElementById("lessons-list").innerHTML = ""
    };

    //Function to get lessons of a selected grade
    const getLessons = async () => {
        try{
            const response = await fetch(backendUrl() + "/lesson/grade/" + selectedGrade.id); 
                if (!response.ok) {
                    showErrorScreen("lessons", response.status.toString());
                    return [];
                }
            const data = await response.json();
            if (!data || data.length === 0) {
                showErrorScreen("lessons", "empty");
            }
            return data;
        }
        catch (error) {
            console.error("Network or fetch error:", error);
            showErrorScreen(contentId, "network");
            return [];
        }
    }

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
    const setLessonNavigation = async (lessonItem, lessonId) => {
        await lessonItem.addEventListener("click", () => {
                location.hash = "#lessons/" + lessonId;
        });
    }

    //Function to show load dashboard after a reload
    const loadDashboard = async () => {
        if (selectedGrade) {
            removeElementsVisibility([moduleSection, gradesSection]);
            addElementsVisibility([dashboard]);
            fillDashboardGradeData();
            setColorBySection();
            document.documentElement.style.setProperty("--secondary-color", selectedGrade.gradeColor);
        }
        return;
    }

    const fillDashboardGradeData = () => {
        const gradeName = document.querySelector("#grade-circle span");
        const gradeType = document.getElementById("grade-type");
        const institute = document.getElementById("grade-institute");
        gradeName.innerHTML = selectedGrade.id;
        institute.innerHTML = selectedModuleName;
        if (selectedModuleName === "billinghurst") {
            gradeType.innerHTML = "Year"
        }
        else if (selectedModuleName === "cambridge"){
            gradeType.innerHTML = "Level"
        }
        else {
            gradeType.innerHTML = "Exam"
        };
    }


    //Function to add their events to the nav buttons
    const setDashboardNavButtons = async () => {
        await addButons();
        setButtonEvent(); 
        return true;
    }

    //Function to add buttons on the document
    const addButons = async () => {
        const container = document.getElementById("buttons-nav");
        const buttons = await getButtons()
        buttons.forEach(button => {
            const element = document.createElement("div");
            element.classList.add("button-icon", "d-flex", "flex-column", "gap-2");
            element.id = button.id;
            const svg = button.svg;
            element.innerHTML = `
                ${svg}
                <span class="text-center">${button.text}</span>
            `
            container.appendChild(element);
            arrayButtons.push(button)
        })
        return true;
    }

    //Function to get buttons from data/json
    const getButtons = async () => {
        try{
            const response = await fetch("./data/webContent/buttons.json")
            if (!response) {
                console.error("Error while fetching the buttons data" + response.statusText);
            }
            const data = await response.json()
            return data;
        }
        catch (error) {
            console.error({error: error.message})
        }
    }

    //Function to get all html container of buttons
    const getButtonsElement = () => {
        const array = arrayButtons.map((button) => {
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

    const setButtonFillSvg = (button) => {
        const buttonObject = arrayButtons.filter(btn => btn.id == button.id)[0]
        const svg = buttonObject.svgFill
        button.innerHTML = `
            ${svg}
            <span class="text-center">${buttonObject.text}</span>
        `
    }

    const setButtonNormalSvg = (button) => {
        const buttonObject = arrayButtons.filter(btn => btn.id == button.id)[0]
        const svg = buttonObject.svg
        button.innerHTML = `
            ${svg}
            <span class="text-center">${buttonObject.text}</span>
        `
    }

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
    let firstVid = null;
    const playlistContainer = document.getElementById(contentId + "-vids");
    playlistContainer.innerHTML = "";
    let playlist = await getPlaylistVideos(playlistId, contentId);
    console.log(playlist, playlist.playlist.author)
    let videos = playlist.videos

    switch (contentId){
        case "phonetics":
            videos = sortVideosByUnit(videos, contentId)
            arrayPhoneticVid = videos;
            break;
        case "material":
            arrayMaterialVid = videos;
            break;
    }

    setPlaylistAuthor(playlist.playlist.author, contentId);

   videos.forEach((vid, index) => {
        if (index == 0) {
            firstVid = vid;
        }
        const item = document.createElement("li");
        const vidId = vid.snippet.resourceId.videoId;
        const title = vid.snippet.title;
        const thumb =
            (vid.snippet.thumbnails.maxres?.url) ||
            (vid.snippet.thumbnails.high?.url) ||
            (vid.snippet.thumbnails.medium?.url) ||
            vid.snippet.thumbnails.default.url;

        item.classList.add("playlist-vid", "p-2", `${contentId}-vid`);
        item.id = vidId;
        item.dataset.index = contentId + "-" + (index + 1);
        item.innerHTML = `
            <div class="vid-data d-flex flex-row">
                <span class="index align-self-center ps-2 pe-3 text-secondary">${index + 1}</span>
                <img src="${thumb}" alt="${title}">
                <span class="pt-2 pb-3 px-3 text-start">${title}</span>
            </div>
        `;
        playlistContainer.appendChild(item);
        item.addEventListener("click", () => {
            selectVideo(vid, contentId);
        });
    });
    setPlaylistOffcanvaData(contentId, videos.length, playlist.playlist.title, playlist.playlist.author.channelTitle);
    setFirstVideo(contentId, firstVid)
};

const setFirstVideo = (contentId, firstVid) => {
    switch (contentId) {
        case "phonetics":
                savePhoneticVid(firstVid)
            break;
         case "material":
                saveMaterialVid(firstVid)
            break;
    } 
} 

const setPlaylistAuthor = async (author, contentId) => {
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

const setPlaylistOffcanvaData = (contentId, playlistLenght, playlistTitle, authorTitle) => {
    const offcanva = document.querySelector("." + contentId + "-offcanva")
    const lenght = offcanva.querySelector(".lenght-playlist")
    const playlistName = offcanva.querySelector(".playlist-title")
    const author = offcanva.querySelector(".author-title")
    lenght.innerHTML = "/" + playlistLenght
    playlistName.innerHTML = playlistTitle
    author.innerHTML = authorTitle
}

const getChannelData = async (channelId) => {
    try {
        const res = await fetch( youtubeApiUrl() + `/channel/${channelId}`);
        const data = await res.json();
        return data;
    } catch (error) {
        console.error("Error while fetching channel data:", error);
    }
    return null;
};

const getPlaylistVideos = async (playlistId, contentId) => {
    try {
        const response = await fetch(youtubeApiUrl() + `/playlist/${playlistId}`);

        if (!response.ok) {
        showErrorScreen(contentId, response.status.toString());
        return [];
        }

        const data = await response.json();

        if (data.error) {
        showErrorScreen(contentId, data.status.toString());
        return [];
        }

        return data;
    } 
    catch (error) {
        console.error("Network or fetch error:", error);
        showErrorScreen(contentId, "network");
        return [];
    }
}

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

        // Abrir cuando el mouse entra en la zona
        trigger.addEventListener("mouseenter", () => {
            bsOffcanvas.show();
        });

        // Opcional: cerrar cuando se sale del panel
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
        saveMaterialVid("")
        saveUserSelection("", null);
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
                selectedPhoneticVid = vid;
                break;
            case "material":
                saveMaterialVid(vid);
                selectedMaterialVid = vid;
                break;  
        }
        loadVideo(contentId);
    }


function loadVideo(contentId) {
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
            return arrayPhoneticVid.find(v => v.snippet.resourceId.videoId === videoId);
        case "material":
            return arrayMaterialVid.find(v => v.snippet.resourceId.videoId === videoId);
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
    const span = offcanva.querySelector(".lenght-playlist")
    return parseInt(span.innerHTML.split("/")[1]);
}

const getVidContainer = (contentId) => {
    switch (contentId) {
        case "phonetics":
            return document.getElementById(selectedPhoneticVid.snippet.resourceId.videoId);
        case "material":
            return document.getElementById(selectedMaterialVid.snippet.resourceId.videoId);
    }
}

const getSelectedVid = (contentId) => {
    selectedPhoneticVid = loadPhoneticVid()
    let selectedVid = selectedPhoneticVid;
    if (contentId == "material") {
        selectedMaterialVid = loadMaterialVid()
        selectedVid = selectedMaterialVid;
    }
    return selectedVid;
}

const setVidData = (contentId) => {
    const vidDataContainer = document.getElementById(contentId + "-info-vid");
    const vidTitle = vidDataContainer.querySelector("h3");
    const authorName = vidDataContainer.querySelector(".vid-author a");
    const authorImg = vidDataContainer.querySelector(".author-image");
    const authorImgHyperlink = vidDataContainer.querySelector("a");
    const authorSubs = vidDataContainer.querySelector(".vid-author span");
    const subscribeButton = vidDataContainer.querySelector(".subscribe")
    let author = null;
    switch (contentId) {
        case "phonetics":
            author = phoneticsAuthor
            break;
        case "material":
            author = materialAuthor
            break;
    }

    vidTitle.innerHTML = getSelectedVid(contentId).snippet.title;
    if (author) {
        
        authorName.innerHTML = author.channelTitle
        authorName.href = "https://www.youtube.com/@" + author.channelTitle
        authorImg.src = author.profilePicture
        authorImgHyperlink.href = "https://www.youtube.com/@" + author.channelTitle
        authorSubs.innerHTML = `${formatSubscribers(author.subscribers)} subscribers`;
        subscribeButton.addEventListener("click", () => {
            location.href = "https://www.youtube.com/@" + author.channelTitle + "?sub_confirmation=1"
        })
    }
}

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

//
const handleHash = () => {
    const hash = location.hash.replace("#", "");
    if (!hash) return;
    const [section, subId] = hash.split("/");
    const button = document.getElementById(section);

    if (section === "lessons" && subId) {
        injectJsonContentToLessonContainer(subId).then(() => {
            hideContents();
            removeElementsVisibility([dashboard])
            setLessonButtons();
        });
        
    } 
    
    else if (section === "lessons") {
        if (button) {
            navButtonAlternateColor(button);
            showSelectedDashboardContent(section);
            setButtonFillSvg(button)
        }
        if (!lessonsLoaded) {
            setLessonsList().then(() => {
                lessonsLoaded = true;
            });
        }
    }

    else if (section === "phonetics") {
        if (button) {
            navButtonAlternateColor(button);
            showSelectedDashboardContent(section);
            setButtonFillSvg(button)
        }
        if (!phoneticsPlaylistLoaded) {
            setPlaylist(section, "PLpLaqjI39e1-wZOrixiNRoU6W89RqFj4k").then(() => {
                loadVideo(section);
                phoneticsPlaylistLoaded = true;
            });
            setTrigger(section)
        } else {
            loadVideo(section);
        }  
    }

    else if (section === "material") {
        if (button) {
            navButtonAlternateColor(button);
            showSelectedDashboardContent(section);
            setButtonFillSvg(button)
        }
        if (!materialPlaylistLoaded) {
            setPlaylist(section, materialPlaylist).then(() => {
                loadVideo(section);
                materialPlaylistLoaded = true;
            });
            setTrigger(section)
            
        } else {
            loadVideo(section);
        }  
    }

    else if (section === "faq") {
        if (button) {
            navButtonAlternateColor(button);
            showSelectedDashboardContent(section);
            setButtonFillSvg(button)
        }
        if (!faqLoaded){
            setFAQList().then(() => {
                faqLoaded = true
                setFAQSectionButtons()
            });
        }
        
    }
    
    else {
        if (button) {
            navButtonAlternateColor(button);
            showSelectedDashboardContent(section);
            setButtonFillSvg(button)
        }
    }
}

const showErrorScreen = (section, errorType) => {
    const container = document.getElementById("content-" + section);
    container.innerHTML = ""; // limpiar el contenido

    let message = "";
    let errorCode = "";
    let button = `
        <div class="px-3 w-fit button-primary d-flex flex-row justify-content-center gap-2 align-items-center p-2" onclick="location.reload()">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-arrow-clockwise" viewBox="0 0 16 16">
                <path fill-rule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z"/>
                <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466"/>
            </svg>
            <span>Refresh page</span>
        </div>
    `;


    switch (errorType) {
        case "network":
            message = "You seem to have a connection error. Please try again in a few minutes.";
            errorCode = "Network error";
            break;
        case "404":
            message = "There's no content available at the moment. Talk to your teacher or wait for something to be uploaded.";
            errorCode = "Empty";
            button = ""
            break;
        case "429":
            message = "It looks like you've made a lot of requests. Please try again in a few minutes.";
            errorCode = "Too many requests";
            break;
        case "empty":
            message = "There's no content available at the moment. Talk to your teacher or wait for something to be uploaded.";
            errorCode = "Empty";
            button = ``;
            break;
        default:
            message = "An unexpected error occurred. Please try again later.";
    }

    container.innerHTML = `
        <div class="row bg-white align-items-center vh-100 overflow-hidden">
            <div class="col-6 d-flex flex-column gap-3 error-screen text-center p-5">
                <h1 class="fs-1 text-start">${errorCode}</h1>
                <h3 class="text-start">Sorry. We couldn't retrieve what you were looking for...</h3>
                <p class="text-start">${message}</p>
                ${button}
            </div>
            <div class="col-6">
                <img class="w-75 m-auto d-block" src="./assets/img/man-with-book.png">
            </div>
        </div>
    `;
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

const hideContents = () => {
    const contents = document.querySelectorAll(".dashboard-content")
    removeElementsVisibility(contents);
}

//Function to put the FAQ in the FAQ section
const setFAQList = async () => {
    const container = document.getElementById("faq-list");
    const FAQs = await getFAQs();
    FAQs.forEach(faq => {
        const element = document.createElement("li")
        element.classList.add("question", "p-3", "rounded-3", "bg-white")
        element.id = faq.questionId
        element.innerHTML = `
            <div class="question-head d-flex flex-row justify-content-between">
                <h4>${faq.title}</h4>
                <div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-plus" viewBox="0 0 16 16">
                        <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/>
                    </svg>
                </div>
            </div>
            <div class="question-body d-none mt-2">
                <p>${faq.answer}</p>
            </div>
        `
        container.appendChild(element);
        element.addEventListener("click", (e) => {
            alternateQuestionBodyDisplay(e);
        })
    }) 
}

const getFAQs = async () => {
    try {
        const response = await fetch("./data/webContent/faq.json")
        if (!response){
            console.error("error while fetching Frequent asked questions")
        }
        const data = await response.json()
        return data;
    }
    catch (error) {
        console.error({error: error.mesagge})
    }
}

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
    getAllQuestionHeads().forEach(element => {
        element.querySelector("div").innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-plus" viewBox="0 0 16 16">
                <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/>
            </svg>
        `
    })
}

const getAllQuestionHeads = () => {
    return document.querySelectorAll(".question-head");
}

const  setDashSVGForAQuestion = (questionElement) => {
    questionElement.querySelector(".question-head div").innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-dash" viewBox="0 0 16 16">
            <path d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8"/>
        </svg>
    `
}

const setFAQSectionButtons = () => {
    const goToForm = document.querySelectorAll(".to-form");
    const submitForm = document.getElementById("send-form");
    const goToFAQ = document.getElementById("cancel-form");

    goToForm.forEach(element => {
        element.addEventListener("click", toForm)
    })
    goToFAQ.addEventListener("click", toFAQs)
    submitForm.addEventListener("click", () => {
        alert("accion de enviar")
    });
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
    clearContactInputs()
    removeElementsVisibility([form]);
    addElementsVisibility([FAQs]);
}

const clearContactInputs = () => {
    const contentContainer = document.getElementById("content-faq");
    let inputs = Array.from(contentContainer.querySelectorAll("form input"));
    console.log(inputs)
    inputs.push(contentContainer.querySelector("textarea"))
    inputs.push(contentContainer.querySelector("select"))
    inputs.forEach(input => {
        input.value = ""
    })

}
const getInstitutePlaylistId = async () => {
    try {
        const response = await fetch("./data/modules/" + selectedModuleName + ".json")
        if (!response) {
            console.error("completar") /*importante*/ 
        } 
        const data = await response.json()
        const gradeObj = data.find(x => x.id === selectedGrade.id);
        return gradeObj.playlistId;
    } catch (error) {
        console.error({error: error.message})
    }
}

//Initial state
const initApp = async () => {
    setModuleNavigation();
    await loadDashboard();           // arma dashboard
    await setDashboardNavButtons();  // pinta los botones
    if (selectedGrade) materialPlaylist = await getInstitutePlaylistId()
    handleHash();                    // ahora sí ejecuta el hash
    window.addEventListener("hashchange", handleHash);
}

window.addEventListener("load", initApp);
