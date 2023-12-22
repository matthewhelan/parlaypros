import requests
from bs4 import BeautifulSoup as bs
import pandas as pd
import re 
import pickle
import json


url = 'https://www.actionnetwork.com/mlb/odds'

mlb_todays_games = 'https://api.actionnetwork.com/web/v1/scoreboard/mlb?period=game&bookIds=15,30,358,347,68,357,359,76,75,123,69,972'
nba_todays_game = 'https://api.actionnetwork.com/web/v1/scoreboard/nba?bookIds=15,30,2161,1665,2028,2061,2029,1971,2031,2030,76,75&period=game'
nfl_todays_games = 'https://api.actionnetwork.com/web/v1/scoreboard/nfl?period=game&bookIds=15,30,2161,1665,2028,2061,2029,1971,2031,2030,76,75'
# ncaaf_todays_games = 'https://api.actionnetwork.com/web/v1/scoreboard/ncaaf?bookIds=15,30,76,75,123,69,68,972,71,247,79&division=TOP25&period=game'
nhl_todays_games = 'https://api.actionnetwork.com/web/v1/scoreboard/nhl?bookIds=15,30,2161,1665,2028,2061,2029,1971,2031,2030,76,75&period=game'
ncaab_todays_games = 'https://api.actionnetwork.com/web/v2/scoreboard/ncaab?bookIds=15,30,2161,1665,2028,2061,2029,1971,2031,2030,76,75'
#'NFL' : nfl_todays_games, 'CFB':ncaaf_todays_games
leagues = {'NBA' : nba_todays_game, 'NFL':nfl_todays_games, 'NHL':nhl_todays_games, 'CBB':ncaab_todays_games}

extra_info = 'https://api.actionnetwork.com/web/v1/games/197892/polling' #gives team, score, players, stats info even weather

headers = {
    "Authority": "api.actionnetwork.com",
    "Method": "GET",
    "Path": "/web/v1/scoreboard/mlb?period=game&bookIds=15,30,358,347,68,357,359,76,75,123,69,972&date=20230729",
    "Scheme": "https",
    "Accept": "application/json",
    "Accept-Encoding": "gzip, deflate, br",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "no-cache",
    "Origin": "https://www.actionnetwork.com",
    "Pragma": "no-cache",
    "Referer": "https://www.actionnetwork.com/odds",
    "Sec-Ch-Ua": '"Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"',
    "Sec-Ch-Ua-Mobile": "?0",
    "Sec-Ch-Ua-Platform": '"macOS"',
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-site",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
}

#return {id : bookname} mapping for action network books
def getBooks():
    books_url = 'https://api.actionnetwork.com/web/v1/books'
    r = requests.get(books_url, headers=headers)
    print(r)
    b = r.json()['books']
    books = {}
    for book in b:
        books[str(book['id'])] = book['parent_name']
        #print(book['meta']['logos'])
        #NOTE: there are logos in book['meta']['logos']
    return books

books = getBooks()
# print(books)

lines = []

for league_name, league_link in leagues.items():

    r = requests.get(league_link, headers=headers)
    print(r)
    games = r.json()['games']
    #league information in ['league']

    for game in games:
        #print(game['odds']) too much info here
    
        if game['status'] == 'scheduled':  #if game hasn't started lookup player props
            # print(game['teams'][0]['full_name'], "vs", game['teams'][1]['full_name'])
            # print(game['teams'][0]['abbr'], '@', game['teams'][1]['abbr'])
            game_name = [game['teams'][0]['abbr']+' @ '+game['teams'][1]['abbr'], game['teams'][0]['full_name']+" vs "+game['teams'][1]['full_name']]
            # print(game_name)

            #get the specific game information
            game_url = 'https://api.actionnetwork.com/web/v1/games/{}/polling?bookIds=2161,1665,2028,2061,2029,1971,2031,2030,76,79'.format(game['id'])
            #teams, odds, lineups (doesnt work), [players], injuries, team_stats, player_stats
            cur_game = requests.get(game_url, headers=headers)
            game_players = cur_game.json()['players']
            #build id : full_player_name mapping to use in the props
            player_map = {}
            for player in game_players:
                player_map[player['id']] = player['full_name']


            #note for querying games - Different results if you specify booksId vs not
            #Stick with default (specify all the major books) (sometimes some wouldn't show up if you don't query specific ones)
            prop_url = 'https://api.actionnetwork.com/web/v1/games/{}/props'.format(game['id'])
            props = requests.get(prop_url, headers=headers)
            props = props.json()['player_props']
            for key, category in props.items():
                for line in category:
                    #this is only for Double-Double or Triple-Double
                    if ' {optionTypeAbbr}{value} ' not in line['custom_pick_type_display_name'] or line['player_id'] not in player_map:
                        continue    
                                        
                    _, attr = line['custom_pick_type_display_name'].split(' {optionTypeAbbr}{value} ')
                    #look up player in the mapping we built
                    player_name = player_map[line['player_id']]

                    print(player_name, attr)

                    
                    entry = {
                            'player' : player_name,
                            'league' : league_name,
                            'game' : game_name,
                            'attribute' : attr,
                            'line' : []
                    }
                    # print(entry)
                    print("Implied v Proj", line['implied_value'], line['projected_value'])
                    for i, (k, v) in enumerate(line['odds'].items()):
                        if books[k] == 'Consensus': #skip consensus
                            continue

                        # if books[k] != 'DraftKings':
                        #     continue
                        book = books[k]
                        print(book)
                        #over and under for each book so only 2 indices - check if all of tthe lines match
                        if len(v) > 1:
                            o, u = v[0], v[1]
                            # print("OVER Odds", o['money'])
                            # if o['value'] != u['value']:
                            #     print("LINES DON'T MATCH")
                            #     continue
                            print(v[0]['money'], v[1]['money'])
                            if v[0]['money'] == 0 or v[1]['money'] == 0: #catch one sided FD lines for now
                                continue

                            if o['edge']:
                                extra = [[o['edge'], o['implied_value'], o['grade']],  [u['edge'], u['implied_value'], u['grade']]]

                                print(extra)
                            #print("UNDER Odds", u['money'])
                                

                            entry['line'].append({'book' : book, 'value' : o['value'], 'over' : o['money'], 'under' : u['money']})
                        
                    #     else: #if one-sided lines : IGNORE for now
                    #         print(v[0]['money'])
                    #         print("ONE-SIDED OVER Odds", v[0]['money'])
                    #         if v[0]['edge']:
                    #             extra = [[v[0]['edge'], v[0]['implied_value'], v[0]['grade']],  [v[0]['edge'], v[0]['implied_value'], v[0]['grade']]]
                    #         entry['line'].append({'book' : book, 'value' : v[0]['value'], 'over' : v[0]['money'], 'under' : None})
                    # print(entry)
                    lines.append(entry)

# print(lines)
                        
with open('current_lines_action.pkl', 'wb') as f:
    pickle.dump(lines, f)


