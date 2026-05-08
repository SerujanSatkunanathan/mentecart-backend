document.addEventListener('DOMContentLoaded', () => {
    const calendarBtn = document.getElementById('calendar-btn');
    
    // Add interactivity to calendar button
    calendarBtn.addEventListener('click', function() {
        // Prevent multiple clicks
        if (this.classList.contains('added')) return;
        
        const originalText = this.innerHTML;
        this.classList.add('added');
        
        // Change state to "Added"
        this.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> Added!';
        this.style.background = '#10b981'; // Success green
        this.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.3)';
        
        // Trigger confetti effect
        createConfetti();
        
        // Optional: revert back after 3 seconds, or keep it in success state
        // Here we keep it in success state as it makes sense for "Add to Calendar"
    });
});

// Function to generate a dynamic confetti explosion effect
function createConfetti() {
    const colors = ['#10b981', '#6366f1', '#f59e0b', '#ec4899', '#3b82f6'];
    const confettiCount = 60;
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.classList.add('confetti');
        
        // Randomly select a color from the palette
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        
        // Start position in the center of the screen
        confetti.style.left = '50%';
        confetti.style.top = '50%';
        
        // Random dimensions for variety
        const size = Math.random() * 8 + 6; // 6px to 14px
        confetti.style.width = `${size}px`;
        confetti.style.height = `${size}px`;
        
        // Mix of circles and rectangles
        if (Math.random() > 0.5) {
            confetti.style.borderRadius = '50%';
        } else {
            confetti.style.borderRadius = '2px';
        }
        
        document.body.appendChild(confetti);
        
        // Calculate random destination (explosion pattern)
        const angle = Math.random() * Math.PI * 2; // Full circle
        const velocity = Math.random() * 200 + 100; // Distance
        
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity - 100; // Slightly upward bias
        
        const rot = Math.random() * 720 - 360; // Random rotation
        
        // Animate the particle
        const animation = confetti.animate([
            { transform: 'translate(-50%, -50%) rotate(0deg) scale(1)', opacity: 1 },
            { transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) rotate(${rot}deg) scale(0)`, opacity: 0 }
        ], {
            duration: Math.random() * 800 + 800, // 800ms to 1600ms
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' // Out cubic
        });
        
        // Clean up DOM after animation completes
        animation.onfinish = () => confetti.remove();
    }
}
