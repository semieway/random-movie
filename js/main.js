const TMDB_API = '2cd07807d06f27e9501bcd4674d3c757';
const OMDB_API = '380457ba';

document.addEventListener('DOMContentLoaded', function() {
  /* Creates movie genres select */
  let slim = new SlimSelect({
    select: '.genres-select',
    placeholder: 'Select genres (max. 3)',
    limit: 3,
    hideSelectedOption: true,
    closeOnSelect: true,
    showSearch: false,
  });

  renderMovie();

  document.querySelector('.roll-button').addEventListener('click', function(e) {
    showLoadingScreen();

    let options = {};
    options.genres = slim.selected();
    options.years = $settingYears.noUiSlider.get();

    renderMovie(options);
  });

  function renderMovie(options = null) {
    getMovieInfo(options).then(data => {
      let releaseDate = new Date(data.release_date);

      document.querySelector('.title').textContent = data.title;
      document.querySelector('.year').textContent = '(' + releaseDate.getFullYear() + ')';
      document.querySelector('.poster img').src = 'https://image.tmdb.org/t/p/w500' + data.poster_path;
      document.querySelector('.genres').textContent = data.genres.reduce((acc, curr) => acc + curr.name + ', ', '').slice(0, -2);
      document.querySelector('.certification').textContent = data.certification;

      let dateOptions = { day: 'numeric', month: 'short', year: 'numeric' };
      document.querySelector('.release').textContent = Intl.DateTimeFormat('en-GB', dateOptions).format(releaseDate);

      let runtimeHours = Math.floor(data.runtime / 60);
      let runtimeMinutes = data.runtime % 60;
      document.querySelector('.runtime-hours-value').textContent = runtimeHours;
      document.querySelector('.runtime-minutes-value').textContent = runtimeMinutes;

      document.querySelector('.directors-name').textContent = data.director;
      document.querySelector('.writers-name').textContent = data.writer;
      document.querySelector('.imdb-info').textContent = data.imdb_votes;

      let $overview = document.querySelector('.overview');
      $overview.textContent = data.overview;
      let $tagline = document.createElement('div');
      $tagline.classList.add('tagline');
      $tagline.textContent = data.tagline;
      $overview.prepend($tagline);

      let $cast = document.querySelector('.cast');
      $cast.innerHTML = '';
      for (let actor of data.cast) {
        let $actor = document.createElement('div');
        $actor.classList.add('actor');

        let $actorImage = document.createElement('img');
        $actorImage.classList.add('actor-image');
        $actorImage.src = 'https://image.tmdb.org/t/p/w276_and_h350_face' + actor.profile_path;
        $actor.append($actorImage);

        let $actorInfo = document.createElement('div');
        $actorInfo.classList.add('actor-info');

        let $actorName = document.createElement('div');
        $actorName.classList.add('actor-name');
        $actorName.textContent = actor.name;
        $actorInfo.append($actorName);

        let $actorCharacter = document.createElement('div');
        $actorCharacter.classList.add('actor-character');
        $actorCharacter.textContent = actor.character;
        $actorInfo.append($actorCharacter);
        $actor.append($actorInfo);

        $cast.append($actor);
      }

      $youtubeTrailer = document.querySelector('.trailer');
      $youtubeTrailer.src = 'https://www.youtube.com/embed/' + data.trailer;

      let imdbRatingParam = (data.imdb_rating / 10).toPrecision(2);
      showImdbRating(imdbRatingParam);

      let metacriticRatingParam = (data.metacritic_rating / 100).toPrecision(2);
      showMetacriticRating(metacriticRatingParam);

      hideLoadingScreen();
    });
  }

  async function getMovieInfo(options = null) {
    let movieInfo = await rollMovie(options);
    let movieId = movieInfo.id;
    let movieLang = (movieInfo.lang == 'ru') ? 'ru-RU' : 'en-US';

    let TmdbResponse = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=2cd07807d06f27e9501bcd4674d3c757&language=${movieLang}&append_to_response=videos%2Ccredits`);
    let TmdbData = await TmdbResponse.json();

    let imdbId = TmdbData.imdb_id;
    let OmdbResponse = await fetch(`http://www.omdbapi.com/?apikey=380457ba&i=${imdbId}`);
    let OmdbData = await OmdbResponse.json();

    let trailer = (TmdbData.videos.results[0]) ? TmdbData.videos.results[0].key : '';

    return {
      title: TmdbData.title,
      poster_path: TmdbData.poster_path,
      release_date: TmdbData.release_date,
      genres: TmdbData.genres,
      runtime: TmdbData.runtime,
      tagline: TmdbData.tagline,
      overview: TmdbData.overview,
      cast: TmdbData.credits.cast.slice(0, 5),
      trailer: trailer,
      imdb_rating: OmdbData.imdbRating,
      imdb_votes: OmdbData.imdbVotes,
      metacritic_rating: OmdbData.Metascore,
      certification: OmdbData.Rated,
      director: OmdbData.Director,
      writer: OmdbData.Writer
    }
  }

  /* Gets random movie id and its language */
  async function rollMovie(options = null) {
    let genresIds = (options) ? options.genres.join(',') : '';
    let startDate = (options) ? options.years[0] + '-01-01' : '1900-01-01';
    let endDate = (options) ? options.years[1] + '-12-31' : new Date().getFullYear() + '-12-31';

    let response = await fetch(`https://api.themoviedb.org/3/discover/movie?api_key=2cd07807d06f27e9501bcd4674d3c757&language=en-US&sort_by=popularity.desc&include_adult=false&include_video=false&page=1&primary_release_date.gte=${startDate}&primary_release_date.lte=${endDate}&with_genres=${genresIds}`);
    let data = await response.json();

    let movieNumber = (data.total_results > 400) ? randomInteger(1, 400) : randomInteger(1, data.total_results);
    let pageNumber = Math.ceil(movieNumber / 20);
    let movieIndex = movieNumber % 20;
    movieIndex = (movieIndex == 0) ? 19 : movieIndex - 1;

    response = await fetch(`https://api.themoviedb.org/3/discover/movie?api_key=2cd07807d06f27e9501bcd4674d3c757&language=en-US&sort_by=popularity.desc&include_adult=false&include_video=false&page=${pageNumber}&primary_release_date.gte=${startDate}&primary_release_date.lte=${endDate}&with_genres=${genresIds}`);
    data = await response.json();

    let movieInfo = data.results[movieIndex];
    return {id: movieInfo.id, lang: movieInfo.original_language};
  }

  function showLoadingScreen() {
    document.querySelector('.container').classList.add('hidden');
    document.querySelector('.loading-screen').classList.add('active');
  }

  function hideLoadingScreen() {
    document.querySelector('.container').classList.remove('hidden');
    document.querySelector('.loading-screen').classList.remove('active');
  }

  function randomInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /* Rating circles */
  function showImdbRating(rating = 0) {
    let $ratingIMDb = document.querySelector('.imdb-bar');
    $ratingIMDb.innerHTML = '';

    let color = '#00c853';
    if (rating < 0.7 && rating >= 0.5) {
      color = '#ffd600';
    } else if (rating < 0.5) {
      color = '#dd2c00';
    }

    let barIMDb = new ProgressBar.Circle($ratingIMDb, {
      color: '#fff',
      // This has to be the same size as the maximum width to
      // prevent clipping
      strokeWidth: 7,
      trailWidth: 0,
      easing: 'easeInOut',
      duration: 1500,
      text: {
        autoStyleContainer: false
      },
      from: { color: color, width: 7 },
      to: { color: color, width: 7 },
      // Set default step function for all animate calls
      step: function (state, circle) {
        circle.path.setAttribute('stroke', state.color);
        circle.path.setAttribute('stroke-width', state.width);

        var value = Math.round(circle.value() * 100) / 10;
        if (value === 0) {
          circle.setText('');
        }
        else {
          circle.setText((value < 1) ? value : value.toPrecision(2));
        }

      }
    });
    barIMDb.text.style.fontFamily = 'sans-serif';
    barIMDb.text.style.fontSize = '25px';

    barIMDb.animate(rating);  // Number from 0.0 to 1.0
  }

  function showMetacriticRating(rating = 0) {
    let $ratingMetacritic = document.querySelector('.metacritic-bar');
    $ratingMetacritic.innerHTML = '';

    let color = '#00c853';
    if (rating < 0.7 && rating >= 0.5) {
      color = '#ffd600';
    } else if (rating < 0.5) {
      color = '#dd2c00';
    }

    let barMetacritic = new ProgressBar.Circle($ratingMetacritic, {
      color: '#fff',
      // This has to be the same size as the maximum width to
      // prevent clipping
      strokeWidth: 7,
      trailWidth: 0,
      easing: 'easeInOut',
      duration: 1500,
      text: {
        autoStyleContainer: false
      },
      from: { color: color, width: 7 },
      to: { color: color, width: 7 },
      // Set default step function for all animate calls
      step: function (state, circle) {
        circle.path.setAttribute('stroke', state.color);
        circle.path.setAttribute('stroke-width', state.width);

        var value = Math.round(circle.value() * 100);
        if (value === 0) {
          circle.setText('');
        }
        else {
          circle.setText(value);
        }

      }
    });
    barMetacritic.text.style.fontFamily = 'sans-serif';
    barMetacritic.text.style.fontSize = '25px';

    barMetacritic.animate(rating);  // Number from 0.0 to 1.0
  }

  /* Creates years slider */
  let $settingYears = document.querySelector('.setting-years');

  noUiSlider.create($settingYears, {
    start: [1900, new Date().getFullYear()],
    step: 1,
    connect: true,
    range: {
      'min': [1900, 10],
      '3%': [1910, 10],
      '6%': [1920, 10],
      '9%': [1930, 10],
      '12%': [1940, 10],
      '15%': [1950, 10],
      '18%': [1960, 10],
      '21%': [1970, 1],
      'max': [2020]
    },
    format: {
      to: function (value) {
        return value;
      },
      from: function (value) {
        return Number(value);
      }
    }
  });

  /* Updates year tooltips */
  let $settingYearsStart = document.querySelector('.years-left-tooltip');
  let $settingYearsEnd = document.querySelector('.years-right-tooltip');

  $settingYears.noUiSlider.on('update', function (values, handle) {
    $settingYearsStart.innerHTML = values[0];
    $settingYearsEnd.innerHTML = values[1];
  });
});
