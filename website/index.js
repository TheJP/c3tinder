"use strict";

let data = {};
let filtered_shifts = {};
let current_shift = {};
let location_filters = {};
let angel_filters = {};

const REJECTS_KEY = "rejects";
const REMEMBERED_KEY = "remembered";

let rejects = JSON.parse(localStorage.getItem(REJECTS_KEY) || "{}");
let remembered = JSON.parse(localStorage.getItem(REMEMBERED_KEY) || "{}");

const swiper = new Swiper('#swiper', {
    initialSlide: 1,
});

window.addEventListener('DOMContentLoaded', () => {
    const close_buttons = document.getElementsByClassName("close-button");
    for (let close_button of close_buttons) {
        close_button.addEventListener("click", function () {
            const modal = this.parentNode;
            const hide_animation = modal.animate([
                { transform: "translateY(0)" },
                { transform: "translateY(100%)" },
            ], {
                duration: 200
            });
            hide_animation.onfinish = () => {
                modal.style["display"] = "none";
            }
        });
    }

    const open_modal = (modal) => {
        modal.style["display"] = "grid";
        modal.animate([
            { transform: "translateY(100%)" },
            { transform: "translateY(0)" },
        ], {
            duration: 200
        });
    };

    const open_cart = document.getElementById("open_cart");
    open_cart.addEventListener("click", () => {
        const cart = this.document.getElementById("cart");
        open_modal(cart);

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

    // Filters
    let disable_checkbox_events = false;
    const locations = document.getElementById("settings_locations");
    const angels = document.getElementById("settings_angels");

    const open_settings = document.getElementById("open_settings");
    open_settings.addEventListener("click", () => {
        const settings = document.getElementById("settings");
        open_modal(settings);

        const add_checkboxes = (div, types, filters) => {
            div.innerHTML = "";
            const keys = Object.keys(types);
            keys.sort((a, b) => types[a].localeCompare(types[b]));
            for (let key of keys) {
                if (!Object.hasOwn(filters, key)) {
                    filters[key] = true;
                }
                const label = document.createElement("label");
                div.append(label);

                const checkbox = document.createElement("input");
                label.append(checkbox);
                checkbox.setAttribute("id", `${div.getAttribute("id")}-${key}`);
                checkbox.setAttribute("type", "checkbox");
                checkbox.checked = filters[key];
                checkbox.addEventListener("change", () => {
                    if (disable_checkbox_events) {
                        return;
                    }
                    filters[key] = checkbox.checked;
                    create_filtered_shifts();
                    show_random_card();
                });

                const text = document.createTextNode(types[key]);
                label.append(text);
            }
        };

        add_checkboxes(locations, data["locations"], location_filters);
        add_checkboxes(angels, data["angel_types"], angel_filters);
    });
    setTimeout(() => open_settings.click(), 200); // TODO: Remove

    const set_all_checkboxes = (div, value, filters) => {
        disable_checkbox_events = true;
        for (let checkbox of div.getElementsByTagName("input")) {
            checkbox.checked = value;
        }
        disable_checkbox_events = false;

        for (let key of Object.keys(filters)) {
            filters[key] = value;
        }

        create_filtered_shifts();
        show_random_card();
    };

    const locations_all = document.getElementById("locations_all");
    locations_all.addEventListener("click", () => set_all_checkboxes(locations, true, location_filters));
    const locations_none = document.getElementById("locations_none");
    locations_none.addEventListener("click", () => set_all_checkboxes(locations, false, location_filters));

    const angel_all = document.getElementById("angel_all");
    angel_all.addEventListener("click", () => set_all_checkboxes(angels, true, angel_filters));
    const angel_none = document.getElementById("angel_none");
    angel_none.addEventListener("click", () => set_all_checkboxes(angels, false, angel_filters));
});

const request = new XMLHttpRequest();
request.open("GET", "shifts.json")
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
    if (keys.length === 0) {
        // TODO: Show message to user.
        console.log("there are no shifts remaining for the selected filters");
        return;
    }

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
    filtered_shifts = { ...data["shifts"] };
    for (let reject of Object.keys(rejects)) {
        delete filtered_shifts[reject];
    }

    const delete_keys = [];

    for (let location of Object.keys(location_filters)) {
        if (location_filters[location]) {
            continue;
        }

        for (let shift_key of Object.keys(filtered_shifts)) {
            if (filtered_shifts[shift_key]["location"]["id"] === location) {
                delete_keys.push(shift_key);
            }
        }
    }

    for (let angel of Object.keys(angel_filters)) {
        if (angel_filters[angel]) {
            continue;
        }

        for (let shift_key of Object.keys(filtered_shifts)) {
            if (filtered_shifts[shift_key]["angel"]["id"] === angel) {
                delete_keys.push(shift_key);
            }
        }
    }

    for (let shift_key of delete_keys) {
        delete filtered_shifts[shift_key];
    }

    // const count = Object.keys(filtered_shifts).length;
    const count = document.getElementById("filtered_count");
    count.innerText = Object.keys(filtered_shifts).length.toLocaleString();
}

function remove_shift(id) {
    const cart_content = document.getElementById("cart_content");
    cart_content.removeChild(document.getElementById(`cart_${id}`));
    delete remembered[id];
    store_remembered();
    update_and_bounce_bubble();
}

swiper.on("slideChangeTransitionEnd", () => {
    if (swiper.activeIndex === 0) {
        rejects[current_shift["id"]] = true;
        store_rejects();
    } else if (swiper.activeIndex === 2) {
        remembered[current_shift["id"]] = current_shift;
        store_remembered();
        update_and_bounce_bubble();
    }

    if (swiper.activeIndex !== 1) {
        show_random_card();

        swiper.allowTouchMove = false;
        setTimeout(() => {
            swiper.slideTo(1, 200, false);
            swiper.allowTouchMove = true;
        }, 300);
    }
});
