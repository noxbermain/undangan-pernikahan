
// ===================================
// WEDDING CONFIGURATION
// ===================================

const config = WEDDING_CONFIG;


// ===================================
// OPEN INVITATION
// ===================================

const openButton = document.getElementById("openInvitation");
const cover = document.getElementById("cover");
const mainInvitation = document.getElementById("mainInvitation");

const weddingMusic = document.getElementById("weddingMusic");
const musicToggle = document.getElementById("musicToggle");

openButton.addEventListener("click", function () {

    cover.style.display = "none";
    mainInvitation.classList.add("active");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    // Mencoba memulai musik setelah interaksi pengguna.
    if (config.music.enabled) {
        playMusic();
    }

});


// ===================================
// MUSIC PLAYER
// ===================================

function playMusic() {

    if (!config.music.enabled) return;

    weddingMusic.volume = 0.5;

    weddingMusic.play()
        .then(function () {
            musicToggle.classList.add("playing");
            musicToggle.setAttribute("aria-pressed", "true");
        })
        .catch(function (error) {
            console.log("Musik belum dapat diputar:", error);
            musicToggle.classList.remove("playing");
            musicToggle.setAttribute("aria-pressed", "false");
        });

}

function pauseMusic() {

    weddingMusic.pause();

    musicToggle.classList.remove("playing");
    musicToggle.setAttribute("aria-pressed", "false");

}

musicToggle.addEventListener("click", function () {

    if (weddingMusic.paused) {
        playMusic();
    } else {
        pauseMusic();
    }

});

weddingMusic.addEventListener("ended", function () {
    musicToggle.classList.remove("playing");
});


// ===================================
// PERSONALIZED GUEST NAME
// ===================================

const params = new URLSearchParams(window.location.search);
const guest = params.get("to");

const guestName = document.getElementById("guestName");

if (guest && guest.trim()) {
    guestName.textContent = guest.trim().slice(0, 80);
}


// ===================================
// APPLY WEDDING CONFIGURATION
// ===================================

function setText(id, value) {
    const element = document.getElementById(id);

    if (element && value) {
        element.textContent = value;
    }
}

setText("groomNameCover", config.groom.name);
setText("brideNameCover", config.bride.name);

setText("groomName", config.groom.name);
setText("brideName", config.bride.name);

setText("eventName", config.wedding.eventName);
setText("eventDate", config.wedding.dateText);
setText("eventTime", config.wedding.eventTime);
setText("venueName", config.wedding.venue);
setText("venueAddress", config.wedding.address);

const mapsLink = document.getElementById("mapsLink");

if (mapsLink && config.wedding.mapsUrl) {
    mapsLink.href = config.wedding.mapsUrl;
}

// ===================================
// PHOTO FALLBACK
// ===================================

document.querySelectorAll(".photo-frame img, .gallery-item img")
    .forEach(function (img) {

        img.addEventListener("error", function () {
            img.style.display = "none";
        });

    });


// ===================================
// IMAGE LIGHTBOX
// ===================================

const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightboxImage");
const closeLightbox = document.getElementById("closeLightbox");

document.querySelectorAll(".gallery-item img").forEach(function (img) {

    img.addEventListener("click", function () {

        if (img.style.display === "none") return;

        lightboxImage.src = img.src;
        lightboxImage.alt = img.alt;

        lightbox.classList.add("active");
        lightbox.setAttribute("aria-hidden", "false");

    });

});

function closePhoto() {

    lightbox.classList.remove("active");
    lightbox.setAttribute("aria-hidden", "true");

    lightboxImage.src = "";

}

closeLightbox.addEventListener("click", closePhoto);

lightbox.addEventListener("click", function (event) {

    if (event.target === lightbox) {
        closePhoto();
    }

});

document.addEventListener("keydown", function (event) {

    if (event.key === "Escape") {
        closePhoto();
    }

});


// ===================================
// WEDDING COUNTDOWN
// ===================================

const weddingDate = config.wedding.date
    ? new Date(config.wedding.date)
    : null;

function updateCountdown() {

    const message = document.getElementById("countdownMessage");

    if (!weddingDate || Number.isNaN(weddingDate.getTime())) {
        message.textContent = "Tanggal pernikahan akan segera diumumkan.";
        return;
    }

    const difference = weddingDate.getTime() - Date.now();

    if (difference <= 0) {

        ["days", "hours", "minutes", "seconds"].forEach(function(id) {
            document.getElementById(id).textContent = "00";
        });

        message.textContent = "Hari bahagia kami telah tiba!";
        return;

    }

    const days = Math.floor(difference / 86400000);
    const hours = Math.floor((difference % 86400000) / 3600000);
    const minutes = Math.floor((difference % 3600000) / 60000);
    const seconds = Math.floor((difference % 60000) / 1000);

    document.getElementById("days").textContent = days;
    document.getElementById("hours").textContent = String(hours).padStart(2, "0");
    document.getElementById("minutes").textContent = String(minutes).padStart(2, "0");
    document.getElementById("seconds").textContent = String(seconds).padStart(2, "0");

    message.textContent = "Sampai bertemu di hari bahagia kami.";

}

updateCountdown();
setInterval(updateCountdown, 1000);

// ===================================
// RSVP & WEDDING WISHES - GOOGLE SHEETS
// ===================================

(function initRsvp() {
    const rsvpForm = document.getElementById("rsvpForm");
    if (!rsvpForm) return;

    const nameInput = document.getElementById("rsvpName");
    const attendanceInput = document.getElementById("rsvpAttendance");
    const guestsInput = document.getElementById("rsvpGuests");
    const wishesInput = document.getElementById("rsvpWishes");
    const submitButton = document.getElementById("rsvpSubmit");
    const statusElement = document.getElementById("rsvpStatus");
    const wishesList = document.getElementById("wishesList");

    const apiUrl = config.apiUrl;

    if (guest && guest.trim()) {
        nameInput.value = guest.trim().slice(0, 100);
    }

    function updateGuestField() {
        const isAttending = attendanceInput.value === "Hadir";
        guestsInput.disabled = !isAttending;
        guestsInput.required = isAttending;
        guestsInput.min = isAttending ? "1" : "0";
        guestsInput.value = isAttending ? "1" : "0";
    }

    attendanceInput.addEventListener("change", updateGuestField);
    updateGuestField();

    function showStatus(message, type) {
        statusElement.textContent = message;
        statusElement.className = "rsvp-status" + (type ? " " + type : "");
    }

    window.handleWeddingWishes = function(result) {
        wishesList.replaceChildren();

        if (!result || result.status !== "success" || !Array.isArray(result.wishes)) {
            wishesList.textContent = "Ucapan belum dapat dimuat.";
            return;
        }

        if (result.wishes.length === 0) {
            wishesList.textContent = "Belum ada ucapan. Jadilah yang pertama!";
            return;
        }

        result.wishes.forEach(function(item) {
            const card = document.createElement("article");
            card.className = "wish-item";

            const name = document.createElement("h4");
            name.textContent = item.nama || "Tamu Undangan";

            const wish = document.createElement("p");
            wish.textContent = item.ucapan || "";

            card.appendChild(name);
            if (item.ucapan) card.appendChild(wish);
            wishesList.appendChild(card);
        });
    };

    function loadWishes() {
        if (!apiUrl) {
            wishesList.textContent = "URL database belum diatur.";
            return;
        }

        const oldScript = document.getElementById("weddingWishesJsonp");
        if (oldScript) oldScript.remove();

        const scriptTag = document.createElement("script");
        scriptTag.id = "weddingWishesJsonp";
        scriptTag.src = apiUrl + "?callback=handleWeddingWishes&t=" + Date.now();
        scriptTag.onerror = function() {
            wishesList.textContent = "Gagal memuat ucapan. Periksa koneksi database.";
        };

        document.body.appendChild(scriptTag);
    }

    rsvpForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        if (!apiUrl) {
            showStatus("URL database belum diatur.", "error");
            return;
        }

        const name = nameInput.value.trim();
        const attendance = attendanceInput.value;
        const guests = attendance === "Hadir" ? Number(guestsInput.value) : 0;
        const wishes = wishesInput.value.trim();

        if (!name) {
            showStatus("Silakan isi nama lengkap.", "error");
            return;
        }

        if (!["Hadir", "Tidak Hadir"].includes(attendance)) {
            showStatus("Silakan pilih kehadiran.", "error");
            return;
        }

        if (attendance === "Hadir" &&
            (!Number.isInteger(guests) || guests < 1 || guests > 10)) {
            showStatus("Jumlah tamu harus 1 sampai 10 orang.", "error");
            return;
        }

        const formData = new URLSearchParams();
        formData.append("nama", name);
        formData.append("kehadiran", attendance);
        formData.append("jumlah", String(guests));
        formData.append("ucapan", wishes);

        submitButton.disabled = true;
        submitButton.textContent = "MENGIRIM...";
        showStatus("Sedang mengirim konfirmasi...", "");

        try {
            await fetch(apiUrl, {
                method: "POST",
                mode: "no-cors",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
                },
                body: formData.toString()
            });

            showStatus(
                "Permintaan dikirim. Periksa Google Sheets untuk memastikan data tersimpan.",
                "success"
            );

            if (wishes) wishesInput.value = "";

            window.setTimeout(loadWishes, 2500);

        } catch (error) {
            console.error(error);
            showStatus("Pengiriman gagal. Silakan coba lagi.", "error");
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "KIRIM KONFIRMASI";
        }
    });

    loadWishes();
})();

// ===================================
// WEDDING GIFT - BANK TRANSFER
// ===================================

(function initWeddingGift() {
    const gift = config.gift;

    if (!gift || !gift.enabled) {
        const giftCard = document.getElementById("giftCard");
        if (giftCard) giftCard.style.display = "none";
        return;
    }

    const bank = document.getElementById("giftBank");
    const accountNumber = document.getElementById("giftAccountNumber");
    const accountName = document.getElementById("giftAccountName");
    const copyButton = document.getElementById("copyAccountButton");
    const copyStatus = document.getElementById("giftCopyStatus");

    bank.textContent = gift.bank || "";
    accountNumber.textContent = gift.accountNumber || "";
    accountName.textContent = gift.accountName || "";

    copyButton.addEventListener("click", async function() {
        const number = String(gift.accountNumber || "").replace(/\s/g, "");

        if (!number) {
            copyStatus.textContent = "Nomor rekening belum tersedia.";
            return;
        }

        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(number);
            } else {
                const temporaryInput = document.createElement("textarea");
                temporaryInput.value = number;
                temporaryInput.style.position = "fixed";
                temporaryInput.style.opacity = "0";
                document.body.appendChild(temporaryInput);
                temporaryInput.select();

                const copied = document.execCommand("copy");
                temporaryInput.remove();

                if (!copied) throw new Error("Copy gagal");
            }

            copyStatus.textContent = "Nomor rekening berhasil disalin!";
        } catch (error) {
            copyStatus.textContent = "Gagal menyalin. Silakan salin nomor secara manual.";
        }
    });
})();
