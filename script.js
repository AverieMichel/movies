import express from "express";
import bodyParser from "body-parser";
import pg from 'pg';
import axios from 'axios';

let err = 404;

const app = express();
const port = 3000;

const db = new pg.Client({
    user: 'postgres',
    host: 'localhost',
    database: 'movies',
    password: 'Averie1103',
    port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));


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
    // const idList = await db.query('SELECT imdbid FROM watched_movies');

    // newIDs.forEach(async function(newID) {
    //     // console.log(newID.imdbid);
    //     const getPoster = await axios.get(`http://www.omdbapi.com/?&apikey=eaf269d3&i=${newID.imdbid}`);
    //     result.rows.forEach(function(row) {
    //         if (row.imdbid === newID.imdbid) {
    //             row.Poster = getPoster.data.Poster;
    //             // console.log(row);
    //         }
    //     });
    // });

    // let reviewerData = JSON.stringify(reviews);
    console.log(reviews.rows);
    console.log(JSON.stringify(reviews.rows));

    res.render('index.ejs', {movies: result.rows });
});

app.post('/search', async (req, res) => {
    let clientInput = req.body;
    // console.log(clientInput);
    const result = await axios.get(`http://www.omdbapi.com/?s=${clientInput['movie-name'].replace(' ', '+')}&apikey=eaf269d3&type=movie`);
    console.log(result);
    // const movieID = req.body.imdbId;
    const movies = result.data.Search.sort(function(a, b) {
        // console.log(`${a.Title} (${a.Year}) :: ${b.Title} (${b.Year}) RETURNS: ${a.Year - b.Year}`);
        // Returns a number indicating which element (a or b) comes first.
        // If it's negative, a comes first.  If positive, b comes first. If equal, both are equal.
        return a.Year - b.Year;
    });
    // console.log(movies);
    movies.forEach(function(result) {
        console.log(result.Title);
        console.log(result.imdbID);
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

    res.render('new.ejs', {newMovieData});
});

app.post('/newReview', async (req, res) => {
    const movie = req.body;
    console.log(movie);
    await db.query('INSERT INTO movie_reviews (imdbid, reviewer, notes, score) VALUES ($1, $2, $3, $4);', 
    [movie.imdbID, req.body['user'], req.body.review, req.body.rating]);
    res.redirect('/');
});

app.post('/delete', async (req, res) => {
    const toDelete = req.body.imdbid;
    // console.log(toDelete);
    const deleteEntry = await db.query(`DELETE FROM watched_movies WHERE imdbid = ($1)`, [toDelete]);
    const newData = await db.query('SELECT * FROM watched_movies');

    res.redirect('/');
});

app.post('/', async (req, res) => {
    const recency = await db.query('SELECT * FROM watched_movies ORDER BY release_year ASC');
    res.render('index.ejs');
});




app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });

  

//   const sortBy = req.body.order; // This is the selected value from the dropdown
    
//   let sortedItems = [...items]; // Create a copy of the data to sort
  
  // Sort based on the selected option
//   switch (sortBy) {
//       case 'recency':
          // Sort by recency (newest to oldest)
    //       sortedItems.sort((a, b) => b.releaseYear - a.releaseYear);
    //       break;
    //   case 'release_yearASC':
          // Sort by release year (oldest to newest)
    //       sortedItems.sort((a, b) => a.releaseYear - b.releaseYear);
    //       break;
    //   case 'release_yearDSC':
          // Sort by release year (newest to oldest)
    //       sortedItems.sort((a, b) => b.releaseYear - a.releaseYear);
    //       break;
    //   case 'rating':
          // Sort by rating (highest to lowest)
    //       sortedItems.sort((a, b) => b.rating - a.rating);
    //       break;
    //   default:
          // If no option is selected or it's the default state
        //   break;
//   }
  
  // Respond with the sorted items (or render a view)
  // In this case, we'll just send the sorted data as JSON
//   res.json(sortedItems); // You can replace this with res.render() to render a view
// });