import json

# 파일 읽기
with open("data/raw/edges.geojson", "r", encoding="utf-8") as f1:
    geo1 = json.load(f1)
with open("data/edge/edges_added.geojson", "r", encoding="utf-8") as f2:
    geo2 = json.load(f2)

# features 합치기
merged = {
    "type": "FeatureCollection",
    "name": "final_edges",
    "crs": {
    "type": "name",
    "properties": {
      "name": "urn:ogc:def:crs:OGC:1.3:CRS84"
    }
  },
  "features": geo1["features"] + geo2["features"]
}

# 저장
with open("data/edge/final_edges.geojson", "w", encoding="utf-8") as f:
    json.dump(merged, f, ensure_ascii=False, indent=2)
