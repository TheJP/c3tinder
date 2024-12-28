"use strict";

let data = {};
let filtered_shifts = {};
let current_shift = {};

const REJECTS_KEY = "rejects";
const REMEMBERED_KEY = "remembered";

let rejects = JSON.parse(localStorage.getItem(REJECTS_KEY) || "{}");
let remembered = JSON.parse(localStorage.getItem(REMEMBERED_KEY) || "{}");

const swiper = new Swiper('#swiper', {
    initialSlide: 1,
});

window.addEventListener('DOMContentLoaded', function () {
    const cart = this.document.getElementById("cart");
    const close_cart = document.getElementById("close_cart");
    close_cart.addEventListener("click", () => {
        const hide_animation = cart.animate([
            { transform: "translateY(0)" },
            { transform: "translateY(100%)" },
        ], {
            duration: 200
        });
        hide_animation.onfinish = () => {
            cart.style["display"] = "none";
        }
    });

    const open_cart = document.getElementById("open_cart");
    open_cart.addEventListener("click", () => {
        cart.style["display"] = "grid";
        cart.animate([
            { transform: "translateY(100%)" },
            { transform: "translateY(0)" },
        ], {
            duration: 200
        });

        const cart_content = document.getElementById("cart_content");
        cart_content.innerHTML = "";
        for (let key of Object.keys(remembered)) {
            const shift = remembered[key];
            const li = document.createElement("li");
            cart_content.append(li);
            li.setAttribute("id", `cart_${shift["id"]}`)

            const title = document.createElement("h3");
            li.append(title);
            title.classList.add("cart_title");
            const title_link = document.createElement("a");
            title.append(title_link)
            title_link.textContent = shift["name"];
            title_link.setAttribute("href", shift["link"]);
            title_link.setAttribute("target", "_blank");

            const trash = document.createElement("button");
            li.append(trash);
            trash.classList.add("cart_trash");
            trash.addEventListener("click", () => remove_shift(shift["id"]));

            const time = document.createElement("p");
            li.append(time);
            time.classList.add("cart_time")
            time.textContent = `${shift["start"]} – ${shift["end"]}`;

            const day = document.createElement("p");
            li.append(day);
            day.classList.add("cart_day")
            day.textContent = shift["day"];

            const location = document.createElement("a");
            li.append(location);
            location.classList.add("cart_location");
            location.textContent = shift["location"]["name"];
            location.setAttribute("href", shift["location"]["link"]);
            location.setAttribute("target", "_blank");

            const angel_type = document.createElement("a");
            li.append(angel_type);
            angel_type.classList.add("cart_angel");
            angel_type.textContent = shift["angel"]["name"];
            angel_type.setAttribute("href", shift["angel"]["link"]);
            angel_type.setAttribute("target", "_blank");
        }
    });
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
        create_filtered_shifts();

        const loading = document.getElementById("loading");
        loading.style["display"] = "none";
        const swiper_div = document.getElementById("swiper");
        swiper_div.style["display"] = "block";

        const skip = document.getElementById("skip");
        skip.addEventListener("click", () => swiper.slidePrev(300, true));
        const remember = document.getElementById("remember");
        remember.addEventListener("click", () => swiper.slideNext(300, true));

        update_and_bounce_bubble();
        show_random_card();
    } else {
        console.log("failed", this.responseText);
    }
});
request.send();

function store_rejects() {
    localStorage.setItem(REJECTS_KEY, JSON.stringify(rejects));
}

function store_remembered() {
    localStorage.setItem(REMEMBERED_KEY, JSON.stringify(remembered));
}

function show_random_card() {
    const keys = Object.keys(filtered_shifts);
    const selected = keys[Math.floor(Math.random() * keys.length)];
    filtered_shifts[selected]["id"] = selected;
    show_card(filtered_shifts[selected]);
    delete filtered_shifts[selected];
}

function show_card(shift) {
    current_shift = shift;

    const header = document.getElementById("shift_header");
    header.textContent = shift["name"];
    header.setAttribute("href", shift["link"]);

    const time = document.getElementById("shift_time");
    time.textContent = `${shift["start"]} – ${shift["end"]}`;

    const date = document.getElementById("shift_date");
    date.textContent = `${shift["day"]}`;

    const location = document.getElementById("shift_location");
    location.textContent = shift["location"]["name"];
    location.setAttribute("href", shift["location"]["link"]);

    const angel_type = document.getElementById("shift_angel_type");
    angel_type.textContent = shift["angel"]["name"];
    angel_type.setAttribute("href", shift["angel"]["link"]);
}

function update_and_bounce_bubble() {
    const count = Object.keys(remembered).length;
    const bubble = document.getElementById("bubble");
    bubble.style["visibility"] = count > 0 ? "visible" : "hidden";
    bubble.textContent = `${count}`;
    bubble.animate([
        { transform: "translateY(0rem)" },
        { transform: "translateY(-2rem)" },
        { transform: "translateY(0rem)" },
    ], {
        duration: 300,
        easing: "ease-in-out",
    })
}

function create_filtered_shifts() {
    filtered_shifts = data["shifts"];
    for (let reject of Object.keys(rejects)) {
        delete filtered_shifts[reject];
    }
}

function remove_shift(id) {
    const cart_content = document.getElementById("cart_content");
    cart_content.removeChild(document.getElementById(`cart_${id}`));
    delete remembered[id];
    store_remembered();
    update_and_bounce_bubble();
}

swiper.on("slideChangeTransitionEnd", () => {
    if (swiper.activeIndex == 0) {
        rejects[current_shift["id"]] = true;
        store_rejects();
    } else if (swiper.activeIndex == 2) {
        remembered[current_shift["id"]] = current_shift;
        store_remembered();
        update_and_bounce_bubble();
    }

    if (swiper.activeIndex != 1) {
        show_random_card();

        swiper.allowTouchMove = false;
        setTimeout(() => {
            swiper.slideTo(1, 200, false);
            swiper.allowTouchMove = true;
        }, 300);
    }
});
