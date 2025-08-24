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
    - `tag_data/`: 노드/수목 태그 부여 결과
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
