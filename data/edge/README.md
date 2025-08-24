**add_edges.py**:
지도에서 서로 다른 두 노드를 클릭하면 두 노드를 잇는 엣지를 만들어서 저장함.

flask로 구현함.

**filter_edges_data.py**:
edges.geojson 파일에서 필요한 정보만 뽑아내는 코드.

**add_tag_to_edge.ipynb**:
어떤 엣지의 시작 노드와 끝 노드 중 하나라도 특정 polygon 영역에 포함되면 그 엣지가 해당 polygon에 속한다고 간주하고, tag를 부여함.