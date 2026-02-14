// Security Configuration & Protection
const SECURITY_CONFIG = {
    MAX_SUBMISSIONS_PER_HOUR: 3,
    MIN_TIME_BETWEEN_SUBMISSIONS: 60000, // 1 minute
    MAX_NAME_LENGTH: 100,
    MAX_EMAIL_LENGTH: 254,
    MAX_MESSAGE_LENGTH: 2000,
    RATE_LIMIT_KEY: 'portfolio_submissions'
};

// Rate limiting functionality
class RateLimiter {
    static getSubmissions() {
        const data = localStorage.getItem(SECURITY_CONFIG.RATE_LIMIT_KEY);
        return data ? JSON.parse(data) : [];
    }
    
    static addSubmission() {
        const submissions = this.getSubmissions();
        const now = Date.now();
        submissions.push(now);
        localStorage.setItem(SECURITY_CONFIG.RATE_LIMIT_KEY, JSON.stringify(submissions));
    }
    
    static cleanOldSubmissions() {
        const submissions = this.getSubmissions();
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        const recentSubmissions = submissions.filter(time => time > oneHourAgo);
        localStorage.setItem(SECURITY_CONFIG.RATE_LIMIT_KEY, JSON.stringify(recentSubmissions));
    }
    
    static isRateLimited() {
        this.cleanOldSubmissions();
        const submissions = this.getSubmissions();
        
        if (submissions.length >= SECURITY_CONFIG.MAX_SUBMISSIONS_PER_HOUR) {
            return { limited: true, reason: 'Too many submissions this hour. Please try again later.' };
        }
        
        if (submissions.length > 0) {
            const lastSubmission = Math.max(...submissions);
            const timeSinceLastSubmission = Date.now() - lastSubmission;
            if (timeSinceLastSubmission < SECURITY_CONFIG.MIN_TIME_BETWEEN_SUBMISSIONS) {
                const waitTime = Math.ceil((SECURITY_CONFIG.MIN_TIME_BETWEEN_SUBMISSIONS - timeSinceLastSubmission) / 1000);
                return { limited: true, reason: `Please wait ${waitTime} seconds before submitting again.` };
            }
        }
        
        return { limited: false };
    }
}

// Input sanitization and validation functions
function sanitizeInput(input, maxLength) {
    if (!input || typeof input !== 'string') return '';
    return input.trim().slice(0, maxLength);
}

function validateName(name) {
    const sanitized = sanitizeInput(name, SECURITY_CONFIG.MAX_NAME_LENGTH);
    const nameRegex = /^[a-zA-Z\s.'-]{2,100}$/;
    return {
        valid: nameRegex.test(sanitized) && sanitized.length >= 2,
        value: sanitized,
        error: 'Name must be 2-100 characters and contain only letters, spaces, dots, hyphens, and apostrophes.'
    };
}

function validateEmailAdvanced(email) {
    const sanitized = sanitizeInput(email, SECURITY_CONFIG.MAX_EMAIL_LENGTH);
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    // Check for email header injection attempts
    const hasNewlines = /[\r\n]/.test(sanitized);
    const hasHeaders = /\b(to|cc|bcc|subject|content-type):/i.test(sanitized);
    
    return {
        valid: emailRegex.test(sanitized) && !hasNewlines && !hasHeaders && sanitized.length <= 254,
        value: sanitized,
        error: 'Please enter a valid email address.'
    };
}

function validateMessage(message) {
    const sanitized = sanitizeInput(message, SECURITY_CONFIG.MAX_MESSAGE_LENGTH);
    
    // Check for suspicious patterns that could be XSS or injection attempts
    const suspiciousPatterns = [
        /<script[^>]*>.*?<\/script>/gi,
        /javascript:/gi,
        /vbscript:/gi,
        /onload=/gi,
        /onerror=/gi,
        /onclick=/gi,
        /data:text\/html/gi
    ];
    
    const hasSuspiciousContent = suspiciousPatterns.some(pattern => pattern.test(sanitized));
    
    return {
        valid: sanitized.length >= 10 && sanitized.length <= SECURITY_CONFIG.MAX_MESSAGE_LENGTH && !hasSuspiciousContent,
        value: sanitized,
        error: 'Message must be 10-2000 characters and cannot contain suspicious content.'
    };
}

// CSRF Protection
let csrfToken = null;
function generateCSRFToken() {
    csrfToken = 'csrf_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    sessionStorage.setItem('csrf_token', csrfToken);
    return csrfToken;
}

// Initialize security on page load
document.addEventListener('DOMContentLoaded', function() {
    generateCSRFToken();
});

// Welcome Screen Animation
window.addEventListener('load', () => {
window.addEventListener('load', () => {
    const welcomeOverlay = document.getElementById('welcomeOverlay');
    const mainContent = document.getElementById('mainContent');

    document.body.classList.add('welcome-active');

    setTimeout(() => {
        welcomeOverlay.classList.add('pixelate-out');

        setTimeout(() => {
            welcomeOverlay.style.display = "none";
            mainContent.classList.add('show');
            document.body.classList.remove('welcome-active');
        }, 800); // animation duration

    }, 1500); // welcome screen visible time
});

    
    // Add click handler for scroll indicator
    const scrollIndicator = document.getElementById('scrollIndicator');
    if (scrollIndicator) {
        scrollIndicator.addEventListener('click', () => {
            const aboutSection = document.querySelector('#about');
            if (aboutSection) {
                aboutSection.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    }
});

// Mobile Navigation Toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Close mobile menu when clicking on nav links
document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

// Smooth Scrolling for Navigation Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Header Background on Scroll
window.addEventListener('scroll', () => {
    const header = document.querySelector('.header');
    const scrollIndicator = document.getElementById('scrollIndicator');
    
    if (window.scrollY > 100) {
        header.style.background = 'rgba(255, 255, 255, 0.98)';
        header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        
        // Hide scroll indicator when user scrolls
        if (scrollIndicator) {
            scrollIndicator.classList.remove('show');
        }
    } else {
        header.style.background = 'rgba(255, 255, 255, 0.95)';
        header.style.boxShadow = 'none';
        
        // Show scroll indicator again when back at top (if typing is complete)
        if (scrollIndicator && scrollIndicator.classList.contains('show')) {
            setTimeout(() => {
                if (window.scrollY < 100) {
                    scrollIndicator.classList.add('show');
                }
            }, 500);
        }
    }
});

// Security Configuration
const SECURITY_CONFIG = {
    MAX_SUBMISSIONS_PER_HOUR: 3,
    MIN_TIME_BETWEEN_SUBMISSIONS: 60000, // 1 minute
    MAX_NAME_LENGTH: 100,
    MAX_EMAIL_LENGTH: 254,
    MAX_MESSAGE_LENGTH: 2000,
    RATE_LIMIT_KEY: 'portfolio_submissions'
};

// Rate limiting functionality
class RateLimiter {
    static getSubmissions() {
        const data = localStorage.getItem(SECURITY_CONFIG.RATE_LIMIT_KEY);
        return data ? JSON.parse(data) : [];
    }
    
    static addSubmission() {
        const submissions = this.getSubmissions();
        const now = Date.now();
        submissions.push(now);
        localStorage.setItem(SECURITY_CONFIG.RATE_LIMIT_KEY, JSON.stringify(submissions));
    }
    
    static cleanOldSubmissions() {
        const submissions = this.getSubmissions();
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        const recentSubmissions = submissions.filter(time => time > oneHourAgo);
        localStorage.setItem(SECURITY_CONFIG.RATE_LIMIT_KEY, JSON.stringify(recentSubmissions));
    }
    
    static isRateLimited() {
        this.cleanOldSubmissions();
        const submissions = this.getSubmissions();
        
        // Check hourly limit
        if (submissions.length >= SECURITY_CONFIG.MAX_SUBMISSIONS_PER_HOUR) {
            return { limited: true, reason: 'Too many submissions this hour. Please try again later.' };
        }
        
        // Check minimum time between submissions
        const lastSubmission = Math.max(...submissions);
        const timeSinceLastSubmission = Date.now() - lastSubmission;
        if (timeSinceLastSubmission < SECURITY_CONFIG.MIN_TIME_BETWEEN_SUBMISSIONS) {
            const waitTime = Math.ceil((SECURITY_CONFIG.MIN_TIME_BETWEEN_SUBMISSIONS - timeSinceLastSubmission) / 1000);
            return { limited: true, reason: `Please wait ${waitTime} seconds before submitting again.` };
        }
        
        return { limited: false };
    }
}

// Input sanitization functions
function sanitizeInput(input, maxLength) {
    if (!input || typeof input !== 'string') return '';
    return input.trim().slice(0, maxLength);
}

function sanitizeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function validateName(name) {
    const sanitized = sanitizeInput(name, SECURITY_CONFIG.MAX_NAME_LENGTH);
    const nameRegex = /^[a-zA-Z\s.'-]{2,100}$/;
    return {
        valid: nameRegex.test(sanitized) && sanitized.length >= 2,
        value: sanitized,
        error: 'Name must be 2-100 characters and contain only letters, spaces, dots, hyphens, and apostrophes.'
    };
}

function validateEmail(email) {
    const sanitized = sanitizeInput(email, SECURITY_CONFIG.MAX_EMAIL_LENGTH);
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    // Additional checks for email header injection
    const hasNewlines = /[\r\n]/.test(sanitized);
    const hasHeaders = /\b(to|cc|bcc|subject|content-type):/i.test(sanitized);
    
    return {
        valid: emailRegex.test(sanitized) && !hasNewlines && !hasHeaders && sanitized.length <= 254,
        value: sanitized,
        error: 'Please enter a valid email address (max 254 characters).'
    };
}

function validateMessage(message) {
    const sanitized = sanitizeInput(message, SECURITY_CONFIG.MAX_MESSAGE_LENGTH);
    
    // Check for suspicious patterns
    const suspiciousPatterns = [
        /<script[^>]*>.*?<\/script>/gi,
        /javascript:/gi,
        /vbscript:/gi,
        /onload=/gi,
        /onerror=/gi,
        /onclick=/gi
    ];
    
    const hasSuspiciousContent = suspiciousPatterns.some(pattern => pattern.test(sanitized));
    
    return {
        valid: sanitized.length >= 10 && sanitized.length <= SECURITY_CONFIG.MAX_MESSAGE_LENGTH && !hasSuspiciousContent,
        value: sanitized,
        error: 'Message must be 10-2000 characters and cannot contain suspicious content.'
    };
}

// Contact Form Handling with Enhanced Security
const contactForm = document.getElementById('contactForm');

contactForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Rate limiting check
    const rateLimitCheck = RateLimiter.isRateLimited();
    if (rateLimitCheck.limited) {
        showMessage(rateLimitCheck.reason, 'error');
        return;
    }
    
    // Get and validate form data
    const formData = new FormData(this);
    const rawName = formData.get('name');
    const rawEmail = formData.get('email');
    const rawMessage = formData.get('message');
    const submitBtn = this.querySelector('button[type="submit"]');
    
    // Comprehensive validation
    const nameValidation = validateName(rawName);
    const emailValidation = validateEmailAdvanced(rawEmail);
    const messageValidation = validateMessage(rawMessage);
    
    if (!nameValidation.valid) {
        showMessage(nameValidation.error, 'error');
        return;
    }
    
    if (!emailValidation.valid) {
        showMessage(emailValidation.error, 'error');
        return;
    }
    
    if (!messageValidation.valid) {
        showMessage(messageValidation.error, 'error');
        return;
    }
    
    // Show loading state
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;
    
    // Prepare secure data payload
    const formDataToSend = {
        name: nameValidation.value,
        email: emailValidation.value,
        message: messageValidation.value,
        timestamp: new Date().toISOString(),
        csrf_token: csrfToken,
        user_agent: navigator.userAgent.substring(0, 100), // Limited for privacy
        referrer: document.referrer || 'direct'
    };
    
    // Send to secure endpoint
    const scriptURL = 'https://script.google.com/macros/s/AKfycbzKpHE8dHu4BKCxlIGRq3o_YQglbMQ4_zXbnY1tQnqmWHq-wbB7_MSjRnT5HSJhz5zo/exec';
    
    fetch(scriptURL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formDataToSend)
    })
    .then(() => {
        // Add to rate limiter on successful submission
        RateLimiter.addSubmission();
        generateCSRFToken(); // Generate new token after use
        
        showMessage('Message sent successfully! I\'ll get back to you soon. 🚀', 'success');
        this.reset();
    })
    .catch(error => {
        console.error('Submission error:', error);
        showMessage('Sorry, there was an error sending your message. Please try again or contact me directly at +91 72003 92705.', 'error');
    })
    .finally(() => {
        // Reset button state
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    });
});

// Show message function
function showMessage(message, type) {
    // Remove existing message if any
    const existingMessage = document.querySelector('.form-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Create message element
    const messageElement = document.createElement('div');
    messageElement.className = `form-message ${type}`;
    messageElement.textContent = message;
    
    // Add styles
    messageElement.style.padding = '12px';
    messageElement.style.borderRadius = '8px';
    messageElement.style.marginTop = '1rem';
    messageElement.style.fontWeight = '500';
    
    if (type === 'success') {
        messageElement.style.backgroundColor = '#f0f0f0';
        messageElement.style.color = '#333333';
        messageElement.style.border = '1px solid #666666';
    } else {
        messageElement.style.backgroundColor = '#e5e5e5';
        messageElement.style.color = '#000000';
        messageElement.style.border = '1px solid #999999';
    }
    
    // Insert message after form
    contactForm.appendChild(messageElement);
    
    // Remove message after 5 seconds
    setTimeout(() => {
        messageElement.remove();
    }, 5000);
}

// Animate progress bar on scroll
const observerOptions = {
    threshold: 0.5,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            // Animate progress bar
            const progressFill = entry.target.querySelector('.progress-fill');
            if (progressFill) {
                progressFill.style.width = '75%';
            }
            
            // Animate counters or other elements
            animateElements(entry.target);
        }
    });
}, observerOptions);

// Observe sections for animations
document.querySelectorAll('.portfolio-preview').forEach(section => {
    observer.observe(section);
});

// Animate elements function
function animateElements(section) {
    const elementsToAnimate = section.querySelectorAll('.project-status, .service-card, .skill-category');
    
    elementsToAnimate.forEach((element, index) => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        
        setTimeout(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

// Add loading animation to buttons
document.querySelectorAll('.btn, .service-btn').forEach(button => {
    button.addEventListener('click', function(e) {
        // Don't add loading to anchor links
        if (this.getAttribute('href') && this.getAttribute('href').startsWith('#')) {
            return;
        }
        
        // Add loading state
        const originalText = this.textContent;
        this.style.position = 'relative';
        this.style.color = 'transparent';
        
        // Create spinner
        const spinner = document.createElement('div');
        spinner.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        spinner.style.position = 'absolute';
        spinner.style.top = '50%';
        spinner.style.left = '50%';
        spinner.style.transform = 'translate(-50%, -50%)';
        spinner.style.color = '#f0f0f0';
        
        this.appendChild(spinner);
        
        // Remove loading state after 2 seconds (adjust as needed)
        setTimeout(() => {
            this.removeChild(spinner);
            this.style.color = '';
            this.textContent = originalText;
        }, 2000);
    });
});

// Typing effect for hero section
function typeWriter(element, text, speed = 100, callback) {
    let i = 0;
    element.innerHTML = '';
    
    function type() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, speed);
        } else if (callback) {
            // Call the callback function when typing is complete
            callback();
        }
    }
    
    type();
}

// Add scroll to top functionality
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Show/hide scroll to top button
window.addEventListener('scroll', () => {
    let scrollToTopBtn = document.getElementById('scrollToTopBtn');
    
    if (!scrollToTopBtn) {
        // Create scroll to top button if it doesn't exist
        scrollToTopBtn = document.createElement('button');
        scrollToTopBtn.id = 'scrollToTopBtn';
        scrollToTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
        scrollToTopBtn.onclick = scrollToTop;
        
        // Style the button
        Object.assign(scrollToTopBtn.style, {
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            width: '50px',
            height: '50px',
            backgroundColor: '#333333',
            color: '#f0f0f0',
            border: 'none',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '1.2rem',
            zIndex: '1000',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 20px rgba(51, 51, 51, 0.3)',
            opacity: '0',
            visibility: 'hidden',
            transform: 'translateY(20px)'
        });
        
        scrollToTopBtn.addEventListener('mouseenter', () => {
            scrollToTopBtn.style.backgroundColor = '#000000';
            scrollToTopBtn.style.transform = 'translateY(-3px)';
        });
        
        scrollToTopBtn.addEventListener('mouseleave', () => {
            scrollToTopBtn.style.backgroundColor = '#333333';
            scrollToTopBtn.style.transform = window.scrollY > 300 ? 'translateY(0)' : 'translateY(20px)';
        });
        
        document.body.appendChild(scrollToTopBtn);
    }
    
    if (window.scrollY > 300) {
        scrollToTopBtn.style.opacity = '1';
        scrollToTopBtn.style.visibility = 'visible';
        scrollToTopBtn.style.transform = 'translateY(0)';
    } else {
        scrollToTopBtn.style.opacity = '0';
        scrollToTopBtn.style.visibility = 'hidden';
        scrollToTopBtn.style.transform = 'translateY(20px)';
    }
});

// Add interactive hover effects for cards
document.querySelectorAll('.service-card, .skill-category, .project-status').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-8px) scale(1.02)';
        this.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
        this.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
    });
});

// Parallax effect for hero section
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const parallaxElements = document.querySelectorAll('.hero-image');
    
    parallaxElements.forEach(element => {
        const speed = 0.5;
        element.style.transform = `translateY(${scrolled * speed}px)`;
    });
});

// Add custom cursor effect (optional)
function addCustomCursor() {
    const cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    
    Object.assign(cursor.style, {
        width: '20px',
        height: '20px',
        backgroundColor: '#333333',
        borderRadius: '50%',
        position: 'fixed',
        pointerEvents: 'none',
        zIndex: '9999',
        transition: 'transform 0.1s ease',
        opacity: '0.7'
    });
    
    document.body.appendChild(cursor);
    
    document.addEventListener('mousemove', (e) => {
        cursor.style.left = e.clientX - 10 + 'px';
        cursor.style.top = e.clientY - 10 + 'px';
    });
    
    // Hide cursor when leaving viewport
    document.addEventListener('mouseleave', () => {
        cursor.style.opacity = '0';
    });
    
    document.addEventListener('mouseenter', () => {
        cursor.style.opacity = '0.7';
    });
}

// Initialize custom cursor (uncomment if you want this feature)
// addCustomCursor();

// Console message for developers
console.log(`
🚀 Vincent Raj R's Portfolio
Built with HTML, CSS, and JavaScript
Feel free to explore the code!

Connect with me:
📧 vincentraj2705@gmail.com
💼 https://www.linkedin.com/in/vincentrajr/
🐙 https://github.com/vincentraj
`);

// Performance monitoring (optional)
if ('performance' in window) {
    window.addEventListener('load', () => {
        setTimeout(() => {
            const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
            console.log(`⚡ Page loaded in ${loadTime}ms`);
        }, 0);
    });

}
