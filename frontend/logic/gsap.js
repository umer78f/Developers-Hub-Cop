gsap.registerPlugin(ScrollTrigger);

const nav = document.querySelector("#navbar");

/* =============================================
   NAVBAR ANIMATION
   ============================================= */
function animateNavbar() {
    const tl = gsap.timeline();
    tl.from(".nav-logo", {
        y: -80,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out"
    })
        .from(".nav-links li", {
            y: -20,
            opacity: 0,
            stagger: 0.08,
            duration: 0.4,
            ease: "power2.out"
        }, "-=0.3")
        .from(".nav-btn", {
            y: -20,
            opacity: 0,
            duration: 0.4,
            ease: "power2.out"
        }, "-=0.2");
}
animateNavbar();

/* =============================================
   NAV HIDE ON SCROLL
   ============================================= */
function hideNav() {
    let lastScroll = 0;
    let ticking = false;

    window.addEventListener("scroll", () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                const currentScroll = window.pageYOffset;
                if (currentScroll > lastScroll && currentScroll > 80) {
                    gsap.to(nav, { y: "-100%", duration: 0.4, ease: "power2.out", overwrite: true });
                } else {
                    gsap.to(nav, { y: "0%", duration: 0.4, ease: "power2.out", overwrite: true });
                }
                lastScroll = currentScroll;
                ticking = false;
            });
            ticking = true;
        }
    });
}
hideNav();

/* =============================================
   HERO ANIMATION
   - Animate upward (y: 60 → 0), not from above viewport
   - Shorter stagger so it feels snappy, not stuck
   ============================================= */
function heroAnimation() {
    const tl = gsap.timeline({ delay: 0.1 });

    tl.from(".hero-text h1", {
        y: 60,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: "power2.out"
    })
        .from(".hero-description", {
            y: 40,
            opacity: 0,
            duration: 0.7,
            ease: "power2.out"
        }, "-=0.4")
        .from(".hero-btns", {
            y: 30,
            opacity: 0,
            duration: 0.6,
            ease: "power2.out"
        }, "-=0.4");
}
heroAnimation();

gsap.from(".company-title h1", {
    xPercent: 80,
    ease: "none",
    scrollTrigger: {
        trigger: ".company-title",
        start: "top 85%",
        end: "bottom top",
        scrub: 1.2,
        invalidateOnRefresh: true
    }
});

// function cardScrollAnimation() {
//     const container = document.querySelector(".serviceCard-container");
//     const cards = gsap.utils.toArray(".service-cards");
//     if (!container || cards.length === 0) return;

//     const getTravelDistance = () => {
//         const last = cards.at(-1);
//         const totalWidth = last.offsetLeft + last.offsetWidth;
//         const targetX = -(totalWidth - window.innerWidth / 2 - last.offsetWidth / 2);
//         return targetX;
//     };

//     gsap.to(container, {
//         x: getTravelDistance,
//         ease: "none",
//         scrollTrigger: {
//             trigger: ".home-services",
//             start: "top top",
//             end: () => "+=" + Math.abs(getTravelDistance()),
//             scrub: 1,
//             pin: true,
//             anticipatePin: 1,
//             invalidateOnRefresh: true
//         }
//     });
// }


