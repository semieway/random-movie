import * as fn from './functions.js';

document.addEventListener('DOMContentLoaded', function() {
  fn.renderMovie();

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

  /* Updates year tooltips */
  let $settingYearsStart = document.querySelector('.years-left-tooltip');
  let $settingYearsEnd = document.querySelector('.years-right-tooltip');

  $settingYears.noUiSlider.on('update', function (values, handle) {
    $settingYearsStart.innerHTML = values[0];
    $settingYearsEnd.innerHTML = values[1];
  });

  /* Cast scroll */
  let $castList = document.querySelector('.cast-list');
  let $castScrollButton = document.querySelector('.cast-scroll-button');
  $castScrollButton.addEventListener('click', function(e) {
    $castScrollButton.classList.add('scrolled');
    $castList.scroll({ left: $castList.scrollWidth, behavior: 'smooth' });
  });

  $castList.addEventListener('scroll', function(e) {
    if ($castList.scrollLeft > 0) {
      $castScrollButton.classList.add('scrolled');
    }
  });

  /* Roll button */
  document.querySelector('.roll-button').addEventListener('click', function (e) {
    fn.showLoadingScreen();

    let options = {};
    options.genres = slim.selected();
    options.years = $settingYears.noUiSlider.get();

    fn.renderMovie(options);

    $castList.scrollLeft = 0;
    $castScrollButton.classList.remove('scrolled');
  });

  /* Sets empty last rolled */
  if (!localStorage.getItem('lastRolled')) {
    localStorage.setItem('lastRolled', '[]');
  }
});
