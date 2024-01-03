document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signup-form');
    const usernameInput = document.getElementById('username');

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = usernameInput.value;
        const response = await fetch(`/check-username?username=${username}`);
        const data = await response.json();

        if (data.exists) {
            alert('Username already exists. Please choose a different username.');
        } else {
            signupForm.submit(); // Submit the form if username is available
        }
    });
});
