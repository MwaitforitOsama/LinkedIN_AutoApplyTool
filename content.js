let user_data = {};

let cover_letter = '';

let about_you = '';

let JobListWrapper;
let JobDetailPanel;
let AllJobs;

let JobApplyModal;
let ApplyButton, NextButton;

let checkLastStep = false;
let hasError = false;
let current_page = 'before';
let jobDescription = '';

const decideInsertedVal = (ele) => {
  if (ele.innerText.includes('First name')) {
    return user_data['fname'];
  } else if (ele.innerText.includes('Last name')) {
    return user_data['lname'];
  } else if (ele.innerText.includes('country code')) {
    return user_data['country_code'];
  } else if (ele.innerText.includes('country')) {
    return user_data['country'];
  } else if (
    ele.innerText.includes('phone number') ||
    ele.innerText.includes('Phone')
  ) {
    return user_data['phone'];
  } else if (ele.innerText.includes('Email')) {
    return user_data['email'];
  } else if (ele.innerText.includes('Street')) {
    return user_data['street'];
  } else if (ele.innerText.includes('City')) {
    return user_data['city'];
  } else if (ele.innerText.includes('ZIP')) {
    return user_data['postal_code'];
  } else if (ele.innerText.includes('State')) {
    return user_data['state'];
  } else if (ele.innerText.includes('Your name')) {
    return user_data['full_name'];
  } else if (ele.innerHTML.includes('Cover letter')) {
    return cover_letter;
  }
  return null;
};

const fetchToOpenAI = async (q, maxRetries = 5) => {
  let retryCount = 0;
  let hasError = true;
  let responseData;
  const apiKey = user_data['gpt_key'];

  while (retryCount < maxRetries && hasError) {
    try {
      // Construct the request body for company list generation
      const message = `My CV is delimited by "//", the Job description is delimated by "@@" and the query is delimited by "&&". Provide relevant information based on my CV context. If there is not enough information in my CV about the query, make sure that you answer the questions in a way that I always land an interview. Such as if I am eligible to work in USA or If I have a degree. All the answers should be yes that support my interview process. \n   //${about_you}// \n @@${jobDescription}@@ \n &&${q}&&`;
      console.log(message);
      const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: message }],
            temperature: 0.7,
          }),
        }
      );

      const data = await response.json();
      await timer(2000);
      responseData = data.choices[0].message.content;
      console.log(responseData);
      hasError = false; // No error, break out of the loop
    } catch (e) {
      console.error('Error occurred:', e);
      retryCount++;
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for 1 second before retrying
    }
  }

  if (hasError) {
    console.error(`Failed after ${maxRetries} retries`);
    throw new Error('Failed to fetch data from OpenAI');
  }

  return responseData;
};

function isNumeric(value) {
  return !isNaN(parseFloat(value)) && isFinite(value);
}

const checkJob = (job) => {
  return job.innerHTML.includes('Easy Apply') ? true : false;
};

const SetRadiocAndCheckboxElement = async (wrapper) => {
  try {
    const elements = wrapper.querySelectorAll('fieldset>div');
    const available_values = [];

    elements.forEach((element, index) => {
      available_values.push(element.innerText);
    });

    const radioFormLegend = wrapper.querySelector(
      'fieldset>legend>span>span'
    ).innerText;
    const radioOpenAiQuery = `
        ${radioFormLegend}\n
        Available options: ${JSON.stringify(available_values)}.
        Select one of the available options and return only its index from the cotext provided to you. The indexes of available options start from 0.`;

    console.log(radioOpenAiQuery);
    let answer = await fetchToOpenAI(radioOpenAiQuery);
    console.log(answer);

    answer = isNumeric(answer) ? parseInt(answer) : 0;

    elements[answer].querySelector('input').checked = true;

    let event = new Event('change', {
      bubbles: true,
      cancelable: true,
    });
    elements[answer].querySelector('input').dispatchEvent(event);
  } catch (e) {
    hasError = true;
  }
};

const OpenJob = async (job) => {
  // open the job
  job.querySelector('.job-card-container--clickable')?.click();

  // scroll to the active job
  JobListWrapper.scrollTop = job.offsetTop;

  await timer(2000);
  JobDetailPanel = document.querySelector('.jobs-search__job-details--wrapper');
  var jobDetailsDiv = document.querySelector(
    '.jobs-box__html-content.jobs-description-content__text.t-14.t-normal'
  );

  if (jobDetailsDiv) {
    jobDescription = jobDetailsDiv.textContent;
  }

  JobDetailPanel.innerHTML.includes('Easy Apply')
    ? await timer(2000)
    : await timer(2000);
};

function isJSON(str) {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}

const InsertData = async () => {
  try {
    const formelements = JobApplyModal.querySelectorAll(
      '.jobs-easy-apply-form-element'
    );
    for (let index = 0; index < formelements.length; index++) {
      const item = formelements[index];
      const inputElement =
        item.querySelector('input') ||
        item.querySelector('select') ||
        item.querySelector('textarea');

      if (
        item.innerHTML.includes('radio') ||
        item.innerHTML.includes('checkbox')
      ) {
        await SetRadiocAndCheckboxElement(item);
        await timer(2000);
        continue;
      }

      if (
        current_page.includes('Contact') ||
        current_page.includes('address') ||
        current_page.includes('Resume')
      ) {
        inputElement.value = decideInsertedVal(item);
      } else {
        let openAIQuery = item.querySelector('label').innerText;
        if (item.innerHTML.includes('numeric')) {
          if (item.innerHTML.includes('numeric')) {
            openAIQuery +=
              '\nProvide a numerical answer in the format { "answer": x }.\n' +
              'If the answer is not clear or cannot be determined, return an answer which is close to job description in the same format of { "answer": x }. If both Job description and CV dont have the context, return {"answer" : 1}\n' +
              'Avoid any string responses; only numeric values are expected in the context of the CV query.';
          }
        }

        if (inputElement.innerHTML.includes('<option')) {
          const available_values = [];
          const options = inputElement.querySelectorAll('option');
          options.forEach((item, index) => {
            available_values.push(item.innerText);
          });
          openAIQuery +=
            `Choose one from the following options: ${JSON.stringify(
              available_values
            )}.` +
            `Ensure your answer is case-sensitive and matches exactly one of the available values.` +
            `Avoid including any extra characters (even '.') in your response.` +
            `In case you are not able to determine, return the first value`;
        }

        let answer = await fetchToOpenAI(openAIQuery);
        await timer(100);

        if (item.innerHTML.includes('numeric')) {
          if (isJSON(answer)) {
            answer = JSON.parse(answer).answer;
            inputElement.value = answer;
          } else {
            answer = 4;
          }
          // answer = !isNumeric(answer) ? 4 : parseInt(answer.answer);
        }
        inputElement.value = answer;
      }

      // trigger event
      let event = new Event('input', {
        bubbles: true,
        cancelable: true,
      });
      inputElement.dispatchEvent(event);
      event = new Event('change');
      inputElement.dispatchEvent(event);

      if (item.innerText.includes('City')) {
        await timer(2000);
        //enter event
        enter = new KeyboardEvent('keydown', {
          key: 'Enter',
          bubbles: true,
          cancelable: true,
        });
        inputElement.dispatchEvent(enter);
        await timer(2000);
      }

      await timer(2000);
    }
    NextButton = JobApplyModal.querySelector(
      'button[data-easy-apply-next-button]'
    );
    NextButton?.click();
    // check if this is last page and if so, click the review button
    const ReviewButton = document.querySelector(
      "button[aria-label='Review your application']"
    );
    if (ReviewButton) {
      checkLastStep = true;
      ReviewButton?.click();
    }
    const submitButton = document.querySelector(
      "button[aria-label='Submit application']"
    );
    if (submitButton) {
      checkLastStep = true;
      current_page = 'Review';
    }
  } catch (e) {
    console.log(e);
    hasError = true;
  }
};

const cancelCurrentApply = async () => {
  try {
    const disMissButton = document.querySelector(
      'button[aria-label="Dismiss"]'
    );
    disMissButton?.click();
    await timer(2000);
    const discardButton = document.querySelector(
      "button[data-control-name='discard_application_confirm_btn']"
    );
    discardButton?.click();
  } catch (error) {
    console.log(error);
  }
};

const identifyPage = async () => {
  try {
    const header = JobApplyModal.querySelector('div h3');
    if (
      header.innerHTML.includes('identification') ||
      current_page == header.innerText
    ) {
      hasError = true;
      await cancelCurrentApply();
      return;
    }
    current_page = header.innerText;
    await InsertData();
  } catch (error) {
    console.log(error);
  }
};

const AttachNormalElementsToVariables = async () => {
  // get global elements
  JobApplyModal = document.querySelector('.jobs-easy-apply-modal');
};

const ApplyJob = async () => {
  // open the apply modal
  JobDetailPanel = document.querySelector('.jobs-search__job-details--wrapper');
  ApplyButton = JobDetailPanel.querySelector('.jobs-apply-button');

  if (ApplyButton) {
    current_page = 'before';
    checkLastStep = false;
    hasError = false;
    ApplyButton.click();
    await timer(2000);
    await AttachNormalElementsToVariables();

    // go through apply steps
    while (!checkLastStep && !hasError) {
      await identifyPage();
      await timer(2000);
    }
    if (!hasError) {
      if (
        !JobApplyModal.querySelector('div h3').innerText.includes('Review') &&
        current_page != 'Review'
      ) {
        await cancelCurrentApply();
        return;
      }

      // Click Submit button
      await timer(2000);
      const submitButton = document.querySelector(
        "button[aria-label='Submit application']"
      );
      submitButton?.click();
      await timer(3000);
      const disMissButton = document.querySelector(
        "button[aria-label='Dismiss']"
      );
      disMissButton?.click();
    } else {
      await cancelCurrentApply();
    }
  }
};

const getJobsList = async () => {
  JobListWrapper = document.querySelector('.jobs-search-results-list');
  AllJobs = JobListWrapper.querySelectorAll(
    'li.jobs-search-results__list-item'
  );

  return AllJobs;
};

const LoopJobsOnOnePage = async (jobs_list) => {
  for (let index = 0; index < jobs_list.length; index++) {
    // open the job
    await OpenJob(jobs_list[index]);
    // check if the job is "easy apply job" or not
    if (!checkJob(jobs_list[index])) continue;
    // Apply job
    await ApplyJob();
  }
};

const timer = (ms) => new Promise((res) => setTimeout(res, ms));

chrome.runtime.onMessage.addListener(async function (
  request,
  sender,
  sendResponse
) {
  switch (request.type) {
    case 'StartApplyContent':
      user_data = request.data;
      cover_letter = user_data.cover_letter;
      about_you = user_data.about_you;
      let page_index = 1;
      let indicator;
      do {
        indicator = document.querySelector(
          `ul.artdeco-pagination__pages.artdeco-pagination__pages--number button[aria-label="Page ${page_index}"]`
        );
        indicator?.click();
        await timer(3000);

        const jobs_list = await getJobsList();
        await LoopJobsOnOnePage(jobs_list);

        page_index++;
      } while (indicator);
      break;

    default:
      break;
  }
});
// // basic data for applying

// // function for time delay

// // get list of the jobs in the current page

// // get answer of screening questions using OpenAI

// Listen for messages from popup
// chrome.runtime.onMessage.addListener(async function (
//   request,
//   sender,
//   sendResponse
// ) {
//   if (request.type == 'StartApply') {
//     console.log('hMein hun yhan');
//     const { data } = request;
//     user_data = data.user_data;
//     cover_letter = data.cover_letter;
//     about_you = data.about_you;

//     let page_index = 1;
//     let indicator;
//     do {
//       indicator = document.querySelector(
//         `ul.artdeco-pagination__pages.artdeco-pagination__pages--number button[aria-label="Page ${page_index}"]`
//       );
//       indicator?.click();
//       await timer(3000);

//       const jobs_list = await getJobsList();
//       await LoopJobsOnOnePage(jobs_list);

//       page_index++;
//     } while (indicator);

//     chrome.runtime.sendMessage({ type: 'EndofApply' });

// });
