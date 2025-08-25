# Edges폴더
## **add_edges.py**
지도에서 서로 다른 두 노드를 클릭하면 두 노드를 잇는 엣지를 만들어서 저장함.

flask로 구현함.

<br>

## **filter_edges_data.py**
edges.geojson 파일에서 필요한 정보만 뽑아내는 코드.

<br>

## **add_tag_to_edge.ipynb**
어떤 엣지의 시작 노드와 끝 노드 중 하나라도 특정 polygon 영역에 포함되면 그 엣지가 해당 polygon에 속한다고 간주하고, tag를 부여함.

<br>

## **merge_edges.py**
edges.geojson, edges_added.geojson을 합쳐서 final_edges.geojson을 생성함.


## **add_nodes.py**
지도에서 노드를 찍고 실시간으로 지도에 표시 및 csv 파일로 저장할 수 있는 웹페이지를 flask로 구현

osm으로 불러온 기존 노드를 파란색으로, 새로 추가한 노드를 빨간색으로 표시함

(서로 다른 폴더에 독립적인 flask 코드를 구현해도 된다. 단, port 설정을 다르게 해야 한다. backend 구현할 때 주의해야 한다.)

<br>

## **merge_nodes.py**
nodes.csv, nodes_added.csv를 합쳐서 final_nodes.csv를 생성함.

 # polygon


# data 폴더 구조 및 설명

이 폴더는 Soomgil 프로젝트의 데이터 관리 및 전처리, 분석, 시각화 결과물을 저장합니다. 각 하위 폴더의 용도는 다음과 같습니다.

## 1. raw/
- **원본 데이터**를 저장합니다. 외부에서 수집한 파일, 가공되지 않은 자료가 위치합니다.
  - `ddm-park-tree.csv`, `ddm-street-tree.csv`: 동대문구 공원/가로수 원본 데이터
  - `edges.geojson`, `nodes.csv`: 네트워크(길/노드) 원본 데이터
  - `tree-characteristics-descriptions.csv`: 수목 특성 설명

## 2. intermediate/
- **중간 가공 데이터** 및 전처리 스크립트가 위치합니다.
  - `street-tree-simple.csv`: 가로수 위치 간략화 데이터
  - `tree-characteristics.csv`: 수목 특성 요약
  - `tree_data_to_simple.py`: 데이터 변환 스크립트

## 3. processed/
- **최종 가공 데이터**와 분석/시각화 결과물을 저장합니다.
- 주요 하위 폴더:
  - `polygon/`
    - 동별/공원별 폴리곤 데이터, 태그 추가, 지도 시각화 결과
    - `polygon_data/`: 산/공원/강 영역 GeoJSON
    - 여러 Jupyter 노트북(`*.ipynb`), HTML 지도 결과물
    - `nodes.csv`: 폴리곤 내 노드 데이터
  - `tree-to-edge/`
    - 가로수와 네트워크 엣지 연결, 속성 추가 및 시각화
    - `edges_with_tree.geojson`: 엣지별 가로수 속성 포함 GeoJSON
    - `edges_with_tree.py`: 속성 추가 스크립트
    - `node_edge.py`: 네트워크 시각화 코드
    - `nodes_edges_map.html`: 시각화 결과

## 4. test1/
- **실험용 데이터 및 시각화 결과**를 저장합니다.
  - `add_tree_weights.py`: 가중치 추가 실험 스크립트
  - `dongdaemun_walk_network_with_trees.html`: 실험 결과 지도
  - `edges_with_tree_park_weight.csv`, `edges_with_tree_park_weight.geojson`: 실험용 가공 데이터
  - `visualization.py`: 시각화 코드

---

## 참고
- 각 폴더별로 데이터 흐름이 `raw → intermediate → processed`로 이어집니다.
- 주요 스크립트와 노트북은 데이터 변환, 속성 추가, 시각화 작업을 담당합니다.
- 자세한 데이터 설명 및 사용법은 각 폴더의 README 또는 주석을 참고하세요.
