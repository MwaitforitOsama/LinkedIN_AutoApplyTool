const timer = (ms) => new Promise((res) => setTimeout(res, ms));

let user_data = {
  fname: '',
  lname: '',
  country_code: '',
  phone: '',
  gpt_key: '',
  email: '',
  street: '',
  city: '',
  postal_code: '',
  state: '',
  full_name: '',
  cover_letter: '',
  about_you: '',
  country: '',
};

let isProgress = false;

const isDataSet = () => {
  if (user_data) {
    return (
      user_data.fname.length > 0 &&
      user_data.lname.length > 0 &&
      user_data.gpt_key.length > 0 &&
      user_data.country_code.length > 0 &&
      user_data.email.length > 0 &&
      user_data.postal_code.length > 0 &&
      user_data.about_you.length > 0
    );
  }
  return false;
};

chrome.runtime.onMessage.addListener(async function (
  request,
  sender,
  sendResponse
) {
  switch (request.type) {
    case 'StartApply':
      if (!isProgress && isDataSet()) {
        isProgress = true;
      }
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        console.log(tabs);
        tabId = tabs[0].id;
        chrome.scripting.executeScript({
          target: { tabId: tabId, allFrames: true },
          files: ['content.js'],
        });
        chrome.tabs.sendMessage(tabId, {
          type: 'StartApplyContent',
          data: user_data,
        });
      });
      break;
    case 'SaveData':
      user_data = request.user_data;
      console.log(user_data);
      break;
    default:
      break;
  }
});
