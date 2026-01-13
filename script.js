// ============================================
// THEME TOGGLE WITH CURSOR LIGHT EFFECT
// ============================================

const themeToggle = document.getElementById('themeToggle');
const body = document.body;

// Create cursor light effect overlay
const cursorLight = document.createElement('div');
cursorLight.classList.add('cursor-light-effect');
document.body.insertBefore(cursorLight, document.body.firstChild);

// Load saved theme or default to dark
const savedTheme = localStorage.getItem('theme') || 'dark';
setTheme(savedTheme);

// Enable cursor light effect after a short delay
setTimeout(() => {
    cursorLight.style.opacity = '1';
}, 100);

themeToggle.addEventListener('click', () => {
    const currentTheme = body.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
});

function setTheme(theme) {
    if (theme === 'dark') {
        body.setAttribute('data-theme', 'dark');
    } else {
        body.removeAttribute('data-theme');
    }
    localStorage.setItem('theme', theme);
}

// Track cursor position for light effect
let cursorX = window.innerWidth / 2;
let cursorY = window.innerHeight / 2;

document.addEventListener('mousemove', (e) => {
    cursorX = e.clientX;
    cursorY = e.clientY;

    // Update CSS custom properties for cursor position
    const xPercent = (cursorX / window.innerWidth) * 100;
    const yPercent = (cursorY / window.innerHeight) * 100;

    body.style.setProperty('--cursor-x', `${xPercent}%`);
    body.style.setProperty('--cursor-y', `${yPercent}%`);
});

// Touch support for cursor light effect
document.addEventListener('touchmove', (e) => {
    const touch = e.touches[0];
    if (touch) {
        cursorX = touch.clientX;
        cursorY = touch.clientY;

        const xPercent = (cursorX / window.innerWidth) * 100;
        const yPercent = (cursorY / window.innerHeight) * 100;

        body.style.setProperty('--cursor-x', `${xPercent}%`);
        body.style.setProperty('--cursor-y', `${yPercent}%`);
    }
}, { passive: true });

// ============================================
// CUSTOM CURSOR WITH PLEXUS TRAIL
// ============================================

const cursor = document.querySelector('.cursor-follower');
let targetX = window.innerWidth / 2, targetY = window.innerHeight / 2;
let lastPosX = targetX, lastPosY = targetY;
let cursorSpeed = 0;

// Create canvas for plexus effect
const plexusCanvas = document.createElement('canvas');
plexusCanvas.classList.add('plexus-canvas');
plexusCanvas.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: -1;
`;
document.body.appendChild(plexusCanvas);
const ctx = plexusCanvas.getContext('2d');

// Resize canvas
function resizeCanvas() {
    plexusCanvas.width = window.innerWidth;
    plexusCanvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Trail system
const trailLength = 100;
const trails = [];

// Initialize trail particles at cursor position with 3D sphere positions
const startX = window.innerWidth / 2;
const startY = window.innerHeight / 2;
const goldenRatio = (1 + Math.sqrt(5)) / 2;

for (let i = 0; i < trailLength; i++) {
    // Fibonacci sphere 3D coordinates
    const phi = Math.acos(1 - 2 * (i + 0.5) / trailLength);
    const theta = 2 * Math.PI * (i + 0.5) / goldenRatio;

    trails.push({
        x: startX,
        y: startY,
        baseX: startX,
        baseY: startY,
        scrollOffset: 0,
        size: 0,
        opacity: 0,
        // 3D sphere coordinates
        sphereX: Math.cos(theta) * Math.sin(phi),
        sphereY: Math.cos(phi),
        sphereZ: Math.sin(theta) * Math.sin(phi)
    });
}

document.addEventListener('mousemove', (e) => {
    targetX = e.clientX;
    targetY = e.clientY;

    // Calculate speed
    const dx = targetX - lastPosX;
    const dy = targetY - lastPosY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    cursorSpeed = Math.min(distance / 8, 2.5);

    lastPosX = targetX;
    lastPosY = targetY;
});

// Touch support for mobile Game of Life
document.addEventListener('touchmove', (e) => {
    const touch = e.touches[0];
    if (touch) {
        targetX = touch.clientX;
        targetY = touch.clientY;

        // Calculate speed
        const dx = targetX - lastPosX;
        const dy = targetY - lastPosY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        cursorSpeed = Math.min(distance / 8, 2.5);

        lastPosX = targetX;
        lastPosY = targetY;
    }
}, { passive: true });

document.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    if (touch) {
        targetX = touch.clientX;
        targetY = touch.clientY;
        lastPosX = targetX;
        lastPosY = targetY;
    }
}, { passive: true });

// Scroll tracking for trail inertia
let lastScrollY = window.pageYOffset;
let scrollSpeed = 0;
let scrollOffset = 0;

window.addEventListener('scroll', () => {
    const currentScrollY = window.pageYOffset;
    const scrollDelta = currentScrollY - lastScrollY;
    scrollSpeed = scrollDelta;
    lastScrollY = currentScrollY;
});

let cursorX_pos = window.innerWidth / 2, cursorY_pos = window.innerHeight / 2;

let sphereTime = 0;

// ============================================
// GAME OF LIFE CELLULAR AUTOMATA
// ============================================

// Grid configuration
const GRID_SIZE = 6; // Size of each cell in pixels
const MAX_GENERATIONS = 100; // Cells fade after this many generations
const SPAWN_CHANCE = 0.2; // Chance to spawn a cell at particle position

// Track alive cells with Map<cellKey, generation>
// cellKey format: "x,y" (grid coordinates)
const aliveCells = new Map();
const cellsToSpawn = new Set();
let frameCount = 0;
const EVOLVE_INTERVAL = 5; // Evolve every 5 frames (~12fps for Game of Life)

// Get grid coordinates from pixel position
function getGridCoords(x, y) {
    return {
        gx: Math.floor(x / GRID_SIZE),
        gy: Math.floor(y / GRID_SIZE)
    };
}

// Get cell key from grid coordinates
function getCellKey(gx, gy) {
    return `${gx},${gy}`;
}

// Count alive neighbors for a cell
function countNeighbors(gx, gy) {
    let count = 0;
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue;
            const key = getCellKey(gx + dx, gy + dy);
            if (aliveCells.has(key)) count++;
        }
    }
    return count;
}

// Evolve the grid one generation using Game of Life rules
function evolveGrid() {
    // Get all cells that need to be checked (alive cells + their neighbors)
    const cellsToCheck = new Set();

    for (const [key, generation] of aliveCells) {
        const [gx, gy] = key.split(',').map(Number);

        // Add this cell and all neighbors to check set
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                cellsToCheck.add(getCellKey(gx + dx, gy + dy));
            }
        }
    }

    // Also check all cells that will be spawned this frame
    for (const key of cellsToSpawn) {
        const [gx, gy] = key.split(',').map(Number);
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                cellsToCheck.add(getCellKey(gx + dx, gy + dy));
            }
        }
    }

    // Apply Game of Life rules
    const nextGeneration = new Map();

    for (const key of cellsToCheck) {
        const [gx, gy] = key.split(',').map(Number);
        const neighbors = countNeighbors(gx, gy);
        const isAlive = aliveCells.has(key);
        const willSpawn = cellsToSpawn.has(key);

        if (isAlive) {
            const currentGen = aliveCells.get(key);
            // Cell survives with 2-3 neighbors
            if (neighbors === 2 || neighbors === 3) {
                if (currentGen < MAX_GENERATIONS) {
                    nextGeneration.set(key, currentGen + 1);
                }
            }
            // Cell dies from loneliness (< 2) or overcrowding (> 3)
        } else if (willSpawn || neighbors === 3) {
            // Empty cell becomes alive with exactly 3 neighbors
            // or was spawned this frame
            nextGeneration.set(key, 0);
        }
    }

    // Clear spawn set and update alive cells
    cellsToSpawn.clear();
    aliveCells.clear();

    for (const [key, generation] of nextGeneration) {
        aliveCells.set(key, generation);
    }
}

// Draw Game of Life cells on canvas with 3D shadows
function drawGameOfLife() {
    const isDark = document.body.hasAttribute('data-theme');
    // Light theme: dark cells (#0a0a0c)
    // Dark theme: light cells (#f5f5b6 - warm light)
    const cellColor = isDark ? '245, 245, 182' : '10, 10, 12';
    const shadowColor = isDark ? '0, 0, 0' : '0, 0, 0';

    for (const [key, generation] of aliveCells) {
        const [gx, gy] = key.split(',').map(Number);
        const x = gx * GRID_SIZE;
        const y = gy * GRID_SIZE;

        // Calculate distance to cursor for dynamic shadow
        const dx = x + GRID_SIZE / 2 - cursorX_pos;
        const dy = y + GRID_SIZE / 2 - cursorY_pos;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const shadowIntensity = Math.max(0, 1 - dist / 300);
        const shadowLength = 2 + shadowIntensity * 4;
        const shadowAngle = Math.atan2(dy, dx);
        const shadowX = Math.cos(shadowAngle) * shadowLength;
        const shadowY = Math.sin(shadowAngle) * shadowLength;
        const shadowBlur = 1 + shadowIntensity * 2;

        // Fade out based on generation
        const fadeProgress = generation / MAX_GENERATIONS;
        const opacity = (1 - fadeProgress * 0.7) * 0.15;

        // Draw shadow
        ctx.shadowColor = `rgba(${shadowColor}, ${opacity * shadowIntensity})`;
        ctx.shadowBlur = shadowBlur;
        ctx.shadowOffsetX = shadowX;
        ctx.shadowOffsetY = shadowY;

        // Draw cell with 3D bevel effect
        ctx.fillStyle = `rgba(${cellColor}, ${opacity})`;
        ctx.fillRect(x, y, GRID_SIZE - 1, GRID_SIZE - 1);

        // Add highlight for 3D volume (top-left edge)
        const highlightOpacity = opacity * 0.3;
        ctx.shadowColor = 'transparent';
        ctx.fillStyle = isDark
            ? `rgba(255, 255, 255, ${highlightOpacity})`
            : `rgba(255, 255, 255, ${highlightOpacity})`;
        ctx.fillRect(x, y, GRID_SIZE - 1, 1);
        ctx.fillRect(x, y, 1, GRID_SIZE - 1);

        // Add shadow edge (bottom-right) for depth
        const depthOpacity = opacity * 0.2;
        ctx.fillStyle = isDark
            ? `rgba(0, 0, 0, ${depthOpacity})`
            : `rgba(0, 0, 0, ${depthOpacity})`;
        ctx.fillRect(x, y + GRID_SIZE - 2, GRID_SIZE - 1, 1);
        ctx.fillRect(x + GRID_SIZE - 2, y, 1, GRID_SIZE - 1);

        ctx.shadowColor = 'transparent';
    }
}

function animateCursor() {
    sphereTime += 0.016; // ~60fps

    const dx = targetX - cursorX_pos;
    const dy = targetY - cursorY_pos;

    cursorX_pos += dx * 0.18;
    cursorY_pos += dy * 0.18;

    cursor.style.left = cursorX_pos - 4 + 'px';
    cursor.style.top = cursorY_pos - 4 + 'px';

    // Update scroll offset with decay (inertia effect)
    scrollOffset += scrollSpeed * 0.3;
    scrollOffset *= 0.92;
    scrollSpeed *= 0.85;

    // Clear canvas
    ctx.clearRect(0, 0, plexusCanvas.width, plexusCanvas.height);

    // Draw Game of Life cells (underneath plexus)
    drawGameOfLife();

    // Get theme for color
    const isDark = document.body.hasAttribute('data-theme');
    const particleColor = isDark ? '150, 180, 255' : '100, 100, 120';

    // Update trail particles
    const sphereSnapRadius = 180;

    for (let i = 0; i < trailLength; i++) {
        const trail = trails[i];

        // Initialize scrollOffset
        if (!trail.scrollOffset) trail.scrollOffset = 0;

        // Scroll inertia - farther particles have more delay
        trail.scrollOffset += (scrollOffset - trail.scrollOffset) * (0.1 - i * 0.0005);

        // Trail follows with delay
        if (i === 0) {
            trail.x += (cursorX_pos - trail.x) * (0.14 - i * 0.001);
            trail.y += (cursorY_pos - trail.y) * (0.14 - i * 0.001);
        } else {
            trail.x += (trails[i - 1].x - trail.x) * (0.16 - i * 0.001);
            trail.y += (trails[i - 1].y - trail.y) * (0.16 - i * 0.001);
        }

        // Calculate distance to cursor
        const distToCursorX = trail.x - cursorX_pos;
        const distToCursorY = trail.y - cursorY_pos;
        const distToCursor = Math.sqrt(distToCursorX * distToCursorX + distToCursorY * distToCursorY);

        // Dynamic sphere snap - particles near cursor form 3D sphere around cursor
        if (distToCursor < sphereSnapRadius) {
            // 3D rotation angles
            const rotX = sphereTime * 0.7;
            const rotY = sphereTime * 0.5;
            const rotZ = sphereTime * 0.3;

            // Apply 3D rotation matrices
            const x = trail.sphereX;
            const y = trail.sphereY;
            const z = trail.sphereZ;

            // Rotate around X axis
            let y1 = y * Math.cos(rotX) - z * Math.sin(rotX);
            let z1 = y * Math.sin(rotX) + z * Math.cos(rotX);

            // Rotate around Y axis
            let x2 = x * Math.cos(rotY) + z1 * Math.sin(rotY);
            let z2 = -x * Math.sin(rotY) + z1 * Math.cos(rotY);

            // Rotate around Z axis
            let x3 = x2 * Math.cos(rotZ) - y1 * Math.sin(rotZ);
            let y3 = x2 * Math.sin(rotZ) + y1 * Math.cos(rotZ);

            // Morphing - undulating radius
            const morphWave = Math.sin(sphereTime * 2 + i * 0.2) * 12 +
                             Math.cos(sphereTime * 1.3 + z2 * 4) * 8;
            const baseSphereRadius = 75 + (1 - distToCursor / sphereSnapRadius) * 65;
            const sphereRadius = baseSphereRadius + morphWave;

            // Perspective projection
            const perspective = 500;
            const scale = perspective / (perspective + z2 * sphereRadius);
            const projX = x3 * sphereRadius * scale;
            const projY = y3 * sphereRadius * scale;
            const depthScale = scale; // Use for size/opacity

            // Final 2D position
            const sphereX = cursorX_pos + projX;
            const sphereY = cursorY_pos + projY;

            // Calculate snap strength based on distance to cursor
            const sphereInfluence = 1 - (distToCursor / sphereSnapRadius);
            const sphereStrength = sphereInfluence * 0.3;

            trail.x += (sphereX - trail.x) * sphereStrength;
            trail.y += (sphereY - trail.y) * sphereStrength;

            // Adjust size and opacity based on depth (3D effect)
            trail.depthScale = depthScale;
        } else {
            trail.depthScale = 1;
        }

        trail.baseX = trail.x;
        trail.baseY = trail.y;

        // Size and opacity based on position and depth
        const speedFactor = 1 - (cursorSpeed * 0.25);
        const positionFactor = 1 - (i / trailLength);
        const depthScale = trail.depthScale || 1;
        trail.size = (2 + speedFactor * 6 * positionFactor) * depthScale;
        trail.opacity = (1 - i / trailLength) * 0.6 * Math.max(0.3, depthScale);
    }

    // Spawn cells at particle positions (with some randomness)
    for (let i = 0; i < trailLength; i++) {
        const trail = trails[i];
        const finalY = trail.baseY + trail.scrollOffset;

        // Spawn cells at particle positions based on probability
        if (Math.random() < SPAWN_CHANCE) {
            const gridPos = getGridCoords(trail.baseX, finalY);
            const key = getCellKey(gridPos.gx, gridPos.gy);
            cellsToSpawn.add(key);
        }
    }

    // Evolve the grid periodically (slower than frame rate for visible patterns)
    frameCount++;
    if (frameCount >= EVOLVE_INTERVAL) {
        evolveGrid();
        frameCount = 0;
    }

    // Draw plexus connections
    const connectionDistance = 80;

    for (let i = 0; i < trailLength; i++) {
        const trail = trails[i];
        const finalY = trail.baseY + trail.scrollOffset;

        // Calculate dynamic shadow for particle (opposite to cursor)
        const dx = trail.baseX - cursorX_pos;
        const dy = finalY - cursorY_pos;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const shadowIntensity = Math.max(0, 1 - dist / 400);
        const shadowLength = 40 + shadowIntensity * 120;
        const shadowAngle = Math.atan2(dy, dx);
        const shadowX = Math.cos(shadowAngle) * shadowLength;
        const shadowY = Math.sin(shadowAngle) * shadowLength;
        const shadowBlur = 1 + shadowIntensity * 2;
        const shadowOpacity = trail.opacity * (0.8 + shadowIntensity * 0.6);

        // Draw particle with sharp dynamic shadow
        ctx.beginPath();
        ctx.arc(trail.baseX, finalY, trail.size * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${particleColor}, ${trail.opacity})`;
        ctx.shadowColor = `rgba(0, 0, 0, ${shadowOpacity})`;
        ctx.shadowBlur = shadowBlur;
        ctx.shadowOffsetX = shadowX;
        ctx.shadowOffsetY = shadowY;
        ctx.fill();
        ctx.shadowColor = 'transparent';

        // Draw connections to nearby particles
        for (let j = i + 1; j < trailLength; j++) {
            const other = trails[j];
            const otherFinalY = other.baseY + other.scrollOffset;

            const distX = trail.baseX - other.baseX;
            const distY = finalY - otherFinalY;
            const distance = Math.sqrt(distX * distX + distY * distY);

            if (distance < connectionDistance) {
                const opacity = (1 - distance / connectionDistance) *
                               Math.min(trail.opacity, other.opacity) * 0.5;
                const lineWidth = (1 - distance / connectionDistance) * 1.5;

                ctx.beginPath();
                ctx.moveTo(trail.baseX, finalY);
                ctx.lineTo(other.baseX, otherFinalY);
                ctx.strokeStyle = `rgba(${particleColor}, ${opacity})`;
                ctx.lineWidth = lineWidth;
                ctx.stroke();
            }
        }
    }

    // Decay speed when not moving
    cursorSpeed *= 0.9;

    requestAnimationFrame(animateCursor);
}

animateCursor();

// Cursor hover effects on interactive elements
const interactiveElements = document.querySelectorAll('a, button, .work-card, .skill-tag, .social-link, .theme-toggle');

interactiveElements.forEach(el => {
    el.addEventListener('mouseenter', () => {
        cursor.classList.add('active');
    });
    el.addEventListener('mouseleave', () => {
        cursor.classList.remove('active');
    });
});

// ============================================
// NAVIGATION
// ============================================

const nav = document.querySelector('.nav');
const hamburger = document.querySelector('.nav__hamburger');
const navMenu = document.querySelector('.nav__menu');

// Scroll effect
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
        nav.classList.add('scrolled');
    } else {
        nav.classList.remove('scrolled');
    }

    lastScroll = currentScroll;
});

// Mobile menu toggle
hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Smooth scroll for nav links
document.querySelectorAll('.nav__link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(link.getAttribute('href'));
        target.scrollIntoView({ behavior: 'smooth' });
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

// ============================================
// HERO ANIMATIONS
// ============================================

// Animate words on load (if exist)
const words = document.querySelectorAll('.word');
if (words.length > 0) {
    words.forEach((word, index) => {
        word.style.opacity = '0';
        word.style.transform = 'translateY(40px)';
        setTimeout(() => {
            word.style.transition = 'all 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            word.style.opacity = '1';
            word.style.transform = 'translateY(0)';
        }, 200 + index * 150);
    });
}

// Animate subtitle characters (if exist)
const chars = document.querySelectorAll('.char');
if (chars.length > 0) {
    chars.forEach((char, index) => {
        char.style.opacity = '0';
        char.style.display = 'inline-block';
        setTimeout(() => {
            char.style.transition = 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            char.style.opacity = '1';
        }, 600 + index * 25);
    });
}

// Magnetic effect on CTA button (if exists)
const ctaButton = document.querySelector('.hero__cta .btn-neo');
if (ctaButton) {
    ctaButton.addEventListener('mousemove', (e) => {
        const rect = ctaButton.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        ctaButton.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
    });

    ctaButton.addEventListener('mouseleave', () => {
        ctaButton.style.transform = 'translate(0, 0)';
    });
}

// ============================================
// WORK CARDS - TILT EFFECT
// ============================================

const workCards = document.querySelectorAll('.work-card');

workCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = (y - centerY) / 12;
        const rotateY = (centerX - x) / 12;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
    });

    // Touch support for tilt effect
    card.addEventListener('touchmove', (e) => {
        const touch = e.touches[0];
        if (touch) {
            const rect = card.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = (y - centerY) / 12;
            const rotateY = (centerX - x) / 12;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
        }
    }, { passive: true });

    card.addEventListener('touchend', () => {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
    });
});

// ============================================
// PARALLAX EFFECT ON ORBS
// ============================================

const orbs = document.querySelectorAll('.gradient-orb');

document.addEventListener('mousemove', (e) => {
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;

    orbs.forEach((orb, index) => {
        const speed = (index + 1) * 15;
        const xOffset = (x - 0.5) * speed;
        const yOffset = (y - 0.5) * speed;
        orb.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
    });
});

// Touch support for orbs parallax
document.addEventListener('touchmove', (e) => {
    const touch = e.touches[0];
    if (touch) {
        const x = touch.clientX / window.innerWidth;
        const y = touch.clientY / window.innerHeight;

        orbs.forEach((orb, index) => {
            const speed = (index + 1) * 15;
            const xOffset = (x - 0.5) * speed;
            const yOffset = (y - 0.5) * speed;
            orb.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
        });
    }
}, { passive: true });

// ============================================
// SCROLL ANIMATIONS
// ============================================

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -80px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe elements for scroll animation
document.querySelectorAll('.work-card, .stat-item, .skill-tag, .about-paragraph').forEach(el => {
    el.style.opacity = '0';
    observer.observe(el);
});

// ============================================
// STATS COUNTER ANIMATION
// ============================================

const statItems = document.querySelectorAll('.stat-item');

const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const target = entry.target;
            const count = parseInt(target.dataset.count);
            const numberEl = target.querySelector('.stat-number');

            animateCounter(numberEl, count);
            statsObserver.unobserve(target);
        }
    });
}, { threshold: 0.5 });

statItems.forEach(item => statsObserver.observe(item));

function animateCounter(element, target) {
    let current = 0;
    const increment = target / 45;
    const duration = 1200;
    const stepTime = duration / 45;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target + '+';
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current) + '+';
        }
    }, stepTime);
}

// ============================================
// SOCIAL LINKS - SUBTLE GRAY EFFECTS
// ============================================

const socialLinks = document.querySelectorAll('.social-link');

socialLinks.forEach(link => {
    link.addEventListener('mouseenter', function() {
        // Skip disabled links
        if (this.classList.contains('social-link--disabled')) return;

        const social = this.dataset.social;
        const grays = {
            instagram: 'var(--gray-80)',
            telegram: 'var(--gray-75)',
            vk: 'var(--gray-70)',
            github: 'var(--gray-65)'
        };

        this.style.background = grays[social] || 'var(--gray-70)';
    });

    link.addEventListener('mouseleave', function() {
        // Skip disabled links
        if (this.classList.contains('social-link--disabled')) return;

        this.style.background = '';
    });
});

// ============================================
// SKILL TAGS - SUBTLE MOVEMENT
// ============================================

const skillTags = document.querySelectorAll('.skill-tag');

skillTags.forEach(tag => {
    tag.addEventListener('mouseenter', () => {
        const randomX = (Math.random() - 0.5) * 6;
        const randomY = (Math.random() - 0.5) * 6;
        tag.style.transform = `translate(${randomX}px, ${randomY}px) scale(1.02)`;
    });

    tag.addEventListener('mouseleave', () => {
        tag.style.transform = '';
    });
});

// ============================================
// SMOOTH REVEAL ON SCROLL
// ============================================

let ticking = false;

window.addEventListener('scroll', () => {
    if (!ticking) {
        window.requestAnimationFrame(() => {
            const scrolled = window.pageYOffset;
            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPercent = scrolled / maxScroll;

            // Parallax for hero content
            const heroContent = document.querySelector('.hero__content');
            if (heroContent && scrolled < window.innerHeight) {
                heroContent.style.transform = `translateY(${scrolled * 0.25}px)`;
                heroContent.style.opacity = 1 - scrollPercent * 0.4;
            }

            ticking = false;
        });

        ticking = true;
    }
});

// ============================================
// PRELOADER
// ============================================

window.addEventListener('load', () => {
    document.body.classList.add('loaded');

    setTimeout(() => {
        document.querySelectorAll('.hero__content > *').forEach((el, i) => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        });
    }, 100);
});

// ============================================
// EASTER EGG - INVERT EFFECT
// ============================================

const konamiCode = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];
let konamiIndex = 0;

document.addEventListener('keydown', (e) => {
    if (e.keyCode === konamiCode[konamiIndex]) {
        konamiIndex++;
        if (konamiIndex === konamiCode.length) {
            activateEasterEgg();
            konamiIndex = 0;
        }
    } else {
        konamiIndex = 0;
    }
});

function activateEasterEgg() {
    // Dramatic invert effect
    document.body.style.transition = 'filter 2.5s ease';
    document.body.style.filter = 'invert(1)';

    setTimeout(() => {
        document.body.style.filter = '';
    }, 15000);
}

// ============================================
// PERFORMANCE THROTTLE
// ============================================

function throttle(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

const throttledMouseMove = throttle((e) => {
    // Throttled operations
}, 16);

document.addEventListener('mousemove', throttledMouseMove);

console.log('АРТЕФАКТ Portfolio - Japanese Minimalist ◻');

// ============================================
// KINETIC TYPOGRAPHY - Living Text Effects
// ============================================

// Random imperfection for hand-made feel
function addRandomImperfection() {
    const kineticChars = document.querySelectorAll('.kinetic-char');
    const randomChar = kineticChars[Math.floor(Math.random() * kineticChars.length)];

    if (randomChar && Math.random() > 0.7) {
        const effects = ['glitch', 'shake'];
        const effect = effects[Math.floor(Math.random() * effects.length)];

        randomChar.classList.add(effect);
        setTimeout(() => {
            randomChar.classList.remove(effect);
        }, 500);
    }
}

// Add imperfections periodically
setInterval(addRandomImperfection, 800);

// Cursor proximity effect for text - DISABLED (conflicts with scramble)
/*
let mouseX = 0, mouseY = 0;

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    // Check proximity to kinetic characters
    document.querySelectorAll('.kinetic-char').forEach(char => {
        const rect = char.getBoundingClientRect();
        const charCenterX = rect.left + rect.width / 2;
        const charCenterY = rect.top + rect.height / 2;

        const distance = Math.sqrt(
            Math.pow(mouseX - charCenterX, 2) +
            Math.pow(mouseY - charCenterY, 2)
        );

        if (distance < 100) {
            const proximity = 1 - (distance / 100);
            const scale = 1 + (proximity * 0.1);
            const brightness = proximity * 0.3;

            char.style.transform = `scale(${scale})`;
            char.style.filter = `brightness(${1 + brightness})`;
        } else {
            char.style.transform = '';
            char.style.filter = '';
        }
    });
});
*/

// Scroll reactive text
const scrollTexts = document.querySelectorAll('[data-scroll-text]');

if (scrollTexts.length > 0) {
    window.addEventListener('scroll', () => {
        const scrollPercent = window.pageYOffset / (document.documentElement.scrollHeight - window.innerHeight);

        scrollTexts.forEach(text => {
            const rect = text.getBoundingClientRect();
            const elementCenter = rect.top + rect.height / 2;
            const viewportCenter = window.innerHeight / 2;
            const distanceFromCenter = Math.abs(elementCenter - viewportCenter) / viewportCenter;

            if (distanceFromCenter < 0.5) {
                const effect = 1 - distanceFromCenter * 2;
                text.style.letterSpacing = `${-0.02 + (effect * 0.03)}em`;
                text.style.fontWeight = 300 + (effect * 100);
            }
        });
    });
}

// Density shift on scroll for section titles
const sectionTitles = document.querySelectorAll('[data-kinetic="section"]');

const densityObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        const title = entry.target;
        const chars = title.querySelectorAll('.kinetic-char');

        if (entry.isIntersecting) {
            // Animate characters in sequence
            chars.forEach((char, i) => {
                setTimeout(() => {
                    char.style.opacity = '1';
                    char.style.transform = 'translateY(0)';
                }, i * 30);
            });
        }
    });
}, { threshold: 0.3 });

sectionTitles.forEach(title => {
    const chars = title.querySelectorAll('.kinetic-char');
    chars.forEach(char => {
        char.style.opacity = '0';
        char.style.transform = 'translateY(10px)';
    });
    densityObserver.observe(title);
});

// Parallax effect for kinetic text
document.addEventListener('mousemove', (e) => {
    const x = (e.clientX - window.innerWidth / 2) / window.innerWidth;
    const y = (e.clientY - window.innerHeight / 2) / window.innerHeight;

    const kineticTitles = document.querySelectorAll('[data-kinetic="title"]');
    kineticTitles.forEach(title => {
        const chars = title.querySelectorAll('.kinetic-char');
        chars.forEach((char, i) => {
            const depth = (i % 3 + 1) * 0.5;
            const moveX = x * depth * 3;
            const moveY = y * depth * 3;
            char.style.transform = `translate(${moveX}px, ${moveY}px)`;
        });
    });
});

// Subtle text texture animation
function animateTextTexture() {
    const texturedTexts = document.querySelectorAll('.text-textured');

    texturedTexts.forEach(text => {
        const chars = text.querySelectorAll('.kinetic-char');
        chars.forEach(char => {
            const randomOffset = Math.random() * 0.3 - 0.15;
            char.style.textShadow = `${randomOffset}px 0 0 rgba(128,128,128,0.1)`;
        });
    });

    requestAnimationFrame(() => {
        setTimeout(animateTextTexture, 100);
    });
}

// Start texture animation after a delay
setTimeout(animateTextTexture, 1000);

// ============================================
// DYNAMIC PERSPECTIVE SHADOWS IN DARK THEME
// ============================================

const shadowElements = document.querySelectorAll('.work-card, .btn-neo, .skill-tag, .social-link, .logo-text, .kinetic-char, .about-paragraph, .contact-title .logo-char');

document.addEventListener('mousemove', (e) => {
    // Only apply in dark theme
    if (!document.body.hasAttribute('data-theme')) return;

    const mouseX = e.clientX;
    const mouseY = e.clientY;

    shadowElements.forEach(el => {
        const rect = el.getBoundingClientRect();
        const elCenterX = rect.left + rect.width / 2;
        const elCenterY = rect.top + rect.height / 2;

        // Calculate distance from cursor to element
        const distX = mouseX - elCenterX;
        const distY = mouseY - elCenterY;
        const distance = Math.sqrt(distX * distX + distY * distY);

        // Only cast shadow if cursor is within range
        if (distance < 500) {
            const intensity = Math.max(0, 1 - distance / 500);
            const shadowLength = 60 + intensity * 80;

            // Shadow direction opposite to cursor (light source)
            const angle = Math.atan2(distY, distX);
            const shadowX = -Math.cos(angle) * shadowLength;
            const shadowY = -Math.sin(angle) * shadowLength;

            const blurRadius = 20 + intensity * 30;
            const shadowOpacity = 0.4 + intensity * 0.3;

            // Use text-shadow for kinetic-char, logo-text, about-paragraph, and contact-title, box-shadow for others
            if (el.classList.contains('kinetic-char') || el.classList.contains('logo-text') || el.classList.contains('about-paragraph') || el.closest('.contact-title')) {
                // Single dynamic shadow for text
                const textShadowX = shadowX * 0.5;
                const textShadowY = shadowY * 0.5;
                const textBlur = blurRadius * 0.4;
                const textOpacity = Math.min(shadowOpacity * 1.3, 0.95);
                el.style.textShadow = `${textShadowX}px ${textShadowY}px ${textBlur}px rgba(0, 0, 0, ${textOpacity})`;
            } else {
                // Single dynamic shadow for all other elements
                el.style.boxShadow = `${shadowX}px ${shadowY}px ${blurRadius}px rgba(0, 0, 0, ${shadowOpacity})`;
            }
        } else {
            if (el.classList.contains('kinetic-char') || el.classList.contains('logo-text') || el.classList.contains('about-paragraph') || el.closest('.contact-title')) {
                el.style.textShadow = '';
            } else {
                el.style.boxShadow = '';
            }
        }
    });
});

// Touch support for dynamic shadows
document.addEventListener('touchmove', (e) => {
    // Only apply in dark theme
    if (!document.body.hasAttribute('data-theme')) return;

    const touch = e.touches[0];
    if (!touch) return;

    const mouseX = touch.clientX;
    const mouseY = touch.clientY;

    shadowElements.forEach(el => {
        const rect = el.getBoundingClientRect();
        const elCenterX = rect.left + rect.width / 2;
        const elCenterY = rect.top + rect.height / 2;

        // Calculate distance from touch to element
        const distX = mouseX - elCenterX;
        const distY = mouseY - elCenterY;
        const distance = Math.sqrt(distX * distX + distY * distY);

        // Only cast shadow if touch is within range
        if (distance < 500) {
            const intensity = Math.max(0, 1 - distance / 500);
            const shadowLength = 60 + intensity * 80;

            // Shadow direction opposite to touch (light source)
            const angle = Math.atan2(distY, distX);
            const shadowX = -Math.cos(angle) * shadowLength;
            const shadowY = -Math.sin(angle) * shadowLength;

            const blurRadius = 20 + intensity * 30;
            const shadowOpacity = 0.4 + intensity * 0.3;

            // Use text-shadow for kinetic-char, logo-text, about-paragraph, and contact-title, box-shadow for others
            if (el.classList.contains('kinetic-char') || el.classList.contains('logo-text') || el.classList.contains('about-paragraph') || el.closest('.contact-title')) {
                // Single dynamic shadow for text
                const textShadowX = shadowX * 0.5;
                const textShadowY = shadowY * 0.5;
                const textBlur = blurRadius * 0.4;
                const textOpacity = Math.min(shadowOpacity * 1.3, 0.95);
                el.style.textShadow = `${textShadowX}px ${textShadowY}px ${textBlur}px rgba(0, 0, 0, ${textOpacity})`;
            } else {
                // Single dynamic shadow for all other elements
                el.style.boxShadow = `${shadowX}px ${shadowY}px ${blurRadius}px rgba(0, 0, 0, ${shadowOpacity})`;
            }
        } else {
            if (el.classList.contains('kinetic-char') || el.classList.contains('logo-text') || el.classList.contains('about-paragraph') || el.closest('.contact-title')) {
                el.style.textShadow = '';
            } else {
                el.style.boxShadow = '';
            }
        }
    });
}, { passive: true });

// ============================================
// OVERHEATING LAMP EFFECT - LIGHT THEME
// ============================================

const glowingElements = document.querySelectorAll('.work-card, .btn-neo, .skill-tag, .social-link, .kinetic-char');
const elementState = new Map();

glowingElements.forEach(el => {
    el.addEventListener('mouseenter', () => {
        // Skip in dark theme
        if (document.body.hasAttribute('data-theme')) return;

        const state = elementState.get(el) || {
            heat: 0,
            isDead: false,
            flickerInterval: null
        };

        if (!state.isDead) {
            state.heatInterval = setInterval(() => {
                state.heat += 0.8;

                // Gradual glow increase
                const progress = Math.min(state.heat / 100, 1);
                const redShift = progress * 60;
                const brightness = 1 + progress * 0.5;
                const glow = progress * 300;

                el.style.filter = `brightness(${brightness}) saturate(${1 + progress * 0.3})`;

                // Use text-shadow for kinetic-char, box-shadow for others
                if (el.classList.contains('kinetic-char')) {
                    const textGlow = glow * 0.5;
                    el.style.textShadow = `
                        0 0 ${textGlow}px rgba(255, ${200 - redShift}, ${150 - redShift}, ${progress * 0.8}),
                        0 0 ${textGlow * 2}px rgba(255, ${150 - redShift}, ${100 - redShift}, ${progress * 0.5})
                    `;
                } else {
                    el.style.boxShadow = `
                        0 0 ${glow}px rgba(255, ${150 - redShift}, ${100 - redShift}, ${progress * 0.5}),
                        0 0 ${glow * 2}px rgba(255, ${100 - redShift}, ${50 - redShift}, ${progress * 0.3}),
                        inset 0 0 ${glow}px rgba(255, 200, 150, ${progress * 0.2})
                    `;
                }

                // Explosion point - lamp "blows"
                if (state.heat >= 100) {
                    clearInterval(state.heatInterval);

                    // Flash white then dead
                    el.style.transition = 'all 0.05s';
                    el.style.filter = 'brightness(30) saturate(0)';
                    if (el.classList.contains('kinetic-char')) {
                        el.style.textShadow = '0 0 50px rgba(255, 255, 255, 0.9)';
                    } else {
                        el.style.boxShadow = '0 0 100px rgba(255, 255, 255, 0.9)';
                    }

                    setTimeout(() => {
                        el.style.filter = '';
                        if (el.classList.contains('kinetic-char')) {
                            el.style.textShadow = '';
                        } else {
                            el.style.boxShadow = '';
                        }
                        el.style.transition = 'all 0.3s';

                        // Start flickering mode
                        state.isDead = true;
                        startFlickering(el, state);
                    }, 100);

                    elementState.set(el, state);
                } else {
                    elementState.set(el, state);
                }
            }, 30);
        }

        elementState.set(el, state);
    });

    el.addEventListener('mouseleave', () => {
        const state = elementState.get(el);
        if (state && state.heatInterval) {
            clearInterval(state.heatInterval);
        }

        // Only cool down if not dead
        if (state && !state.isDead) {
            el.style.filter = '';
            if (el.classList.contains('kinetic-char')) {
                el.style.textShadow = '';
            } else {
                el.style.boxShadow = '';
            }
            state.heat = 0;
            elementState.set(el, state);
        }
    });
});

function startFlickering(el, state) {
    const flicker = () => {
        // Random flicker behavior like halogen lamp
        const flickerType = Math.random();

        if (flickerType < 0.15) {
            // Momentary drop - almost dead
            el.style.filter = 'brightness(0.2) grayscale(0.9)';
            setTimeout(() => {
                el.style.filter = '';
            }, 50 + Math.random() * 150);
        } else if (flickerType < 0.3) {
            // Brief surge - comes back to life for moment
            el.style.filter = 'brightness(1.2) saturate(0.8)';
            if (el.classList.contains('kinetic-char')) {
                el.style.textShadow = '0 0 8px rgba(255, 200, 150, 0.3)';
            } else {
                el.style.boxShadow = '0 0 15px rgba(255, 200, 150, 0.3)';
            }
            setTimeout(() => {
                el.style.filter = '';
                if (el.classList.contains('kinetic-char')) {
                    el.style.textShadow = '';
                } else {
                    el.style.boxShadow = '';
                }
            }, 100 + Math.random() * 300);
        } else if (flickerType < 0.45) {
            // Rapid flicker sequence
            let count = 0;
            const rapidFlicker = setInterval(() => {
                el.style.filter = count % 2 === 0
                    ? 'brightness(0.2) grayscale(0.9)'
                    : 'brightness(0.4) grayscale(0.7)';
                count++;
                if (count > 6) {
                    clearInterval(rapidFlicker);
                    el.style.filter = '';
                }
            }, 40);
        } else {
            // 55% - Normal state, no issues
            el.style.filter = '';
            if (el.classList.contains('kinetic-char')) {
                el.style.textShadow = '';
            } else {
                el.style.boxShadow = '';
            }
        }

        // Schedule next flicker - random interval but not too long
        const nextFlicker = 500 + Math.random() * 2500;
        state.flickerInterval = setTimeout(flicker, nextFlicker);
    };

    // Start flickering cycle
    flicker();
}

// ============================================
// WEBGL FLUID MORPHING EFFECT
// ============================================

(function initFluidMorphing() {
    const canvas = document.getElementById('fluidMorphCanvas');
    if (!canvas) return;

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return;

    // Resize canvas
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Vertex shader - simple pass-through
    const vertexShaderSource = `
        attribute vec2 a_position;
        attribute vec2 a_texCoord;
        varying vec2 v_texCoord;
        void main() {
            gl_Position = vec4(a_position, 0.0, 1.0);
            v_texCoord = a_texCoord;
        }
    `;

    // Fragment shader - fluid noise distortion
    const fragmentShaderSource = `
        precision highp float;
        varying vec2 v_texCoord;
        uniform float u_time;
        uniform vec2 u_resolution;
        uniform vec2 u_mouse;
        uniform float u_mouseInfluence;

        // Simplex noise function
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

        float snoise(vec2 v) {
            const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
            vec2 i  = floor(v + dot(v, C.yy));
            vec2 x0 = v - i + dot(i, C.xx);
            vec2 i1;
            i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
            vec4 x12 = x0.xyxy + C.xxzz;
            x12.xy -= i1;
            i = mod289(i);
            vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
            vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
            m = m*m;
            m = m*m;
            vec3 x = 2.0 * fract(p * C.www) - 1.0;
            vec3 h = abs(x) - 0.5;
            vec3 ox = floor(x + 0.5);
            vec3 a0 = x - ox;
            m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
            vec3 g;
            g.x = a0.x * x0.x + h.x * x0.y;
            g.yz = a0.yz * x12.xz + h.yz * x12.yw;
            return 130.0 * dot(m, g);
        }

        // Fractal Brownian Motion
        float fbm(vec2 p) {
            float value = 0.0;
            float amplitude = 0.5;
            float frequency = 1.0;
            for (int i = 0; i < 5; i++) {
                value += amplitude * snoise(p * frequency);
                amplitude *= 0.5;
                frequency *= 2.0;
            }
            return value;
        }

        void main() {
            vec2 uv = v_texCoord;
            vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
            vec2 p = uv * aspect;

            // Mouse influence
            vec2 mousePos = u_mouse * aspect;
            float mouseDist = length(p - mousePos);
            float mouseEffect = smoothstep(0.5, 0.0, mouseDist) * u_mouseInfluence;

            // Time-based fluid movement
            float t = u_time * 0.3;

            // Layered noise for fluid effect
            float noise1 = fbm(p * 2.0 + vec2(t * 0.5, t * 0.3));
            float noise2 = fbm(p * 3.0 - vec2(t * 0.4, t * 0.6));
            float noise3 = fbm(p * 1.5 + vec2(t * 0.2, -t * 0.4));

            // Combine noise layers
            float fluidNoise = noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2;

            // Add mouse influence to fluid
            fluidNoise += mouseEffect * 0.5;

            // Create distortion vectors
            vec2 distort = vec2(
                snoise(p * 2.0 + t + fluidNoise),
                snoise(p * 2.0 - t * 0.7 + fluidNoise)
            );

            // Apply distortion with varying intensity
            float distortIntensity = 0.02 + mouseEffect * 0.03;
            vec2 distortedUV = uv + distort * distortIntensity;

            // Create flowing color based on noise
            vec3 color1 = vec3(0.04, 0.06, 0.08);  // Very dark blue
            vec3 color2 = vec3(0.06, 0.09, 0.12);  // Dark blue
            vec3 color3 = vec3(0.03, 0.05, 0.07);  // Even darker

            // Mix colors based on fluid noise
            vec3 fluidColor = mix(color1, color2, fluidNoise * 0.3 + 0.35);
            fluidColor = mix(fluidColor, color3, sin(t + fluidNoise * 3.0) * 0.15 + 0.15);

            // Add very subtle glow around mouse
            float glow = smoothstep(0.5, 0.0, mouseDist) * 0.05;
            fluidColor += vec3(0.1, 0.12, 0.15) * glow * u_mouseInfluence;

            // Add subtle variation
            float variation = snoise(distortedUV * 5.0 + t) * 0.03;
            fluidColor += variation;

            gl_FragColor = vec4(fluidColor, 0.25);
        }
    `;

    // Compile shader
    function compileShader(source, type) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader compile error:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    // Create program
    const vertexShader = compileShader(vertexShaderSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program link error:', gl.getProgramInfoLog(program));
        return;
    }

    gl.useProgram(program);

    // Set up geometry (full-screen quad)
    const positions = new Float32Array([
        -1, -1,  1, -1,  -1, 1,
        -1,  1,  1, -1,   1, 1
    ]);

    const texCoords = new Float32Array([
        0, 1,  1, 1,  0, 0,
        0, 0,  1, 1,  1, 0
    ]);

    // Position buffer
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    const positionLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    // TexCoord buffer
    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
    const texCoordLoc = gl.getAttribLocation(program, 'a_texCoord');
    gl.enableVertexAttribArray(texCoordLoc);
    gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);

    // Uniforms
    const timeLoc = gl.getUniformLocation(program, 'u_time');
    const resolutionLoc = gl.getUniformLocation(program, 'u_resolution');
    const mouseLoc = gl.getUniformLocation(program, 'u_mouse');
    const mouseInfluenceLoc = gl.getUniformLocation(program, 'u_mouseInfluence');

    // Mouse tracking
    let mouseX = 0.5, mouseY = 0.5;
    let targetMouseX = 0.5, targetMouseY = 0.5;
    let mouseInfluence = 0;
    let targetMouseInfluence = 0;

    document.addEventListener('mousemove', (e) => {
        targetMouseX = e.clientX / window.innerWidth;
        targetMouseY = 1.0 - e.clientY / window.innerHeight;
        targetMouseInfluence = 1.0;
    });

    // Touch support for fluid morphing
    document.addEventListener('touchmove', (e) => {
        const touch = e.touches[0];
        if (touch) {
            targetMouseX = touch.clientX / window.innerWidth;
            targetMouseY = 1.0 - touch.clientY / window.innerHeight;
            targetMouseInfluence = 1.0;
        }
    }, { passive: true });

    document.addEventListener('touchend', () => {
        targetMouseInfluence = 0;
    });

    document.addEventListener('mouseleave', () => {
        targetMouseInfluence = 0;
    });

    // Animation loop
    let startTime = Date.now();
    function animate() {
        // Smooth mouse following
        mouseX += (targetMouseX - mouseX) * 0.05;
        mouseY += (targetMouseY - mouseY) * 0.05;
        mouseInfluence += (targetMouseInfluence - mouseInfluence) * 0.03;

        const time = (Date.now() - startTime) / 1000;

        gl.uniform1f(timeLoc, time);
        gl.uniform2f(resolutionLoc, canvas.width, canvas.height);
        gl.uniform2f(mouseLoc, mouseX, mouseY);
        gl.uniform1f(mouseInfluenceLoc, mouseInfluence);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
        requestAnimationFrame(animate);
    }

    animate();
})();

// ============================================
// CURSOR PROXIMITY TEXT FLUID DISTORTION
// ============================================

(function initCursorProximityDistortion() {
    // Text elements to affect - only logo
    const textElements = document.querySelectorAll('.logo-text');
    if (textElements.length === 0) return;

    // Get the filter elements
    const displacementMap = document.querySelector('#fluidDistort feDisplacementMap');
    if (!displacementMap) return;

    // Configuration
    const maxDistance = 300; // Distance at which effect starts
    const maxScale = 35; // Maximum distortion scale
    const smoothFactor = 0.015; // Smooth transition for gradual recovery

    // Current scale value (for smooth interpolation)
    let currentScale = 0;
    let time = 0;

    // Update distortion based on cursor position
    function updateDistortion(cursorX, cursorY) {
        time += 0.02; // Faster wave animation

        let maxInfluence = 0;

        textElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            const dist = Math.sqrt(
                Math.pow(cursorX - centerX, 2) +
                Math.pow(cursorY - centerY, 2)
            );

            // Calculate influence based on distance (0 = far, 1 = close)
            const influence = Math.max(0, 1 - dist / maxDistance);
            maxInfluence = Math.max(maxInfluence, influence);
        });

        // Smooth interpolation - gradual recovery when cursor moves away
        const targetScale = maxInfluence * maxScale;
        currentScale += (targetScale - currentScale) * smoothFactor;

        // Apply to filter with subtle animation
        const animatedScale = currentScale + Math.sin(time) * (currentScale * 0.25);
        displacementMap.setAttribute('scale', animatedScale);

        // Apply filter to elements that have influence
        textElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            const dist = Math.sqrt(
                Math.pow(cursorX - centerX, 2) +
                Math.pow(cursorY - centerY, 2)
            );

            const influence = Math.max(0, 1 - dist / maxDistance);

            if (influence > 0.01) {
                el.style.filter = 'url(#fluidDistort)';
            } else {
                el.style.filter = 'none';
            }
        });

        requestAnimationFrame(() => updateDistortion(lastCursorX, lastCursorY));
    }

    // Track cursor
    let lastCursorX = window.innerWidth / 2;
    let lastCursorY = window.innerHeight / 2;

    document.addEventListener('mousemove', (e) => {
        lastCursorX = e.clientX;
        lastCursorY = e.clientY;
    });

    // Touch support for cursor distortion
    document.addEventListener('touchmove', (e) => {
        const touch = e.touches[0];
        if (touch) {
            lastCursorX = touch.clientX;
            lastCursorY = touch.clientY;
        }
    }, { passive: true });

    // Start animation
    updateDistortion(lastCursorX, lastCursorY);
})();

// ============================================
// VIDEO SOUND FADE ON HOVER
// ============================================

(function initVideoSound() {
    const videos = document.querySelectorAll('video[data-video]');

    videos.forEach(video => {
        const videoSrc = video.querySelector('source')?.src || video.src;
        const isSoundVideo = videoSrc.includes('Fluid') || videoSrc.includes('Wave');

        // Sound videos (Fluid, Wave): pause initially
        // Other videos: let them autoplay muted
        if (isSoundVideo) {
            video.pause();
            video.currentTime = 0;
        }

        // Only add hover effects for sound videos
        if (!isSoundVideo) return;

        let isHovering = false;
        let fadeInterval = null;
        let currentVolume = 0;

        const fadeIn = () => {
            if (fadeInterval) clearInterval(fadeInterval);

            // Play video and unmute
            video.play().catch(e => console.log('Video play error:', e));
            video.muted = false;

            fadeInterval = setInterval(() => {
                if (currentVolume < 0.5) {
                    currentVolume += 0.02;
                    if (currentVolume > 0.5) currentVolume = 0.5;
                    video.volume = currentVolume;
                } else {
                    clearInterval(fadeInterval);
                }
            }, 30);
        };

        const fadeOut = () => {
            if (fadeInterval) clearInterval(fadeInterval);

            fadeInterval = setInterval(() => {
                if (currentVolume > 0) {
                    currentVolume -= 0.02;
                    if (currentVolume < 0) currentVolume = 0;
                    video.volume = currentVolume;
                } else {
                    video.muted = true;
                    video.pause();
                    video.currentTime = 0;
                    clearInterval(fadeInterval);
                }
            }, 30);
        };

        const card = video.closest('.work-card');

        card.addEventListener('mouseenter', () => {
            isHovering = true;
            fadeIn();
        });

        card.addEventListener('mouseleave', () => {
            isHovering = false;
            fadeOut();
        });

        // Set initial volume
        video.volume = 0;
    });
})();

// ============================================
// SCRAMBLE DECODE TYPOGRAPHY
// ============================================

function initScrambleText() {
    console.log('initScrambleText called');

    const scrambleElements = document.querySelectorAll('.scramble-text');
    console.log('Found elements:', scrambleElements.length);

    if (scrambleElements.length === 0) return;

    // Characters for random scrambling (matrix-style)
    const chars = 'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*';

    scrambleElements.forEach((element, elemIndex) => {
        console.log('Processing element', elemIndex, element);

        // Get all logo-char elements (not the space ones)
        const chars_elements = Array.from(element.children).filter(el => el.classList.contains('logo-char') && !el.classList.contains('space'));
        console.log('Found chars elements:', chars_elements.length);

        if (chars_elements.length === 0) return;

        const originalText = chars_elements.map(el => el.dataset.char);
        let isScrambling = false;
        let animationFrame = null;

        const scramble = () => {
            chars_elements.forEach((charEl) => {
                const randomChar = chars[Math.floor(Math.random() * chars.length)];
                charEl.textContent = randomChar;
                charEl.classList.add('scrambling');
            });
        };

        const decode = () => {
            let allRevealed = true;
            let revealedCount = 0;

            chars_elements.forEach((charEl, index) => {
                if (Math.random() > 0.1 && revealedCount < originalText.length / 3) {
                    charEl.textContent = originalText[index];
                    charEl.classList.remove('scrambling');
                    revealedCount++;
                    allRevealed = false;
                } else if (charEl.textContent !== originalText[index]) {
                    const randomChar = chars[Math.floor(Math.random() * chars.length)];
                    charEl.textContent = randomChar;
                    allRevealed = false;
                } else {
                    charEl.classList.remove('scrambling');
                }
            });

            if (!allRevealed) {
                animationFrame = requestAnimationFrame(decode);
            } else {
                isScrambling = false;
            }
        };

        const startScramble = () => {
            console.log('Scramble started!');
            if (isScrambling) {
                cancelAnimationFrame(animationFrame);
            }
            isScrambling = true;

            let scrambleCount = 0;
            const maxScramble = 15;

            const fastScramble = () => {
                if (scrambleCount < maxScramble) {
                    scramble();
                    scrambleCount++;
                    setTimeout(fastScramble, 30);
                } else {
                    decode();
                }
            };

            fastScramble();
        };

        const restoreOriginal = () => {
            // Start restoration after 3 seconds
            setTimeout(() => {
                let restoreIndex = 0;
                const restoreInterval = setInterval(() => {
                    if (restoreIndex < chars_elements.length) {
                        chars_elements[restoreIndex].textContent = originalText[restoreIndex];
                        chars_elements[restoreIndex].classList.remove('scrambling');
                        restoreIndex++;
                    } else {
                        clearInterval(restoreInterval);
                    }
                }, 100); // Restore each letter every 100ms
            }, 3000);
        };

        element.addEventListener('mouseenter', startScramble);

        element.addEventListener('mouseleave', () => {
            if (isScrambling) {
                cancelAnimationFrame(animationFrame);
                isScrambling = false;
            }
            restoreOriginal();
        });
    });

    console.log('Scramble initialized!');
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrambleText);
} else {
    initScrambleText();
}
