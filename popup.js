const loginLink = document.querySelector('.login-link');
const mainWindow = document.querySelector('.main-window');
const userInput = document.querySelector('.user-input');
const startButton = document.getElementById('start');
const stopButton = document.getElementById('stop');
const settingButton = document.getElementById('setting');
const saveButton = document.getElementById('save');
const cvInput = document.getElementById('cvInput');
const outputDiv = document.getElementById('output');
const country = document.getElementById('country');
const state = document.getElementById('state');
const city = document.getElementById('city');

import {
  getDocument,
  GlobalWorkerOptions,
} from './pdfjs-4.0.379-dist/build/pdf.mjs';
GlobalWorkerOptions.workerSrc = './pdfjs-4.0.379-dist/build/pdf.worker.mjs';

let user_data = {
  fname: '',
  country: '',
  lname: '',
  country_code: '',
  phone: '',
  gpt_key: '',
  email: '',
  street: '',
  state: '',
  city: '',
  postal_code: '',
  full_name: '',
  cover_letter: '',
  about_you: '',
};

const insertDataFromBackground = (data) => {
  document.querySelector('#fname').value = data.fname;
  document.querySelector('#lname').value = data.lname;
  document.querySelector('#country_code').value =
    data.country_code.match(/\d+/)[0];
  document.querySelector('#gpt_key').value = data.gpt_key;
  document.querySelector('#phone').value = data.phone;
  document.querySelector('#email').value = data.email;
  document.querySelector('#street').value = data.street;
  // document.querySelector('#city').value = data.city;
  document.querySelector('#postal_code').value = data.postal_code;
  // document.querySelector('#state').value = data.state;
  document.querySelector('.cover-letter').value = data.cover_letter;
};

const extractTextFromCV = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    let allText = '';
    reader.onload = async (e) => {
      const arrayBuffer = e.target.result;
      try {
        const pdfDoc = await getDocument(arrayBuffer).promise;
        const numPages = pdfDoc.numPages;

        for (let i = 1; i <= numPages; i++) {
          try {
            const page = await pdfDoc.getPage(i);
            const pageText = await page.getTextContent();
            const pageContent = pageText.items
              .map(function (s) {
                return s.str;
              })
              .join(' ');
            allText += pageContent;
          } catch (error) {
            console.error(`Error reading page ${i}:`, error);
          }
        }
        resolve(allText);
      } catch (error) {
        reject(error);
      }
    };
    reader.readAsArrayBuffer(file);
  });
};

const extractDataFromInput = async () => {
  user_data.fname = document.querySelector('#fname').value;
  user_data.lname = document.querySelector('#lname').value;
  user_data.gpt_key = document.querySelector('#gpt_key').value;
  user_data.full_name = user_data.fname + ' ' + user_data.lname;
  const selectedCode = document.querySelector('#country_code');
  const countryCodeText = selectedCode.options[selectedCode.selectedIndex].text;
  user_data.country_code = countryCodeText.replace(/(.+) (\+\d+)/, '$1 ($2)');
  user_data.phone = document.querySelector('#phone').value;
  user_data.email = document.querySelector('#email').value;
  user_data.street = document.querySelector('#street').value;
  const selectedCity = document.querySelector('#city');
  user_data.city = selectedCity.options[selectedCity.selectedIndex].text;
  user_data.postal_code = document.querySelector('#postal_code').value;
  const selectedState = document.querySelector('#state');
  user_data.state = selectedState.options[selectedState.selectedIndex].text;
  const selectedCountry = document.querySelector('#country');
  user_data.country =
    selectedCountry.options[selectedCountry.selectedIndex].text;

  user_data.cover_letter = document.querySelector('.cover-letter').value;
  const formFields = [
    'fname',
    'lname',
    'phone',
    'gpt_key',
    'email',
    'street',
    'postal_code',
    'country',
    'city',
    'state',
  ];
  formFields.forEach((field) => {
    window.localStorage.setItem(field, user_data[field]);
  });
  window.localStorage.setItem(
    'cover_letter',
    document.querySelector('.cover-letter').value
  );
  window.localStorage.setItem(
    'countryCodeValue',
    document.getElementById('country_code').value
  );

  const options = ['country', 'state', 'city'];
  options.forEach((item) => {
    const dropdown = document.getElementById(item);
    const options = Array.from(dropdown.options);
    const optionData = {
      options: options.map((option) => ({
        text: option.text,
        value: option.value,
      })),
      selectedIndex: dropdown.selectedIndex,
    };
    localStorage.setItem(`${item}-values`, JSON.stringify(optionData));
  });

  console.log(localStorage);
  const file = cvInput.files[0];
  if (file) {
    user_data.about_you = await extractTextFromCV(file);
  } else {
    outputDiv.textContent = 'Please select a CV file.';
  }
};

startButton.addEventListener('click', () => {
  try {
    chrome.runtime.sendMessage({ type: 'StartApply' });
  } catch (e) {
    console.log(e);
  }
});

stopButton.addEventListener('click', () => console.log('Stop'));

saveButton.addEventListener('click', async () => {
  try {
    await extractDataFromInput();
    userInput.style.display = 'none';
    saveButton.style.display = 'none';
    mainWindow.style.display = 'block';
    chrome.runtime.sendMessage({ type: 'SaveData', user_data: user_data });
  } catch (error) {
    console.log(error);
  }
});

country.addEventListener('change', () => populateStates());
state.addEventListener('change', () => populateCities());

// function fetchLocationIQData(query, callback) {
//   const apiUrl = `https://us.locationiq.com/v1/search.php?q=Canada&format=json&key=${geoCodingAPI}`;

//   fetch(apiUrl)
//     .then((response) => response.json())
//     .then((data) => callback(data))
//     .catch((error) => console.error('Error fetching LocationIQ data:', error));
// }

settingButton.addEventListener('click', async () => {
  try {
    userInput.style.display = 'block';
    saveButton.style.display = 'block';
    mainWindow.style.display = 'none';
    insertDataFromBackground(user_data);
  } catch (error) {
    console.log(error);
  }
});

window.addEventListener('load', () => {
  try {
    // Retrieve all form fields from local storage
    const formFields = [
      'fname',
      'lname',
      'phone',
      'gpt_key',
      'email',
      'street',
      'city',
      'postal_code',
      'state',
    ];
    formFields.forEach((field) => {
      const value = window.localStorage.getItem(field);
      if (value) {
        user_data[field] = value;
      }
    });
    user_data['country_code'] = window.localStorage.getItem('countryCodeValue');
    const countries = window.localStorage.getItem('country-values');
    const states = window.localStorage.getItem('state-values');
    const cities = window.localStorage.getItem('city-values');

    if (countries && states && cities) {
      const data = [countries, states, cities];
      const fields = ['country', 'state', 'city'];
      for (let i = 0; i < 3; i++) {
        const storedOptions = JSON.parse(data[i]);
        const dropdown = document.getElementById(fields[i]);
        storedOptions.options.forEach((optionData, index) => {
          if (index !== 0) {
            const option = document.createElement('option');
            option.text = optionData.text;
            option.value = optionData.value;
            dropdown.add(option);
          }
          if (index === storedOptions.selectedIndex) {
            dropdown.disabled = false;
            dropdown.options[index].selected = true;
          }
        });

        // dropdown.selectedIndex = storedOptions.selectedIndex;
      }
    } else {
      populateCountries();
    }

    const coverLetterValue = window.localStorage.getItem('cover_letter');
    if (coverLetterValue) {
      document.querySelector('.cover-letter').value = coverLetterValue;
    }
  } catch (error) {
    console.error('Error retrieving data from local storage:', error);
    // Optionally clear local storage to avoid inconsistencies
    window.localStorage.clear();
  }
});

// const onButtonClick = (event) => {
//   console.log('Hanzalah');
//   const button = event.target;
//   if (button.id === 'start') {
//     try {
//       chrome.runtime.sendMessage({ type: 'StartApply' });
//     } catch (e) {
//       console.log(e);
//     }
//   } else if (button.id === 'stop') {
//     try {
//       chrome.runtime.sendMessage({ type: 'StopApply' });
//     } catch (e) {
//       console.log(e);
//     }
//   } else if (button.id == 'save') {
//     try {
//       const collected_data = extractDataFromInput();
//       chrome.runtime.sendMessage({ type: 'SaveData', data: collected_data });

//       userInput.style.display = 'none';
//       saveButton.style.display = 'none';

//       mainWindow.style.display = 'block';
//     } catch (error) {
//       console.log(error);
//     }
//   }
// };

// chrome.runtime.onMessage.addListener(async function (
//   request,
//   sender,
//   sendResponse
// ) {
//   if (request.type == 'SendData') {
//     insertDataFromBackground(request.data);
//   } else if (request.type == 'startButtonStatus') {
//     console.log(request.isProgress);
//     startButton.disabled = request.isProgress;
//   }
// });

// chrome.runtime.sendMessage({
//   type: 'checkProgress',
// });

const geonamesUsername = 'alexscript';

function fetchGeoNamesData(endpoint, query, callback) {
  const apiUrl = `http://api.geonames.org/${endpoint}?${query}&username=${geonamesUsername}`;
  fetch(apiUrl)
    .then((response) => response.json()) // This returns a Promise
    .then((data) => callback(data))
    .catch((error) => console.error('Error fetching GeoNames data:', error));
}

function populateDropdown(dropdown, data) {
  if (document.getElementById('country') === dropdown) {
    dropdown.innerHTML =
      '<option value="" selected disabled>Select Country</option>';
  } else if (document.getElementById('state') === dropdown) {
    dropdown.innerHTML =
      '<option value="" selected disabled>Select State</option>';
  } else if (document.getElementById('city') === dropdown) {
    dropdown.innerHTML =
      '<option value="" selected disabled>Select City</option>';
  }
  data.forEach((item) => {
    const option = document.createElement('option');
    option.value = item.geonameId;
    if (document.getElementById('country') === dropdown) {
      option.text = item.countryName;
    } else if (document.getElementById('state') === dropdown) {
      option.text = item.adminName1;
    } else if (document.getElementById('city') === dropdown) {
      option.text = item.toponymName;
    }

    dropdown.add(option);
  });
}

function populateCountries() {
  fetchGeoNamesData('countryInfoJSON', '', (data) => {
    const countryDropdown = document.getElementById('country');
    populateDropdown(countryDropdown, data.geonames);
    populateStates(); // Automatically populate states after loading countries
  });
}

function populateStates() {
  const countryDropdown = document.getElementById('country');
  const stateDropdown = document.getElementById('state');
  const cityDropdown = document.getElementById('city');

  // Disable state and city dropdowns
  stateDropdown.disabled = true;
  cityDropdown.disabled = true;

  const selectedCountry = countryDropdown.value;

  if (selectedCountry) {
    const query = `geonameId=${selectedCountry}`;
    fetchGeoNamesData('childrenJSON', query, (data) => {
      populateDropdown(stateDropdown, data.geonames);
      // Enable the state dropdown
      stateDropdown.disabled = false;
      populateCities(); // Automatically populate cities after loading states
    });
  } else {
    stateDropdown.innerHTML =
      '<option value="" selected disabled>Select State</option>';
    populateCities(); // Clear cities dropdown if no state is selected
  }
}

function populateCities() {
  const stateDropdown = document.getElementById('state');
  const cityDropdown = document.getElementById('city');
  const selectedState = stateDropdown.value;

  // Disable city dropdown
  cityDropdown.disabled = true;

  if (selectedState) {
    const query = `geonameId=${selectedState}`;
    fetchGeoNamesData('childrenJSON', query, (data) => {
      populateDropdown(cityDropdown, data.geonames);
      // Enable the city dropdown
      cityDropdown.disabled = false;
    });
  } else {
    cityDropdown.innerHTML =
      '<option value="" selected disabled>Select City</option>';
  }
}

// Initialize the country dropdown
