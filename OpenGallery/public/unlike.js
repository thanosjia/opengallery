document.addEventListener('DOMContentLoaded', () => {
    const unlikeBtn = document.getElementById('unlikeBtn');
    if (unlikeBtn) {
        unlikeBtn.addEventListener('click', () => {
            const artworkId = window.location.pathname.split('/').pop(); // Get artwork ID from URL

            fetch('/unlike-artwork/' + artworkId, {
                method: 'PUT'
            })
            .then(() => {
                console.log('Artwork unliked!');
                window.location.reload();
            })
            .catch(error => console.error('Error:', error));
        });
    }
});
