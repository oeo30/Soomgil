import json
import pandas as pd

with open('data/raw/edges.geojson', encoding='utf-8') as f:
    geo = json.load(f)

rows = []

for feature in geo['features']:
    props = feature['properties']
    coords = feature['geometry']['coordinates']
    row = {
        'u': props.get('u'),
        'v': props.get('v'),
        'key': props.get('key'),
        'length': props.get('length'),
        'highway': props.get('highway'),
        'name': props.get('name'),
        'coordinates': coords
    }
    rows.append(row)

df = pd.DataFrame(rows)
df.to_csv('edges.csv', index=False)