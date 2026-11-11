
"use strict";

// ------------------------------
// MOBILE NAVIGATION
// ------------------------------

const menuToggle = document.getElementById("menuToggle");
const nav = document.getElementById("nav");

menuToggle.addEventListener("click", () => {
  nav.classList.toggle("open");
  menuToggle.textContent = nav.classList.contains("open") ? "✕" : "☰";
});

nav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    nav.classList.remove("open");
    menuToggle.textContent = "☰";
  });
});

// ------------------------------
// ROOM INFORMATION
// ------------------------------

const rooms = {
  standard: { name: "Standard Room", price: 2499, capacity: 2 },
  deluxe: { name: "Deluxe Room", price: 3999, capacity: 3 },
  suite: { name: "Executive Suite", price: 5999, capacity: 4 },
  family: { name: "Family Room", price: 7499, capacity: 6 }
};

const roomCards = document.querySelectorAll(".room-card");
const roomButtons = document.querySelectorAll(".select-room");

// ------------------------------
// DATE HELPERS
// ------------------------------

const checkIn = document.getElementById("checkIn");
const checkOut = document.getElementById("checkOut");
const bookingCheckIn = document.getElementById("bookingCheckIn");
const bookingCheckOut = document.getElementById("bookingCheckOut");

function getLocalDate() {
  const date = new Date();

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

function getTomorrow(dateString) {
  const date = new Date(`${dateString}T12:00:00`);
  date.setDate(date.getDate() + 1);

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

const today = getLocalDate();

[checkIn, bookingCheckIn].forEach((input) => {
  input.min = today;
});

[checkOut, bookingCheckOut].forEach((input) => {
  input.min = getTomorrow(today);
});

function updateCheckoutMinimum(startInput, endInput) {
  const start = startInput.value || today;
  endInput.min = getTomorrow(start);

  if (endInput.value && endInput.value <= start) {
    endInput.value = "";
  }
}

checkIn.addEventListener("change", () => {
  updateCheckoutMinimum(checkIn, checkOut);
});

bookingCheckIn.addEventListener("change", () => {
  updateCheckoutMinimum(bookingCheckIn, bookingCheckOut);
});

// ------------------------------
// SEARCH ROOMS
// ------------------------------

const searchForm = document.getElementById("searchForm");
const searchGuests = document.getElementById("searchGuests");
const searchMessage = document.getElementById("searchMessage");

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const start = checkIn.value;
  const end = checkOut.value;
  const guests = Number(searchGuests.value);

  if (!start || !end) {
    searchMessage.textContent = "Please select both check-in and check-out dates.";
    return;
  }

  if (start < today || end <= start) {
    searchMessage.textContent = "Please select valid future dates. Check-out must be after check-in.";
    return;
  }

  // Demo room filtering by guest capacity.
  roomCards.forEach((card) => {
    const capacity = Number(card.dataset.capacity);
    card.hidden = capacity < guests;
  });

  const matchingRooms = [...roomCards].filter((card) => !card.hidden);

  if (matchingRooms.length === 0) {
    searchMessage.textContent = "No room matches that guest count. Please try fewer guests.";
  } else {
    searchMessage.textContent =
      `${matchingRooms.length} room type(s) match your search for ${guests} guest(s). Select a room below to continue.`;

    // Carry the selected search details into the booking form.
    bookingCheckIn.value = start;
    bookingCheckOut.value = end;
    document.getElementById("bookingGuests").value = String(guests);

    updateCheckoutMinimum(bookingCheckIn, bookingCheckOut);
    calculatePrice();

    document.getElementById("rooms").scrollIntoView({ behavior: "smooth" });
  }
});

// ------------------------------
// SELECT A ROOM
// ------------------------------

const selectedRoom = document.getElementById("selectedRoom");

roomButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedRoom.value = button.dataset.room;

    // Update the selected room's guest count if needed.
    const capacity = rooms[selectedRoom.value].capacity;
    const guestSelect = document.getElementById("bookingGuests");

    if (Number(guestSelect.value) > capacity) {
      guestSelect.value = String(capacity);
    }

    calculatePrice();

    document.getElementById("booking-details").scrollIntoView({
      behavior: "smooth"
    });
  });
});

// ------------------------------
// LIVE PRICE CALCULATION
// ------------------------------

const bookingGuests = document.getElementById("bookingGuests");
const nightlyPrice = document.getElementById("nightlyPrice");
const nightCount = document.getElementById("nightCount");
const totalPrice = document.getElementById("totalPrice");

function calculateNights(start, end) {
  if (!start || !end || end <= start) {
    return 0;
  }

  const startDate = new Date(`${start}T12:00:00`);
  const endDate = new Date(`${end}T12:00:00`);

  return Math.round((endDate - startDate) / 86400000);
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);
}

function calculatePrice() {
  const room = rooms[selectedRoom.value];
  const nights = calculateNights(
    bookingCheckIn.value,
    bookingCheckOut.value
  );

  const price = room ? room.price : 0;
  const total = price * nights;

  nightlyPrice.textContent = formatCurrency(price);
  nightCount.textContent = String(nights);
  totalPrice.textContent = formatCurrency(total);
}

[selectedRoom, bookingGuests, bookingCheckIn, bookingCheckOut].forEach((input) => {
  input.addEventListener("change", calculatePrice);
});

// ------------------------------
// BOOKING FORM VALIDATION
// ------------------------------

const bookingForm = document.getElementById("bookingForm");
const bookingMessage = document.getElementById("bookingMessage");

const guestName = document.getElementById("guestName");
const guestPhone = document.getElementById("guestPhone");

bookingForm.addEventListener("submit", (event) => {
  event.preventDefault();

  bookingMessage.textContent = "";
  bookingMessage.className = "booking-message";

  const name = guestName.value.trim();
  const phone = guestPhone.value.trim();
  const roomKey = selectedRoom.value;
  const guests = Number(bookingGuests.value);
  const start = bookingCheckIn.value;
  const end = bookingCheckOut.value;

  if (name.length < 2) {
    showBookingError("Please enter a valid full name.");
    return;
  }

  if (!/^[6-9]\d{9}$/.test(phone)) {
    showBookingError("Enter a valid 10-digit Indian mobile number.");
    return;
  }

  if (!rooms[roomKey]) {
    showBookingError("Please select a room.");
    return;
  }

  if (!start || !end || start < today || end <= start) {
    showBookingError("Please select valid check-in and check-out dates.");
    return;
  }

  if (!Number.isInteger(guests) || guests < 1 || guests > rooms[roomKey].capacity) {
    showBookingError(
      `This room accommodates up to ${rooms[roomKey].capacity} guest(s). Please choose a suitable room.`
    );
    return;
  }

  const nights = calculateNights(start, end);

  if (nights < 1) {
    showBookingError("Your stay must be at least one night.");
    return;
  }

  const total = rooms[roomKey].price * nights;

  // Show the demo confirmation modal.
  openConfirmation({
    name,
    phone,
    room: rooms[roomKey].name,
    guests,
    start,
    end,
    nights,
    total
  });
});

function showBookingError(message) {
  bookingMessage.textContent = message;
  bookingMessage.classList.add("error");
}

// ------------------------------
// CONFIRMATION MODAL
// ------------------------------

const confirmationModal = document.getElementById("confirmationModal");
const modalDescription = document.getElementById("modalDescription");
const modalSummary = document.getElementById("modalSummary");

const closeModalButton = document.getElementById("closeModal");
const doneButton = document.getElementById("doneButton");

function openConfirmation(details) {
  modalDescription.textContent =
    `Thank you, ${details.name}! Your demo booking request is ready.`;

  modalSummary.textContent =
    `Guest: ${details.name}\n` +
    `Phone: ${details.phone}\n` +
    `Room: ${details.room}\n` +
    `Guests: ${details.guests}\n` +
    `Check-in: ${details.start}\n` +
    `Check-out: ${details.end}\n` +
    `Nights: ${details.nights}\n` +
    `Estimated Total: ${formatCurrency(details.total)}`;

  confirmationModal.classList.add("show");
  confirmationModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  closeModalButton.focus();
}

function closeConfirmation() {
  confirmationModal.classList.remove("show");
  confirmationModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

closeModalButton.addEventListener("click", closeConfirmation);
doneButton.addEventListener("click", closeConfirmation);

confirmationModal.addEventListener("click", (event) => {
  if (event.target === confirmationModal) {
    closeConfirmation();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && confirmationModal.classList.contains("show")) {
    closeConfirmation();
  }
});
