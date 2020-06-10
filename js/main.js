const TMDB_API = '2cd07807d06f27e9501bcd4674d3c757';
const OMDB_API = '380457ba';

document.addEventListener('DOMContentLoaded', function() {
  renderMovie();

  /* Renders movie on a page */
  function renderMovie(options = null) {
    getMovieInfo(options).then(data => {
      document.querySelector('.title').textContent = data.title;

      let releaseDate = new Date(data.release_date);
      document.querySelector('.year').textContent = '(' + releaseDate.getFullYear() + ')';

      let posterPath = (data.poster_path) ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : '../images/poster-placeholder.png';
      document.querySelector('.poster img').src = posterPath;

      document.querySelector('.genres').textContent = data.genres.reduce((acc, curr) => acc + curr.name + ', ', '').slice(0, -2);
      document.querySelector('.certification').textContent = (data.certification) ? data.certification : 'N/A';

      let dateOptions = { day: 'numeric', month: 'short', year: 'numeric' };
      document.querySelector('.release').textContent = Intl.DateTimeFormat('en-GB', dateOptions).format(releaseDate);

      let runtimeHours = Math.floor(data.runtime / 60);
      let runtimeMinutes = data.runtime % 60;
      document.querySelector('.runtime-hours-value').textContent = runtimeHours;
      document.querySelector('.runtime-minutes-value').textContent = runtimeMinutes;

      $countryFlags = document.querySelector('.countries');
      $countryFlags.innerHTML = '';
      for (let country of data.countries.reverse().splice(0, 3)) {
        let countryISO = country.iso_3166_1.toLowerCase();
        let $country = document.createElement('span');
        $country.classList.add('country-flag', 'flag-icon', `flag-icon-${countryISO}`);
        $countryFlags.append($country);
      }

      document.querySelector('.directors-name').textContent = (data.director) ? data.director : 'Not available';
      document.querySelector('.writers-name').textContent = (data.writer) ? data.writer : 'Not available';
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
        let profile_path = (actor.profile_path) ? `https://image.tmdb.org/t/p/w276_and_h350_face${actor.profile_path}` : '../images/actor-placeholder.png';
        $actorImage.src = profile_path;
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
      if (data.trailer) {
        $youtubeTrailer.hidden = false;
        $youtubeTrailer.src = 'https://www.youtube.com/embed/' + data.trailer;
      } else {
        $youtubeTrailer.hidden = true;
      }

      let $imdbLink = document.querySelector('.imdb-link');
      let imdbLink;
      if (data.imdbId && data.imdbId != 'N/A') {
        imdbLink = 'https://www.imdb.com/title/' + data.imdbId;
        $imdbLink.setAttribute('href', imdbLink);
      } else {
        $imdbLink.removeAttribute('href');
      }

      let $metacriticLink = document.querySelector('.metacritic-link');
      if (data.metacritic_rating && data.metacritic_rating != 'N/A') {
        $metacriticLink.setAttribute('href', 'https://www.metacritic.com/movie/' + data.title.toLowerCase().replace(/[:'()&.,…]/g, '').replace(/\s+/g, '-'));
      } else {
        $metacriticLink.removeAttribute('href');
      }

      let imdbRatingParam = (data.imdb_rating == 'N/A' || data.imdb_rating == null) ? 0 : (data.imdb_rating / 10).toPrecision(2);
      showImdbRating(imdbRatingParam);

      let metacriticRatingParam = (data.metacritic_rating == 'N/A' || data.metacritic_rating == null) ? 0 : (data.metacritic_rating / 100).toPrecision(2);
      showMetacriticRating(metacriticRatingParam);

      if (document.querySelector('.cast').scrollWidth <= 768) {
        $cast.classList.add('scrolled');
      }

      let lastRolled = JSON.parse(localStorage.getItem('lastRolled'));
      let itemRolled = {
        imdbLink: imdbLink,
        poster: (data.poster_path) ? `https://image.tmdb.org/t/p/w185${data.poster_path}` : '../images/poster-placeholder.png',
        title: data.title + ' (' + releaseDate.getFullYear() + ')'
      }
      lastRolled.unshift(itemRolled);

      if (lastRolled.length > 7) {
        lastRolled.pop();
      }
      localStorage.setItem('lastRolled', JSON.stringify(lastRolled));

      let $lastRolledList = document.querySelector('.last-rolled-list');
      $lastRolledList.innerHTML = '';
      for (let item of lastRolled) {
        let $lastRolledItem = document.createElement('a');
        $lastRolledItem.classList.add('last-rolled-item');
        let $itemPoster = document.createElement('img');
        $itemPoster.src = item.poster;
        let $itemTitle = document.createElement('div');
        $itemTitle.textContent = item.title;

        if (item.imdbLink) {
          $lastRolledItem.href = item.imdbLink;
          $lastRolledItem.setAttribute('target', '_blank');
        }
        $lastRolledItem.append($itemPoster, $itemTitle);
        $lastRolledList.append($lastRolledItem);
      }

      scrollToTop();
      hideLoadingScreen();
    })
    .catch((e) => {
      if (e == 'Not found') {
        let error = showLoadingError('🧐 Nothing was found. Please change search settings and try again.');
        setTimeout(() =>  {
          hideLoadingScreen();
          error.remove();
        }, 2000);

      } else {
        showLoadingError('🙁 Something went wrong. Please try again later.');
        console.error(e);
      }
    });
  }

  /* Gets movie information by id */
  async function getMovieInfo(options = null) {
    let movieId = await rollMovie(options);

    let TmdbResponse = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_API}&language=en-US&append_to_response=videos%2Ccredits`);
    let TmdbData = await TmdbResponse.json();

    let imdbId = TmdbData.imdb_id;
    let OmdbResponse = await fetch(`https://www.omdbapi.com/?apikey=${OMDB_API}&i=${imdbId}`);
    let OmdbData = await OmdbResponse.json();

    let trailer = (TmdbData.videos.results[0]) ? TmdbData.videos.results[0].key : '';

    return {
      id: TmdbData.id,
      title: TmdbData.title,
      poster_path: TmdbData.poster_path,
      release_date: TmdbData.release_date,
      genres: TmdbData.genres,
      runtime: TmdbData.runtime,
      countries: TmdbData.production_countries,
      tagline: TmdbData.tagline,
      overview: TmdbData.overview,
      cast: TmdbData.credits.cast.slice(0, 10),
      trailer: trailer,
      director: OmdbData.Director,
      writer: OmdbData.Writer,
      imdb_rating: OmdbData.imdbRating,
      imdb_votes: OmdbData.imdbVotes,
      imdbId: OmdbData.imdbID,
      metacritic_rating: OmdbData.Metascore,
      certification: OmdbData.Rated,
    }
  }

  /* Gets random movie id */
  async function rollMovie(options = null) {
    let genresIds = (options) ? options.genres.join(',') : '';
    let startDate = (options) ? options.years[0] + '-01-01' : '1900-01-01';
    let endDate = (options) ? options.years[1] + '-12-31' : new Date().getFullYear() + '-12-31';

    let response = await fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API}&language=en-US&sort_by=popularity.desc&include_adult=false&include_video=false&page=1&primary_release_date.gte=${startDate}&primary_release_date.lte=${endDate}&with_genres=${genresIds}`);
    let data = await response.json();
    if (data.total_results == 0) throw 'Not found';

    let movieNumber = (data.total_results > 400) ? randomInteger(1, 400) : randomInteger(1, data.total_results);
    let pageNumber = Math.ceil(movieNumber / 20);
    let movieIndex = movieNumber % 20;
    movieIndex = (movieIndex == 0) ? 19 : movieIndex - 1;

    response = await fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API}&language=en-US&sort_by=popularity.desc&include_adult=false&include_video=false&page=${pageNumber}&primary_release_date.gte=${startDate}&primary_release_date.lte=${endDate}&with_genres=${genresIds}`);
    data = await response.json();

    let movieInfo = data.results[movieIndex];
    return movieInfo.id;
  }

  /* IMDb rating circle */
  function showImdbRating(rating = 0) {
    let $ratingIMDb = document.querySelector('.imdb-bar');
    $ratingIMDb.innerHTML = '';

    let color = '#00c853';
    if (rating < 0.7 && rating >= 0.5) {
      color = '#ffd600';
    } else if (rating < 0.5) {
      color = '#dd2c00';
    }

    let stepFunction;
    if (rating) {
      stepFunction = function (state, circle) {
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
    } else {
      stepFunction = function (state, circle) {
        circle.path.setAttribute('stroke', state.color);
        circle.path.setAttribute('stroke-width', state.width);
        circle.setText('N/A');
      }
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
      step: stepFunction
    });
    barIMDb.text.style.fontFamily = 'sans-serif';
    barIMDb.text.style.fontSize = (rating) ? '23px' : '18px';

    barIMDb.animate(rating);  // Number from 0.0 to 1.0
  }

  /* Metacritic rating circle */
  function showMetacriticRating(rating = 0) {
    let $ratingMetacritic = document.querySelector('.metacritic-bar');
    $ratingMetacritic.innerHTML = '';

    let color = '#00c853';
    if (rating < 0.7 && rating >= 0.5) {
      color = '#ffd600';
    } else if (rating < 0.5) {
      color = '#dd2c00';
    }

    let stepFunction;
    if (rating) {
      stepFunction = function (state, circle) {
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
    } else {
      stepFunction = function (state, circle) {
        circle.path.setAttribute('stroke', state.color);
        circle.path.setAttribute('stroke-width', state.width);
        circle.setText('N/A');
      }
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

      step: stepFunction
    });
    barMetacritic.text.style.fontFamily = 'sans-serif';

    barMetacritic.text.style.fontSize = (rating) ? '23px' : '18px';
    barMetacritic.animate(rating);
  }

  function showLoadingScreen() {
    document.querySelector('.container').classList.add('hidden');
    document.querySelector('.loading-screen').classList.add('active');
  }

  function hideLoadingScreen() {
    document.querySelector('.container').classList.remove('hidden');
    document.querySelector('.loading-screen').classList.remove('active');
  }

  function showLoadingError(message) {
    document.querySelector('.sk-chase').style.display = 'none';
    let $error = document.createElement('div');
    $error.innerHTML = message;
    document.querySelector('.loading-screen').append($error);
    return $error;
  }

  function scrollToTop() {
    window.scrollTo(0, 0);
  }

  function randomInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /* Creates movie genres select */
  let slim = new SlimSelect({
    select: '.genres-select',
    placeholder: 'Select genres (max. 3)',
    limit: 3,
    hideSelectedOption: true,
    closeOnSelect: true,
    showSearch: false,
  });

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

  /* Roll button */
  document.querySelector('.roll-button').addEventListener('click', function (e) {
    showLoadingScreen();

    let options = {};
    options.genres = slim.selected();
    options.years = $settingYears.noUiSlider.get();

    renderMovie(options);
  });

  /* Updates year tooltips */
  let $settingYearsStart = document.querySelector('.years-left-tooltip');
  let $settingYearsEnd = document.querySelector('.years-right-tooltip');

  $settingYears.noUiSlider.on('update', function (values, handle) {
    $settingYearsStart.innerHTML = values[0];
    $settingYearsEnd.innerHTML = values[1];
  });

  /* Cast scroll */
  document.querySelector('.cast').addEventListener('scroll', (e) => e.currentTarget.classList.add('scrolled'));

  /* Sets empty last rolled */
  if (!localStorage.getItem('lastRolled')) {
    localStorage.setItem('lastRolled', '[]');
  }
});
