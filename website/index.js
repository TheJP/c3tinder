"use strict";

let data = {};
let filtered_shifts = {};
let current_shift = {};

const swiper = new Swiper('#swiper', {
    initialSlide: 1,
});

const request = new XMLHttpRequest();
request.open("GET", "../shifts.json")
request.addEventListener("readystatechange", function () {
    if (this.readyState != XMLHttpRequest.DONE) {
        return;
    }

    const status = this.status;
    if (status >= 200 && status < 400) {
        data = JSON.parse(this.responseText);
        filtered_shifts = data["shifts"];

        const loading = document.getElementById("loading");
        loading.style["display"] = "none";
        const swiper_div = document.getElementById("swiper");
        swiper_div.style["display"] = "block";

        const skip = document.getElementById("skip");
        skip.addEventListener("click", () => swiper.slidePrev(300, true));
        const remember = document.getElementById("remember");
        remember.addEventListener("click", () => swiper.slideNext(300, true));

        show_random_card();
    } else {
        console.log("failed", this.responseText);
    }
});
request.send();

function show_random_card() {
    const keys = Object.keys(filtered_shifts);
    const selected = keys[Math.floor(Math.random() * keys.length)];
    show_card(filtered_shifts[selected]);
    delete filtered_shifts[selected];
}

function show_card(shift) {
    current_shift = shift;

    const header = document.getElementById("shift_header");
    header.textContent = shift["name"];
    header.setAttribute("href", shift["link"]);

    const time = document.getElementById("shift_time");
    time.textContent = `${shift["start"]} - ${shift["end"]}`;

    const date = document.getElementById("shift_date");
    date.textContent = `${shift["day"]}`;

    const location = document.getElementById("shift_location");
    location.textContent = shift["location"]["name"];
    location.setAttribute("href", shift["location"]["link"]);

    const angel_type = document.getElementById("shift_angel_type");
    angel_type.textContent = shift["angel"]["name"];
    angel_type.setAttribute("href", shift["angel"]["link"]);
}

swiper.on("slideChangeTransitionEnd", () => {
    if (swiper.activeIndex == 0) {
        // Reject
    } else if (swiper.activeIndex == 2) {
        // Accept
    }

    if (swiper.activeIndex != 1) {
        show_random_card();

        swiper.allowTouchMove = false;
        setTimeout(() => {
            swiper.slideTo(1, 200, false);
            swiper.allowTouchMove = true;
        }, 300);
    }
})
