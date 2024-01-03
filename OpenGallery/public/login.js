document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        // Check if username exists
        let response = await fetch(`/check-username?username=${username}`);
        let data = await response.json();

        if (!data.exists) {
            alert('Username does not exist.');
            return;
        }

        // Validate password
        response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            const result = await response.json();
            // Redirect to the user's profile page using the userId provided by the server
            window.location.href = `/user/${result.userId}`;
        } else {
            const errorMessage = await response.text();
            alert(errorMessage);
        }
    });
});
