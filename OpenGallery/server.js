import { MongoClient, ObjectId } from "mongodb";
import fs from 'fs';
import path from 'path';
import express from 'express';
import session from 'express-session';
import mongoose from 'mongoose';
import Artwork from './ArtworkModel.js';
import Workshop from './WorkshopModel.js';
import User from './UserModel.js';

let app = express();
const uri = "mongodb://127.0.0.1:27017/a5";

app.use(express.static("public"));
app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'some secret key here',
    resave: false,
    saveUninitialized: true,
}));

app.use(function (req, res, next) {
    res.locals.loggedIn = !!req.session.userId; // Set a flag if the user is logged in
    next();
});

app.set('view engine', 'pug');

app.use(function(req, res, next) {
    res.locals.loggedIn = !!req.session.userId;
    res.locals.loggedInUserId = req.session.userId; // Set logged-in user ID for all routes
    next();
});

app.get('/', async function(req, res) {
    if (req.session.userId) {
        try {
            const user = await User.findById(req.session.userId).populate('following');
            const followedArtists = user.following.map(u => u._id);
            const followedArtistArtworkCounts = user.followedArtistArtworkCounts || new Map();

            let recentArtworks = [];
            for (let artistId of followedArtists) {
                const currentCount = await Artwork.countDocuments({ artistID: artistId });
                const lastCount = followedArtistArtworkCounts.get(artistId.toString()) || 0;
                if (currentCount > lastCount) {
                    const newArtworks = await Artwork.find({ artistID: artistId })
                                                    .sort({ createdAt: -1 })
                                                    .limit(currentCount - lastCount);
                    recentArtworks.push(...newArtworks);
                    followedArtistArtworkCounts.set(artistId.toString(), currentCount);
                }
            }

            user.followedArtistArtworkCounts = followedArtistArtworkCounts;
            await user.save();

            res.render('home', { loggedIn: true, recentArtworks });
        } catch (err) {
            res.status(500).send("Error retrieving notifications.");
        }
    } else {
        res.render('home', { loggedIn: false });
    }
});

mongoose.connect('mongodb://127.0.0.1/a5');

app.get('/login', function(req, res) {
    res.render('login');
});

app.post('/login', async function(req, res) {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user) {
            res.status(404).send('Username does not exist');
        } else if (user.password !== password) {
            res.status(401).send('Invalid password');
        } else {
            req.session.userId = user._id;
            res.json({ success: true, userId: user._id });
        }
    } catch (err) {
        res.status(500).send("Server error during authentication.");
    }
});


app.get('/logout', function(req, res) {
    req.session.destroy(err => {
        if (err) {
            res.status(500).send("Error logging out.");
        } else {
            res.send("<script>alert('You have logged out.'); window.location.href = '/';</script>");
        }
    });
});

app.post('/signup', async function(req, res) {
    try {
        const { username, password } = req.body;

        const newUser = new User({ username, password, accountType: 'Patron' });
        await newUser.save();

        req.session.userId = newUser._id;
        res.redirect('/user/' + newUser._id);
    } catch (err) {
        res.status(500).send("Error in signup process.");
    }
});

app.get('/check-username', async function(req, res) {
    const username = req.query.username;
    const user = await User.findOne({ username: username });

    if (user) {
        res.json({ exists: true });
    } else {
        res.json({ exists: false });
    }
});

app.get('/user', function(req, res) {
    if (req.session.userId) {
        res.redirect('/user/' + req.session.userId);
    } else {
        res.render('user');
    }
});

app.get('/user/:uID', async function(req, res) {
    try {
        const userId = req.params.uID;
        const user = await User.findById(userId);
        const loggedInUser = req.session.userId ? await User.findById(req.session.userId) : null;

        if (!user) {
            return res.status(404).send('User not found');
        }

        // Check if the logged-in user is following the current profile user
        const currentUserIsFollowing = loggedInUser ? user.followers.includes(loggedInUser._id) : false;

        // Normalize the username to match against artist names
        const normalizedUsername = user.username.toLowerCase();

        // Fetch all artworks
        const artworks = await Artwork.find({});

        // Filter artworks manually
        const userArtworks = artworks.filter(artwork => {
            // Normalize the artist name from the artwork
            const normalizedArtistName = artwork.Artist.replace(/\s+/g, '').toLowerCase();
            return normalizedArtistName === normalizedUsername;
        });

        // Fetch workshops hosted by the user
        const workshops = await Workshop.find({ Host: normalizedUsername });
        const onOwnProfile = req.session.userId === userId.toString();
        const loggedInUserId = req.session.userId;
        res.render('userID', { 
            user, 
            artworks: userArtworks, 
            workshops, 
            onOwnProfile, 
            loggedInUserId, 
            currentUserIsFollowing,
            accountType: user.accountType
        });
    } catch (err) {
        res.status(500).send("Error retrieving user, artworks or workshops.");
    }
});

app.put('/follow-user/:userId/follow', async function(req, res) {
    if (!req.session.userId) {
        return res.status(403).send("You are not authorized to perform this action.");
    }

    try {
        const userIdToFollow = req.params.userId;
        const userToFollow = await User.findById(userIdToFollow);
        const currentUser = await User.findById(req.session.userId);

        if (!userToFollow || !currentUser) {
            return res.status(404).send("User not found.");
        }

        // Add current user to the followed user's followers if not already
        if (!userToFollow.followers.includes(currentUser._id)) {
            userToFollow.followers.push(currentUser._id);
            await userToFollow.save();
        }

        // Add the followed user to current user's following if not already
        if (!currentUser.following.includes(userToFollow._id)) {
            currentUser.following.push(userToFollow._id);
            await currentUser.save();
        }

        res.send("User followed.");
    } catch (err) {
        res.status(500).send("Error processing follow request.");
    }
});

app.put('/follow-user/:userId/unfollow', async function(req, res) {
    if (!req.session.userId) {
        return res.status(403).send("You are not authorized to perform this action.");
    }

    try {
        const userIdToUnfollow = req.params.userId;
        const userToUnfollow = await User.findById(userIdToUnfollow);
        const currentUser = await User.findById(req.session.userId);

        if (!userToUnfollow || !currentUser) {
            return res.status(404).send("User not found.");
        }

        // Remove current user from the unfollowed user's followers
        const followerIndex = userToUnfollow.followers.indexOf(currentUser._id);
        if (followerIndex > -1) {
            userToUnfollow.followers.splice(followerIndex, 1);
            await userToUnfollow.save();
        }

        // Remove the unfollowed user from current user's following
        const followingIndex = currentUser.following.indexOf(userToUnfollow._id);
        if (followingIndex > -1) {
            currentUser.following.splice(followingIndex, 1);
            await currentUser.save();
        }

        res.send("User unfollowed.");
    } catch (err) {
        res.status(500).send("Error processing unfollow request.");
    }
});

app.get('/user/:uID/followers', async function(req, res) {
    try {
        const userId = req.params.uID;
        const user = await User.findById(userId).populate('followers');
        if (!user) {
            return res.status(404).send('User not found');
        }
        res.render('followers', { followers: user.followers });
    } catch (err) {
        res.status(500).send("Error retrieving followers.");
    }
});

app.get('/user/:uID/following', async function(req, res) {
    try {
        const userId = req.params.uID;
        const user = await User.findById(userId).populate('following');
        if (!user) {
            return res.status(404).send('User not found');
        }
        res.render('following', { following: user.following });
    } catch (err) {
        res.status(500).send("Error retrieving following.");
    }
});

app.get('/user/:uID/reviews', async function(req, res) {
    try {
        const userId = req.params.uID;
        const user = await User.findById(userId);
        if (!user) return res.status(404).send('User not found');

        let reviews = await Promise.all(user.reviews.map(async review => {
            const artwork = await Artwork.findById(review.artworkId);
            return artwork ? {
                review: review.review,
                artworkTitle: artwork.Title,
                artworkId: artwork._id
            } : null;
        })).then(results => results.filter(x => x !== null));
  
        res.render('userreviews', { user, reviews });
    } catch (err) {
        res.status(500).send("Error retrieving user reviews.");
    }
});

app.get('/search', async function(req, res) {
    const searchTerm = req.query.searchTerm || '';
    let users = [];
    let artworks = [];
    let workshops = [];

    if (searchTerm) {
        try {
            users = await User.find({ 
                username: new RegExp(searchTerm, 'i') 
            });

            artworks = await Artwork.find({ 
                $or: [
                    { Title: new RegExp(searchTerm, 'i') },
                    { Artist: new RegExp(searchTerm, 'i') },
                    {Year: new RegExp(searchTerm, 'i') },
                    {Category: new RegExp(searchTerm, 'i') },
                    {Medium: new RegExp(searchTerm, 'i') }
                ]
            });

            workshops = await Workshop.find({ 
                $or: [
                    { Title: new RegExp(searchTerm, 'i') },
                    { Host: new RegExp(searchTerm, 'i') }
                ]
            });

        } catch (err) {
            res.status(500).send("Error processing search.");
            return;
        }
    }

    res.render('search', { searchTerm, users, artworks, workshops });
});


app.get('/artworks', async function(req, res) {
    try {
        const artworks = await Artwork.find({});
        res.render('artworks', { artworks });
    } catch (err) {
        res.status(500).send("Error retrieving artworks.");
    }
});

app.post('/add-artwork', async function(req, res) {
    if (!req.session.userId) {
        return res.status(403).send("You are not authorized to perform this action.");
    }

    try {
        const { Title, Year, Category, Medium, Description, Poster } = req.body;
        const user = await User.findById(req.session.userId);

        if (!user) {
            return res.status(404).send("User not found.");
        }

        const newArtwork = new Artwork({ 
            Title, 
            Artist: user.username, 
            Year, 
            Category, 
            Medium, 
            Description, 
            Poster 
        });

        await newArtwork.save();

        // Upgrade user's account type to 'Artist' if they are currently a 'Patron'
        if (user.accountType === 'Patron') {
            user.accountType = 'Artist';
            await user.save();
        }

        res.redirect('/artworks/' + newArtwork._id);
    } catch (err) {
        res.status(500).send("Error adding artwork.");
    }
});

app.get('/artworks/:aID', async function(req, res) {
    try {
        const artworkId = req.params.aID;
        const artwork = await Artwork.findById(artworkId);

        if (!artwork) {
            return res.status(404).send('Artwork not found');
        }

        // Normalize the artist's username from the artwork
        const normalizedArtistUsername = artwork.Artist.replace(/\s+/g, '').toLowerCase();
        
        // Fetch the artist's user data
        const artistUser = await User.findOne({ username: normalizedArtistUsername });

        // Determine if the logged-in user has liked the artwork
        const userLikesArtwork = req.session.userId && artwork.likes.includes(req.session.userId);

        res.render('artworkID', {
            artwork,
            artistUserId: artistUser?._id.toString(),
            loggedInUserId: req.session.userId,
            userLikesArtwork
        });
    } catch (err) {
        res.status(500).send("Error retrieving artwork.");
    }
});

app.get('/artworks/:aID/reviews', async function(req, res) {
    try {
        const artworkId = req.params.aID;
        const artwork = await Artwork.findById(artworkId);
        if (!artwork) return res.status(404).send('Artwork not found');
  
        let reviews = await Promise.all(artwork.reviews.map(async review => {
            const user = await User.findById(review.userId);
            return user ? {
                review: review.review,
                username: user.username,
                userId: user._id
            } : null;
        })).then(results => results.filter(x => x !== null));
  
        res.render('artworkreviews', { artwork, reviews });
    } catch (err) {
        res.status(500).send("Error retrieving artwork reviews.");
    }
});

app.post('/artworks/:aID/add-review', async function(req, res) {
    if (!req.session.userId) {
        return res.status(403).send("You must be logged in to write a review.");
    }

    try {
        const artworkId = req.params.aID;
        const { review } = req.body;
        const userId = req.session.userId;

        // Update Artwork with new review
        const artwork = await Artwork.findById(artworkId);
        if (!artwork) return res.status(404).send("Artwork not found");

        const existingReviewIndex = artwork.reviews.findIndex(r => r.userId.toString() === userId);
        if (existingReviewIndex >= 0) {
            artwork.reviews[existingReviewIndex].review = review;
        } else {
            artwork.reviews.push({ userId, review });
        }

        await artwork.save();

        // Update or Add review in User collection
        const user = await User.findById(userId);
        const existingUserReviewIndex = user.reviews.findIndex(r => r.artworkId.toString() === artworkId);
        if (existingUserReviewIndex >= 0) {
            user.reviews[existingUserReviewIndex].review = review;
        } else {
            user.reviews.push({ artworkId, review });
        }

        await user.save();

        res.redirect(`/artworks/${artworkId}`);
    } catch (err) {
        res.status(500).send("Error adding or updating review.");
    }
});

app.post('/artworks/:aID/remove-review', async function(req, res) {
    if (!req.session.userId) {
        return res.status(403).send("You must be logged in to remove a review.");
    }

    try {
        const artworkId = req.params.aID;
        const userId = req.session.userId;

        // Update Artwork to remove the review
        const artwork = await Artwork.findById(artworkId);
        if (!artwork) return res.status(404).send("Artwork not found");
        artwork.reviews = artwork.reviews.filter(r => r.userId.toString() !== userId);
        await artwork.save();

        // Update User to remove the review
        const user = await User.findById(userId);
        user.reviews = user.reviews.filter(r => r.artworkId.toString() !== artworkId);
        await user.save();

        res.redirect(`/artworks/${artworkId}`);
    } catch (err) {
        res.status(500).send("Error removing review.");
    }
});

app.put('/like-artwork/:artworkId', async function(req, res) {
    if (!req.session.userId) {
        return res.status(403).send("You are not authorized to perform this action.");
    }

    try {
        const artworkId = req.params.artworkId;
        const artwork = await Artwork.findById(artworkId);

        if (!artwork) {
            return res.status(404).send("Artwork not found.");
        }

        const userId = req.session.userId;
        if (!artwork.likes.includes(userId)) {
            artwork.likes.push(userId);
            await artwork.save();
        }

        res.end();
    } catch (err) {
        res.status(500).send("Error processing like.");
    }
});

app.put('/unlike-artwork/:artworkId', async function(req, res) {
    if (!req.session.userId) {
        return res.status(403).send("You are not authorized to perform this action.");
    }

    try {
        const artworkId = req.params.artworkId;
        const artwork = await Artwork.findById(artworkId);

        if (!artwork) {
            return res.status(404).send("Artwork not found.");
        }

        const userId = req.session.userId;
        const index = artwork.likes.indexOf(userId);
        if (index > -1) {
            artwork.likes.splice(index, 1);
            await artwork.save();
        }

        res.end();
    } catch (err) {
        res.status(500).send("Error processing unlike.");
    }
});

app.get('/workshops', async function(req, res) {
    try {
        const workshops = await Workshop.find({});
        res.render('workshops', { workshops });
    } catch (err) {
        res.status(500).send("Error retrieving workshops.");
    }
});

app.get('/workshops/:wID', async function(req, res) {
    try {
        const workshopId = req.params.wID;
        const workshop = await Workshop.findById(workshopId);

        if (!workshop) {
            return res.status(404).send('Workshop not found');
        }

        const normalizedHostName = workshop.Host.toLowerCase();
        const hostUser = await User.findOne({ username: normalizedHostName });

        let hostUserId = null;
        if (hostUser) {
            hostUserId = hostUser._id;
        }

        res.render('workshopID', { workshop, hostUserId });
    } catch (err) {
        res.status(500).send("Error retrieving workshop.");
    }
});

app.post('/add-workshop', async function(req, res) {
    if (!req.session.userId) {
        return res.status(403).send("You are not authorized to perform this action.");
    }

    try {
        const { Title, Description } = req.body;
        const user = await User.findById(req.session.userId);

        if (!user) {
            return res.status(404).send("User not found.");
        }

        const newWorkshop = new Workshop({
            Title, 
            Description,
            Host: user.username
        });
        await newWorkshop.save();

        res.redirect('/user/' + req.session.userId);
    } catch (err) {
        res.status(500).send("Error adding workshop.");
    }
});

app.put('/enroll-workshop/:workshopId', async function(req, res) {
    if (!req.session.userId) {
        return res.status(403).send("You must be logged in to enroll.");
    }

    try {
        const workshopId = req.params.workshopId;
        const workshop = await Workshop.findById(workshopId);

        if (!workshop) {
            return res.status(404).send("Workshop not found.");
        }

        // Check if the user is already enrolled
        if (workshop.enrolledUsers.includes(req.session.userId)) {
            return res.status(400).send("You are already enrolled in this workshop.");
        }

        // Add the user to the list of enrolled users
        workshop.enrolledUsers.push(req.session.userId);
        await workshop.save();

        res.status(200).json({ message: "Successfully enrolled in the workshop!" });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error enrolling in workshop.");
    }
});

app.put('/drop-out-workshop/:workshopId', async function(req, res) {
    if (!req.session.userId) {
        return res.status(403).send("You must be logged in to drop out.");
    }

    try {
        const workshopId = req.params.workshopId;
        const workshop = await Workshop.findById(workshopId);

        if (!workshop) return res.status(404).send("Workshop not found");
        
        // Remove user from enrolled users
        const index = workshop.enrolledUsers.indexOf(req.session.userId);
        if (index > -1) {
            workshop.enrolledUsers.splice(index, 1);
            await workshop.save();
        }

        res.send("Dropped out of workshop.");
    } catch (err) {
        res.status(500).send("Error dropping out of workshop.");
    }
});

app.post('/downgrade-account', async function(req, res) {
    if (!req.session.userId || req.body.userId != req.session.userId) {
        return res.status(403).send('Unauthorized access.');
    }

    try {
        const user = await User.findById(req.session.userId);
        if (user) {
            user.accountType = 'Patron';
            await user.save();
            res.status(200).send('Account downgraded to Patron.');
        } else {
            res.status(404).send('User not found.');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error.');
    }
});

app.use(function(req, res, next) {
    res.status(404).send('ERROR: 404 Not Found');
});

app.listen(3000);
console.log("Server listening at http://localhost:3000");