# -*- coding: utf-8 -*-
"""
Created on Sun Feb 23 15:52:22 2020

@author: USER
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import category_encoders as ce
import seaborn as sns
from sklearn.preprocessing import LabelEncoder




df = pd.read_csv('final_cleaned_wildlife_impacts.csv')
parsed_df = pd.DataFrame(columns=['source','target','value'])
g1 = df.groupby(['phase_of_flt','time_of_day']).size()
g2 = df.groupby(['time_of_day','sky']).size()
#print(g1)

#parsed_df= parsed_df.append(g1,ignore_index=True)
for pair,count in g1.items():
    if(pair[0]!="Unknown"): # Ignore the unknowns
        row = {'source':pair[0],'target':pair[1],'value':count}
        parsed_df = parsed_df.append(row,ignore_index=True)

for pair,count in g2.items():
    row = {'source':pair[0],'target':pair[1],'value':count}
    parsed_df = parsed_df.append(row,ignore_index=True)

print(parsed_df)

'''
parsed_csv = pd.concat(g1,ignore_index=True)
parsed_csv = pd.concat(g2,ignore_index=True)
'''
parsed_df.to_csv(r'sankey_parsed_data.csv',index=False)
