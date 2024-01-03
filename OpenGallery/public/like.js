document.addEventListener('DOMContentLoaded', () => {
    const likeBtn = document.getElementById('likeBtn');
    if (likeBtn) {
        likeBtn.addEventListener('click', () => {
            const artworkId = window.location.pathname.split('/').pop(); // Get artwork ID from URL

            fetch('/like-artwork/' + artworkId, {
                method: 'PUT'
            })
            .then(() => {
                console.log('Artwork liked!');
                window.location.reload();
            })
            .catch(error => console.error('Error:', error));
        });
    }
});
