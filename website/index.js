"use strict";

let data = {};
let filtered_shifts = {};

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

        const keys = Object.keys(filtered_shifts);
        show_card(filtered_shifts[keys[0]]);
    } else {
        console.log("failed", this.responseText);
    }
});
request.send();

function show_card(shift) {
    const card = document.getElementById("card");
    card.style["display"] = "block";
    // card.textContent = JSON.stringify(card);

    const header = document.getElementById("shift_header");
    header.textContent = shift["name"];
    header.setAttribute("href", shift["link"]);

    const date = document.getElementById("shift_date");
    date.textContent = `${shift["day"]} ${shift["start"]} - ${shift["end"]}`;
    console.log(`${shift["day"]} ${shift["start"]} - ${shift["end"]}`);

    const location = document.getElementById("shift_location");
    location.textContent = shift["location"]["name"];
    location.setAttribute("href", shift["location"]["link"]);

    const angel_type = document.getElementById("shift_angel_type");
    angel_type.textContent = shift["angel"]["name"];
    angel_type.setAttribute("href", shift["angel"]["link"]);

}
