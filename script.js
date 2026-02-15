/* ================================
   MATRIX RAIN CANVAS ANIMATION
   ================================ */
function initMatrixRain() {
    const canvas = document.getElementById('matrixCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*()_+-=[]{}|;:,.<>?/~`アカサタナハマヤラワイキシチニヒミリウクスツヌフムユルエケセテネヘメレオコソトノホモロ01';
    const charArr = chars.split('');
    const fontSize = 14;
    let columns = Math.floor(canvas.width / fontSize);
    let drops = new Array(columns).fill(1);
    
    // Randomize initial drops
    for (let i = 0; i < drops.length; i++) {
        drops[i] = Math.random() * -100;
    }
    
    function draw() {
        // Semi-transparent black to create trail effect
        ctx.fillStyle = 'rgba(5, 5, 16, 0.06)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.font = fontSize + 'px JetBrains Mono, monospace';
        
        for (let i = 0; i < drops.length; i++) {
            // Random character
            const text = charArr[Math.floor(Math.random() * charArr.length)];
            
            // Head of the drop is brighter
            const y = drops[i] * fontSize;
            
            if (y > 0) {
                // Bright green for the leading character
                ctx.fillStyle = '#00ff88';
                ctx.fillText(text, i * fontSize, y);
                
                // Dimmer trail
                ctx.fillStyle = 'rgba(0, 240, 255, 0.15)';
                ctx.fillText(charArr[Math.floor(Math.random() * charArr.length)], i * fontSize, y - fontSize);
            }
            
            // Reset drop when it reaches the bottom
            if (y > canvas.height && Math.random() > 0.985) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    }
    
    let animationId;
    function animate() {
        draw();
        animationId = requestAnimationFrame(animate);
    }
    
    // Throttle to ~30fps for performance
    let lastTime = 0;
    function throttledAnimate(currentTime) {
        animationId = requestAnimationFrame(throttledAnimate);
        if (currentTime - lastTime < 33) return; // ~30fps
        lastTime = currentTime;
        draw();
    }
    requestAnimationFrame(throttledAnimate);
    
    // Resize handler
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            resizeCanvas();
            columns = Math.floor(canvas.width / fontSize);
            drops = new Array(columns).fill(1);
            for (let i = 0; i < drops.length; i++) {
                drops[i] = Math.random() * -50;
            }
        }, 200);
    });
}

/* ================================
   TYPING EFFECT
   ================================ */
function initTypingEffect() {
    const typingEl = document.getElementById('typingText');
    if (!typingEl) return;
    
    const phrases = [
        'Securing Cloud Infrastructure',
        'Building Resilient Networks',
        'Encrypting Communications',
        'Automating Security Operations',
        'Designing Disaster Recovery',
        'Hardening System Defenses',
        'Analyzing Vulnerabilities'
    ];
    
    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let isPaused = false;
    
    function type() {
        const current = phrases[phraseIndex];
        
        if (isPaused) {
            isPaused = false;
            isDeleting = true;
            setTimeout(type, 50);
            return;
        }
        
        if (isDeleting) {
            typingEl.textContent = current.substring(0, charIndex - 1);
            charIndex--;
            
            if (charIndex === 0) {
                isDeleting = false;
                phraseIndex = (phraseIndex + 1) % phrases.length;
                setTimeout(type, 400);
                return;
            }
            setTimeout(type, 30);
        } else {
            typingEl.textContent = current.substring(0, charIndex + 1);
            charIndex++;
            
            if (charIndex === current.length) {
                isPaused = true;
                setTimeout(type, 2000);
                return;
            }
            setTimeout(type, 70 + Math.random() * 40);
        }
    }
    
    setTimeout(type, 800);
}

/* ================================
   NAVIGATION
   ================================ */
function initNavigation() {
    const navbar = document.getElementById('navbar');
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');
    const links = document.querySelectorAll('.nav-link');
    
    // Scroll effect — add background on scroll
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
    
    // Mobile hamburger
    if (hamburger) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
    }
    
    // Close mobile menu on link click
    links.forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
        });
    });
    
    // Active link on scroll
    const sections = document.querySelectorAll('section[id]');
    
    function highlightNav() {
        const scrollPos = window.scrollY + 150;
        
        sections.forEach(section => {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            const id = section.getAttribute('id');
            
            if (scrollPos >= top && scrollPos < top + height) {
                links.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === '#' + id) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }
    
    window.addEventListener('scroll', highlightNav);
}

/* ================================
   SCROLL REVEAL ANIMATIONS
   ================================ */
function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                // Once revealed, stop observing
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    reveals.forEach(el => observer.observe(el));
}

/* ================================
   CONTACT FORM
   ================================ */
function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const btn = form.querySelector('.btn-submit');
        const originalText = btn.innerHTML;
        
        // Simulate send animation
        btn.innerHTML = '<span class="btn-icon">⏳</span> Sending...';
        btn.disabled = true;
        btn.style.opacity = '0.7';
        
        setTimeout(() => {
            btn.innerHTML = '<span class="btn-icon">✅</span> Message Sent!';
            btn.style.background = 'linear-gradient(135deg, #00ff88, #00cc6a)';
            
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.disabled = false;
                btn.style.opacity = '1';
                btn.style.background = '';
                form.reset();
            }, 2500);
        }, 1500);
    });
}

/* ================================
   PARALLAX SUBTLE EFFECT
   ================================ */
function initParallax() {
    const hero = document.getElementById('hero');
    
    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY;
        if (scrolled < window.innerHeight) {
            const canvas = document.getElementById('matrixCanvas');
            if (canvas) {
                canvas.style.transform = `translateY(${scrolled * 0.3}px)`;
            }
        }
    });
}

/* ================================
   MAGNETIC HOVER EFFECT ON BUTTONS
   ================================ */
function initMagneticButtons() {
    const buttons = document.querySelectorAll('.btn, .hero-social');
    
    buttons.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            
            btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
        });
        
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = '';
        });
    });
}

/* ================================
   SKILL CARD TILT EFFECT
   ================================ */
function initTiltEffect() {
    const cards = document.querySelectorAll('.project-card, .cert-card');
    
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            
            const tiltX = (y - 0.5) * 6;
            const tiltY = (x - 0.5) * -6;
            
            card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-6px)`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });
}

/* ================================
   GLOWING CURSOR EFFECT ON SECTIONS
   ================================ */
function initGlowCursor() {
    const sections = document.querySelectorAll('.section');
    
    sections.forEach(section => {
        section.addEventListener('mousemove', (e) => {
            const rect = section.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            section.style.setProperty('--cursor-x', `${x}px`);
            section.style.setProperty('--cursor-y', `${y}px`);
        });
    });
}

/* ================================
   COUNTER ANIMATION FOR STATS
   ================================ */
function animateCounters() {
    const counters = document.querySelectorAll('[data-count]');
    
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-count'));
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;
        
        const timer = setInterval(() => {
            current += step;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            counter.textContent = Math.round(current);
        }, 16);
    });
}

/* ================================
   SMOOTH SCROLL ENHANCEMENT
   ================================ */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

/* ================================
   INITIALIZE EVERYTHING
   ================================ */
document.addEventListener('DOMContentLoaded', () => {
    initMatrixRain();
    initTypingEffect();
    initNavigation();
    initScrollReveal();
    initContactForm();
    initParallax();
    initSmoothScroll();
    
    // Delay fancy effects slightly for performance
    setTimeout(() => {
        initMagneticButtons();
        initTiltEffect();
        initGlowCursor();
    }, 500);
});
