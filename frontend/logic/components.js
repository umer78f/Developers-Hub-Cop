function Navbar() {
  const userToken = localStorage.getItem('userToken');
  const userName = localStorage.getItem('userName');
  const isLoggedIn = !!userToken;

  const authButtonDesktop = isLoggedIn
    ? `<div class="nav-auth">
         <span class="nav-user-name"><i class="ri-user-line"></i> ${userName || 'User'}</span>
         <button class="nav-btn btn-secondary" onclick="logoutUser()">Logout</button>
       </div>`
    : `<div class="nav-btn-container">
         <button class="nav-btn btn-primary">
           <a href="register.html" style="color: inherit; text-decoration: none;">Register</a>
         </button>
       </div>`;

  const authButtonMobile = isLoggedIn
    ? `<li class="nav-mobile-btn nav-auth-mobile">
         <span class="nav-user-name"><i class="ri-user-line"></i> ${userName || 'User'}</span>
         <button class="btn-secondary" onclick="logoutUser()">Logout</button>
       </li>`
    : `<li class="nav-mobile-btn">
         <button class="btn-primary">
           <a href="register.html" style="color: inherit; text-decoration: none;">Register</a>
         </button>
       </li>`;

  return `
    <nav class="navbar js-navbar">

      <div class="nav-logo-container">
        <h2 class="nav-logo">Developers Hub</h2>
      </div>

      <!-- Toggle -->
      <div class="nav-toggle js-nav-toggle">
        <span></span>
        <span></span>
        <span></span>
      </div>

      <!-- Links -->
      <ul class="nav-links js-nav-links">
        <li><a href="Home.html">
          <span class="link-wrapper">
            <span class="link-text">Home</span>
            <span class="link-text">Home</span>
        </a></li>

        <li><a href="About.html">
          <span class="link-wrapper">
            <span class="link-text">About</span>
            <span class="link-text">About</span>
        </a></li>

        <li><a href="Services.html">
          <span class="link-wrapper">
            <span class="link-text">Services</span>
            <span class="link-text">Services</span>
        </a></li>

        <li><a href="Portfolio.html">
          <span class="link-wrapper">
            <span class="link-text">Portfolio</span>
            <span class="link-text">Portfolio</span>
        </a></li>

        <li><a href="Blog.html">
          <span class="link-wrapper">
            <span class="link-text">Blog</span>
            <span class="link-text">Blog</span>
        </a></li>

        ${authButtonMobile}
      </ul>

      ${authButtonDesktop}

    </nav>
  `;
}

function logoutUser() {
  localStorage.removeItem('userToken');
  localStorage.removeItem('userName');
  localStorage.removeItem('adminToken');
  window.location.href = 'Home.html';
}

function initNavbar(root) {
  const toggle = root.querySelector(".js-nav-toggle");
  const links = root.querySelector(".js-nav-links");

  if (!toggle || !links) return;

  toggle.addEventListener("click", () => {
    links.classList.toggle("active");
  });
}
const navbarContainer = document.getElementById("navbar");
navbarContainer.innerHTML = Navbar();
initNavbar(navbarContainer);


// footer
function Footer() {
  return `
    <footer class="footer">
      <div class="footer-container">

        <div class="footer-brand">
          <h2>Developers Hub</h2>
          <p>Building modern web experiences with clean design and performance.</p>
        </div>

        <div class="footer-links">
          <h4>Quick Links</h4>
          <ul>
            <li><a href="Home.html">Home</a></li>
            <li><a href="About.html">About</a></li>
            <li><a href="Services.html">Services</a></li>
            <li><a href="Portfolio.html">Portfolio</a></li>
            <li><a href="Blog.html">Blog</a></li>
          </ul>
        </div>

        <div class="footer-contact">
          <h4>Contact</h4>
          <p>Email: contact@devhub.com</p>
          <p>Phone: +92 300 0000000</p>
        </div>

      <div class="footer-bottom">
        <p>© 2026 Developers Hub. All rights reserved.</p>
      </div>
    </footer>
  `;
}

document.getElementById("footer").innerHTML = Footer();
