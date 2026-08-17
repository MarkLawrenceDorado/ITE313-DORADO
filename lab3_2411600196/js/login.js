document.addEventListener('DOMContentLoaded', function () {

    const loginBtn = document.getElementById('loginBtn');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const feedbackDiv = document.getElementById('loginFeedback');

    if (localStorage.getItem('isLoggedIn') === 'true') {
        window.location.href = 'dashboard.html';
    }

    loginBtn.addEventListener('click', function () {
        const username = usernameInput.value.trim(); //change ariaValueMax to value
        const password = passwordInput.value.trim();

        feedbackDiv.innerHTML = '';

        if (username === '' || password === '') {
            showFeedback('Please enter both username and password.', 'danger');
            return;//add return statement to prevent further execution if fields are empty
        }

        const validUsername = 'admin';
        const validPassword = 'password123';

        if (username === validUsername && password === validPassword) /*delete double quotes of variable name to compare to  another variable*/{
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('user', username);

            showFeedback('Login successful! Redirecting...', 'success');

            setTimeout(function () {
                window.location.href = "dashboard.html";
            }, 1000);
        } else {
            showFeedback('Invalid username or password, Please try again.', 'danger');
        }
    });
    function showFeedback(message, type){
        const alertClass = type === 'danger' ? 'alert-danger' : 'alert-success';
        feedbackDiv.innerHTML = `
        <div class="alert ${alertClass} alert-dismissable fade show" role="alert">
            ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
        `;
    }

    usernameInput.addEventListener('keypress', function(e){
        if(e.key ==="Enter"){
            loginBtn.click();
        }
    });

    passwordInput.addEventListener('keypress', function(e){
        if(e.key == 'Enter'){
            loginBtn.click();
        }
    });
});