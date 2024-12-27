import json
import os
from typing import Tuple
from bs4 import BeautifulSoup
import requests
from datetime import date, datetime, timedelta


SESSION_FILE = ".session.private"
OUTPUT_FILE = "shifts.json"
BASE_URL = f"https://engel.events.ccc.de/user-shifts"


# Session
if not os.path.isfile(SESSION_FILE):
    print(f"require session key in file '{SESSION_FILE}'")
    exit(1)

with open(SESSION_FILE, encoding="utf-8") as f:
    session = f.read().strip()


def fetch(url: str, params: dict | None = None) -> requests.Response:
    global session

    print(f"> fetching '{url}'")
    response = requests.get(url, params=params, cookies={ "session": session })
    # Debug requests:
    # request = requests.Request("GET", url, params=params, cookies={ "session": session })
    # prepared = request.prepare()
    # print(prepared.url)
    # s = requests.Session()
    # response = s.send(prepared)

    if not (200 <= response.status_code < 300):
        print(f"< failed: status code == {response.status_code}")
        print("< response:")
        print(response.text.strip())
        exit(2)

    return response


def get_types() -> Tuple[dict, dict]:
    global BASE_URL
    response = fetch(BASE_URL)
    bs = BeautifulSoup(response.content, "lxml")

    locations_div = bs.find(id="selection_locations")
    locations = {}
    for location in locations_div.find_all("div"):
        id = location.find("input")["value"]
        name = location.get_text()
        locations[id] = name

    types_div = bs.find(id="selection_types")
    types = {}
    for type in types_div.find_all("div"):
        id = type.find("input")["value"]
        name = type.get_text()
        types[id] = name

    return (locations, types)


def get_shifts() -> dict:
    global locations, angel_types

    shifts = {}

    day = date.today()
    params = {
        "start_day": day.strftime("%Y-%m-%d"),
        "search_terms": "",
        "start_time": datetime.now().strftime("%H:%M"),
        "end_day": day.strftime("%Y-%m-%d"),
        "end_time": "23:59",
        "filled[]": ["0"],
    }

    params["locations[]"] = []
    for id in locations.keys():
        params["locations[]"].append(id)

    params["types[]"] = []
    for id in angel_types.keys():
        params["types[]"].append(id)

    while day <= date(2024, 12, 31):
        response = fetch(BASE_URL, params)
        bs = BeautifulSoup(response.content, "lxml")

        shift_cards = bs.find_all(class_="shift-card")
        for shift in shift_cards:
            header = shift.find(class_="card-header")

            header_link = header.find("a")["href"]
            id = header_link.rsplit("=", maxsplit=1)[1]

            header_spans = header.find_all("span")
            amount = header_spans[0].get_text()
            title = header_spans[1].get_text()
            times, name = title.split("—", maxsplit=1)
            start, end = times.split("&dash;", maxsplit=1)

            location = shift.find(class_="card-body")
            location_a_tag = location.find("a")
            location_link = location_a_tag["href"]
            location_id = location_link.rsplit("=", maxsplit=1)[1]
            location_name = location_a_tag.get_text()

            footer = shift.find(class_="list-group")
            angel_a_tag = footer.find("a")
            angel_link = angel_a_tag["href"]
            angel_id = angel_link.rsplit("=", maxsplit=1)[1]
            angel_name = angel_a_tag.get_text()

            shifts[id] = {
                "name": name.strip(),
                "link": header_link,
                "amount": amount.strip(),
                "day": day.strftime("%Y-%m-%d"),
                "start": start.strip(),
                "end": end.strip(),
                "location": {
                    "id": location_id,
                    "link": location_link,
                    "name": location_name.strip(),
                },
                "angel": {
                    "id": angel_id,
                    "link": angel_link,
                    "name": angel_name.strip(),
                },
            }

        day += timedelta(days=1)
        params["start_day"] = day.strftime("%Y-%m-%d")
        params["end_day"] = day.strftime("%Y-%m-%d")
        params["start_time"] = "00:00"

    return shifts


def write_output(output: dict):
    with open(OUTPUT_FILE, mode="w", encoding="utf-8") as f:
        json.dump(output, f)


locations, angel_types = get_types()
shifts = get_shifts()
write_output({
    "shifts": shifts,
    "locations": locations,
    "angel_types": angel_types,
})
