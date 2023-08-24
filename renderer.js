const buttonsContainer = document.getElementById('fileButtons'); //Button div 
const fileContent = document.getElementById('contents'); //Sleected file content pre element
var directoryPath = '//svdc2/shared/dev/Common/hosts'; // (global) current directory path
var currentMainButton = null; // current selected main button (copy file button)
var currentViewButton = null; // current selected view button
var userOS; //User operating system

var buttonsArray = []; // array with a div for each file (which contains three buttons each)

window.electronAPI.getOS((event, os) => { // get operating system 
    const description = document.getElementById('os'); // get operating system description
    // Change to appropriate operating system icon in DOM
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
    description.innerHTML = os; // set operating system description to os
})

async function createButton(file, i) { // takes a file and index parameter, corresponding to the div's index within the buttons array
    const div = document.createElement('div'); // create new div element
    div.id = 'div'+i; // make div id to distinguish all file divs

    // Create the toggle button (disable/enable) and assign properties
    const toggleVisibility = document.createElement('input');
    toggleVisibility.type = 'checkbox';
    toggleVisibility.checked = true;
    toggleVisibility.id = 'switch'+i;
    toggleVisibility.className = 'checkbox';

    const label = document.createElement('label');
    label.htmlFor = 'switch'+i;
    label.className = 'toggle'; 
    
    // Create the copy file button and assign properties
    const button = document.createElement('button');
    const linebreak = document.createElement('br');
    button.innerText = file;
    button.title = file;
    button.className = 'btn btn-outline-primary';
    button.classList.add('btn-ripple');
    button.id = 'fileButton';
    button.type = 'button';
    button.disabled = false;
    
    // Create the view button and assign properties
    const view = document.createElement('button');
    view.innerHTML = 'view';
    view.className = 'btn btn-outline-success';
    view.classList.add('btn.ripple');
    view.type = 'button';
    
    // Append all elements created to the div (linebreak is for separating the three buttons of each file)
    div.appendChild(toggleVisibility);
    div.appendChild(label);
    div.appendChild(button);
    div.appendChild(view);
    div.appendChild(linebreak);

    buttonsContainer.appendChild(div); // Add div to the main div in DOM
    buttonsArray.push(div); // Add div to the buttons array

    toggleVisibility.addEventListener('change', () => { // add an on change event to the toggle button
        if (toggleVisibility.checked) { // green/checked
            setTimeout(() => {
                button.disabled = false; // enable copy file button
                buttonsContainer.removeChild(div); // remove the old div from the DOM
                buttonsContainer.prepend(div); // re-add the div to the beginning of the main div
            }, 500) // allow the toggle transition to finish

        }
        else { // red/unchecked
            setTimeout(() => {
                button.disabled = true; // disable copy file button
                buttonsContainer.removeChild(div); // remove the old div fromt he DOM
                buttonsContainer.appendChild(div); // add the new div to the end of the main div
            }, 500) // allow the toggle transition to finish
        }
    })

    // Add event listener to the copy file button
    button.addEventListener('click', async () => { // on click execute asynchronous function
        myConfirmBox(file).then((response) => { // get response from a pop up
            if (response === true) { // user clicks proceed
                window.electronAPI.copyFile(directoryPath+'/'+file); // trigger copy file function in main
                if (currentMainButton == null) { // no current main button has been set yet
                    currentMainButton = button; // set current main button to this button
                }
                if (!button.classList.contains('active')) { // copy file button is not active/enabled
                    currentMainButton.classList.remove('active'); // remove active status of current main button
                    currentMainButton = button; // set current main button to this button
                    currentMainButton.classList.add('active'); // set current main button to active
                }
                view.click(); // trigger the view button
            }
        });
    })

    // Add event listener to the view file button
    view.addEventListener('click', async () => {  // on click execute asnchronous function
        const contents = await window.electronAPI.readFile(directoryPath, file); // get contents of file from callback after executing read file function in main

        if (contents === 'Error while reading contents.\nEnsure you have selected a file and not a folder!') { // error reading contents
            document.getElementById('curHostsFile').innerText = ''; // change current hosts file text in DOM to nothing because copy file function does not execute
        }
        else {
            document.getElementById('curHostsFile').innerText = file; // change current hosts file text in DOM
        }
        if (currentViewButton == null) { // no current view button has been set yet
            currentViewButton = view; // set current view button to this view button
        }
        if (!view.classList.contains('active')) { // view file button is not avtive/enabled
            currentViewButton.classList.remove('active'); // remove active status of current view button
            currentViewButton = view; // set current view button to this view button
            currentViewButton.classList.add('active'); // set current view button to active
        }
            
        fileContent.innerHTML = contents; // change the text element in DOM to file contents
        document.getElementById('currentView').innerHTML = `Currently viewing <em>${file}</em>` // tell users what file is being displayed
    })
}

function myConfirmBox(replacementFile) { // confirmation window before executing the copy file function in main
    let element = document.createElement("div"); // create a new div
    element.classList.add("box-background"); // add class name
    // add the html of the div
    element.innerHTML = `<div class="box">
                            <div>
                                You are replacing your local hosts file with <br><strong>${replacementFile}</strong><br><br>
                                <button type="button" class="btn btn-outline-success" id="trueButton"">Proceed</button>
                                <button type="button" class="btn btn-outline-danger" id="falseButton">Cancel</button>
                            </div>
                          </div>`;
    document.body.appendChild(element); // add this div to the end of the DOM body
    return new Promise(function (resolve, reject) { 
      document
        .getElementById("trueButton") // get true button element
        .addEventListener("click", function () { // click on 'Proceed'
          resolve(true); // return true
          document.body.removeChild(element); // remove the confirmation box div
        });
      document
        .getElementById("falseButton") // get false button element
        .addEventListener("click", function () { // click on 'Cancel'
          resolve(false); // return false
          document.body.removeChild(element); // remove the confirmation box div
        });
    });
}

/* Search Field */

const searchField = document.getElementById('searchField'); // get search field input element
searchField.addEventListener('input', () => { // add event listener to detect changes in in the input field contents 
    const input = document.getElementById('searchField').value.toLowerCase(); // get the input field contents and lower case for non case-sensitive searching
    buttonsArray.forEach((div) => { // loop through each div in buttons array
        if (div.children[2].innerText.toLowerCase().includes(input)) { // 3rd element in div (copy file button with filename as the text) in lower case includes part or all of the input so far
            div.style.display = ''; // keep the display of matching divs
        }
        else {
            div.style.display = 'none'; // hide the display of non-matching divs
        }
    })
})

const uploadButton = document.getElementById('uploadFolder'); // get the upload button (Go button) element

uploadButton.addEventListener('click', async () => { // add event listener on click to the upload button
    directoryPath = document.getElementById('searchPath').value; // get the directory path value from the search field input right before clicking the button
    const fileNames = await window.electronAPI.loadFolder(directoryPath); // send the directory path to main and store result in constant array

    buttonsContainer.innerHTML = ''; // clear the current buttons container when loading in a new directory
    for (let i=0;i<fileNames.length;i++) { // loop through each file in newly loaded directory
        createButton(fileNames[i], i); // create a button for each file
    }
})

// Initial load (hardcoded)
async function initialLoad() {
    const initialFileNames = await window.electronAPI.loadFolder(directoryPath); // send the directory path to main and store result in constant array
    console.log(initialFileNames)
    buttonsContainer.innerHTML = ''; // clear the current buttons container when loading in a new directory
    for (let i=0;i<initialFileNames.length;i++) { // loop through each file in newly loaded directory
        createButton(initialFileNames[i], i); // create a button for each file
    }
}

initialLoad();


