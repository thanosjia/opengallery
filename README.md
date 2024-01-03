OPENGALLERY - WEB APPLICATION

OpenGallery is a web application that lets users view, post, like, and review artworks. Users can also view and join workshops hosted by artists, and follow other users.
A MongoDB database was used.

FUTURE ASPIRATIONS:
- If this has any hope of actually being put into production, encryption of usernames and their passwords MUST be implemented. In addition, verification of new usernames (e.g. not allowing illegal characters) should also be implemented.

- Currently, alerts are used to communicate to the user if an invalid password/username was entered. I can't think of any website that does this because from a design point of view it is just ugly. This should instead be changed to show a div that contains error messages (and likewise, hide them).

- Currently, the link to each user profile is /users/:{userID}. I would like to change this to /users/:{username} to avoid having to type in a long string of characters to navigate directly to a user profile.

- The search page needs to be refined so that pagination is used. As it stands, this is currently not an issue due to the miniscule size of the database. However, if this has any intention of having a large database, then this will almost certainly need to be fixed.

- Most forms of social media contain a page or tab where you a user can view their notifications. Currently this does not exist - it should display any likes on their artwork, updates from users they are following, etc.

- At the moment, when a user likes an image, or follows a user, the page is instantly refreshed to update the like or follow count. This needs to be changed so that it is changed client side only, i.e. the page is not refreshed. However, refreshing the page after should obviously show the newly updated count that is kept in the website database.

- The web design currently is sufficient, but also quite basic. It could do with some sprucing up down the line. Something to also consider is mobile users.


INSTALL AND RUN INSTRUCTIONS:
1. Download and extract the files, and open a terminal window in the root directory of the project (containing server.js and gallery-initializer.js).

2. If you have not done so already, download [Node.js](https://nodejs.org/en/download) and [MongoDB Community Server](https://www.mongodb.com/try/download/community). [MongoDBCompass](https://www.mongodb.com/try/download/compass) is also a helpful tool where you can see changes to your database in real time.

3. Enter the following commands:
    npm install
    node gallery-initializer.js
    node server.js

4. Navigate to https://localhost:3000 in your web browser of choice.


ADDITIONAL NOTES:
- For testing purposes, I have created a test workshop. Feel free to add your own.
- All the artists in the initial database have been given an account. Their usernames are the same as their names, just all lowercase and no spaces. The default password is "artist" (For example, Corinne Hunt will have a username "corinnehunt" and password "artist").


MIT License

Copyright (c) 2024 Thanos Jia

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
