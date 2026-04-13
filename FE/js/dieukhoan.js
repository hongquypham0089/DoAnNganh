// Handle logout
function handleLogout() {
    if(confirm('Bạn có chắc chắn muốn đăng xuất?')) {
        alert('Đã đăng xuất!');
    }
}

// Scroll to section
function scrollToSection(sectionId, element) {
    event.preventDefault();
    
    // Update active state
    document.querySelectorAll('.policy-index a').forEach(link => {
        link.classList.remove('active');
    });
    element.classList.add('active');
    
    // Scroll to section
    const section = document.getElementById(sectionId);
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Toggle article content
function toggleArticle(header) {
    const content = header.nextElementSibling;
    const icon = header.querySelector('.toggle-icon');
    
    if(content.style.display === 'none') {
        content.style.display = 'block';
        icon.style.transform = 'rotate(0deg)';
    } else {
        content.style.display = 'none';
        icon.style.transform = 'rotate(-90deg)';
    }
}

// Toggle FAQ
function toggleFAQ(item) {
    const answer = item.querySelector('.faq-answer');
    const icon = item.querySelector('.faq-question span:last-child');
    
    if(answer.classList.contains('show')) {
        answer.classList.remove('show');
        icon.textContent = '▼';
    } else {
        answer.classList.add('show');
        icon.textContent = '▲';
    }
}

// Print policy
function printPolicy() {
    window.print();
}

// Highlight active section on scroll
window.addEventListener('scroll', function() {
    const sections = document.querySelectorAll('.policy-section');
    const navLinks = document.querySelectorAll('.policy-index a');
    
    let current = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 150;
        if (pageYOffset >= sectionTop) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if(link.getAttribute('href') === '#' + current) {
            link.classList.add('active');
        }
    });
});

// Initialize all articles as expanded
document.querySelectorAll('.article-content').forEach(content => {
    content.style.display = 'block';
});
