import pandas as pd

# 파일 경로
park_path = "data/02_intermediate/park-tree-simple.csv"
street_path = "data/02_intermediate/street-tree-simple.csv"
output_path = "data/03_processed/add_tree/merged_tree_data.csv"

# 데이터 로드
park_df = pd.read_csv(park_path)
street_df = pd.read_csv(street_path)

# 합치기
merged_df = pd.concat([park_df, street_df], ignore_index=True)

# 저장
merged_df.to_csv(output_path, index=False)

