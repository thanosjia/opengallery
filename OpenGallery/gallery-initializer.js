import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import Artwork from './ArtworkModel.js';
import Workshop from './WorkshopModel.js';
import User from './UserModel.js';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

mongoose.connect('mongodb://127.0.0.1/a5');
let db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', async () => {
    console.log("Connected to database. Starting initialization.");

    try {
        // Initialize Artwork Collection
        await Artwork.deleteMany({});
        console.log("Artworks collection cleared.");
        const artworksFilePath = path.join(__dirname, 'gallery', 'gallery.json');
        const artworksContent = fs.readFileSync(artworksFilePath, 'utf8');
        const artworks = JSON.parse(artworksContent);
        for (const item of artworks) {
            const artwork = new Artwork(item);
            await artwork.save();
        }
        console.log("All artworks saved.");

        // Initialize Workshops Collection
        await Workshop.deleteMany({});
        console.log("Workshops collection cleared.");
        const workshopsFilePath = path.join(__dirname, 'gallery', 'workshops.json');
        const workshopsContent = fs.readFileSync(workshopsFilePath, 'utf8');
        const workshops = JSON.parse(workshopsContent);
        for (const item of workshops) {
            const workshop = new Workshop(item);
            await workshop.save();
        }
        console.log("All workshops saved.");

        // Initialize User Collection
        await User.deleteMany({});
        console.log("User collection cleared");
        const usersFilePath = path.join(__dirname, 'gallery', 'users.json');
        const usersContent = fs.readFileSync(usersFilePath, 'utf8');
        const users = JSON.parse(usersContent);
        for (const item of users) {
            const user = new User(item);
            await user.save();
        }
        console.log("All users saved.");

    } catch (err) {
        console.error("An error occurred during initialization:", err);
    } finally {
        mongoose.disconnect();
    }
});
