const showFormBtn = document.getElementById("showFormBtn");
const formContainer = document.querySelector(".form-container");
const showRegister = document.getElementById("showRegister");
const showRegisterLoggedOut = document.getElementById("showRegister-loggedInFalse");
const formRegister = document.querySelector(".form-register");
const showLogin = document.getElementById("showLogin");
const showLoginLoggedOut = document.getElementById("showLogin-loggedInFalse");
const mainLogin = document.querySelector(".form-login-loggedOut");
const overlay = document.getElementById("overlay");
const invToken = document.getElementById("invToken");
const regFail = document.getElementById("regFail");
const regSuc = document.getElementById("regSuc");
const verFail = document.getElementById("verFail");
const verSuc = document.getElementById("verSuc");

const textboxFocus = document.getElementById("textboxFocus");
textboxFocus.focus();
const regiFocus = document.getElementById("regiFocus");
regiFocus.focus();
function toggleFormAndOverlay(formElement) {
    const isFormVisible = formElement.style.display === "block";

    if (isFormVisible) {
        formElement.classList.remove("show-form");
        formElement.style.display = "none";
        overlay.style.display = "none";
    } else {
        formElement.classList.add("show-form");
        formElement.style.display = "block";
        overlay.style.display = "block";
    }
}

function hideBothForms() {
    formContainer.classList.remove("show-form");
    formContainer.style.display = "none";
    formRegister.classList.remove("show-form");
    formRegister.style.display = "none";
    mainLogin.classList.remove("show-form");
    mainLogin.style.display = "none";
    overlay.style.display = "none";
}
function unhide() {
    if(formRegister.style.display === "block"){
        
    toggleFormAndOverlay(formRegister);
    formRegister.classList.add('hide');
    }
    
    if (mainLogin) {
        mainLogin.classList.remove('hide');
        mainLogin.style.display = "block";
    } else {
        console.error("mainLogin is null or undefined");
    }
}
function hide(){
    mainLogin.classList.add('hide');
    if(mainLogin.style.display === "block"){
        toggleFormAndOverlay(mainLogin);
    }

    toggleFormAndOverlay(formRegister);
    overlay.style.display = "none";
    showLoginLoggedOut.classList.remove('hide');
    showRegisterLoggedOut.classList.add('show-form');
}
function hideForm(){
    regFail.classList.add('hide');
    if(regFail.style.display === "block"){
        toggleFormAndOverlay(regFail);
    }
    
    toggleFormAndOverlay(formRegister);
    overlay.style.display = "none";
    showLoginLoggedOut.classList.remove('hide');
    showRegisterLoggedOut.classList.add('show-form');
}
showLogin.addEventListener("click", () => {
    toggleFormAndOverlay(mainLogin);
    formContainer.classList.remove("show-form");
    formContainer.style.display = "none";
});
showLoginLoggedOut.addEventListener("click", () => {
    toggleFormAndOverlay(mainLogin);
    formContainer.classList.remove("show-form");
    formContainer.style.display = "none";
});

showRegister.addEventListener("click", () => {
    toggleFormAndOverlay(formRegister);
    formContainer.classList.remove("show-form");
    formContainer.style.display = "none";
});
showRegisterLoggedOut.addEventListener("click", () => {
    toggleFormAndOverlay(formRegister);
    formContainer.classList.remove("show-form");
    formContainer.style.display = "none";
});


showFormBtn.addEventListener("click", () => {
    toggleFormAndOverlay(formContainer);
    formRegister.classList.remove("show-form");
    formRegister.style.display = "none";
});

overlay.addEventListener("click", () => {
    hideBothForms();
});
function performAction(index, motherName) {
    const checkbox = document.getElementById(`myCheckbox${index}`);
    const cellText = document.getElementById(`cellText${index}`);
    const mothersName = JSON.parse(decodeURIComponent(motherName)); // Decode the encoded string

    console.log('Checkbox checked:', checkbox.checked);
    console.log('Index:', index);
    console.log('Mother Name:', mothersName);

    if (checkbox.checked) {
        updateList(index, mothersName); // Pass the correct arguments to updateList function
    }

    cellText.style.textDecoration = checkbox.checked ? 'line-through' : 'none';
}

function updateList(index, motherName) {
    const data = { motherName }; // Send motherName directly as an object
    fetch('/updateList', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data) // Send the updated array to the server
    })
    .then(response => {
        if (response.ok) {
            const userId = window.location.pathname.split('/')[1]; // Get the userID from the current URL
            window.location.href = `/${userId}`; // Redirect to the user-specific page
        } else {
            console.error('Failed to update list');
        }
    })
    .catch(error => console.error('Error:', error));
}
function showHideFunc(i) {
    const display = $("#staticNotes"+i).css("display");
    // Toggle the visibility of the textarea
    $("#textareaMNotes" + i).toggleClass("hide");
  
    // Toggle the visibility of the staticNotes element
    $("#staticNotes" + i).toggleClass("hide");
  
    // Toggle the visibility of the updateConfirm button
    if(display === "none"){
        $("#updateConfirm" + i).addClass("hide");
    } else {
        $("#updateConfirm" + i).removeClass("hide");
    }
  }
function changeText(i){
    const display = $("#staticNotes" + i).css("display");

    if (display === "none") {
        $("#showHide"+i).text("Cancel");
    } else {
        $("#showHide"+i).text("Update");
    }
}
function updateFunc(index, motherName) {
    const mothersName = JSON.parse(decodeURIComponent(motherName));
    const updateNote = $("#updateMNotes" + index).val();

    const data = {
        index: index,
        motherName: mothersName,
        updateNote: updateNote
    };

    fetch('/updateNotes', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (response.ok) {
            const userId = window.location.pathname.split('/')[1]; // Get the userID from the current URL
            window.location.href = `/${userId}`; // Reload the page to display the updated list
        } else {
            console.error('Failed to update list');
        }
    })
    .catch(error => console.error('Error:', error));
};

function validateInput(inputElement) {
    var inputValue = inputElement.value;
    var allowedCharacters = /^[a-zA-Z0-9]*$/;

    if (!allowedCharacters.test(inputValue)) {
        alert("Special characters are not allowed.");
        inputElement.value = inputValue.replace(/[^a-zA-Z0-9]/g, '');
    }
}
        function validateEmail(emailElement) {
            var emailValue = emailElement.value;
            var emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

            if (!emailPattern.test(emailValue)) {
                alert("Please enter a valid email address.");
                emailElement.value = "";
            }
        }