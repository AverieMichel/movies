console.log("✅ Starting script...");

import express from "express";
import bodyParser from "body-parser";
import pg from 'pg';
import axios from 'axios';

console.log("✅ Packages imported");

let err = 404;

const app = express();
app.set('view engine', 'ejs');
const port = 3000;

const db = new pg.Client({
    user: 'postgres',
    host: 'localhost',
    database: 'movies',
    password: 'Averie1103',
    port: 5432,
});
db.connect()
  .then(() => console.log("Connected to database"))
  .catch((err) => {
    console.error("Database connection error:", err);
    process.exit(1); // Stop the server if DB connection fails
  });

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

console.log("✅ Middleware set up");


let movies = [
    {
        title: 'The Big Short',
        director: 'Adam McKay',
        rating: 10,
        imdbid: 'tt1596363',
        // year: 2015,
    },
    {
        title: 'It',
        director: 'Stephen King',
        rating: 0,
        imdbid: '978-3453435773'
    }
];

// http://www.omdbapi.com/?i=tt3896198&apikey=eaf269d3


//get the home page
app.get('/', async (req, res) => {
    
    const result = await db.query('SELECT * FROM watched_movies');
    const reviews = await db.query('SELECT * FROM movie_reviews'); 
    // console.log(reviews.rows);

    res.render('index.ejs', {movies: result.rows, reviews: reviews.rows });
});

app.post('/search', async (req, res) => {
    let clientInput = req.body;
    // console.log(clientInput);
    const result = await axios.get(`http://www.omdbapi.com/?s=${clientInput['movie-name'].replace(' ', '+')}&apikey=eaf269d3&type=movie`);
    // console.log(result);
    // const movieID = req.body.imdbId;
    const movies = result.data.Search.sort(function(a, b) {
        // console.log(`${a.Title} (${a.Year}) :: ${b.Title} (${b.Year}) RETURNS: ${a.Year - b.Year}`);
        // Returns a number indicating which element (a or b) comes first.
        // If it's negative, a comes first.  If positive, b comes first. If equal, both are equal.
        return a.Year - b.Year;
    });

    res.render('search.ejs', { movies });
});

app.post('/new', async (req, res) => {

    const movieID = req.body.imdbID;
    console.log(movieID);

    const newMovieData = await axios.get(`http://www.omdbapi.com/?&apikey=eaf269d3&i=${movieID}`);

    const newMovie = await db.query('INSERT INTO watched_movies (imdbid, title, director, release_year, plot, posters) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (imdbid) DO NOTHING;', [
        newMovieData.data.imdbID, newMovieData.data.Title, newMovieData.data.Director, newMovieData.data.Year, newMovieData.data.Plot, newMovieData.data.Poster
    ]);

    // const newReview = req.body.reviewer;
    // console.log(newReview);

    res.render('new.ejs', {newMovieData});
});

app.post('/newReview', async (req, res) => {
    try {
      const { imdbID, reviewer, notes, rating } = req.body;
      console.log(notes);
  
      await db.query(
        'INSERT INTO movie_reviews (imdbid, reviewer, notes, score) VALUES ($1, $2, $3, $4);',
        [imdbID, reviewer, notes, rating]
      );
  
      res.redirect('/');
    } catch (error) {
      console.error("Error adding review:", error);
      res.status(500).send("Failed to add review");
    }
  });

app.post('/delete', async (req, res) => {
    try {
        const toDelete = req.body.imdbid;
    
        // Delete reviews that reference this movie first
        await db.query('DELETE FROM movie_reviews WHERE imdbid = $1', [toDelete]);
    
        // Now delete the movie
        await db.query('DELETE FROM watched_movies WHERE imdbid = $1', [toDelete]);
    
        res.redirect('/');
      } catch (err) {
        console.error('Error deleting movie and reviews:', err);
        res.status(500).send('Failed to delete movie');
      }
});

app.post('/', async (req, res) => {
    const order = req.body.order;
    let moviesQuery = 'SELECT * FROM watched_movies';

    if (order === 'recency') {
        moviesQuery += ' ORDER BY date_added DESC'; // Or whichever date field you want
    } else if (order === 'release_yearASC') {
        moviesQuery += ' ORDER BY release_year ASC';
    } else if (order === 'release_yearDSC') {
        moviesQuery += ' ORDER BY release_year DESC';
    } else if (order === 'rating') {
        // Assuming you have average rating in the watched_movies table or you join
        // For now, just order by release_year DESC as fallback
        moviesQuery += ' ORDER BY release_year DESC';
    }

    const movies = await db.query(moviesQuery);
    const reviews = await db.query('SELECT * FROM movie_reviews');

    res.render('index.ejs', { movies: movies.rows, reviews: reviews.rows });
});




app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });

  
