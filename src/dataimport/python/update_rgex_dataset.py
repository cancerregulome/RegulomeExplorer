#!/usr/bin/python
import db_util
import sys
import os
import time

def addDataset(label, feature_matrix, associations, method):
	insertSql = "replace into tcga.regulome_explorer_dataset (label,method,source,contact,comments) values ('%s', '%s', 'TCGA', '%s', '%s');" %(label, method,"Sheila Reynolds sreynolds@systemsbiology.org","{matrix:"+feature_matrix+",rfassociations:"+associations+"}")
	db_util.executeInsert(insertSql)

if __name__=="__main__":
	if (len(sys.argv) < 5):
	        print 'Usage is py2.6 update_rgex_dataset.py dataset_label feature_matrix associations method'
        	sys.exit(1)

	addDataset(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4])
