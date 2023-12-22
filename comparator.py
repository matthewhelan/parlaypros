import pickle
import pandas as pd
import requests
import json
import time
from scipy.stats import poisson
import numpy as np
import math


def getFairOdds(over, under):
    #need both sides of a line to compute
    if not (over and under):
        return None 
    if over < 0:
        o = -1*over
        oo = o/(100+o)
    else:
        oo = 100 / (100+over)
    if under < 0:
        u = -1*under
        uu = u/(100+u)
    else:
        uu = 100 / (100+under)

    impliedU, impliedO = uu / (oo+uu), oo / (oo+uu)

    if impliedO < 0.5: #if under favored
        noVigO = (100 / impliedO) - 100
        noVigU = -1*(impliedU*100)/(1-impliedU)
    elif impliedU < 0.5: #if over favored
        noVigU = (100 / impliedU) - 100
        noVigO = -1*(impliedO*100)/(1-impliedO)
    else: #otherwise its a 50/50
        noVigO, noVigU = 100, 100
        
    return [impliedO, noVigO, impliedU, noVigU]

def find_expected_average(line, under_probability):
    if line >= 0.5:
        for mean_value in np.arange(line-0.5, 10000, 0.01):  # Try mean values from 1 to 10 with step-size 0.001
            poisson_prob = poisson.cdf(line, mean_value)
            if poisson_prob < under_probability:
                return mean_value
    return None 

#gives under percentage
def combo_expected_average(combo_line, sum_of_expected_averages):
    print("Line is", combo_line, "expected value is", sum_of_expected_averages)
    p = poisson.cdf(combo_line, sum_of_expected_averages)
    #if line is ends in .0 NOT 0.5 then calc push chance
    if (combo_line / 0.5) % 2 == 0:
        print("Push Chance", poisson.pmf(combo_line, sum_of_expected_averages))
    else:
        print("No Push Chance")
    return p 

# with open('current_lines_pp.pkl', 'rb') as f:
#     prizepicks = pickle.load(f)

# #print(pp)

# cur_lines = pd.DataFrame(prizepicks)
# pp = cur_lines.to_dict(orient='records')
#print(json_data)

with open('current_lines_ud.pkl', 'rb') as f:
    ud = pickle.load(f)
#print(ud)

# with open('current_lines_betano.pkl', 'rb') as f:
#     betano = pickle.load(f)

with open('current_lines_action.pkl', 'rb') as f:
    action = pickle.load(f)

# with open('current_lines_dk.pkl', 'rb') as f:
#     dk = pickle.load(f)

headers = {
  'Content-Type': 'application/json'
}

ud_to_pp = {'MAPS 1-3 Kills' : 'Kills on Maps 1+2+3'}
# for data in betano:
#     if data['attribute'] in ud_to_pp:
#         data['attribute'] = ud_to_pp[data['attribute']]
#     j = json.dumps(data)
#     print(j)
#     response = requests.request("POST", 'http://localhost:5001/fact', headers=headers, data=j)
#     print(response)
# time.sleep(2)

skip_leagues = ['NFLSZN']

# for data in dk:
#     print(data)
#     # print(j)
#     name = data['player']
#     #Don't edit name for now
#     n = name.strip().split(' ', 1)
#     if len(n) > 1:
#         name = n[0][0]+'.'+n[1]
#     liga = data['league']
#     game = data['game']
#     attr = data['attribute']
#     for b in data['line']:
#         out = getFairOdds(b['over'], b['under'])
#         if out:
#             impliedO, noVigO, impliedU, noVigU = out
#             expected_avrg = find_expected_average(b['value'], impliedU)

#             individual = {"player" : name,
#                         'league' : liga,
#                         'game' : game,
#                         'attribute' : attr,
#                         'line' : {
#                             'book' : b['book'],
#                             'value' : b['value'],
#                             'over' : b['over'],
#                             'under' : b['under'],
#                             'impliedOver': impliedO,
#                             'impliedUnder': impliedU,
#                             'noVigOver':round(noVigO, 2),
#                             'noVigUnder': round(noVigU,2),
#                             'expectedValue':expected_avrg
#                         }
#                         }
#         else:
#             individual = {"player" : name,
#                         'league' : liga,
#                         'game' : game,
#                         'attribute' : attr,
#                         'line' : {
#                             'book' : b['book'],
#                             'value' : b['value'],
#                             'over' : b['over'],
#                             'under' : b['under']
#                         }
#             }

#         i = json.dumps(individual)
#         response = requests.request("POST", 'http://localhost:5001/fact', headers=headers, data=i)

# time.sleep(2)

skip_attr = ['Fantasy Points']
for data in ud:
    name = data['player']
    liga = data['league']
    if liga in skip_leagues:
        continue
    if liga == "FIFA" or liga == 'SOCCER':
        data['league'] = 'Soccer'
        data['game'] = None
    # game = data['game'][0]
    # data['game'] = None
    attr = data['attribute']
    if attr in skip_attr:
        continue
    # n = name.strip().split(' ', 1)
    # if len(n) > 1:
    #     new_name = n[0][0]+'.'+n[1]
    #     data['player'] = new_name

    #parse combos
     

    j = json.dumps(data)
    print(j)
    response = requests.request("POST", 'http://localhost:5001/fact', headers=headers, data=j)
    print(response)

time.sleep(2)

abbrev = {'Pts' : 'Points', 'Rebs' : 'Rebounds', 'Ast': 'Assists', 'Stl+Blk' : 'Blocks + Steals', 'Pts+Rebs+Ast': 'Pts + Rebs + Asts', 'Rebs+Ast' : 'Rebounds + Assists',
          'Pts+Rebs' : 'Points + Rebounds', 'Pts+Ast' : 'Points + Assists', 'Blk':'Blocks', 'Stl':'Steals','3pt M' : '3-Pointers Made',
          'Ks' : 'Strikeouts', 'BB': 'Walks Allowed', 'Outs' : 'Pitching Outs', 'Earned Runs' : 'Earned Runs Allowed', 'Runs Scored' : 'Runs', 'MAPS 1-2 Kills' : 'Kills on Map 1+2', 
          'Recs':'Receptions', 'Rec Yds' : 'Receiving Yards', 'Rush Yds':'Rushing Yards', 'Pass Yds' : 'Passing Yards', 'Pass TDs' : 'Passing TDs', 'Rush + Rec Yds' : 'Rushing + Receiving Yards', 'Tackles + Ast' : 'Tackles + Assists', 'Rush Att' : 'Rushing Attempts', 'Pass Att' : 'Passing Attempts', 'Int':'Interceptions', 
          'SOG' : 'Shots'}
skip_attr = ['HR', 'RBI', 'Triples', 'Doubles', 'Longest Completion', 'Longest Rush', 'Longest Reception']

tic = time.perf_counter()

for data in action:
    j = json.dumps(data)
    # print(j)
    name = data['player']
    liga = data['league']
    game = data['game'][0]
    attr = data['attribute']
    #check if attribute is an abbreviation
    if attr in abbrev:
        attr = abbrev[attr]
    if attr in skip_attr:
        continue
    for b in data['line']:
        out = getFairOdds(b['over'], b['under'])
        if out:
            impliedO, noVigO, impliedU, noVigU = out
            expected_avrg = find_expected_average(b['value'], impliedU)

            individual = {"player" : name,
                        'league' : liga,
                        'game' : game,
                        'attribute' : attr,
                        'line' : {
                            'book' : b['book'],
                            'value' : b['value'],
                            'over' : b['over'],
                            'under' : b['under'],
                            'impliedOver': impliedO,
                            'impliedUnder': impliedU,
                            'noVigOver':round(noVigO, 2),
                            'noVigUnder': round(noVigU,2),
                            'expectedValue':expected_avrg
                        }
                        }
        else:
            individual = {"player" : name,
                        'league' : liga,
                        'game' : game,
                        'attribute' : attr,
                        'line' : {
                            'book' : b['book'],
                            'value' : b['value'],
                            'over' : b['over'],
                            'under' : b['under']
                        }
            }

        i = json.dumps(individual)
        response = requests.request("POST", 'http://localhost:5001/fact', headers=headers, data=i)

toc = time.perf_counter()

print(toc - tic)
    # print(response)

# for data in pp:
#     p = {'player' : (data['player']),
#          'league' : (data['league']),
#          'attribute' : (data['attribute']),
#          'line' : {
#             "book" : "PrizePicks",
#             'value' : (data['line'])
#          }
#     }
#     j = json.dumps(p)
#     #print(j)
#     response = requests.request("POST", 'http://localhost:5001/fact', headers=headers, data=j)






# for league, players in ud.items():


