document.addEventListener('DOMContentLoaded', () => {
    const followBtn = document.getElementById('followBtn');
    if (followBtn) {
        followBtn.addEventListener('click', () => {
            const userId = followBtn.dataset.userId;
            fetch('/follow-user/' + userId + '/follow', {
                method: 'PUT'
            })
            .then(() => {
                console.log('User followed');
                window.location.reload();
            })
            .catch(error => console.error('Error:', error));
        });
    }
});
