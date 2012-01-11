#!/usr/bin/python
import db_util
import sys
import os
import time

def addDataset(label, feature_matrix, associations, method):
	description = ""
	#not general, revisit this to enter all TCGA known cancers
	if (label.find("brca") != -1 or label.find("BRCA") != -1):
		description = "Breast"
	if (label.find("ov") != -1 or label.find("OV") != -1):
		description = description + "Ovarian"
	if (label.find("gbm") != -1 or label.find("GBM") != -1):
		description = description + "Glioblastoma"
	if (label.find("coadread") != -1 or label.find("COAD") != -1 or label.find("crc") != -1 or label.find("CRC") != -1):
		description = description + "ColoRectal"
	if (label.find("cesc") != -1 or label.find("CESC") != -1):
		description = description + "Cervical"
	if (label.find("hnsc") != -1 or label.find("HNSC") != -1):
		description = description + "HeadNeck"
	if (label.find("kirc") != -1 or label.find("KIRC") != -1 or label.find("kirp") != -1  or label.find("KIRP") != -1):
		description = description + "Kidney"
	if (label.find("luad") != -1 or label.find("LUAD") != -1 or label.find("lusc") != -1  or label.find("LUSC") != -1):
		description = description + "Lung"
	if (label.find("stad") != -1 or label.find("STAD") != -1):
		description = description + "Stomach"	
	if (label.find("nomask") != -1):
		description = description
	elif (label.find("mask") != -1):
		description = description + " filtered"
	currentDate = time.strftime("%m-%d-%y")
	insertSql = "replace into tcga.regulome_explorer_dataset (label,method,source,contact,comments,dataset_date,description) values ('%s', '%s', 'TCGA', '%s', '%s', '%s', '%s');" %(label, method,"Sheila Reynolds sreynolds@systemsbiology.org","{matrix:"+feature_matrix+",rfassociations:"+associations+"}",currentDate,description)
	db_util.executeInsert(insertSql)

if __name__=="__main__":
	if (len(sys.argv) < 5):
	        print 'Usage is py2.6 update_rgex_dataset.py dataset_label feature_matrix associations method'
        	sys.exit(1)

	addDataset(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4])
