import db_util
import sys
import os
import time
import json

def addDataset(label, feature_matrix, associations, method, description, comments, configfile):
	print "adding dataset to admin table with config " + configfile + " for label " + label 
	if (description == ""):
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
	if (comments == ""):
		comments = "{matrix:"+feature_matrix+",associations:"+associations+"}"
	inputfiles = "{matrix:"+feature_matrix+",associations:"+associations+"}"
	currentDate = time.strftime("%m-%d-%y")
	config = db_util.getConfig(configfile)
	results_path = db_util.getResultsPath(config)
	max_logpv = -1.0
	contact = "Sheila Reynolds sreynolds@systemsbiology.org"
	if (label.find('gbm') != -1):
		contact = "Brady Bernard bbernard@systemsbiology.org"
	if (label.find('coad') != -1):
		contact = "Vesteinn Thorsson vthorsson@systemsbiology.org"
	if (os.path.exists(results_path + '/' + label + '/edges_out_' + label + '_meta.json')):
		meta_json_file = open(results_path + '/' + label + '/edges_out_' + label + '_meta.json','r')
		metaline = meta_json_file.read()
		max_logpv = json.loads(metaline)["max_logpv"]
		#print metaline
		meta_json_file.close()		
	insertSql = "replace into regulome_explorer_dataset (label,method,source,contact,comments,dataset_date,description,max_logged_pvalue, input_files) values ('%s', '%s', 'TCGA', '%s', '%s', '%s', '%s', %f, '%s');" %(label, method, contact, comments,currentDate,description, max_logpv, inputfiles)
	db_util.executeInsert(config, insertSql)

if __name__=="__main__":
	#/tools/bin/python2.7 update_rgex_dataset.py $dataset_label $feature_matrix_file $associations_pw $method $description $comments $configfile
	if (len(sys.argv) < 8):
	        print 'Usage is py2.6 update_rgex_dataset.py dataset_label feature_matrix associations method desc comments configfile'
        	sys.exit(1)
	addDataset(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5], sys.argv[6], sys.argv[7])
