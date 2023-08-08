const buttonsContainer = document.getElementById('fileButtons'); //Button div 
const fileContent = document.getElementById('contents'); //Sleected file content pre element
var directoryPath = '';
var currentActiveButton = null;
var currentActiveButton2 = null;
var userOS; //User operating system

var buttonsArray = [];

window.electronAPI.getOS((event, os) => {
    const description = document.getElementById('os');
    const osImg = document.getElementById('osImage');
    if (os === 'win32') {
        userOS = os;
        osImg.src = './images/windows.png';
        os = 'Windows'
    }
    else if (os === 'darwin') {
        userOS = os;
        osImg.src = './images/darwin.png';
        os = 'Mac'
    }
    else if (os === 'linux') {
        userOS = os;
        osImg.src = './images/linux.png';
        os = 'Linux'
    }
    description.innerHTML = os;
})

async function createButton(file, i) {
    const div = document.createElement('div');
    div.id = 'div'+i;

    const toggleVisibility = document.createElement('input');
    toggleVisibility.type = 'checkbox';
    toggleVisibility.checked = true;
    toggleVisibility.id = 'switch'+i;
    toggleVisibility.className = 'checkbox';

    const label = document.createElement('label');
    label.htmlFor = 'switch'+i;
    label.className = 'toggle'; 
    
    const button = document.createElement('button');
    const linebreak = document.createElement('br');
    button.innerText = file;
    button.title = file;
    button.className = 'btn btn-outline-primary';
    button.classList.add('btn-ripple');
    button.id = 'fileButton';
    button.type = 'button';
    button.disabled = false;
    
    const view = document.createElement('button');
    view.innerHTML = 'view';
    view.className = 'btn btn-outline-success';
    view.classList.add('btn.ripple');
    view.type = 'button';

    div.appendChild(toggleVisibility);
    div.appendChild(label);
    div.appendChild(button);
    div.appendChild(view);
    div.appendChild(linebreak);

    buttonsContainer.appendChild(div);
    buttonsArray.push(div);

    toggleVisibility.addEventListener('change', () => {
        if (toggleVisibility.checked) {
            setTimeout(() => {
                button.disabled = false;
                view.disabled = false;
                buttonsContainer.removeChild(div);
                buttonsContainer.prepend(div)
            }, 500)
        }
        else {
            setTimeout(() => {
                button.disabled = true;
                view.disabled = true;
                buttonsContainer.removeChild(div);
                buttonsContainer.appendChild(div)
            }, 500)
        }
    })

    // Add event listener to the file button
    button.addEventListener('click', async () => {
        myConfirmBox(file).then((response) => {
            if (response === true) {
                window.electronAPI.copyFile(directoryPath+'/'+file);
                if (currentActiveButton == null) {
                    currentActiveButton = button;
                }
                if (!button.classList.contains('active')) {
                    currentActiveButton.classList.remove('active');
                    currentActiveButton = button;
                    button.classList.add('active');
                }
                document.getElementById('curHostsFile').innerText = file;
                document.getElementById('filePath').innerText = directoryPath+'/'+file;
                view.click();
            }
        });
    })

    view.addEventListener('click', async () => {
        const contents = await window.electronAPI.readFile(directoryPath, file);

        if (currentActiveButton2 == null) {
            currentActiveButton2 = view;
        }
        if (!view.classList.contains('active')) {
            currentActiveButton2.classList.remove('active');
            currentActiveButton2 = view;
            view.classList.add('active');
        }
            
        fileContent.innerHTML = contents;
        document.getElementById('currentView').innerHTML = `Currently viewing <em>${file}</em>`
            
    })
}


function myConfirmBox(replacementFile) {
    let element = document.createElement("div");
    element.classList.add("box-background");
    element.innerHTML = `<div class="box"> 
                            <div>
                                You are replacing your local hosts file with <br><strong>${replacementFile}</strong><br><br>
                                <button type="button" class="btn btn-outline-success" id="trueButton"">Proceed</button>
                                <button type="button" class="btn btn-outline-danger" id="falseButton">Cancel</button>
                            </div>
                          </div>`;
    document.body.appendChild(element);
    return new Promise(function (resolve, reject) {
      document
        .getElementById("trueButton")
        .addEventListener("click", function () {
          resolve(true);
          document.body.removeChild(element);
        });
      document
        .getElementById("falseButton")
        .addEventListener("click", function () {
          resolve(false);
          document.body.removeChild(element);
        });
    });
}

/* Search Field */

const searchField = document.getElementById('searchField');
searchField.addEventListener('input', () => {
    
    const input = document.getElementById('searchField').value.toLowerCase();
    buttonsArray.forEach((div) => {
        if (div.children[2].innerText.toLowerCase().includes(input)) {
            
            div.style.display = '';
        }
        else {
            div.style.display = 'none';
        }
    })
    
})

const uploadButton = document.getElementById('uploadFolder');

uploadButton.addEventListener('click', async () => {
    directoryPath = document.getElementById('searchPath').value;
    console.log(directoryPath);
    const fileNames = await window.electronAPI.loadFolder(directoryPath);
    console.log(fileNames);

    buttonsContainer.innerHTML = '';
    for (let i=0;i<fileNames.length;i++) {
        createButton(fileNames[i], i);
    }
})

/*
uploadButton.addEventListener('click', () => {
    directoryPath = document.getElementById('searchPath').value;
    window.electronAPI.loadFolder(directoryPath);

    /* Getting all file names in directory
    and storing in a string array */
/*
    let fileNames = [];
    
    window.electronAPI.getFiles((event, array) => {
        fileNames = [...array];
        fileNames.sort();
        console.log(fileNames);
    })

    setTimeout(() => {
        console.log('hello');
        for (let i=0;i<fileNames.length;i++) {
            createButton(fileNames[i], i);
        }
    }, 1000); // Could replace with ipcRenderer.sendSync but no need since file is not large

// 2way renderer to main
// send the path, make one async function in main to get all files and then return the file names


*/

    