document.addEventListener('DOMContentLoaded', () => {
    const unfollowBtn = document.getElementById('unfollowBtn');
    if (unfollowBtn) {
        unfollowBtn.addEventListener('click', () => {
            const userId = unfollowBtn.dataset.userId;
            fetch('/follow-user/' + userId + '/unfollow', {
                method: 'PUT'
            })
            .then(() => {
                console.log('User unfollowed');
                window.location.reload();
            })
            .catch(error => console.error('Error:', error));
        });
    }
});
