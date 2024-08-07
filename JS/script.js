// Like/dislike heart animation + updating likes on the front end only.
function heartAnimation(event) {
  const heartIcon = event.target;
  toggleHeartAnimation(heartIcon);
  updateLikesCount(heartIcon);
}

function toggleHeartAnimation(heartIcon) {
  heartIcon.classList.toggle("heart-active");
  heartIcon.classList.toggle("fa-solid");
}

function updateLikesCount(heartIcon) {
  const card = heartIcon.closest(".card");
  const likesElem = card.querySelector(".like-count");
  let likes = parseInt(likesElem.innerText);

  likes += heartIcon.classList.contains("heart-active") ? 1 : -1;
  likesElem.innerText = likes;
}

// Delete clicked element with SweetAlert2 confirmation
function deleteElement(event) {
  const deleteIcon = event.target;

  // Using SweetAlert2 for the confirmation dialog
  Swal.fire({
    title: "Are you sure?",
    text: "You won't be able to revert this!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, delete it!",
  }).then((result) => {
    if (result.isConfirmed) {
      deleteCardFromLocalStorage(deleteIcon.getAttribute("data-id"));
      deleteIcon.closest(".card").remove();
      Swal.fire("Deleted!", "Your photo has been deleted.", "success");
    }
  });
}

// API call credentials
const UNSPLASH_API_URL = "https://api.unsplash.com/photos/?client_id=";
const UNSPLASH_API_KEY = "5BFamL-qwIJlWsUajaoaCj3jGesVJ4BxTPU-1Uexm_c";

// Fetch photos from Unsplash API
async function fetchPhotosFromAPI(page) {
  const response = await fetch(
    `${UNSPLASH_API_URL}${UNSPLASH_API_KEY}&page=${page}`
  );
  return response
    .json()
    .catch((error) => console.error("Error fetching data from API:", error));
}

// Create and append public photo cards
const publicGrid = document.querySelector("#public-photos-grid");

function createPublicCard(
  profilePictureURL,
  username,
  imageURL,
  imageName = "",
  imageDesc = "",
  likes = 0
) {
  const publicCard = `
    <div class="card">
      <img class="profile-pic" src="${profilePictureURL}" alt="profile picture">
      <div class="name">${username}<i class="fas fa-check"></i></div>
      <div class="photo">
        <img src="${imageURL}" alt="user image">
      </div>
      <i class="fa-regular fa-heart heart-icon" onclick="heartAnimation(event)"></i>
      <div class="photo-text">
        <div class="photo-name-likes">
          <h4>${imageName}</h4>
          <h6><span class="like-count">${likes}</span> Likes</h6>
        </div>
        <p>${imageDesc}</p>
      </div>
    </div>`;
  publicGrid.innerHTML += publicCard;
}

function generateCardsFromAPIData(data) {
  data.forEach((photo) => {
    createPublicCard(
      photo.user.profile_image.small,
      photo.user.username,
      photo.urls.regular,
      "Lorem Ipsum",
      photo.description || "Lorem ipsum dolor sit amet.",
      photo.likes
    );
  });
}

// Create and append local photo cards
const localGrid = document.querySelector("#local-photos-grid");

function createLocalCard(card) {
  const localCard = `
    <div class="card">
      <img class="profile-pic" src="Images/user.png" alt="profile picture">
      <div class="name">thecolorlesseyes<i class="fas fa-check"></i></div>
      <i class="fa-regular fa-trash-can trash-icon" onclick="deleteElement(event)" data-id="${card.id}"></i>
      <div class="photo">
        <img src="${card.img}" alt="user image">
      </div>
      <i class="fa-regular fa-heart heart-icon" onclick="heartAnimation(event)"></i>
      <div class="photo-text">
        <div class="photo-name-likes">
          <h4>${card.name}</h4>
          <h6><span class="like-count">0</span> Likes</h6>
        </div>
        <p>${card.desc}</p>
      </div>
    </div>`;
  localGrid.innerHTML += localCard;
}

function generateCardsFromLocalStorage() {
  Object.keys(localStorage).forEach((key) => {
    if (key !== "idCounter") {
      try {
        const card = JSON.parse(localStorage[key]);
        if (isValidCard(card)) {
          createLocalCard(card);
        }
      } catch (error) {
        console.error("Error parsing JSON from localStorage:", error);
      }
    }
  });
}

function isValidCard(card) {
  return card && card.id && card.name && card.desc && card.img;
}

// Local storage manipulation
class Card {
  constructor(id, name, desc, img) {
    this.id = id;
    this.name = name;
    this.desc = desc;
    this.img = img;
  }
}

function writeCardToLocalStorage(card) {
  const idCounter = localStorage.idCounter || 0;
  localStorage.setItem(`card${idCounter}`, JSON.stringify(card));
  localStorage.idCounter = parseInt(idCounter) + 1;
}

function deleteCardFromLocalStorage(id) {
  localStorage.removeItem(`card${id}`);
}

// Form validation and submission
function handleFormSubmission(event) {
  event.preventDefault(); // Prevent form submission until validation is complete

  const name = document.querySelector("#text-name");
  const desc = document.querySelector("#text-desc");
  const img = document.querySelector("#file-input");

  if (isValidForm(name, desc, img)) {
    const reader = new FileReader();
    reader.readAsDataURL(img.files[0]);
    reader.onload = () => {
      const newCard = new Card(
        localStorage.idCounter || 0,
        name.value,
        desc.value,
        reader.result
      );
      writeCardToLocalStorage(newCard);
      window.location.href = "index.html#local-photos-grid";
    };
  }
}

// Validate text and image formats
function isValidForm(name, desc, img) {
  const regex = /^[a-zA-Z-,]*$/;
  if (!regex.test(name.value)) {
    toastr.warning(
      "You can only use alphabets , or - for Name field",
      "Warning"
    );
    return false;
  }
  if (!img.files[0]) {
    toastr.warning("Please upload an image", "Warning");
    return false;
  }
  const imgType = img.files[0].type;
  if (!["image/jpg", "image/jpeg", "image/png"].includes(imgType)) {
    toastr.warning(
      "Please choose an image in jpg, jpeg or png format!",
      "Warning"
    );

    return false;
  }
  return true;
}

// Event listeners
if (document.body.id === "index-body") {
  document.addEventListener("DOMContentLoaded", () => {
    generateCardsFromLocalStorage();
    fetchPhotosFromAPI(Math.floor(Math.random() * 100)).then(
      generateCardsFromAPIData
    );
  });
} else {
  document
    .querySelector("#add-photo-form")
    .addEventListener("submit", handleFormSubmission);
}

// Toastr Options

toastr.options = {
  closeButton: true,
  debug: false,
  newestOnTop: false,
  progressBar: true,
  positionClass: "toast-top-right",
  preventDuplicates: true,
  onclick: null,
  showDuration: "300",
  hideDuration: "1000",
  timeOut: "5000",
  extendedTimeOut: "1000",
  showEasing: "swing",
  hideEasing: "linear",
  showMethod: "fadeIn",
  hideMethod: "fadeOut",
};
