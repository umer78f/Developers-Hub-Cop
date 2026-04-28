async function handleLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const res = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (res.ok && data.token) {
            localStorage.setItem('adminToken', data.token);
            window.location.href = 'index.html';
        } else {
            alert(data.message || 'Login failed. Please check your credentials.');
        }
    } catch (err) {
        alert('Could not connect to the server.');
    }
}