import requests
from bs4 import BeautifulSoup as bs
import pandas as pd
import pickle
from unidecode import unidecode

headers = {
    "Authority": "api.underdogfantasy.com",
    "Method": "GET",
    "Path": "/beta/v1/live_over_under_lines",
    "Scheme": "https",
    "Accept": "application/json",
    "Accept-Encoding": "gzip, deflate, br",
    "Accept-Language": "en-US,en;q=0.9",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiJ9.eyJqdGkiOiIxZGZlMTk1ZC0yZmVmLTQwOWQtODJkZi1iMmMwODYxNzFjMTciLCJzdWIiOiI3M2Y5MzU0Mi1mNjRjLTQ2NGUtOGY5MC1mMmQzNDRlZjZiOGIiLCJzY3AiOiJ1c2VyIiwiYXVkIjpudWxsLCJpYXQiOjE2OTA4MjkxMzMsImV4cCI6MTY5MzQ1ODg3OX0.abFXWJR4WthpHoVVV2zVmSEMlpfiYjbOvy9s_a5Fk24",
    "Cache-Control": "no-cache",
    "Client-Device-Id": "264a8c13-cabd-47c9-9745-e9c69b73dfe5",
    "Client-Request-Id": "4b1314a8-1252-407e-b4a8-c50fc0000fb8",
    "Client-Type": "web",
    "Client-Version": "202307271759",
    "Origin": "https://underdogfantasy.com",
    "Pragma": "no-cache",
    "Referer": "https://underdogfantasy.com/",
    "Referring-Link": "",
    "Sec-Ch-Ua": "\"Not.A/Brand\";v=\"8\", \"Chromium\";v=\"114\", \"Google Chrome\";v=\"114\"",
    "Sec-Ch-Ua-Mobile": "?0",
    "Sec-Ch-Ua-Platform": "\"macOS\"",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-site",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
}

url = 'https://api.underdogfantasy.com/beta/v4/over_under_lines'

#live = 'https://api.underdogfantasy.com/beta/v1/live_over_under_lines' # don't worry about live lines for now

feat = "https://api.underdogfantasy.com/v2/user/featured_over_under_lines" # see if there are any promos

#limit = "https://api.underdogfantasy.com/v1/user/entry_slip_limits" #limits for each league type

r = requests.get(url, headers=headers)

print(r)

a = r.json()

#for each listing in appearances, 'match_id', 'match_type', 'player_id', 'position_id', 'team_id'
# match_type can be either Game or SoloGame

#{'id': '8dbc3fca-c0e1-4a2a-93cd-fed027dd799b', 'badges': [{'icon': 'https://assets.underdogfantasy.com/badges/check_light_mode.png', 'text': 'SP', 'label': 'Starting', 'value': 'Yes'}], 'lineup_status_id': None, 'match_id': 31018, 'match_type': 'Game', 'player_id': '7acd135b-644d-4895-8314-4692412b715b', 'position_id': '6631eab0-d844-460a-8d30-0650383377da', 'team_id': '25101c7a-340a-4c08-a93d-979242271c89'}

#mapping from appearance_id to match_id, player_id, //team_id, position/match type?
appear = {}
for i in (a['appearances']):
    appear[i['id']] = [i['match_type'], i['match_id']]

#don't need player lookup for now, information provided in a['over_under_lines'] is sufficient
# players = {}
# for i in a['players']:
#     if i['sport_id'] == 'ESPORTS': #for esports, change sport ID to actual game and name to just last name (in game name)
#         if i['first_name'] == 'CS:GO': #weird format for CS:GO no ':' at end
#             players[i['id']] = [i["last_name"], i['first_name']]
#         else:
#             players[i['id']] = [i["last_name"], i['first_name'][:-1]]
#     else:
#         players[i['id']] = [i['first_name'] + " " + i["last_name"], i['sport_id']]


games = {}
for i in a['games']: #also i['scheduled_at'] for time
    games[i['id']] = [i['sport_id'], i['title']]

solo_games = {}
for i in a['solo_games']:
    solo_games[i['id']] = [i['sport_id'], i['title']]

# for i in appear:
#     games[i[0]]
#     players[i[1]]
lines = []
for i in a['over_under_lines']:
    stat = i['over_under']['appearance_stat']['display_stat']
    #remove O/U
    name = i['over_under']['title'][:-4].replace(' '+stat, '')
    #lookup appearance id
    p = appear[i['over_under']['appearance_stat']['appearance_id']]
    sport, game_title = None, None
    if p[0] == 'Game':
        sport, game_title = games[p[1]]
    elif p[0] == 'SoloGame':
        sport, game_title = solo_games[p[1]]
    #overwrite sport if its one of the ESPORTS
    if 'CS:GO ' in name:
        sport = 'CS:GO'
        name = name[6:]
    elif 'LoL: ' in name:
        sport = 'LoL'
        name = name[5:]
    elif 'Val: ' in name:
        sport = 'Val'
        name = name[5:]

    print(game_title)
    
    guy = {
        'player' : unidecode(name),
        'league' : sport,
        'game' : game_title,
        'attribute' : stat,
        'line' : {
            'book' : 'Underdog',
            'value' : i['stat_value'],
            'over' : '',
            'under' : '',
            'impliedOver': '',
            'impliedUnder': '',
            'noVigOver': '',
            'noVigUnder': '',
            'expectedValue': i['stat_value']
        }
    }

    lines.append(guy)

print(lines)

with open('current_lines_ud.pkl', 'wb') as f:
    pickle.dump(lines, f)


