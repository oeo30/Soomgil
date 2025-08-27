import pandas as pd

# CSV 읽기
df1 = pd.read_csv("data/raw/nodes.csv")
df2 = pd.read_csv("data/node/nodes_added.csv")

# 세로로 합치기
df_merged = pd.concat([df1, df2], ignore_index=True)

# CSV로 저장
df_merged.to_csv("data/node/final_nodes.csv", index=False)
