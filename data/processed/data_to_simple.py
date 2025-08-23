import pandas as pd

#street-tree 데이터 간소화
df = pd.read_csv('data/raw/ddm-street-tree.csv')
df_simple = df[['수목명','수목위도','수목경도']]
df_simple.to_csv('ddm-street-tree-simple.csv', index=False)

