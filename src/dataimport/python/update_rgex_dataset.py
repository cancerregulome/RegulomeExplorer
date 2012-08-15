import db_util
import sys
import os
import time
import json

def addDataset(label, feature_matrix, associations, method, source, description, comments, configfile, results_path, ds_date, disease, contact):
	print "Adding " + source + " dataset to admin table with config " + configfile + " for label " + label 
	if (description == ""):
		#not general, revisit this to enter all TCGA known cancers
		if (label.find("brca") != -1 or label.find("BRCA") != -1):
			description = "Breast"
		if (label.find("ov") != -1 or label.find("OV") != -1):
			description = description + "Ovarian"
		if (label.find("gbm") != -1 or label.find("GBM") != -1):
			description = description + "Glioblastoma"
		if (label.find("coadread") != -1 or label.find("COAD") != -1 or label.find("coad") != -1 or label.find("crc") != -1 or label.find("CRC") != -1):
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
	max_logpv = -1.0
	if (os.path.exists(results_path + 'edges_out_' + label + '_meta.json')):
		meta_json_file = open(results_path + 'edges_out_' + label + '_meta.json','r')
		metaline = meta_json_file.read()
		if (len(metaline) > 1):
			try:
				max_logpv = json.loads(metaline)["max_logpv"]
			except ValueError:
				max_logpv = -1
				#okay that the max_logpv is not set
			except:
				print "Unexpected error:", sys.exc_info()[0]
				raise
		meta_json_file.close()	
	summary_json = ""
	if (os.path.exists(results_path + "feature_summary_" + label + ".json")):
		summary_file = open(results_path + "feature_summary_" + label + ".json", "r")
		summary_json = summary_file.read().strip()
		summary_file.close()	
	insertSql = "replace into tcga.regulome_explorer_dataset (label,method,source,contact,comments,dataset_date,description,max_logged_pvalue, input_files, default_display,disease,summary_json) values ('%s', '%s', '%s', '%s', '%s', '%s', '%s', %f, '%s', '%i', '%s', '%s');" %(label, method, source, contact, comments,ds_date,description, max_logpv, inputfiles, 1, disease, summary_json)
	print "updating regulome_explorer_dataset\n" + insertSql
	db_util.executeInsert(config, insertSql)

if __name__=="__main__":
	if (len(sys.argv) < 13):
	        print 'Usage is py2.6 update_rgex_dataset.py dataset_label feature_matrix associations method source desc comments configfile, resultsPath, dataset_date, diseaseCode, contact'
        	sys.exit(1)
	addDataset(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5], sys.argv[6], sys.argv[7], sys.argv[8], sys.argv[9], sys.argv[10], sys.argv[11], sys.argv[12])
